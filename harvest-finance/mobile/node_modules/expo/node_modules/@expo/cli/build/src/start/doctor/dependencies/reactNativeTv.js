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
    get REACT_NATIVE_TVOS_PACKAGE_NAME () {
        return REACT_NATIVE_TVOS_PACKAGE_NAME;
    },
    get correctReactNativeTvVersion () {
        return correctReactNativeTvVersion;
    },
    get isReactNativeTvProjectAsync () {
        return isReactNativeTvProjectAsync;
    },
    get reactNativeTvVersionMatchesBundled () {
        return reactNativeTvVersionMatchesBundled;
    }
});
function _jsonfile() {
    const data = /*#__PURE__*/ _interop_require_default(require("@expo/json-file"));
    _jsonfile = function() {
        return data;
    };
    return data;
}
function _requireutils() {
    const data = require("@expo/require-utils");
    _requireutils = function() {
        return data;
    };
    return data;
}
function _semver() {
    const data = /*#__PURE__*/ _interop_require_default(require("semver"));
    _semver = function() {
        return data;
    };
    return data;
}
const _env = require("../../../utils/env");
const _fetch = require("../../../utils/fetch");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const REACT_NATIVE_TVOS_PACKAGE_NAME = 'react-native-tvos';
const debug = require('debug')('expo:doctor:reactNativeTv');
const NPM_DIST_TAGS_URL = `https://registry.npmjs.org/-/package/${REACT_NATIVE_TVOS_PACKAGE_NAME}/dist-tags`;
const LATEST_FALLBACK_SPEC = `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@latest`;
async function isReactNativeTvProjectAsync(projectRoot) {
    const reactNativePackageJsonPath = (0, _requireutils().resolveFrom)(projectRoot, 'react-native/package.json');
    if (!reactNativePackageJsonPath) {
        return false;
    }
    try {
        const installedPkg = await _jsonfile().default.readAsync(reactNativePackageJsonPath);
        return installedPkg.name === REACT_NATIVE_TVOS_PACKAGE_NAME;
    } catch  {
        return false;
    }
}
async function correctReactNativeTvVersion(bundledReactNativeVersion) {
    const derivedTag = deriveDistTag(bundledReactNativeVersion);
    if (!derivedTag) {
        debug(`Could not derive a react-native-tvos dist-tag from "${bundledReactNativeVersion}"; falling back to @latest`);
        return LATEST_FALLBACK_SPEC;
    }
    // In offline mode skip the npm dist-tags lookup and trust the derived tag —
    // any other CLI code path that needs a network request also bails on
    // `EXPO_OFFLINE` (see `validateDependenciesVersionsAsync`).
    if (_env.env.EXPO_OFFLINE) {
        debug(`EXPO_OFFLINE is set; skipping npm dist-tags lookup for react-native-tvos`);
        return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${derivedTag}`;
    }
    const publishedTags = await fetchReactNativeTvDistTagsAsync();
    if (publishedTags.has(derivedTag)) {
        return `npm:${REACT_NATIVE_TVOS_PACKAGE_NAME}@${derivedTag}`;
    }
    debug(`Derived react-native-tvos dist-tag "${derivedTag}" is not published; falling back to @latest`);
    return LATEST_FALLBACK_SPEC;
}
function reactNativeTvVersionMatchesBundled(actualVersion, bundledReactNativeVersion) {
    const actual = _semver().default.coerce(actualVersion);
    const bundled = _semver().default.coerce(bundledReactNativeVersion);
    if (!actual || !bundled) {
        return false;
    }
    return actual.major === bundled.major && actual.minor === bundled.minor;
}
function deriveDistTag(reactNativeVersion) {
    if (!reactNativeVersion) {
        return undefined;
    }
    let minVersion = null;
    try {
        minVersion = _semver().default.minVersion(reactNativeVersion);
    } catch  {
        minVersion = null;
    }
    if (!minVersion) {
        return undefined;
    }
    if (minVersion.prerelease.length > 0) {
        return 'next';
    }
    return `${minVersion.major}.${minVersion.minor}-stable`;
}
async function fetchReactNativeTvDistTagsAsync() {
    let response;
    try {
        response = await (0, _fetch.fetch)(NPM_DIST_TAGS_URL);
    } catch (error) {
        debug(`npm dist-tags lookup threw: ${(error == null ? void 0 : error.message) ?? error}`);
        return new Set();
    }
    // Always read the body to release the underlying stream — even on a non-2xx —
    // before deciding what to do with it. Parse JSON manually so a malformed
    // body never escapes as a rejected promise.
    let body = '';
    try {
        body = await response.text();
    } catch (error) {
        debug(`npm dist-tags body read threw: ${(error == null ? void 0 : error.message) ?? error}`);
        return new Set();
    }
    if (!response.ok) {
        debug(`npm dist-tags lookup failed with status ${response.status}`);
        return new Set();
    }
    let json;
    try {
        json = JSON.parse(body);
    } catch  {
        return new Set();
    }
    if (!json || typeof json !== 'object') {
        return new Set();
    }
    return new Set(Object.keys(json));
}

//# sourceMappingURL=reactNativeTv.js.map