import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros

/**
 Macro applied to a module class. It plays three roles, each implemented in its own
 extension below:

 - `MemberMacro`: scans the class body for `@JS`-marked declarations and synthesizes a
   framework-internal `_synthesizedDefinition()` returning `[AnyDefinition]`, which
   `expo-modules-core` calls automatically and merges into the module's definition. When
   the class doesn't already inherit `Module`/`BaseModule`, it also synthesizes the
   `appContext` storage and `init(appContext:)` those base classes would have provided.
 - `MemberAttributeMacro`: stamps `@JavaScriptActor` on `@JS` sync members and
   `@ModuleDefinitionBuilder` on a `definition()` method.
 - `ExtensionMacro`: adds the `AnyModule` conformance when the class doesn't inherit it.

 Inheriting from `Module` is therefore optional — a class can carry any superclass (or
 none) and still be a module, because everything inheritance used to provide is synthesized.

   @ExpoModule
   public final class MyModule {
     public func definition() -> ModuleDefinition {
       Name("MyModule")
     }

     @JS
     func greet(name: String) -> String { "Hi, \(name)" }
   }
 */
public struct ExpoModuleMacro: MemberMacro {
  public static func expansion(
    of node: AttributeSyntax,
    providingMembersOf declaration: some DeclGroupSyntax,
    conformingTo protocols: [TypeSyntax],
    in context: some MacroExpansionContext
  ) throws -> [DeclSyntax] {
    guard let classDecl = declaration.as(ClassDeclSyntax.self) else {
      throw MacroExpansionErrorMessage("@ExpoModule can only be applied to a class")
    }

    let moduleName = jsNameArgument(of: node) ?? classDecl.name.text
    var entries: [String] = ["Name(\"\(moduleName)\")"]

    // `@JS func`s (sync and async) and `@JS var`s are bound directly into the JS object by the
    // synthesized `_decorateModule` rather than described with a `Function(...)` / `Property(...)`
    // DSL entry, so they're collected here instead of appended to `entries`.
    var functions: [JSFunction] = []
    var properties: [JSProperty] = []

    for typeName in classListArgument(of: node, label: "classes") {
      entries.append("\(typeName)._synthesizedClassDefinition()")
    }

    for member in classDecl.memberBlock.members {
      let decl = member.decl

      if let funcDecl = decl.as(FunctionDeclSyntax.self),
        let attribute = funcDecl.attributes.firstAttribute(named: "JS") {
        functions.append(JSFunction(funcDecl: funcDecl, attribute: attribute))
        continue
      }

      if let varDecl = decl.as(VariableDeclSyntax.self),
        let attribute = varDecl.attributes.firstAttribute(named: "JS") {
        properties.append(contentsOf: collectProperties(varDecl: varDecl, attribute: attribute))
      }
    }

    let lines = entries.map { "    \($0)" }.joined(separator: ",\n")
    let body = "  return [\n\(lines)\n  ]"

    var emitted: [DeclSyntax] = []

    // `Module`/`BaseModule` already provide `appContext` storage and the
    // `init(appContext:)` requirement, so we only synthesize them for classes that
    // inherit from neither. Each is skipped individually if the user wrote their own,
    // to avoid emitting a duplicate declaration.
    if !inheritsFromAny(classDecl, names: ["Module", "BaseModule"]) {
      if !hasStoredProperty(classDecl, named: "appContext") {
        emitted.append("public weak var appContext: AppContext?")
      }
      if !hasAppContextInitializer(classDecl) {
        emitted.append(
          """
          public required init(appContext: AppContext) {
            self.appContext = appContext
          }
          """
        )
      }
    }

    // Always emitted: the definition is derived from the class name and `@JS` members,
    // independent of any `definition()` the user wrote.
    let method: DeclSyntax = """
      public func _synthesizedDefinition() -> [AnyDefinition] {
      \(raw: body)
      }
      """
    emitted.append(method)

    // Direct JSI binding: one `_decorateModule` that binds each `@JS func` (inlined `setProperty`
    // closure) and each `@JS var` (a `defineProperty` get/set accessor) into the module's JS object.
    // Only emitted when there's at least one member to bind.
    if !functions.isEmpty || !properties.isEmpty {
      emitted.append(buildDecorateJavaScriptObject(functions: functions, properties: properties))
    }

    return emitted
  }
}

extension ExpoModuleMacro: MemberAttributeMacro {
  public static func expansion(
    of node: AttributeSyntax,
    attachedTo declaration: some DeclGroupSyntax,
    providingAttributesFor member: some DeclSyntaxProtocol,
    in context: some MacroExpansionContext
  ) throws -> [AttributeSyntax] {
    // This macro is invoked once per member and may attach more than one attribute,
    // so we collect into an array rather than returning early. The two checks below are
    // independent — a given member matches at most one in practice, but they're written
    // so neither precludes the other.
    var attributes: [AttributeSyntax] = []

    // `@JS` sync members run on the JS thread; stamp `@JavaScriptActor` so isolation is
    // checked at compile time. Skipped when the member already chose an isolation
    // (`async`, `nonisolated`, or another global actor) — see `shouldStampJavaScriptActor`.
    if memberHasJSAttribute(member),
      shouldStampJavaScriptActor(on: member, enclosedBy: declaration) {
      attributes.append("@JavaScriptActor")
    }

    // Apply the result builder to `definition()` so the user doesn't have to. Skipped if
    // they already wrote `@ModuleDefinitionBuilder` themselves, which would otherwise be
    // a duplicate attribute.
    if isModuleDefinitionFunction(member),
      !memberAttributes(of: member).contains(where: { hasAttributeName($0, "ModuleDefinitionBuilder") }) {
      attributes.append("@ModuleDefinitionBuilder")
    }

    return attributes
  }
}

private func isModuleDefinitionFunction(_ member: some DeclSyntaxProtocol) -> Bool {
  guard let funcDecl = member.as(FunctionDeclSyntax.self),
    funcDecl.name.text == "definition",
    funcDecl.signature.parameterClause.parameters.isEmpty,
    let returnType = funcDecl.signature.returnClause?.type else {
    return false
  }
  return baseIdentifier(of: returnType) == "ModuleDefinition"
}

private func hasAttributeName(_ element: AttributeListSyntax.Element, _ name: String) -> Bool {
  guard let attribute = element.as(AttributeSyntax.self) else {
    return false
  }
  return attribute.attributeName.trimmedDescription == name
}

extension ExpoModuleMacro: ExtensionMacro {
  public static func expansion(
    of node: AttributeSyntax,
    attachedTo declaration: some DeclGroupSyntax,
    providingExtensionsOf type: some TypeSyntaxProtocol,
    conformingTo protocols: [TypeSyntax],
    in context: some MacroExpansionContext
  ) throws -> [ExtensionDeclSyntax] {
    // `protocols` is empty when the compiler already sees the conformance (e.g. it's
    // spelled in the declaration), in which case there's nothing for us to add.
    guard !protocols.isEmpty else {
      return []
    }
    // These base types already supply `AnyModule`; emitting a second conformance here
    // would be redundant and error.
    if let classDecl = declaration.as(ClassDeclSyntax.self),
      inheritsFromAny(classDecl, names: ["Module", "BaseModule", "AnyModule"]) {
      return []
    }
    let conformance: DeclSyntax = "extension \(type.trimmed): AnyModule {}"
    return [conformance.cast(ExtensionDeclSyntax.self)]
  }
}

// MARK: - Synthesized-member detection

private func hasStoredProperty(_ classDecl: ClassDeclSyntax, named name: String) -> Bool {
  for member in classDecl.memberBlock.members {
    guard let varDecl = member.decl.as(VariableDeclSyntax.self) else {
      continue
    }
    for binding in varDecl.bindings {
      if let identifier = binding.pattern.as(IdentifierPatternSyntax.self),
        identifier.identifier.text == name {
        return true
      }
    }
  }
  return false
}

/**
 True if the class declares an initializer that satisfies the `init(appContext:)` protocol
 requirement: a single parameter labeled `appContext` whose type is written as `AppContext`
 (or `…​.AppContext`). Both must match — the label is part of the requirement, so
 `init(c: AppContext)` does *not* satisfy it (we still synthesize ours), and the type guards
 against a same-labeled init of an unrelated type. A macro can't resolve types, so this is a
 syntactic match on the spelled name.
 */
private func hasAppContextInitializer(_ classDecl: ClassDeclSyntax) -> Bool {
  for member in classDecl.memberBlock.members {
    guard let initDecl = member.decl.as(InitializerDeclSyntax.self) else {
      continue
    }
    let params = initDecl.signature.parameterClause.parameters
    guard params.count == 1, let param = params.first else {
      continue
    }
    if param.firstName.text == "appContext", baseIdentifier(of: param.type) == "AppContext" {
      return true
    }
  }
  return false
}

// MARK: - Member builders

private func collectProperties(
  varDecl: VariableDeclSyntax,
  attribute: AttributeSyntax
) -> [JSProperty] {
  let jsNameOverride = jsNameArgument(of: attribute)
  // A `let` is never settable; only `var` bindings can carry a setter.
  let isVar = varDecl.bindingSpecifier.tokenKind == .keyword(.var)

  return varDecl.bindings.compactMap { binding in
    guard let ident = binding.pattern.as(IdentifierPatternSyntax.self) else {
      return nil
    }
    let swiftName = ident.identifier.text
    // Prefer the explicit annotation; recover the type from a literal default (`var x = false`)
    // when there's none. `nil` falls back to inference at the use site.
    let valueType = binding.typeAnnotation?.type.trimmedDescription
      ?? binding.initializer.flatMap { inferredLiteralType(of: $0.value) }
    return JSProperty(
      swiftName: swiftName,
      jsName: jsNameOverride ?? swiftName,
      valueType: valueType,
      isSettable: isVar && bindingIsSettable(binding)
    )
  }
}

/// Whether a `var` binding is settable from JS. A stored property (no accessor block) is settable;
/// a computed property is settable only when it declares an explicit `set` accessor. A getter-only
/// computed property (`{ get }` or a single getter body) stays read-only. `willSet`/`didSet`
/// observers imply stored storage, which is also settable.
private func bindingIsSettable(_ binding: PatternBindingSyntax) -> Bool {
  guard let accessorBlock = binding.accessorBlock else {
    return true
  }
  switch accessorBlock.accessors {
  case .accessors(let accessors):
    return accessors.contains { accessor in
      switch accessor.accessorSpecifier.tokenKind {
      case .keyword(.set), .keyword(.willSet), .keyword(.didSet):
        return true
      default:
        return false
      }
    }
  case .getter:
    return false
  }
}

