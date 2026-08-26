import { WebSocketCloseMessage, WebSocketConnectMessage, WebSocketMessageMessage } from '../protocol';
import { Context } from './shared';
import { type WebSocket } from '../utils/ws';
export declare function sendToProxiedWebsocket(message: WebSocketMessageMessage): Promise<void>;
export declare function createProxiedWebsocket(tunnel: WebSocket, ctx: Context, message: WebSocketConnectMessage): Promise<void>;
export declare function closeProxiedWebsocket(message: WebSocketCloseMessage): Promise<void>;
