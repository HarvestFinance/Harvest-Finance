export interface TunnelParams {
    /** The main URL of the ws tunnel service */
    apiUrl?: string;
    /** The target URL of requests the proxy makes */
    targetUrl?: string;
    /** The (unique) session identifier */
    session?: string | null;
}
export interface Context {
    readonly apiUrl: URL;
    readonly proxyUrl: URL;
    readonly targetUrl: URL;
    /** Returns the retargeted URL */
    getTargetUrl(url: string): URL;
}
export declare const makeContext: (params: TunnelParams) => {
    apiUrl: import("url").URL;
    proxyUrl: import("url").URL;
    targetUrl: import("url").URL;
    getTargetUrl(input: string): import("url").URL;
};
