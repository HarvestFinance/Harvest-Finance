import SwiftSyntax

/**
 A `@JS func` collected for **direct JSI binding**. Instead of describing the function with a
 `Function(...)` / `AsyncFunction(...)` DSL entry that the runtime interprets per call,
 `@ExpoModule` synthesizes a `_decorateModule` that binds each such function into the module's JS object
 via the closure-taking `JavaScriptObject.setProperty(_:)`, with the decode-call-encode body
 inlined into the closure. This omits the `[Any]`/`toTuple` dynamic-call path: every argument is
 decoded individually by its static type.

 The receiver is the module's real `self` (a module is a singleton instance), so the body calls
 `self.<name>(...)` directly and ignores the JS `this`. An `async` `@JS func` produces an `async`
 closure body and is installed through the async `setProperty(_:)` overload (so JS gets a promise).
 */
internal struct JSFunction {
  let swiftName: String
  let jsName: String
  let parameters: [FunctionParameterSyntax]
  /// The declared return type as written, or `nil` when the function returns `Void`/nothing.
  let returnType: String?
  let isThrowing: Bool
  let isAsync: Bool

  init(funcDecl: FunctionDeclSyntax, attribute: AttributeSyntax) {
    self.swiftName = funcDecl.name.text
    self.jsName = jsNameArgument(of: attribute) ?? funcDecl.name.text
    self.parameters = Array(funcDecl.signature.parameterClause.parameters)

    let declaredReturnType = funcDecl.signature.returnClause?.type
    self.returnType = isVoidType(declaredReturnType) ? nil : declaredReturnType?.trimmedDescription

    let effectSpecifiers = funcDecl.signature.effectSpecifiers
    self.isThrowing = effectSpecifiers?.throwsClause?.throwsSpecifier != nil
    self.isAsync = effectSpecifiers?.asyncSpecifier != nil
  }

  /// The decode-call-encode statements that form the host-function body, indented with the given
  /// prefix. Arity guard, then per-argument decode (primitives via a direct typed accessor like
  /// `asDouble()` on a zero-copy `arguments.unownedValue(at:)`, others via `getDynamicType().cast(...)`),
  /// the `self.<name>(...)` call, and the
  /// result encode (primitives via `toJavaScriptValue(in:)`, others via `castToJS(...)`).
  private func bodyStatements(indent: String) -> String {
    var lines: [String] = []

    lines.append(
      """
      guard arguments.count == \(parameters.count) else {
        throw Exception(name: "InvalidArgumentCount", description: "Function '\(jsName)' expects \(parameters.count) argument(s), but got \\(arguments.count)")
      }
      """)

    var callArguments: [String] = []
    for (index, parameter) in parameters.enumerated() {
      let type = parameter.type.trimmedDescription

      // Primitives decode through a direct typed accessor (`asDouble()`, etc.) on a borrowed
      // `JavaScriptUnownedValue` — no owning `JavaScriptValue` allocation, no `jsi::Value` copy, no
      // `getDynamicType()` allocation, no `Any` boxing, no force-cast — while still validating and
      // throwing `TypeError` on a mismatch. Other types fall back to the dynamic converter, which
      // needs an owning value, so they index the buffer directly.
      if let accessor = fastDecodeAccessor(for: type) {
        lines.append("let arg\(index) = try arguments.unownedValue(at: \(index)).\(accessor)()")
      } else {
        lines.append(
          "let arg\(index) = try \(type).getDynamicType().cast(jsValue: arguments[\(index)], appContext: appContext) as! \(type)")
      }

      let label = parameter.firstName.text
      callArguments.append(label == "_" ? "arg\(index)" : "\(label): arg\(index)")
    }

    let tryKeyword = (isThrowing || isAsync) ? "try " : ""
    let awaitKeyword = isAsync ? "await " : ""
    let callExpression =
      "\(tryKeyword)\(awaitKeyword)self.\(swiftName)(\(callArguments.joined(separator: ", ")))"

    if let returnType {
      lines.append("let result = \(callExpression)")
      // Primitives encode through `toJavaScriptValue(in:)` (the typed `JavaScriptRepresentable`
      // conversion) — no `Any`, no dynamic-type allocation. Others go through the dynamic converter.
      if fastDecodeAccessor(for: returnType) != nil {
        lines.append("return result.toJavaScriptValue(in: runtime)")
      } else {
        lines.append("return try \(returnType).getDynamicType().castToJS(result, appContext: appContext, in: runtime)")
      }
    } else {
      lines.append(callExpression)
      lines.append("return .undefined")
    }

    return lines
      .flatMap { $0.split(separator: "\n", omittingEmptySubsequences: false) }
      .map { indent + $0 }
      .joined(separator: "\n")
  }

  /// The `setProperty` statement that installs this function on the JS object. The decode-call-encode
  /// body is inlined directly into the closure passed to the closure-taking `setProperty` overload
  /// (which creates the host function under the hood) — no separate named binding. For an `async`
  /// function the body `await`s the call, which selects the async `setProperty` overload (so JS
  /// receives a promise).
  ///
  /// Capture mirrors core's `SyncFunctionDefinition.build`: `self` (the module) is captured
  /// **strong** — the host-function closure is what keeps the native callable alive for as long as
  /// JS can invoke it; its lifetime is bounded by the JS VM's garbage collection of the object.
  /// `appContext` is captured **weak** (and guarded) so it doesn't form a real retain cycle through
  /// the app context. When no argument or return value goes through the dynamic-type converter the
  /// body never references `appContext`, so the capture and guard are omitted to avoid the
  /// unused-capture warning.
  var decorateStatements: String {
    if usesAppContext {
      return """
          object.setProperty("\(jsName)") { [weak appContext, self] this, arguments in
            guard let appContext else {
              throw Exceptions.AppContextLost()
            }
        \(bodyStatements(indent: "    "))
          }
        """
    }
    return """
        object.setProperty("\(jsName)") { [self] this, arguments in
      \(bodyStatements(indent: "    "))
        }
      """
  }

  /// True when the host-function body references `appContext` — i.e. some parameter or the return
  /// type lacks a fast accessor and decodes/encodes through `getDynamicType()`, which threads
  /// `appContext` in.
  private var usesAppContext: Bool {
    if parameters.contains(where: { fastDecodeAccessor(for: $0.type.trimmedDescription) == nil }) {
      return true
    }
    if let returnType, fastDecodeAccessor(for: returnType) == nil {
      return true
    }
    return false
  }
}

/// A `@JS var` collected for **direct JSI binding**. Instead of describing the property with a
/// `Property(...)` DSL entry, `@ExpoModule` synthesizes a get/set accessor into the module's JS
/// object inside `_decorateModule`: it builds a descriptor object (`enumerable` + `get`, and `set`
/// when the property is settable) and installs it with `object.defineProperty(name, descriptor:)`,
/// mirroring core's `PropertyDefinition.buildDescriptor`. The `get`/`set` host functions are
/// installed the same way `@JS func`s are — the closure-taking `setProperty(_:)` overload, with the
/// read/write body inlined into the closure.
///
/// The receiver is the module's real `self`, so the getter reads `self.<name>` and the setter writes
/// `self.<name> = …` directly, ignoring the JS `this`. Decode/encode of the value reuse the same
/// static-type fast path as functions (primitives through a direct typed accessor / `toJavaScriptValue`,
/// other types through the `getDynamicType()` converter).
internal struct JSProperty {
  let swiftName: String
  let jsName: String
  /// The property's value type as written, or `nil` when it couldn't be inferred (no annotation and
  /// no literal default). When `nil` the getter still works (the encode infers from `self.<name>`)
  /// but the setter uses an untyped closure parameter.
  let valueType: String?
  /// Whether the property is settable from JS: `true` for a stored `var` or a computed `var` with an
  /// explicit `set` accessor; `false` for a getter-only computed `var` or a `let`.
  let isSettable: Bool

  /// The statements that install this property's accessor on the JS object, indented for the
  /// `_decorateModule` body. Builds a descriptor object (`enumerable` + `get`, and `set` when
  /// settable) via the closure-taking `setProperty(_:)` overload — with the read/write body inlined
  /// into each closure — and installs it with `object.defineProperty(name, descriptor:)`. Capture
  /// matches the function bindings: `self` strong, `appContext` weak + guarded — and, like functions,
  /// the `appContext` capture + guard are omitted from an accessor whose body never references it (a
  /// primitive value, decoded/encoded without the dynamic converter), to avoid the unused-capture
  /// warning. Getter and setter are gated independently.
  var decorateStatements: String {
    let descriptorName = "\(swiftName)Descriptor"
    // A primitive value type encodes/decodes without `getDynamicType()`, so its accessor body never
    // references `appContext`. `nil` (untyped) goes through the dynamic-less `toJavaScriptValue`
    // getter, which also doesn't use it.
    let usesAppContext = valueType.map { fastDecodeAccessor(for: $0) == nil } ?? false
    var lines: [String] = []

    lines.append("let \(descriptorName) = runtime.createObject()")
    lines.append("\(descriptorName).setProperty(\"enumerable\", value: true)")

    // Getter: read `self.<name>` and encode the result back to JS.
    let getEncode: String
    if let valueType, fastDecodeAccessor(for: valueType) != nil {
      getEncode = "return self.\(swiftName).toJavaScriptValue(in: runtime)"
    } else if let valueType {
      getEncode =
        "return try \(valueType).getDynamicType().castToJS(self.\(swiftName), appContext: appContext, in: runtime)"
    } else {
      // No known type: fall back to converting whatever `self.<name>` is. This only happens when the
      // declaration has neither an annotation nor a literal default, which is rare for a stored var.
      getEncode = "return self.\(swiftName).toJavaScriptValue(in: runtime)"
    }
    lines.append(accessorClosure(descriptorName, "get", usesAppContext: usesAppContext, body: getEncode))

    // Setter: decode argument 0 by the static type and write `self.<name>`. A typed setter needs a
    // known value type; when the type couldn't be inferred the property is bound getter-only (a
    // settable var with neither an annotation nor a literal default is rare and can't be decoded).
    if isSettable, let valueType {
      let setDecode: String
      if let accessor = fastDecodeAccessor(for: valueType) {
        setDecode = "self.\(swiftName) = try arguments.unownedValue(at: 0).\(accessor)()"
      } else {
        setDecode =
          "self.\(swiftName) = try \(valueType).getDynamicType().cast(jsValue: arguments[0], appContext: appContext) as! \(valueType)"
      }
      lines.append(
        accessorClosure(descriptorName, "set", usesAppContext: usesAppContext, body: "\(setDecode)\nreturn .undefined"))
    }

    lines.append("object.defineProperty(\"\(jsName)\", descriptor: \(descriptorName))")

    return lines
      .flatMap { $0.split(separator: "\n", omittingEmptySubsequences: false) }
      .map { "  " + $0 }
      .joined(separator: "\n")
  }

  /// One `descriptor.setProperty("get"/"set") { … }` accessor entry. Captures `self` strong and, when
  /// `usesAppContext`, `appContext` weak + guarded (matching the function bindings); otherwise the
  /// capture and guard are omitted so a primitive accessor doesn't warn on an unused capture.
  private func accessorClosure(
    _ descriptorName: String, _ key: String, usesAppContext: Bool, body: String
  ) -> String {
    // Indent each line of a (possibly multi-line) body to sit one level inside the closure, aligned
    // with the `guard`; a bare `\(body)` interpolation would only indent the first line.
    let indentedBody = body
      .split(separator: "\n", omittingEmptySubsequences: false)
      .map { "  \($0)" }
      .joined(separator: "\n")
    if usesAppContext {
      return """
        \(descriptorName).setProperty("\(key)") { [weak appContext, self] this, arguments in
          guard let appContext else {
            throw Exceptions.AppContextLost()
          }
        \(indentedBody)
        }
        """
    }
    return """
      \(descriptorName).setProperty("\(key)") { [self] this, arguments in
      \(indentedBody)
      }
      """
  }
}

/// The single generated function that decorates the module's JS object. Core supplies the object;
/// this binds every `@JS func` (via an inlined `setProperty` closure) and every `@JS var` (via a
/// `defineProperty` accessor) into it. Mirrors core's `ObjectDefinition.decorate(object:)`, including
/// its `borrowing` object parameter (it mutates through the reference without reassigning or taking
/// ownership). Named `_decorateModule` with the leading-underscore convention for synthesized members
/// the **runtime calls by name**; the `ExpoModule` suffix names the `@ExpoModule` macro it came from (a
/// shared object's counterpart is `_decorateSharedObject`).
internal func buildDecorateJavaScriptObject(functions: [JSFunction], properties: [JSProperty]) -> DeclSyntax {
  let functionBody = functions.map { $0.decorateStatements }
  let propertyBody = properties.map { $0.decorateStatements }
  let body = (functionBody + propertyBody).joined(separator: "\n")
  return """
    @JavaScriptActor
    public func _decorateModule(object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime, appContext: AppContext) throws {
    \(raw: body)
    }
    """
}

/// The throwing `JavaScriptUnownedValue` accessor that decodes the given primitive type directly,
/// bypassing the dynamic-type converter (`asDouble()` for `Double`, etc.). Returns `nil` for
/// types without a dedicated accessor — arrays, records, optionals, shared objects, other numeric
/// widths — which decode through `getDynamicType().cast(...)`.
private func fastDecodeAccessor(for type: String) -> String? {
  switch type {
  case "Bool":
    return "asBool"
  case "Int":
    return "asInt"
  case "Double":
    return "asDouble"
  case "String":
    return "asString"
  default:
    return nil
  }
}

/// True when a return clause is absent or written as `Void` / `()` — i.e. the function returns
/// nothing JS-visible, so the binding returns `.undefined`.
private func isVoidType(_ type: TypeSyntax?) -> Bool {
  guard let type else {
    return true
  }
  let text = type.trimmedDescription
  return text == "Void" || text == "()"
}
