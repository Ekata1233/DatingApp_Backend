import { Server, Socket } from "socket.io";

import {
  AuthenticatedSocket,
} from "../../../middleware/socketAuth.middleware";

import { chatService } from "../chat.service";

/**
 * Register profile socket events
 */
export const registerProfileSocket = (
  io: Server,
) => {
  /**
   * ==============================
   * SOCKET CONNECTION
   * ==============================
   */
  io.on("connection", (socket: Socket) => {
    /**
     * ==============================
     * PROFILE DETAILS
     * ==============================
     *
     * Client:
     *
     * socket.emit("profile:details", {
     *   conversationId,
     * });
     */
    socket.on(
      "profile:details",
      async (
        data: {
          conversationId: string;
        },
        callback?,
      ) => {
        try {
          /**
           * Get authenticated user ID
           */
          const currentUserId =
            (socket as AuthenticatedSocket).userId;

          /**
           * Validate conversation ID
           */
          if (!data?.conversationId) {
            throw new Error(
              "Conversation ID is required",
            );
          }

          /**
           * Get profile details
           *
           * This service should return:
           * - userId
           * - name
           * - age
           * - packageType
           * - isOnline
           * - lastSeenAt
           * - isBlocked
           * - matchScore
           * - profileImage
           */
          const result =
            await chatService.getProfileDetails(
              data.conversationId,
              currentUserId,
            );

          /**
           * ==============================
           * JOIN PROFILE ROOM
           * ==============================
           *
           * Example:
           *
           * User A + User B
           *
           * profile:
           * A+B
           *
           * and
           *
           * B+A
           *
           * will generate the same room.
           */
          const profileRoom =
            getProfileRoom(
              currentUserId,
              result.user.userId,
            );

          socket.join(profileRoom);

          console.log(
            `Socket ${socket.id} joined profile room: ${profileRoom}`,
          );

          /**
           * ==============================
           * SEND RESPONSE
           * ==============================
           *
           * If frontend sends acknowledgement
           * callback, use callback.
           *
           * Otherwise emit response event.
           */
          if (callback) {
            callback({
              success: true,
              data: result,
            });
          } else {
            socket.emit(
              "profile:details:response",
              {
                success: true,
                data: result,
              },
            );
          }
        } catch (error: any) {
          console.error(
            "Profile details socket error:",
            error,
          );

          /**
           * Error response
           */
          if (callback) {
            callback({
              success: false,
              message:
                error?.message ??
                "Failed to get profile details",
            });
          } else {
            socket.emit(
              "profile:details:error",
              {
                success: false,
                message:
                  error?.message ??
                  "Failed to get profile details",
              },
            );
          }
        }
      },
    );
  });
};

/**
 * ==============================
 * PROFILE ROOM
 * ==============================
 *
 * Generate deterministic room.
 *
 * User A + User B
 * and
 * User B + User A
 *
 * must generate the same room.
 */
export const getProfileRoom = (
  userId1: string,
  userId2: string,
): string => {
  const ids = [
    userId1,
    userId2,
  ].sort();

  return `profile:${ids[0]}:${ids[1]}`;
};