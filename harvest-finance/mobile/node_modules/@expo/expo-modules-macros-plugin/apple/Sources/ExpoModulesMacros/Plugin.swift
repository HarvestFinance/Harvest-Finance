import SwiftCompilerPlugin
import SwiftSyntaxMacros

@main
struct ExpoModulesMacrosPlugin: CompilerPlugin {
  let providingMacros: [Macro.Type] = [
    OptimizedFunctionAttachedMacro.self,
    JSMacro.self,
    ExpoModuleMacro.self,
    SharedObjectMacro.self,
    RecordMacro.self,
  ]
}
