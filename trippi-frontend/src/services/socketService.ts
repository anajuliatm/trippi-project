import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9010";


let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
