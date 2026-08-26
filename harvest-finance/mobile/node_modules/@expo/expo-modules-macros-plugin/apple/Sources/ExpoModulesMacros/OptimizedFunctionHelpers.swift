import SwiftSyntaxMacros

/// Generates Objective-C type encoding string for the given signature
internal func generateTypeEncoding(returnType: String, paramTypes: [String]) throws -> String {
  var encoding = ""

  // Encode return type
  guard let returnEncoding = typeToEncoding(returnType) else {
    throw MacroExpansionErrorMessage("Unsupported return type: \(returnType)")
  }
  encoding += returnEncoding

  // Add block marker
  encoding += "@?"

  // Encode parameters
  for paramType in paramTypes {
    guard let paramEncoding = typeToEncoding(paramType) else {
      throw MacroExpansionErrorMessage("Unsupported parameter type: \(paramType)")
    }
    encoding += paramEncoding
  }

  return encoding
}

/// Maps Swift type to Objective-C type encoding character
internal func typeToEncoding(_ type: String) -> String? {
  switch type {
  case "Double":
    return "d"
  case "Int", "Int64":
    return "q"
  case "String":
    return "@"
  case "Bool":
    return "B"
  case "Void", "()":
    return "v"
  default:
    return nil
  }
}

struct MacroExpansionErrorMessage: Error, CustomStringConvertible {
  let message: String

  init(_ message: String) {
    self.message = message
  }

  var description: String {
    return message
  }
}
