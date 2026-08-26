// Copyright © 2024 650 Industries.
// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Forks https://github.com/facebook/metro/blob/01b4ad6/packages/metro/src/node-haste/DependencyGraph/createFileMap.js
// and redirects to `@expo/metro-file-map`
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get /**
 * Creates a `FileMap` using `@expo/metro-file-map`, matching the same config
 * interpretation as Metro's original `createFileMap`.
 */ default () {
        return createFileMap;
    },
    get replaceMetroFileMap () {
        return replaceMetroFileMap;
    }
});
function _metrofilemap() {
    const data = /*#__PURE__*/ _interop_require_wildcard(require("@expo/metro-file-map"));
    _metrofilemap = function() {
        return data;
    };
    return data;
}
function _ciinfo() {
    const data = /*#__PURE__*/ _interop_require_default(require("ci-info"));
    _ciinfo = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
const _composeMetroIgnorePatterns = require("../../../utils/composeMetroIgnorePatterns");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function getIgnorePattern(config) {
    const { blockList, blacklistRE } = config.resolver;
    return (0, _composeMetroIgnorePatterns.composeMetroIgnorePatterns)(blacklistRE || blockList);
}
function createFileMap(config, options) {
    const watch = (options == null ? void 0 : options.watch) == null ? !_ciinfo().default.isCI : options.watch;
    const { enabled: autoSaveEnabled, ...autoSaveOpts } = config.watcher.unstable_autoSaveCache ?? {};
    const autoSave = watch && autoSaveEnabled ? autoSaveOpts : false;
    const plugins = [
        ...config.unstable_fileMapPlugins ?? []
    ];
    let dependencyPlugin = null;
    if (config.resolver.dependencyExtractor != null && (options == null ? void 0 : options.extractDependencies) !== false) {
        dependencyPlugin = new (_metrofilemap()).DependencyPlugin({
            dependencyExtractor: config.resolver.dependencyExtractor,
            computeDependencies: true
        });
        plugins.push(dependencyPlugin);
    }
    const hasteMap = new (_metrofilemap()).HastePlugin({
        platforms: new Set([
            ...config.resolver.platforms,
            _metrofilemap().default.H.NATIVE_PLATFORM
        ]),
        hasteImplModulePath: config.resolver.hasteImplModulePath ?? null,
        enableHastePackages: config.resolver.enableGlobalPackages,
        rootDir: config.projectRoot,
        failValidationOnConflicts: (options == null ? void 0 : options.throwOnModuleCollision) ?? true
    });
    plugins.push(hasteMap);
    const projectRoot = config.projectRoot;
    const serverRoot = config.server.unstable_serverRoot;
    const enableFallback = !!config.resolver.unstable_onDemandFilesystem;
    // NOTE(@kitten): We allow the on-demand filesystem to escape the server root and access any file,
    // - if we're using the CLI from `expo/expo` on an external project (e.g. in CI(
    // - if the user explicitly sets the experimental flag to 'UNSTABLE_ALLOW_ALL'
    const scopeFallback = enableFallback && config.resolver.unstable_onDemandFilesystem !== 'UNSTABLE_ALLOW_ALL' && isDirectoryIn(__dirname, serverRoot ?? projectRoot);
    const fileMap = new (_metrofilemap()).default({
        // NOTE(@kitten): Dropped `config.unstable_fileMapCacheManagerFactory`
        cacheManagerFactory: (factoryParams)=>{
            return new (_metrofilemap()).DiskCacheManager(factoryParams, {
                cacheDirectory: config.fileMapCacheDirectory ?? config.hasteMapCacheDirectory,
                cacheFilePrefix: options == null ? void 0 : options.cacheFilePrefix,
                autoSave
            });
        },
        perfLoggerFactory: config.unstable_perfLoggerFactory,
        computeSha1: !config.watcher.unstable_lazySha1,
        enableSymlinks: true,
        // NOTE(@kitten): @expo/metro-file-map fork adds `enableFallback` and `scopeFallback`
        enableFallback,
        scopeFallback,
        extensions: Array.from(new Set([
            ...config.resolver.sourceExts,
            ...config.resolver.assetExts,
            ...config.watcher.additionalExts
        ])),
        healthCheck: config.watcher.healthCheck,
        ignorePattern: getIgnorePattern(config),
        maxWorkers: config.maxWorkers,
        plugins,
        retainAllFiles: true,
        resetCache: config.resetCache,
        rootDir: projectRoot,
        roots: config.watchFolders,
        useWatchman: config.resolver.useWatchman ?? false,
        watch,
        watchmanDeferStates: config.watcher.watchman.deferStates,
        // NOTE: (@expo/metro-file-map fork) New option is required for `scopeFallback: true` checks
        serverRoot
    });
    return {
        fileMap,
        hasteMap,
        dependencyPlugin
    };
}
function isDirectoryIn(targetPath, rootPath) {
    return targetPath === rootPath || targetPath.startsWith(rootPath + _nodepath().default.sep);
}
function assertMetroFileMapPatched(metro) {
    var _metro_getBundler_getBundler;
    const depGraph = (_metro_getBundler_getBundler = metro.getBundler().getBundler()) == null ? void 0 : _metro_getBundler_getBundler._depGraph;
    const fileMap = depGraph == null ? void 0 : depGraph._haste;
    if (!fileMap || !fileMap.__expo) {
        throw new Error('@expo/metro-file-map was not used by Metro. ' + "The DependencyGraph's file map does not have the __expo flag, " + 'which means the createFileMap module export was not replaced before ' + 'Metro instantiated. Ensure replaceMetroFileMap() is called before runServer().');
    }
}
async function replaceMetroFileMap(immediate) {
    const createFileMapModule = require('@expo/metro/metro/node-haste/DependencyGraph/createFileMap');
    Object.defineProperty(createFileMapModule, 'default', {
        enumerable: true,
        configurable: false,
        writable: false,
        value: createFileMap
    });
    const result = await immediate();
    assertMetroFileMapPatched(result.metro);
    return result;
}

//# sourceMappingURL=createFileMap-fork.js.map