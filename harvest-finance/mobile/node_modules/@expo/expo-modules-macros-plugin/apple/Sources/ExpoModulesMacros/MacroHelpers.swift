import SwiftSyntax

/**
 Reads the first string-literal argument of an attribute, e.g. `@JS("doWork")` -> "doWork".
 Returns nil if the attribute has no arguments or the first argument is not a string literal.
 */
internal func jsNameArgument(of attribute: AttributeSyntax) -> String? {
  guard let args = attribute.arguments?.as(LabeledExprListSyntax.self),
    let first = args.first,
    let str = first.expression.as(StringLiteralExprSyntax.self),
    let segment = str.segments.first?.as(StringSegmentSyntax.self) else {
    return nil
  }
  return segment.content.text
}

/**
 Reads a labeled array-literal argument of an attribute, e.g. `@ExpoModule(classes: [Foo.self, Bar.self])`,
 and returns the type names referenced (e.g. `["Foo", "Bar"]`). Each element must be a
 `<TypeName>.self` member-access expression; non-conforming elements are skipped silently.
 */
internal func classListArgument(of attribute: AttributeSyntax, label: String) -> [String] {
  guard let args = attribute.arguments?.as(LabeledExprListSyntax.self) else {
    return []
  }
  for arg in args where arg.label?.text == label {
    guard let array = arg.expression.as(ArrayExprSyntax.self) else {
      return []
    }
    return array.elements.compactMap { element -> String? in
      guard let memberAccess = element.expression.as(MemberAccessExprSyntax.self),
        memberAccess.declName.baseName.text == "self",
        let base = memberAccess.base?.as(DeclReferenceExprSyntax.self) else {
        return nil
      }
      return base.baseName.text
    }
  }
  return []
}

/**
 Returns true if the class's inheritance clause names any of the given identifiers.
 Matches by base identifier only, so `Module`, `ExpoModulesCore.Module`, and
 `Module<Foo>` all match an entry of "Module".
 */
internal func inheritsFromAny(_ classDecl: ClassDeclSyntax, names: Set<String>) -> Bool {
  guard let inherited = classDecl.inheritanceClause?.inheritedTypes else {
    return false
  }
  for entry in inherited {
    if let name = baseIdentifier(of: entry.type), names.contains(name) {
      return true
    }
  }
  return false
}

/**
 Returns the rightmost identifier of a type, e.g. `Foo` for `Foo`, `Foo` for
 `Module.Foo`, and nil for composed or generic shapes the macro doesn't need to handle.
 */
internal func baseIdentifier(of type: TypeSyntax) -> String? {
  if let identifier = type.as(IdentifierTypeSyntax.self) {
    return identifier.name.text
  }
  if let member = type.as(MemberTypeSyntax.self) {
    return member.name.text
  }
  return nil
}

/**
 True if the declaration carries a `@JS` attribute. Works for functions, properties, and inits;
 returns false for any other decl kind.
 */
internal func memberHasJSAttribute(_ decl: DeclSyntaxProtocol) -> Bool {
  if let funcDecl = decl.as(FunctionDeclSyntax.self) {
    return funcDecl.attributes.firstAttribute(named: "JS") != nil
  }
  if let varDecl = decl.as(VariableDeclSyntax.self) {
    return varDecl.attributes.firstAttribute(named: "JS") != nil
  }
  if let initDecl = decl.as(InitializerDeclSyntax.self) {
    return initDecl.attributes.firstAttribute(named: "JS") != nil
  }
  return false
}

/**
 Decides whether the macro should stamp `@JavaScriptActor` on a `@JS`-marked member.
 The macro defers to the user when they've already chosen an isolation:
 - the `nonisolated` modifier is present on the member
 - any attribute whose name matches a known global actor (`@MainActor`, `@JavaScriptActor`)
   or follows the `*Actor` naming convention is present on the member or its enclosing type
 Async members never get the stamp because `AsyncFunction` controls their dispatch separately.
 */
internal func shouldStampJavaScriptActor(
  on member: DeclSyntaxProtocol,
  enclosedBy enclosing: some DeclGroupSyntax
) -> Bool {
  let modifiers = memberModifiers(of: member)
  if modifiers.contains(where: { $0.name.text == "nonisolated" }) {
    return false
  }

  if let funcDecl = member.as(FunctionDeclSyntax.self),
    funcDecl.signature.effectSpecifiers?.asyncSpecifier != nil {
    return false
  }

  let memberAttributes = memberAttributes(of: member)
  if memberAttributes.contains(where: hasGlobalActorShape) {
    return false
  }

  if enclosing.attributes.contains(where: hasGlobalActorShape) {
    return false
  }

  return true
}

private func memberModifiers(of decl: DeclSyntaxProtocol) -> DeclModifierListSyntax {
  if let funcDecl = decl.as(FunctionDeclSyntax.self) {
    return funcDecl.modifiers
  }
  if let varDecl = decl.as(VariableDeclSyntax.self) {
    return varDecl.modifiers
  }
  if let initDecl = decl.as(InitializerDeclSyntax.self) {
    return initDecl.modifiers
  }
  return DeclModifierListSyntax()
}

internal func memberAttributes(of decl: DeclSyntaxProtocol) -> AttributeListSyntax {
  if let funcDecl = decl.as(FunctionDeclSyntax.self) {
    return funcDecl.attributes
  }
  if let varDecl = decl.as(VariableDeclSyntax.self) {
    return varDecl.attributes
  }
  if let initDecl = decl.as(InitializerDeclSyntax.self) {
    return initDecl.attributes
  }
  return AttributeListSyntax()
}

private func hasGlobalActorShape(_ element: AttributeListSyntax.Element) -> Bool {
  guard let attribute = element.as(AttributeSyntax.self) else {
    return false
  }
  let name = attribute.attributeName.trimmedDescription
  return name.hasSuffix("Actor")
}

/// The Swift default type of a literal expression — `String`, `Double`, `Int`, or `Bool` — or `nil`
/// when the expression isn't one of those literals. Used to recover a property's type when it has no
/// annotation but does have a literal default (`var name = "foo"` → `String`). This matches the type
/// Swift itself would infer for the same un-annotated declaration; expressions whose type a syntactic
/// macro can't know (function calls, collection literals, member access) return `nil`.
internal func inferredLiteralType(of expression: ExprSyntax) -> String? {
  if expression.is(StringLiteralExprSyntax.self) {
    return "String"
  }
  if expression.is(FloatLiteralExprSyntax.self) {
    return "Double"
  }
  if expression.is(IntegerLiteralExprSyntax.self) {
    return "Int"
  }
  if expression.is(BooleanLiteralExprSyntax.self) {
    return "Bool"
  }
  return nil
}

extension AttributeListSyntax {
  internal func firstAttribute(named name: String) -> AttributeSyntax? {
    for element in self {
      if let attr = element.as(AttributeSyntax.self),
        attr.attributeName.trimmedDescription == name {
        return attr
      }
    }
    return nil
  }
}
