import { type TunnelOptions } from './tunnel/tunnel';
export type { TunnelOptions as WsTunnelOptions } from './tunnel/tunnel';
export declare function startAsync(options: TunnelOptions): Promise<import("url").URL>;
export declare function stopAsync(): Promise<void>;
