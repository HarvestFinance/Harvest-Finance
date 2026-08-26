import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros

/**
 Member macro applied to a record type. Treats **every stored property** that is not
 `static`, `private`, `fileprivate`, `lazy` or computed as a property — no `@Field` wrapper
 needed — and synthesizes the conversion surface from the property's static type:

 - an explicit memberwise `init` (so the static factories have a single construction point),
 - `from(object:appContext:)` — the fast path, reading each property straight off a
   `JavaScriptObject`,
 - `from(dictionary:appContext:)` — reading each property from a `[String: Any]` dictionary,
 - `toDictionary(appContext:)` and `toObject(appContext:)` for the write side.

 The type is auto-conformed to `Record` (a core protocol whose requirements are exactly this
 surface); the synthesized methods override `Record`'s reflection-based defaults. Author-facing
 shape — no conformance to spell out:

   @Record
   struct Options {
     var name: String          // required (non-optional, no default)
     var count: Int = 0        // optional (has default)
     var note: String?         // nullable + optional
   }

 The JS key is always the property name. Requiredness is inferred from the declaration:
 a default value makes a property optional (the default applies when the source omits it),
 an optional type makes it nullable and optional, and a non-optional property without a
 default is required (the factories throw when the source omits it).

 Conversions go through the **public** dynamic-type API — `T.getDynamicType()` plus
 `cast(jsValue:appContext:)` / `cast(_:appContext:)` / `convertToJS(_:appContext:)` —
 so the synthesized code compiles inside user modules without any internal core symbols.
 Every property type must therefore conform to `AnyArgument`.

 For classes that inherit from another `@Record`-annotated class, the synthesized
 methods chain to `super` so inherited properties are handled first.
 */
public struct RecordMacro: MemberMacro, ExtensionMacro {
  public static func expansion(
    of node: AttributeSyntax,
    providingMembersOf declaration: some DeclGroupSyntax,
    conformingTo protocols: [TypeSyntax],
    in context: some MacroExpansionContext
  ) throws -> [DeclSyntax] {
    let isClass = declaration.is(ClassDeclSyntax.self)
    guard declaration.is(StructDeclSyntax.self) || isClass else {
      throw MacroExpansionErrorMessage("@Record can only be applied to a struct or class")
    }

    let properties = try recordProperties(of: declaration)
    let inheritsRecord = isClass && classHasInheritance(declaration)

    // The user may hand-write any of the initializers the macro would otherwise synthesize. Emitting
    // a duplicate is a hard "invalid redeclaration" error, so skip anything already declared and let
    // the author's version stand — the factories only need *an* `init(<properties>)` and `Record` only
    // needs *an* `init()`, regardless of who wrote them.
    let existingInitLabels = initializerParameterLabels(of: declaration)

    var members: [DeclSyntax] = []

    // A single never-called member that makes the compiler verify each property type is
    // JS-convertible (the conversions below go through its dynamic-type API). Each property keeps its
    // own named assertion inside, so the compiler's conformance diagnostic names the offending
    // property (see `typeConformanceAssertions`). Emitted first so that, for a non-conforming type,
    // this clear "requires that '…' conform to '…'" error is reported ahead of the noisier
    // "no member 'getDynamicType'" errors from the conversion code below.
    let assertions = properties.map { ConformanceAssertion(name: $0.name, types: [$0.type]) }
    if let assertionMember = typeConformanceAssertions(for: assertions) {
      members.append(assertionMember)
    }

    if !existingInitLabels.contains([]) {
      if let defaultInit = defaultInit(properties: properties, isClass: isClass) {
        members.append(defaultInit)
      }
    }
    if !existingInitLabels.contains(properties.map { $0.name }) {
      members.append(memberwiseInit(properties: properties))
    }
    members.append(fromJSObjectFactory(properties: properties))
    members.append(fromDictionaryFactory(properties: properties))
    members.append(toDictionaryMethod(properties: properties, inheritsRecord: inheritsRecord))
    members.append(toObjectMethod(properties: properties, inheritsRecord: inheritsRecord))
    return members
  }

  /**
   Auto-conforms the type to `Record` — the protocol whose requirements are exactly the members
   synthesized above (`init()`, the two `from(_:)` factories, and the `toDictionary`/`toObject`
   write side), which the synthesized methods satisfy by overriding `Record`'s reflection-based
   defaults.

   The conformance is skipped when the type already declares it, and for class subclasses
   (which inherit it from a `@Record`-annotated parent) no extension is emitted at all.
   */
  public static func expansion(
    of node: AttributeSyntax,
    attachedTo declaration: some DeclGroupSyntax,
    providingExtensionsOf type: some TypeSyntaxProtocol,
    conformingTo protocols: [TypeSyntax],
    in context: some MacroExpansionContext
  ) throws -> [ExtensionDeclSyntax] {
    if declaration.is(ClassDeclSyntax.self) && classHasInheritance(declaration) {
      return []
    }
    guard declaration.is(StructDeclSyntax.self) || declaration.is(ClassDeclSyntax.self) else {
      return []
    }
    if inheritsProtocol(named: "Record", in: declaration) {
      return []
    }

    let ext: DeclSyntax = """
      extension \(type.trimmed): Record {}
      """
    guard let extDecl = ext.as(ExtensionDeclSyntax.self) else {
      return []
    }
    return [extDecl]
  }
}

// MARK: - Property model

/**
 A single record property discovered on the type, paired with everything the synthesized
 conversions need: its property name (also the JS key), its written type, and how the
 source may omit it.
 */
private struct RecordProperty {
  let name: String
  /// The property's declared type, verbatim (e.g. `String`, `Int`, `String?`). Used to build
  /// the memberwise-init parameter and to look up the dynamic type via `T.getDynamicType()`.
  let type: String
  /// The default-value expression verbatim (`0`, `""`, `[]`), or `nil` when the property has none.
  /// Inlined into the memberwise init and the factories' omitted-property branch so the synthesized
  /// code never needs a throwaway `Self()` to recover defaults.
  let defaultValue: String?
  /// True when the property's type is optional (`T?` / `T!` / `Optional<T>`).
  let isOptional: Bool

  /// True when the property declares a default value (`var x: T = …`).
  var hasDefault: Bool {
    return defaultValue != nil
  }

  /// Required properties must be present in the source; omission throws.
  var isRequired: Bool {
    return !hasDefault && !isOptional
  }
}

/**
 Discovers the record's properties: every stored `var`/`let` binding that is not `static`,
 `private`, `fileprivate`, `lazy`, or computed. Each property must declare an explicit type
 annotation, since the synthesized conversions reference `Type.getDynamicType()`.
 */
private func recordProperties(
  of declaration: some DeclGroupSyntax
) throws -> [RecordProperty] {
  var properties: [RecordProperty] = []

  for member in declaration.memberBlock.members {
    guard let varDecl = member.decl.as(VariableDeclSyntax.self) else {
      continue
    }
    if isExcludedByModifier(varDecl.modifiers) {
      continue
    }
    // `@Field` is the v1 property wrapper and has no meaning here — every stored property is a
    // record property now. Left in place it would wrap the value in `Field<T>` (backing storage
    // `_name`), so the synthesized conversions would be generated against the wrong type. Flag it
    // explicitly rather than emit broken code.
    if varDecl.attributes.firstAttribute(named: "Field") != nil {
      throw MacroExpansionErrorMessage(
        "@Field is no longer used — @Record treats every stored property as a record property. Remove the @Field attribute"
      )
    }
    for binding in varDecl.bindings {
      // Computed properties (and `{ get set }`) carry an accessor block — never properties.
      if binding.accessorBlock != nil {
        continue
      }
      guard let ident = binding.pattern.as(IdentifierPatternSyntax.self) else {
        continue
      }
      // Prefer the explicit annotation. When it's omitted, recover the type from a literal default
      // (Swift's own default-literal type) — covers the common `var name = "foo"` case. Anything
      // whose type a syntactic macro can't determine (calls, collections, member access) still needs
      // an annotation.
      let inferredType = binding.typeAnnotation?.type.trimmedDescription
        ?? binding.initializer.flatMap { inferredLiteralType(of: $0.value) }
      guard let type = inferredType else {
        throw MacroExpansionErrorMessage(
          "@Record properties must declare an explicit type — '\(ident.identifier.text)' has none"
        )
      }
      properties.append(
        RecordProperty(
          name: ident.identifier.text,
          type: type,
          defaultValue: binding.initializer?.value.trimmedDescription,
          isOptional: binding.typeAnnotation.map { isOptionalType($0.type) } ?? false
        )
      )
    }
  }
  return properties
}

// MARK: - Synthesized members

/**
 The parameterless `init()` required by the `Record` protocol. Nothing in the synthesized code uses
 it — the factories construct through the memberwise init with defaults inlined — so it's purely a
 conformance witness. Swift only synthesizes an implicit `init()` for a struct that declares no other
 initializer, but the macro always emits a memberwise `init(…)`, which suppresses it, so for structs
 the macro must supply `init()` itself.

 When no property is required, the body is empty: every stored property initializes from its own
 declaration. When a property *is* required there's no value to give it, so the body traps — this `init()`
 is never reached (the `from(…)` factories don't call it), it exists only to satisfy the requirement.

 Not emitted when there are no properties at all — there the memberwise init already *is* `init()`. Classes
 are left alone: they inherit `init()` from their `@Record` superclass, and a base `@Record` class is
 unsupported today.
 */
private func defaultInit(properties: [RecordProperty], isClass: Bool) -> DeclSyntax? {
  if isClass || properties.isEmpty {
    return nil
  }
  if properties.contains(where: { $0.isRequired }) {
    return """
      public init() {
      fatalError("\\(Self.self) has required properties and cannot be created with init(); construct it through the @Record-synthesized from(dictionary:) or from(object:) factories")
      }
      """
  }
  return """
    public init() {
    }
    """
}

/**
 Explicit memberwise initializer over the discovered properties, in declaration order. The factories
 call this as the single construction point. Optional properties default to `nil` for ergonomics; all
 other parameters are required at this level (the factories supply a value for every property, inlining
 each declared default where the source omits it).
 */

private func memberwiseInit(properties: [RecordProperty]) -> DeclSyntax {
  let params = properties.map { property -> String in
    if property.isOptional {
      return "\(property.name): \(property.type) = nil"
    }
    return "\(property.name): \(property.type)"
  }
  let assignments = properties.map { "  self.\($0.name) = \($0.name)" }.joined(separator: "\n")
  let signature = params.joined(separator: ", ")

  return """
    public init(\(raw: signature)) {
    \(raw: assignments)
    }
    """
}

/**
 `from(object:appContext:)` — reads each property off the `JavaScriptObject` into a local,
 then constructs the record through the memberwise init. Required properties throw when
 undefined; defaulted properties fall back to the property's declared default (read from a
 throwaway `Self()`) when undefined; optional properties become `nil` when undefined/null.
 */
private func fromJSObjectFactory(properties: [RecordProperty]) -> DeclSyntax {
  let body = factoryBody(properties: properties, readLines: jsObjectReadLines(properties: properties))
  return """
    @JavaScriptActor
    public static func from(object: borrowing JavaScriptObject, appContext: AppContext) throws -> Self {
    \(raw: body)
    }
    """
}

/**
 `from(dictionary:appContext:)` — same as the JS path but reads from `[String: Any]` and
 uses the `Any?` cast overload; a missing key is `dictionary[key] == nil`.
 */
private func fromDictionaryFactory(properties: [RecordProperty]) -> DeclSyntax {
  let body = factoryBody(properties: properties, readLines: dictionaryReadLines(properties: properties))
  return """
    public static func from(dictionary: [String: Any], appContext: AppContext) throws -> Self {
    \(raw: body)
    }
    """
}

/**
 Builds a factory body: per-property reads into locals, then a single call to the synthesized
 memberwise init. Each property's declared default expression is captured at parse time and inlined
 directly into the omitted-property branch (see the read-line builders), so the factory needs neither
 a throwaway `Self()` nor the record's `init()`.
 */
private func factoryBody(properties: [RecordProperty], readLines: [String]) -> String {
  var lines: [String] = []
  lines.append(contentsOf: readLines)
  let initArgs = properties.map { "\($0.name): \($0.name)" }.joined(separator: ", ")
  lines.append("  return Self(\(initArgs))")
  return lines.joined(separator: "\n")
}

/// Per-property read statements for the JS-object factory, each producing a `let <name>`.
private func jsObjectReadLines(properties: [RecordProperty]) -> [String] {
  var lines: [String] = []
  for property in properties {
    let valueVar = "\(property.name)JSValue"
    let cast = "try \(property.type).getDynamicType().cast(jsValue: \(valueVar), appContext: appContext) as! \(property.type)"
    lines.append("  let \(valueVar) = object.getProperty(\"\(property.name)\")")
    if property.isRequired {
      lines.append("  guard !\(valueVar).isUndefined() else {")
      lines.append("    throw RecordPropertyRequiredException(\"\(property.name)\")")
      lines.append("  }")
      lines.append("  let \(property.name) = \(cast)")
    } else if property.isOptional {
      lines.append("  let \(property.name): \(property.type) = (\(valueVar).isUndefined() || \(valueVar).isNull()) ? nil : \(cast)")
    } else {
      lines.append("  let \(property.name) = \(valueVar).isUndefined() ? \(property.defaultValue!) : \(cast)")
    }
  }
  return lines
}

/// Per-property read statements for the dictionary factory, each producing a `let <name>`.
private func dictionaryReadLines(properties: [RecordProperty]) -> [String] {
  var lines: [String] = []
  for property in properties {
    let valueVar = "\(property.name)Value"
    let cast = "try \(property.type).getDynamicType().cast(\(valueVar), appContext: appContext) as! \(property.type)"
    lines.append("  let \(valueVar) = dictionary[\"\(property.name)\"]")
    if property.isRequired {
      lines.append("  guard let \(valueVar) else {")
      lines.append("    throw RecordPropertyRequiredException(\"\(property.name)\")")
      lines.append("  }")
      lines.append("  let \(property.name) = \(cast)")
    } else if property.isOptional {
      lines.append("  let \(property.name): \(property.type) = (\(valueVar) == nil || \(valueVar)! is NSNull) ? nil : \(cast)")
    } else {
      lines.append("  let \(property.name) = \(valueVar) == nil ? \(property.defaultValue!) : \(cast)")
    }
  }
  return lines
}

/**
 `toDictionary(appContext:)` — converts each property back to a JS-compatible value via the
 dynamic type and assembles a `[String: Any]`. Inherited properties are merged in first.
 */
private func toDictionaryMethod(properties: [RecordProperty], inheritsRecord: Bool) -> DeclSyntax {
  let overrideKeyword = inheritsRecord ? "override " : ""
  var lines: [String] = []
  if inheritsRecord {
    lines.append("  var dictionary = super.toDictionary(appContext: appContext)")
  } else {
    lines.append("  var dictionary: [String: Any] = [:]")
  }
  for property in properties {
    lines.append("  dictionary[\"\(property.name)\"] = self.\(property.name)")
  }
  lines.append("  return dictionary")
  let body = lines.joined(separator: "\n")

  if inheritsRecord {
    return """
      public \(raw: overrideKeyword)func toDictionary(appContext: AppContext? = nil) -> [String: Any] {
      \(raw: body)
      }
      """
  }
  return """
    public func toDictionary(appContext: AppContext? = nil) -> [String: Any] {
    \(raw: body)
    }
    """
}

/**
 `toObject(appContext:)` — builds a `JavaScriptObject` directly, converting each property via
 `convertToJS`. The fast write path mirroring `from(object:)`. Subclasses chain to `super` so
 inherited properties are written first.
 */
private func toObjectMethod(properties: [RecordProperty], inheritsRecord: Bool) -> DeclSyntax {
  let overrideKeyword = inheritsRecord ? "override " : ""
  var lines: [String] = []
  if inheritsRecord {
    lines.append("  let object = try super.toObject(appContext: appContext)")
  } else {
    lines.append("  let object = try appContext.runtime.createObject()")
  }
  for property in properties {
    lines.append("  object.setProperty(\"\(property.name)\", value: try \(property.type).getDynamicType().convertToJS(self.\(property.name), appContext: appContext))")
  }
  lines.append("  return object")
  let body = lines.joined(separator: "\n")

  return """
    @JavaScriptActor
    public \(raw: overrideKeyword)func toObject(appContext: AppContext) throws -> JavaScriptObject {
    \(raw: body)
    }
    """
}

// MARK: - Helpers

/**
 The parameter-label list of every initializer the type already declares, used to avoid emitting a
 duplicate of one the author hand-wrote. Each entry is the ordered external argument labels of one
 `init` — e.g. `init(name: String, count: Int)` → `["name", "count"]`, and `init()` → `[]`. A
 parameter written with `_` or with no external label contributes its internal name's absence as an
 empty-string label, which simply won't match the macro's always-labeled signatures (a safe miss).
 */
private func initializerParameterLabels(of declaration: some DeclGroupSyntax) -> [[String]] {
  var signatures: [[String]] = []
  for member in declaration.memberBlock.members {
    guard let initDecl = member.decl.as(InitializerDeclSyntax.self) else {
      continue
    }
    let labels = initDecl.signature.parameterClause.parameters.map { parameter in
      // `firstName` is the external label (or `_`); fall back to the internal name when omitted.
      let label = parameter.firstName.text
      return label == "_" ? "" : label
    }
    signatures.append(labels)
  }
  return signatures
}

/**
 True if the variable declaration carries a modifier that excludes it from being a property:
 `static`, `class` (type-level storage), `private`, `fileprivate`, or `lazy`.
 */
private func isExcludedByModifier(_ modifiers: DeclModifierListSyntax) -> Bool {
  for modifier in modifiers {
    switch modifier.name.tokenKind {
    case .keyword(.static), .keyword(.class), .keyword(.private), .keyword(.fileprivate), .keyword(.lazy):
      return true
    default:
      continue
    }
  }
  return false
}

/**
 True if the type syntax is optional: `T?`, `T!`, or the spelled-out `Optional<T>`.
 */
private func isOptionalType(_ type: TypeSyntax) -> Bool {
  if type.is(OptionalTypeSyntax.self) || type.is(ImplicitlyUnwrappedOptionalTypeSyntax.self) {
    return true
  }
  if let identifier = type.as(IdentifierTypeSyntax.self), identifier.name.text == "Optional" {
    return true
  }
  return false
}

/**
 True if the type's inheritance clause already lists a protocol with the given name.
 Matches either the bare identifier (`Record`) or a qualified member access ending in
 the name (`ExpoModulesCore.Record`).
 */
private func inheritsProtocol(named name: String, in declaration: some DeclGroupSyntax) -> Bool {
  let inheritanceClause: InheritanceClauseSyntax?
  if let structDecl = declaration.as(StructDeclSyntax.self) {
    inheritanceClause = structDecl.inheritanceClause
  } else if let classDecl = declaration.as(ClassDeclSyntax.self) {
    inheritanceClause = classDecl.inheritanceClause
  } else {
    return false
  }
  guard let inherited = inheritanceClause?.inheritedTypes else {
    return false
  }
  for entry in inherited {
    let typeSyntax = entry.type
    if let identifier = typeSyntax.as(IdentifierTypeSyntax.self),
      identifier.name.text == name {
      return true
    }
    if let member = typeSyntax.as(MemberTypeSyntax.self),
      member.name.text == name {
      return true
    }
  }
  return false
}

/**
 True if the class declaration has any inheritance clause. Used as a heuristic for
 whether the superclass also conforms to `Record` and provides the synthesized methods;
 the macro emits `override` in this case.
 */
private func classHasInheritance(_ declaration: some DeclGroupSyntax) -> Bool {
  guard let classDecl = declaration.as(ClassDeclSyntax.self),
    let inherited = classDecl.inheritanceClause?.inheritedTypes,
    !inherited.isEmpty else {
    return false
  }
  return true
}
