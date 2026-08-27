import SwiftSyntax

/// The protocol that every type crossing the JS boundary must conform to. Centralized here so the
/// eventual rename (this is a placeholder name) is a single edit, and shared by every macro that
/// asserts the conformance (`@JS`, `@Record`, …).
internal let jsConvertibleProtocolName = "AnyArgument"

/// Types we never assert because they're statically known to conform and never reach the dynamic
/// converter: the JS primitives. Asserting them would only add noise to the expansion. Kept here
/// (rather than reusing the decode-path's `fastDecodeAccessor`) because "known-to-conform" is a
/// concept that belongs with the assertion logic, not with how a value is decoded.
private let knownConformingPrimitives: Set<String> = ["Bool", "Int", "Double", "String"]

/// One member's worth of conformance assertion: a name (the member it stands for) and the declared
/// types crossing the JS boundary for it. The name surfaces verbatim in the compiler's conformance
/// diagnostic ("local function '<name>' requires that '<Type>' conform to …"), so it identifies the
/// offending member in the error message on top of the location pointing at the user's declaration.
internal struct ConformanceAssertion {
  let name: String
  /// Declared types as written. Composed types (`[Int]`, `String?`, …) are kept verbatim — their
  /// conditional conformances transitively constrain the elements.
  let types: [String]
}

/// A single conformance-assertion peer for a `@JS` member: a never-called `private func` whose body
/// statically asserts the member's boundary types conform. The assertion is compile-time only — the
/// function is never invoked, but Swift still type-checks its body, so a non-conforming type becomes
/// a compile error. Emitted as a **peer** of the user's declaration, so that error lands on the
/// user's own member rather than on the enclosing macro.
///
/// `isStatic` makes the peer `static`, mirroring a `static`/`class` member so it's emitted in the
/// right metatype context (a peer of a type-level member can't be an instance method). `class func`
/// members collapse to `static` here too: the peer is private and never called or overridden, so
/// `static` is always sufficient.
///
/// Returns `nil` when nothing is left to assert (every type was a known-conforming primitive, or the
/// list was empty), so the caller emits nothing in that case.
internal func typeConformanceAssertion(for assertion: ConformanceAssertion, isStatic: Bool) -> DeclSyntax? {
  guard let body = conformanceAssertionBody(assertion) else {
    return nil
  }
  let staticKeyword = isStatic ? "static " : ""
  return """
    private \(raw: staticKeyword)func _assertTypesConformance_\(raw: assertion.name)() {
    \(raw: body)
    }
    """
}

/// One conformance-assertion peer covering several members' assertions at once — used by `@Record`,
/// which folds every property into a single `_assertTypesConformance()` rather than emitting a peer
/// per property. Each assertion keeps its own named nested helper, so the per-member naming in the
/// diagnostic is preserved even though they share one peer.
///
/// Returns `nil` when no assertion has anything left to verify (all primitives / empty), so the
/// caller emits nothing.
internal func typeConformanceAssertions(for assertions: [ConformanceAssertion]) -> DeclSyntax? {
  let bodies = assertions.compactMap(conformanceAssertionBody)
  guard !bodies.isEmpty else {
    return nil
  }
  return """
    private func _assertTypesConformance() {
    \(raw: bodies.joined(separator: "\n"))
    }
    """
}

/// The assertion's body fragment: a nested generic helper named after the member, plus one call per
/// distinct non-primitive type. Nesting the helper keeps the constraint entirely local — no shared
/// symbol, nothing to collide, nothing left in the type's namespace — and naming it after the member
/// puts the member's name in the compiler's conformance diagnostic. Returns `nil` when every type was
/// a known-conforming primitive or the list was empty.
private func conformanceAssertionBody(_ assertion: ConformanceAssertion) -> String? {
  // Unwrap top-level optionals to the core type, then dedup so each type is asserted once even when
  // it appears more than once; skip known primitives.
  var seen: Set<String> = []
  var distinct: [String] = []
  for type in assertion.types.map(unwrappedOptional)
  where !knownConformingPrimitives.contains(type) && seen.insert(type).inserted {
    distinct.append(type)
  }
  guard !distinct.isEmpty else {
    return nil
  }

  var lines = ["func \(assertion.name)<T: \(jsConvertibleProtocolName)>(_: T.Type) {}"]
  lines.append(contentsOf: distinct.map { "\(assertion.name)(\($0).self)" })
  return lines.joined(separator: "\n")
}

/// Strips every trailing optional marker (`?`/`!`) so the assertion targets the core wrapped type.
/// `Optional<W>: AnyArgument` holds exactly when `W: AnyArgument` (and `T!` is just `T?`), so each
/// layer is conformance-equivalent to its wrapped type. Asserting the core gives a cleaner diagnostic
/// (the direct `requires that '<type>' conform`, not the conditional-conformance phrasing through
/// `Optional`) and sidesteps that `T!.self` is invalid in metatype position. Only *trailing* markers
/// are stripped, so `[Int?]` keeps its inner `?`; a longhand `Optional<W>` isn't peeled but is still
/// asserted whole, which remains correct.
private func unwrappedOptional(_ type: String) -> String {
  var result = Substring(type)
  while result.hasSuffix("?") || result.hasSuffix("!") {
    result = result.dropLast()
  }
  return String(result)
}
