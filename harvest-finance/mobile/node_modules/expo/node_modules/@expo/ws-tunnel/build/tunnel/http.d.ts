import { WebSocket } from 'ws';
import { RequestBodyChunkMessage, RequestMessage, RequestAbortMessage } from '../protocol';
import { Context } from './shared';
export declare function handleProxiedRequest(tunnel: WebSocket, ctx: Context, message: RequestMessage): Promise<void>;
export declare function pushProxiedRequestBodyChunk(message: RequestBodyChunkMessage): Promise<void>;
export declare function abortProxiedRequest(message: RequestAbortMessage): Promise<void>;
