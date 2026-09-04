import { Server, Socket } from "socket.io";

import {
  blockUserService,
} from "./block.service";
import { getProfileRoom } from "../../chat/profile/profile.socket";



export const registerBlockSocket = (
  io: Server,
  socket: Socket,
) => {

  /**
   * BLOCK USER
   */
  socket.on(
    "user:block",
    async (
      data: {
        blockedId: string;
      },
      callback?,
    ) => {

      try {

        const blockerId =
          (socket as any).user.id;

        const result =
          await blockUserService(
            blockerId,
            data.blockedId,
          );

        /**
         * Profile room
         */
        const room =
          getProfileRoom(
            blockerId,
            data.blockedId,
          );

        /**
         * Notify both users
         */
        io.to(room).emit(
          "profile:block:update",
          {
            userId:
              data.blockedId,

            blockedBy:
              blockerId,

            isBlocked: true,
          },
        );

        /**
         * Response to caller
         */
        if (callback) {
          callback({
            success: true,
            data: result,
          });
        }

      } catch (error: any) {

        if (callback) {
          callback({
            success: false,
            message:
              error.message ??
              "Failed to block user",
          });
        }
      }
    },
  );

};