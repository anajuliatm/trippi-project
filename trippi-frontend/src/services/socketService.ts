import { io, type Socket } from "socket.io-client";

//const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";


let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("http://localhost:8000", { transports: ["websocket"] });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
