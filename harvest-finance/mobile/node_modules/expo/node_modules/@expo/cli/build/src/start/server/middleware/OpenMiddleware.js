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
    get OpenEndpoint () {
        return OpenEndpoint;
    },
    get OpenMiddleware () {
        return OpenMiddleware;
    }
});
const _ExpoMiddleware = require("./ExpoMiddleware");
const _resolvePlatform = require("./resolvePlatform");
const _net = require("../../../utils/net");
const OpenEndpoint = '/_expo/open';
class OpenMiddleware extends _ExpoMiddleware.ExpoMiddleware {
    constructor(projectRoot, options){
        super(projectRoot, [
            OpenEndpoint
        ]), this.options = options;
    }
    async handleRequestAsync(req, res) {
        (0, _ExpoMiddleware.disableResponseCache)(res);
        res.setHeader('Content-Type', 'application/json');
        const method = (req.method ?? 'GET').toUpperCase();
        const searchParams = new URL(req.url ?? '', 'http://localhost').searchParams;
        const platformParam = (0, _resolvePlatform.parsePlatformHeader)(req);
        const platform = normalizePlatform(platformParam);
        const runtimeParam = searchParams.get('runtime') ?? undefined;
        const normalizedRuntime = runtimeParam ? normalizeRequestedRuntime(runtimeParam) : 'default';
        if (platformParam && !platform) {
            sendError(res, 400, {
                code: 'INVALID_PLATFORM',
                error: `Unsupported "platform" value "${platformParam}". Must be "ios", "android", or "web".`
            });
            return;
        }
        if (runtimeParam && !normalizedRuntime) {
            sendError(res, 400, {
                code: 'INVALID_RUNTIME',
                error: `Unsupported "runtime" value "${runtimeParam}". Must be "default", "expo", "custom", or "unknown".`
            });
            return;
        }
        const runtime = normalizedRuntime ?? 'default';
        if (method === 'POST') {
            const sameDeviceError = assertSameDevice(req);
            if (sameDeviceError) {
                sendError(res, 403, sameDeviceError);
                return;
            }
            const sameOriginError = assertSameOrigin(req, this.options.serverBaseUrl);
            if (sameOriginError) {
                sendError(res, 403, sameOriginError);
                return;
            }
            if (!platform) {
                sendError(res, 400, {
                    code: 'MISSING_PLATFORM',
                    error: `POST /_expo/open requires a platform. Pass it as the "platform" query param or "expo-platform" header. Must be "ios", "android", or "web".`
                });
                return;
            }
            const support = this.options.getHostSupport(platform);
            if (!support.canOpen) {
                sendError(res, 501, {
                    code: 'HOST_CANNOT_OPEN_PLATFORM',
                    platform,
                    error: `Cannot open the project on ${platform} from this dev server host.`,
                    details: (support.reason ? support.reason + ' ' : '') + `Use GET /_expo/open?platform=${platform} to retrieve the deep link, then launch it from a host that supports ${platform} or hand it to a remote preview service.`
                });
                return;
            }
            try {
                const result = await this.options.open({
                    platform
                });
                res.statusCode = 200;
                res.end(JSON.stringify(result));
            } catch (error) {
                sendError(res, 500, {
                    code: typeof (error == null ? void 0 : error.code) === 'string' ? error.code : 'OPEN_FAILED',
                    platform,
                    error: `Failed to open the project on ${platform}.`,
                    details: (typeof (error == null ? void 0 : error.message) === 'string' ? error.message : String(error)) + ` Check the dev server logs for more detail, or use GET /_expo/open?platform=${platform} to launch the deep link from another environment.`
                });
            }
            return;
        }
        if (method !== 'GET' && method !== 'HEAD') {
            res.setHeader('Allow', 'GET, HEAD, POST');
            sendError(res, 405, {
                code: 'METHOD_NOT_ALLOWED',
                error: `Method "${method}" not allowed. Use GET to inspect, POST to open.`
            });
            return;
        }
        const info = await this.options.getInfo({
            platform,
            runtime
        });
        res.statusCode = 200;
        res.end(JSON.stringify(info));
    }
}
function normalizePlatform(p) {
    return p === 'ios' || p === 'android' || p === 'web' ? p : null;
}
function normalizeRequestedRuntime(r) {
    return r === 'default' || r === 'expo' || r === 'custom' || r === 'unknown' ? r : null;
}
function sendError(res, statusCode, body) {
    res.statusCode = statusCode;
    res.end(JSON.stringify(body));
}
function assertSameDevice(req) {
    if ((0, _net.isLocalSocket)(req.socket)) {
        return null;
    }
    return {
        code: 'REMOTE_DEVICE_FORBIDDEN',
        error: 'POST /_expo/open is restricted to same-device requests.',
        details: `The dev server only opens the project for clients connected over the loopback interface ` + `so a device on the LAN (or a tunnel client) can't launch the app on the developer's machine. ` + `Issue the POST from the dev server's host, or use GET /_expo/open to retrieve the deep link and open it from the remote device.`
    };
}
function assertSameOrigin(req, serverBaseUrl) {
    var _req_headers;
    if ((0, _net.isMatchingOrigin)(req, serverBaseUrl)) {
        return null;
    }
    const origin = firstHeader((_req_headers = req.headers) == null ? void 0 : _req_headers.origin) ?? 'unknown';
    return {
        code: 'CROSS_ORIGIN_FORBIDDEN',
        error: 'POST /_expo/open is restricted to same-origin requests.',
        details: `Request origin "${origin}" does not match the dev server "${serverBaseUrl}". This protects the dev server from cross-origin scripts that might try to launch the app without the developer's consent. Issue POST requests from the dev server's origin (or from a non-browser client), or use GET /_expo/open to retrieve the deep link and open it yourself.`
    };
}
function firstHeader(value) {
    if (Array.isArray(value)) return value[0];
    return value ?? undefined;
}

//# sourceMappingURL=OpenMiddleware.js.map