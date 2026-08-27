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
    get checkDependencies () {
        return checkDependencies;
    },
    get getDependencyCheckMessage () {
        return getDependencyCheckMessage;
    },
    get printDependencyCheckResult () {
        return printDependencyCheckResult;
    }
});
function _chalk() {
    const data = /*#__PURE__*/ _interop_require_default(require("chalk"));
    _chalk = function() {
        return data;
    };
    return data;
}
const _log = /*#__PURE__*/ _interop_require_wildcard(require("../log"));
const _validateDependenciesVersions = require("./doctor/dependencies/validateDependenciesVersions");
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
/**
 * Fetch dependency version check results.
 * Returns null if everything is up-to-date.
 */ async function checkDependenciesAsync(projectRoot, exp, pkg) {
    const incorrectDeps = await (0, _validateDependenciesVersions.getVersionedDependenciesAsync)(projectRoot, exp, pkg);
    if (incorrectDeps.length === 0) {
        return null;
    }
    const expoDep = incorrectDeps.find((dep)=>dep.packageName === 'expo');
    const otherCount = incorrectDeps.filter((dep)=>dep.packageName !== 'expo').length;
    return {
        expo: expoDep ? {
            actualVersion: expoDep.actualVersion,
            expectedVersionOrRange: expoDep.expectedVersionOrRange
        } : undefined,
        otherCount
    };
}
let _checkDependenciesRef;
function checkDependencies(projectRoot, exp, pkg) {
    if (_checkDependenciesRef) {
        return _checkDependenciesRef;
    }
    const ref = {
        result: null,
        promise: Promise.resolve(null)
    };
    ref.promise = checkDependenciesAsync(projectRoot, exp, pkg).then((result)=>{
        ref.result = result;
        return result;
    }, (_error)=>null);
    _checkDependenciesRef = ref;
    return ref;
}
function getDependencyCheckMessage(result) {
    if (result == null ? void 0 : result.expo) {
        return [
            _chalk().default.yellow`An update for {bold expo} is available: {red ${result.expo.actualVersion}} {dim →} {green ${result.expo.expectedVersionOrRange}}`,
            _chalk().default.yellow`${result.otherCount} other package${result.otherCount === 1 ? '' : 's'} may need updating. Run {bold npx expo install --check} for details.`
        ];
    } else if (result == null ? void 0 : result.otherCount) {
        return [
            _chalk().default.yellow`${result.otherCount} package${result.otherCount === 1 ? '' : 's'} may need updating. Run {bold npx expo install --check} for details.`
        ];
    } else {
        return [];
    }
}
function printDependencyCheckResult(result) {
    for (const line of getDependencyCheckMessage(result)){
        _log.log(line);
    }
}

//# sourceMappingURL=checkDependenciesOnStart.js.map