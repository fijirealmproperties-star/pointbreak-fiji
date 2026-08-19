import { io, Socket } from "socket.io-client";
import { getBaseUrl } from "./client";

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(getBaseUrl(), {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 30000,
    upgrade: true,
    rememberUpgrade: true,
    extraHeaders: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  socket.on("connect", () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      scheduleReconnect();
    }
  });

  socket.on("connect_error", () => {
    scheduleReconnect();
  });

  return socket;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, 5000);
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
