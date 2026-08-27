// swift-tools-version: 6.2
// The swift-tools-version declares the minimum version of Swift required to build this package.

import CompilerPluginSupport
import Foundation
import PackageDescription

let package = Package(
  name: "ExpoModulesMacros",
  platforms: [.macOS(.v13)],
  products: [],
  dependencies: [
    .package(url: "https://github.com/swiftlang/swift-syntax.git", from: "602.0.0-latest")
  ],
  targets: [
    .macro(
      name: "ExpoModulesMacros",
      dependencies: [
        .product(name: "SwiftSyntaxMacros", package: "swift-syntax"),
        .product(name: "SwiftCompilerPlugin", package: "swift-syntax"),
      ]
    )
  ]
)

// The Tests directory is excluded from the published npm package,
// so only declare the test target when building from the repository.
if FileManager.default.fileExists(atPath: Context.packageDirectory + "/Tests") {
  package.targets.append(
    .testTarget(
      name: "ExpoModulesMacrosTests",
      dependencies: [
        "ExpoModulesMacros",
        .product(name: "SwiftSyntaxMacrosTestSupport", package: "swift-syntax"),
        .product(name: "SwiftSyntaxMacrosGenericTestSupport", package: "swift-syntax"),
      ]
    )
  )
}
