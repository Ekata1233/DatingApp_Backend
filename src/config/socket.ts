import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware";
import { registerChatSocket } from "../features/chat/socket/chat.socket";


let io: SocketIOServer;

export const initializeSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },

    transports: ["websocket", "polling"],

    pingInterval: 25000,
    pingTimeout: 20000,

    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  /**
   * Authenticate every socket connection
   */
  io.use(socketAuthMiddleware);

  /**
   * Register socket modules
   */
  registerChatSocket(io);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.onAny((event, ...args) => {
    console.log("🔥 SOCKET EVENT RECEIVED:", event);
    console.log("🔥 SOCKET EVENT PAYLOAD:", args);
  });

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id}, reason: ${reason}`
      );
    });
  });

  console.log("✅ Socket.IO initialized");

  return io;
};

/**
 * Get Socket.IO instance from anywhere in the application.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};