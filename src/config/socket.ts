import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { AuthenticatedSocket, socketAuthMiddleware } from "../middleware/socketAuth.middleware";
import { registerChatSocket } from "../features/chat/socket/chat.socket";
import { presenceService } from "../features/chat/presence/presence.service";


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

  io.on("connection", async (socket) => {
    const userId = (socket as AuthenticatedSocket).userId;

    console.log(
      `Socket connected: ${socket.id}, User: ${userId}`
    );


    /**
     * ==============================
     * USER ONLINE
     * ==============================
     */
    const onlineEvent =
      await presenceService.setOnline(
        userId,
        socket.id
      );


    /**
     * Notify other connected users.
     */
    socket.broadcast.emit(
      "user:online",
      onlineEvent
    );

    /**
   * HEARTBEAT
   */
    socket.on(
      "presence:heartbeat",
      async () => {
        try {
          await presenceService.heartbeat(
            userId,
            socket.id
          );
        } catch (error) {
          console.error(
            "Presence heartbeat error:",
            error
          );
        }
      }
    );

    socket.onAny((event, ...args) => {
      console.log("🔥 SOCKET EVENT RECEIVED:", event);
      console.log("🔥 SOCKET EVENT PAYLOAD:", args);
    });

    /**
    * ==============================
    * USER DISCONNECTED
    * ==============================
    */
    socket.on(
      "disconnect",
      async (reason) => {

        console.log(
          `Socket disconnected: ${socket.id}, reason: ${reason}`
        );


        /**
         * Remove this socket from
         * user's active socket list.
         */
        const offlineEvent =
          await presenceService.setOffline(
            userId,
            socket.id
          );


        /**
         * If null:
         *
         * Another socket is still connected.
         *
         * Therefore user remains ONLINE.
         */
        if (!offlineEvent) {
          return;
        }


        /**
         * This was the user's LAST socket.
         *
         * Notify other users that
         * the user is now offline.
         */
        socket.broadcast.emit(
          "user:offline",
          offlineEvent
        );

      }
    );

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