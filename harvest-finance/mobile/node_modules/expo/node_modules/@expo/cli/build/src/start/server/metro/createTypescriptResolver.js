// Resolves bare module specifiers using `compilerOptions.paths` and `compilerOptions.baseUrl`
// from the project's tsconfig.json or jsconfig.json.
// Includes a standalone tsconfig parser that walks the `extends` chain using @expo/json-file
// without depending on the `typescript` package. Uses Metro's DependencyGraph for file
// existence, realpath, and node_modules resolution.
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
    get _loadTsConfigWithExtends () {
        return _loadTsConfigWithExtends;
    },
    get _resolveWithTsConfigPaths () {
        return _resolveWithTsConfigPaths;
    },
    get _toResolveConfig () {
        return _toResolveConfig;
    },
    get createTypescriptResolver () {
        return createTypescriptResolver;
    }
});
function _jsonfile() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/json-file"));
    _jsonfile = function() {
        return data;
    };
    return data;
}
function _RootPathUtils() {
    const data = require("@expo/metro/metro-file-map/lib/RootPathUtils");
    _RootPathUtils = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interop_require_default(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
const _metroErrors = require("./metroErrors");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const debug = require('debug')('expo:start:server:metro:typescript-resolver');
function createTypescriptResolver({ projectRoot, getMetroBundler, getStrictResolver, watch }) {
    const input = {
        current: null
    };
    let initialized = false;
    function init() {
        initialized = true;
        const bundler = getMetroBundler();
        const tsconfig = loadTsConfigPaths(projectRoot, bundler._depGraph);
        input.current = _toResolveConfig(tsconfig, projectRoot);
        if (watch) {
            setupTsConfigWatcher(input, bundler, projectRoot);
        }
    }
    const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
    const nodeModulesPart = `${_path().default.sep}node_modules${_path().default.sep}`;
    return function requestTsconfigPaths(immutableContext, moduleName, platform) {
        if (!initialized) {
            init();
        }
        if (!input.current) {
            return null;
        } else if (fileSpecifierRe.test(moduleName)) {
            return null;
        } else if (immutableContext.originModulePath.includes(nodeModulesPart)) {
            return null;
        }
        // TypeScript paths resolution is heavily pre-computed, which is processed
        // in the `_toResolveConfig` helper. This allows the actual resolver to do
        // very little work
        return _resolveWithTsConfigPaths(input.current, moduleName, getOptionalResolve(immutableContext, platform, getStrictResolver));
    };
}
function setupTsConfigWatcher(input, bundler, projectRoot) {
    function reload() {
        const tsconfig = loadTsConfigPaths(projectRoot, bundler._depGraph);
        input.current = _toResolveConfig(tsconfig, projectRoot);
    }
    const watcher = bundler.getWatcher();
    watcher.addListener('change', ({ changes })=>{
        var _input_current;
        for (const change of changes.addedFiles){
            // Additions are only relevant if we haven't watched tsconfigs before
            if (change[0] === TSCONFIG_NAME || change[0] === JSCONFIG_NAME) {
                return reload();
            }
        }
        if ((_input_current = input.current) == null ? void 0 : _input_current.configNormalPaths) {
            for (const change of changes.modifiedFiles){
                if (input.current.configNormalPaths.has(change[0])) {
                    return reload();
                }
            }
            for (const change of changes.removedFiles){
                if (input.current.configNormalPaths.has(change[0])) {
                    return reload();
                }
            }
        }
    });
}
const escapePrefix = (str)=>str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function joinBaseUrl(baseUrl, lookup) {
    return _path().default.join(baseUrl, lookup);
}
function _resolveWithTsConfigPaths(config, moduleName, resolve) {
    // Exact matches contain no '*' wildcards, and can be 1:1 replacements
    const exactPaths = config.exactMatches[moduleName];
    if (exactPaths != null) {
        for (const alias of exactPaths){
            const result = resolve(alias);
            if (result != null) {
                debug(`${moduleName} -> ${alias}`);
                return result;
            }
        }
        return null;
    }
    // Widlcard matches contain '*' and we first match the preceding string before it with a regex
    if (config.prefixRe != null) {
        const match = config.prefixRe.exec(moduleName);
        if (match != null) {
            const prefix = match[1];
            const rest = moduleName.slice(prefix.length);
            for (const entry of config.prefixMap[prefix]){
                let star = rest;
                if (entry.suffix) {
                    // If we have a suffix (string after '*') it's checked separately
                    // This is cheap, since most matches are complex path prefixes
                    if (!rest.endsWith(entry.suffix)) continue;
                    star = rest.slice(0, -entry.suffix.length);
                }
                for (const alias of entry.mapping){
                    const possibleResult = alias.replace('*', star);
                    const result = resolve(possibleResult);
                    if (result != null) {
                        debug(`${moduleName} -> ${possibleResult}`);
                        return result;
                    }
                }
                break; // First matching suffix wins
            }
            // NOTE: Special case for `"*"` paths pattern (replacement for `baseUrl`)
            // If a non-catch-all prefix matched but failed, try the "*" catch-all
            // This could also apply to `*.[ext]` paths commonly though
            if (prefix !== '' && config.prefixMap[''] != null) {
                for (const entry of config.prefixMap['']){
                    let star = moduleName;
                    if (entry.suffix) {
                        if (!moduleName.endsWith(entry.suffix)) continue;
                        star = moduleName.slice(0, -entry.suffix.length);
                    }
                    for (const alias of entry.mapping){
                        const possibleResult = alias.replace('*', star);
                        const result = resolve(possibleResult);
                        if (result != null) {
                            debug(`${moduleName} -> ${possibleResult}`);
                            return result;
                        }
                    }
                }
            }
            return null;
        }
    }
    // Only resolve against baseUrl if no `paths` groups were matched.
    // Base URL is resolved after paths, and before node_modules.
    // NOTE: In TypeScript 6 this is disabled unless `"ignoreDeprecations": "6.0"` is added
    // In TypeScript 7, this will be removed, and `paths['*']` is the replacement
    if (config.baseUrl != null) {
        const possibleResult = joinBaseUrl(config.baseUrl, moduleName);
        const result = resolve(possibleResult);
        if (result) {
            debug(`baseUrl: ${moduleName} -> ${possibleResult}`);
            return result;
        }
    }
    return null;
}
function getOptionalResolve(context, platform, getStrictResolver) {
    const doResolve = getStrictResolver(context, platform);
    return function optionalResolve(moduleName) {
        try {
            return doResolve(moduleName);
        } catch (error) {
            // If the error is directly related to a resolver not being able to resolve a module, then
            // we can ignore the error and try the next resolver. Otherwise, we should throw the error.
            const isResolutionError = (0, _metroErrors.isFailedToResolveNameError)(error) || (0, _metroErrors.isFailedToResolvePathError)(error);
            if (!isResolutionError) {
                throw error;
            }
        }
        return null;
    };
}
function _toResolveConfig(tsconfig, projectRoot) {
    if (!tsconfig || !tsconfig.paths && tsconfig.baseUrl == null) {
        return null;
    }
    // NOTE(@kitten): We previously had a bug that assumed that paths are relative to the `baseUrl` only
    // However, the `baseUrl` is optional and paths can be relative to the config path instead.
    const pathsBasePath = tsconfig.baseUrl ?? tsconfig.pathsBasePath ?? projectRoot;
    const paths = tsconfig.paths ?? {};
    const exactMatches = Object.create(null);
    const prefixMap = Object.create(null);
    const seenPrefixes = [];
    for(const key in paths){
        if (!Array.isArray(paths[key])) {
            continue;
        }
        // Pre-join with baseUrl so the hot path avoids path.join entirely
        const mapping = paths[key].filter((p)=>typeof p === 'string' && !p.endsWith('.d.ts')).map((p)=>joinBaseUrl(pathsBasePath, p));
        if (mapping.length > 0) {
            const starIndex = key.indexOf('*');
            if (starIndex === -1) {
                exactMatches[key] = mapping;
            } else {
                const prefix = key.slice(0, starIndex);
                const suffix = key.slice(starIndex + 1);
                if (!prefixMap[prefix]) {
                    prefixMap[prefix] = [];
                    seenPrefixes.push(prefix);
                }
                prefixMap[prefix].push({
                    suffix,
                    mapping
                });
            }
        }
    }
    // Match longest prefix first
    seenPrefixes.sort((a, b)=>b.length - a.length);
    const prefixRe = seenPrefixes.length ? new RegExp(`^(${seenPrefixes.map(escapePrefix).join('|')})`) : null;
    return {
        exactMatches,
        prefixRe,
        prefixMap,
        baseUrl: tsconfig.baseUrl ?? null,
        configNormalPaths: tsconfig.configNormalPaths
    };
}
const TSCONFIG_NAME = 'tsconfig.json';
const JSCONFIG_NAME = 'jsconfig.json';
function loadTsConfigPaths(projectRoot, depGraph) {
    let configPath = null;
    if (depGraph.doesFileExist(TSCONFIG_NAME)) {
        configPath = _path().default.join(projectRoot, TSCONFIG_NAME);
    } else if (depGraph.doesFileExist(JSCONFIG_NAME)) {
        configPath = _path().default.join(projectRoot, JSCONFIG_NAME);
    }
    if (!configPath) {
        return null;
    }
    try {
        return _loadTsConfigWithExtends(projectRoot, configPath, depGraph);
    } catch (error) {
        if ((error == null ? void 0 : error.isJsonFileError) || (error == null ? void 0 : error.name) === 'SyntaxError') {
            debug(`Failed to parse ${configPath}: ${error.message}`);
            return null;
        }
        throw error;
    }
}
function _loadTsConfigWithExtends(projectRoot, configPath, depGraph) {
    const visited = new Set();
    const rootConfigDir = _path().default.dirname(configPath);
    function load(configPath) {
        // NOTE: We avoid cycles here, which are theoretically possible
        // We avoid warning or throwing an error though, since TypeScript will complain about this anyway
        if (typeof configPath !== 'string' || visited.has(configPath)) {
            return null;
        } else {
            visited.add(configPath);
        }
        const configDir = _path().default.dirname(configPath);
        const raw = _jsonfile().default.read(configPath, {
            json5: true
        });
        const own = extractPathsFromCompilerOptions(raw);
        let baseUrl;
        let paths;
        let pathsBasePath;
        if (raw.extends) {
            const exts = !Array.isArray(raw.extends) ? [
                raw.extends
            ] : raw.extends;
            for (const ext of exts){
                if (typeof ext === 'string') {
                    // Resolve the `extends` path with Node-like resolution, similar to TypeScript
                    const extPath = resolveExtendsPath(ext, configDir, depGraph._fileSystem);
                    const parent = load(extPath);
                    if (parent) {
                        baseUrl = parent.baseUrl ?? baseUrl;
                        paths = parent.paths ?? paths;
                        pathsBasePath = parent.pathsBasePath ?? pathsBasePath;
                    }
                }
            }
        }
        // Outermost config values win, but can be combined
        // The `pathsBasePath` is the path of the config that `paths` are defined in
        // `paths` are not merged
        return {
            baseUrl: own.baseUrl ?? baseUrl,
            paths: own.paths ?? paths,
            pathsBasePath: own.paths != null ? configDir : pathsBasePath
        };
    }
    const result = load(configPath);
    if (result != null) {
        const pathUtils = new (_RootPathUtils()).RootPathUtils(projectRoot);
        const configPaths = new Set();
        // Keep track of the configuration paths here for the file watcher
        for (const visitedConfigPath of visited){
            configPaths.add(pathUtils.absoluteToNormal(visitedConfigPath));
        }
        result.configNormalPaths = configPaths;
        if (result.baseUrl != null) {
            result.baseUrl = _path().default.resolve(rootConfigDir, substituteConfigDir(result.baseUrl, rootConfigDir));
        }
        if (result.paths != null) {
            for(const key in result.paths){
                const mapping = result.paths[key];
                for(let idx = 0; idx < mapping.length; idx++){
                    mapping[idx] = substituteConfigDir(mapping[idx], rootConfigDir);
                }
            }
        }
    }
    return result;
}
/** Normalize JSON's tsconfig compilerOptions */ function extractPathsFromCompilerOptions(raw) {
    if (raw.compilerOptions == null || typeof raw.compilerOptions !== 'object') {
        return {};
    }
    const opts = raw.compilerOptions;
    const baseUrl = typeof opts.baseUrl === 'string' ? opts.baseUrl : undefined;
    let paths;
    if (opts.paths != null && typeof opts.paths === 'object') {
        paths = {};
        for(const key in opts.paths){
            const values = opts.paths[key];
            if (Array.isArray(values)) {
                paths[key] = values.filter((v)=>typeof v === 'string');
            }
        }
    }
    return {
        baseUrl,
        paths
    };
}
/** Lookup/resolve an `extends` path */ function resolveExtendsPath(targetPath, configDir, fileSystem) {
    let target = fileSystem.lookup(_path().default.join(configDir, targetPath));
    if (target.exists && target.type === 'f') {
        return target.realPath;
    }
    if (!targetPath.endsWith('.json')) {
        target = fileSystem.lookup(_path().default.join(configDir, targetPath + '.json'));
        if (target.exists && target.type === 'f') {
            return target.realPath;
        }
    }
    // Last attempt is Node-like resolution
    let lookup;
    if (!targetPath.endsWith('.json')) {
        lookup = fileSystem.hierarchicalLookup(configDir, `node_modules/${targetPath}.json`, {
            subpathType: 'f'
        });
        if (lookup != null) {
            return lookup.absolutePath;
        }
    }
    if (lookup == null) {
        lookup = fileSystem.hierarchicalLookup(configDir, `node_modules/${targetPath}`, {
            subpathType: 'f'
        });
    }
    if (lookup == null && !targetPath.endsWith('.json')) {
        lookup = fileSystem.hierarchicalLookup(configDir, `node_modules/${targetPath}/${TSCONFIG_NAME}`, {
            subpathType: 'f'
        });
    }
    // NOTE(@kitten): Some implementations opt to add `package.json:exports` and `package.json:tsconfig`
    // field support here, but it's unclear if this is even supported in TypeScript itself. It's likely
    // not used, as it's impossible to find an example of this anywhere
    return lookup == null ? void 0 : lookup.absolutePath;
}
/** TypeScript's `${configDir}` template prefix for the user config's path */ function substituteConfigDir(value, configDir) {
    return value.startsWith('${configDir}') ? value.replace('${configDir}', configDir.endsWith(_path().default.sep) ? '.' : './') : value;
}

//# sourceMappingURL=createTypescriptResolver.js.map