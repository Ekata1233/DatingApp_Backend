import { Request, Response } from "express";
import { blockUserService, unblockUserService } from "./block.service";
import { getProfileRoom } from "../../chat/profile/profile.socket";
import { getIO } from "../../../config/socket";
import { chatService } from "../../chat/chat.service";
import { chatRepository } from "../../chat/chat.repository";

export const blockUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const blockerId = (req as any).user.id;
    const { blockedId } = req.body;

    const block = await blockUserService(
      blockerId,
      blockedId
    );

    const io = getIO();

    const profileRoom = getProfileRoom(
      blockerId,
      blockedId
    );

    // Find conversation automatically
    const conversation =
      await chatRepository.findConversationBetweenUsers(
        blockerId,
        blockedId
      );

    // If conversation exists, get chat profile details
    if (conversation) {
      const profileDetails =
        await chatService.getProfileDetails(
          conversation.id,
          blockerId
        );

      io.to(profileRoom).emit(
        "profile:details",
        {
          success: true,
          data: profileDetails,
          blockerId,
          blockedId,
          isBlocked: true,
        }
      );
    }

    // Common block event
    io.to(profileRoom).emit(
      "profile:block:updated",
      {
        blockerId,
        blockedId,
        isBlocked: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: block,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const unblockUserController = async (
  req: Request,
  res: Response
) => {
  try {
    // Logged-in user
    const blockerId = (req as any).user.id;

    // User to unblock
    const blockedId = String(req.params.blockedId);

    /**
     * 1. UNBLOCK USER
     */
    const result = await unblockUserService(
      blockerId,
      blockedId
    );

    /**
     * 2. SOCKET INSTANCE
     */
    const io = getIO();

    /**
     * 3. PROFILE ROOM
     */
    const profileRoom = getProfileRoom(
      blockerId,
      blockedId
    );

    /**
     * 4. FIND CONVERSATION AUTOMATICALLY
     *
     * No conversationId required from frontend.
     */
    const conversation =
      await chatRepository.findConversationBetweenUsers(
        blockerId,
        blockedId
      );

    /**
     * 5. IF CHAT EXISTS,
     * SEND UPDATED PROFILE DETAILS
     */
    if (conversation) {
      const profileDetails =
        await chatService.getProfileDetails(
          conversation.id,
          blockerId
        );

      io.to(profileRoom).emit(
        "profile:details",
        {
          success: true,
          data: profileDetails,
          blockerId,
          blockedId,
          isBlocked: false,
        }
      );

      console.log(
        "🔥 profile:details emitted after unblock",
        {
          profileRoom,
          conversationId: conversation.id,
          blockerId,
          blockedId,
          isBlocked: false,
        }
      );
    }

    /**
     * 6. COMMON BLOCK STATUS UPDATE
     *
     * Works for Feed + Chat
     */
    io.to(profileRoom).emit(
      "profile:block:updated",
      {
        blockerId,
        blockedId,
        isBlocked: false,
      }
    );

    console.log(
      "🔥 profile:block:updated emitted",
      {
        profileRoom,
        blockerId,
        blockedId,
        isBlocked: false,
      }
    );

    /**
     * 7. RESPONSE
     */
    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};