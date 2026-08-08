import { Server } from "socket.io";
import { AuthenticatedSocket } from "../../../middleware/socketAuth.middleware";

export const registerChatSocket = (io: Server) => {
  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    const userId = authSocket.userId;

    console.log(
      `User ${userId} connected with socket ${socket.id}`
    );

    /**
     * Join user's personal room
     */
    socket.join(`user:${userId}`);

    /**
     * User starts typing
     */
    socket.on("typing:start", (data) => {
      console.log("Typing started:", {
        userId,
        ...data,
      });
    });

    /**
     * User stops typing
     */
    socket.on("typing:stop", (data) => {
      console.log("Typing stopped:", {
        userId,
        ...data,
      });
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", (reason) => {
      console.log(
        `User ${userId} disconnected`,
        reason
      );
    });
  });
};