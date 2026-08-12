import { Server } from "socket.io";
import { AuthenticatedSocket } from "../../../middleware/socketAuth.middleware";
import { registerChatEvents } from "./chat.events";

export const registerChatSocket = (io: Server) => {
  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    const userId = authSocket.userId;



    /**
     * Join user's personal room
     */
    socket.join(`user:${userId}`);

    console.log(
      "👤 USER ROOM JOINED:",
      `user:${userId}`
    );
    /**
     * Register chat events
     */
    registerChatEvents(
      io,
      authSocket,
      userId
    );

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