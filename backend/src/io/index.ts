/**
 * @module io
 * @description Socket.IO setup, handlers, and broadcasting utilities
 */

export { initializeSocketIO, type SocketIOServer, type SocketType } from './socket.config';
export { setupSocketIOHandlers, broadcasters } from './handlers';
export { verifyJWT, type DecodedJWT } from './auth.io';
