import SwiftSyntax
import SwiftSyntaxMacros

/// Marker macro applied to module / shared-object members that should be exposed to JavaScript.
/// `@ExpoModule` and `@SharedObject` discover declarations carrying this attribute and generate the
/// corresponding `Function` / `AsyncFunction` / `Property` / `Constructor` registrations; that part
/// of the expansion lives in those macros.
///
/// On its own, `@JS` emits one thing: a never-called peer that asserts every type crossing the JS
/// boundary is JS-convertible. Because it's a **peer** of the marked member, a non-conforming type
/// produces a compile error located on the user's own `@JS` declaration rather than on the enclosing
/// `@ExpoModule`. The assertion mechanism itself is shared (see `typeConformanceAssertion`); `@JS`
/// only supplies the boundary types it reads off the declaration.
///
/// Usage:
///
///   @JS
///   func greet(name: String) -> String { ... }
///
///   @JS("doWork")
///   func performWork() async throws { ... }
///
///   @JS
///   var status: String { "ok" }
public struct JSMacro: PeerMacro {
  public static func expansion(
    of node: AttributeSyntax,
    providingPeersOf declaration: some DeclSyntaxProtocol,
    in context: some MacroExpansionContext
  ) throws -> [DeclSyntax] {
    guard let member = boundaryMember(of: declaration),
      let assertion = typeConformanceAssertion(
        for: ConformanceAssertion(name: member.name, types: member.types),
        isStatic: member.isStatic
      ) else {
      return []
    }
    return [assertion]
  }
}

/// What an assertion peer needs about the `@JS` member it sits beside: a name (to keep the peer
/// unique among siblings), the types crossing the JS boundary, and whether the member is type-level.
private struct BoundaryMember {
  let name: String
  /// Boundary types as written. Composed types (`[Int]`, `String?`, …) are kept verbatim — their
  /// conditional conformances transitively constrain the elements.
  let types: [String]
  /// True for `static`/`class` members, so the peer is emitted in the same metatype context.
  let isStatic: Bool
}

/// Reads the boundary member off a `@JS` declaration. A function contributes its parameter types
/// plus the return type (when non-Void); a property contributes its declared type. Returns `nil` for
/// declaration kinds `@JS` doesn't read types from, or a property whose type isn't spelled out (a
/// syntactic macro can't recover it), so no assertion is emitted there.
private func boundaryMember(of declaration: some DeclSyntaxProtocol) -> BoundaryMember? {
  if let funcDecl = declaration.as(FunctionDeclSyntax.self) {
    var types = funcDecl.signature.parameterClause.parameters.map { $0.type.trimmedDescription }
    if let returnType = funcDecl.signature.returnClause?.type, !isVoidType(returnType) {
      types.append(returnType.trimmedDescription)
    }
    return BoundaryMember(name: funcDecl.name.text, types: types, isStatic: isTypeLevel(funcDecl.modifiers))
  }

  if let varDecl = declaration.as(VariableDeclSyntax.self),
    let binding = varDecl.bindings.first,
    let identifier = binding.pattern.as(IdentifierPatternSyntax.self),
    let type = binding.typeAnnotation?.type {
    return BoundaryMember(
      name: identifier.identifier.text,
      types: [type.trimmedDescription],
      isStatic: isTypeLevel(varDecl.modifiers)
    )
  }

  return nil
}

/// True when the modifiers make the member type-level (`static` or `class`), so its assertion peer
/// must be emitted in the same metatype context rather than as an instance member.
private func isTypeLevel(_ modifiers: DeclModifierListSyntax) -> Bool {
  return modifiers.contains {
    $0.name.tokenKind == .keyword(.static) || $0.name.tokenKind == .keyword(.class)
  }
}

/// True when a return clause is written as `Void` / `()` — nothing crosses the boundary, so it needs
/// no conformance assertion. (A missing return clause never reaches here: `returnClause` is `nil`.)
private func isVoidType(_ type: TypeSyntax) -> Bool {
  let text = type.trimmedDescription
  return text == "Void" || text == "()"
}
