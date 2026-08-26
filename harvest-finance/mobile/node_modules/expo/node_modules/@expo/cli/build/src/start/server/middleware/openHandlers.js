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
    get createInfoHandler () {
        return createInfoHandler;
    },
    get createOpen () {
        return createOpen;
    },
    get resolveOpenInfo () {
        return resolveOpenInfo;
    }
});
function createInfoHandler(deps) {
    return ({ platform, runtime })=>resolveOpenInfo({
            platform,
            runtime
        }, deps);
}
async function resolveOpenInfo({ platform, runtime }, deps) {
    // Snapshot the live state once per request so the response is internally consistent even if a
    // toggle happens between sub-resolutions.
    const scheme = deps.urlCreator.getScheme();
    const isDevClient = deps.getIsDevClient();
    const isRedirectPageEnabled = deps.getIsRedirectPageEnabled();
    const availableRuntimes = isDevClient ? [
        'custom'
    ] : isRedirectPageEnabled ? [
        'expo',
        'custom'
    ] : [
        'expo'
    ];
    if (platform) {
        return {
            scheme,
            availableRuntimes,
            ...await resolvePlatformInfo(platform, runtime, deps, {
                isDevClient,
                isRedirectPageEnabled
            })
        };
    }
    const [ios, android, web] = await Promise.all([
        resolvePlatformInfo('ios', runtime, deps, {
            isDevClient,
            isRedirectPageEnabled
        }),
        resolvePlatformInfo('android', runtime, deps, {
            isDevClient,
            isRedirectPageEnabled
        }),
        resolvePlatformInfo('web', runtime, deps, {
            isDevClient,
            isRedirectPageEnabled
        })
    ]);
    return {
        scheme,
        availableRuntimes,
        platforms: {
            ios,
            android,
            web
        }
    };
}
async function resolvePlatformInfo(platform, runtime, deps, state) {
    const { urlCreator, getAppId } = deps;
    const { isDevClient, isRedirectPageEnabled } = state;
    const appId = await getAppId(platform);
    if (platform === 'web') {
        // constructUrl inherits the tunnel host from `defaults.hostType` when --tunnel is active,
        // so this returns the ngrok URL instead of localhost in that case.
        return {
            runtime: 'web',
            url: urlCreator.constructUrl({
                scheme: 'http'
            }),
            appId
        };
    }
    // Caller explicitly wants the disambiguation page — useful when they want the device (not the
    // dev server) to pick between Expo Go and the dev build. No `runtime` field on the response
    // since the actual runtime depends on the device's choice.
    if (runtime === 'unknown') {
        return {
            url: urlCreator.constructLoadingUrl({}, platform),
            appId
        };
    }
    // `runtime: 'default'` mirrors what pressing `i` / `a` does in the terminal:
    //   --dev-client server  → open the dev client directly.
    //   project has both     → hand off to the disambiguation interstitial so the
    //                          device resolves between Expo Go and the dev build.
    //   else                 → open Expo Go directly.
    if (runtime === 'default') {
        if (isDevClient) {
            return {
                runtime: 'custom',
                url: urlCreator.constructDevClientUrl(),
                appId
            };
        }
        if (isRedirectPageEnabled) {
            return {
                url: urlCreator.constructLoadingUrl({}, platform),
                appId
            };
        }
        return {
            runtime: 'expo',
            url: urlCreator.constructUrl({
                scheme: 'exp'
            }),
            appId
        };
    }
    return {
        runtime,
        url: runtime === 'custom' ? urlCreator.constructDevClientUrl() : urlCreator.constructUrl({
            scheme: 'exp'
        }),
        appId
    };
}
function createOpen(deps) {
    return async ({ platform })=>{
        if (platform === 'web') {
            const result = await deps.openPlatformAsync('desktop');
            return {
                platform,
                runtime: 'web',
                url: result.url ?? ''
            };
        }
        const launchTarget = platform === 'ios' ? 'simulator' : 'emulator';
        const result = await deps.openPlatformAsync(launchTarget, {
            shouldPrompt: false
        });
        return {
            platform,
            runtime: deps.getIsDevClient() ? 'custom' : 'expo',
            url: result.url ?? ''
        };
    };
}

//# sourceMappingURL=openHandlers.js.map