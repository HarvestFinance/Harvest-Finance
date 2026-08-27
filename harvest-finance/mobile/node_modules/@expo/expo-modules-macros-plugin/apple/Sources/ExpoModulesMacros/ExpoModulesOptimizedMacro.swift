import Foundation
import SwiftSyntax
import SwiftSyntaxBuilder
import SwiftSyntaxMacros

// MARK: - ExpoModulesOptimizedMacro

/// Implementation of the `@OptimizedFunction` attached macro.
/// Generates a peer function that returns `OptimizedFunctionDescriptor` for use with
/// the `Function("name", descriptor)` or `AsyncFunction("name", descriptor)` overload.
///
/// Usage:
///
///     @OptimizedFunction
///     private func addNumbers(a: Double, b: Double) -> Double {
///         return a + b
///     }
///
/// generates a peer function:
///
///     private func addNumbers() -> OptimizedFunctionDescriptor {
///         return OptimizedSyncFunctionDefinition.createDescriptor(
///             typeEncoding: "d@?dd",
///             argsCount: 2,
///             block: (addNumbers as @convention(block) (Double, Double) -> Double) as AnyObject
///         )
///     }
///
/// Then use in definition(): `Function("addNumbers", addNumbers())`
public struct OptimizedFunctionAttachedMacro: PeerMacro {
  public static func expansion(
    of node: AttributeSyntax,
    providingPeersOf declaration: some DeclSyntaxProtocol,
    in context: some MacroExpansionContext
  ) throws -> [DeclSyntax] {
    guard let funcDecl = declaration.as(FunctionDeclSyntax.self) else {
      throw MacroExpansionErrorMessage(
        "@OptimizedFunction can only be attached to function declarations")
    }

    let functionName = funcDecl.name.text

    var paramTypes: [String] = []
    for param in funcDecl.signature.parameterClause.parameters {
      paramTypes.append(param.type.trimmedDescription)
    }

    let returnType = funcDecl.signature.returnClause?.type.trimmedDescription ?? "Void"
    let functionThrows = funcDecl.signature.effectSpecifiers?.throwsClause?.throwsSpecifier != nil
    let typeEncoding = try generateTypeEncoding(returnType: returnType, paramTypes: paramTypes)
    let implFuncName = funcDecl.name.text
    let blockParamTypes = paramTypes.joined(separator: ", ")
    let argNames = (0..<paramTypes.count).map { "arg\($0)" }.joined(separator: ", ")

    let peerFunc: DeclSyntax

    if functionThrows {
      let isVoid = returnType == "Void" || returnType == "()"
      let implType =
        paramTypes.isEmpty
        ? "() throws -> \(returnType)" : "(\(blockParamTypes)) throws -> \(returnType)"
      let wrapperType =
        paramTypes.isEmpty
        ? "@convention(block) () -> \(returnType)"
        : "@convention(block) (\(blockParamTypes)) -> \(returnType)"
      let closureArgs = paramTypes.isEmpty ? "" : " \(argNames) in"
      let implCall = paramTypes.isEmpty ? "impl()" : "impl(\(argNames))"
      let tryExpr = isVoid ? "try \(implCall)" : "return try \(implCall)"
      let unreachable = isVoid ? "" : "\n      fatalError(\"Unreachable\")"

      peerFunc = """
        private func \(raw: functionName)() -> OptimizedFunctionDescriptor {
          let impl: \(raw: implType) = \(raw: implFuncName)
          let wrapper: \(raw: wrapperType) = {\(raw: closureArgs)
            do {
              \(raw: tryExpr)
            } catch {
              let nsError: NSError
              if let expoError = error as? Exception {
                nsError = NSError(domain: "dev.expo.modules", code: 0, userInfo: [
                  "name": expoError.name,
                  "code": expoError.code,
                  "message": expoError.debugDescription,
                ])
              } else {
                nsError = error as NSError
              }
              let exception = NSException(
                name: NSExceptionName(nsError.userInfo["name"] as? String ?? "SwiftError"),
                reason: nsError.userInfo["message"] as? String ?? nsError.localizedDescription,
                userInfo: nsError.userInfo
              )
              exception.raise()\(raw: unreachable)
            }
          }
          return OptimizedSyncFunctionDefinition.createDescriptor(
            typeEncoding: "\(raw: typeEncoding)",
            argsCount: \(raw: String(paramTypes.count)),
            block: wrapper as AnyObject
          )
        }
        """
    } else {
      peerFunc = """
        private func \(raw: functionName)() -> OptimizedFunctionDescriptor {
          return OptimizedSyncFunctionDefinition.createDescriptor(
            typeEncoding: "\(raw: typeEncoding)",
            argsCount: \(raw: String(paramTypes.count)),
            block: (\(raw: implFuncName) as @convention(block) (\(raw: blockParamTypes)) -> \(raw: returnType)) as AnyObject
          )
        }
        """
    }

    return [peerFunc]
  }
}
