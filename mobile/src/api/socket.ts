import { io, Socket } from "socket.io-client";
import { getBaseUrl } from "./client";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket) return socket;
  socket = io(getBaseUrl(), {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
