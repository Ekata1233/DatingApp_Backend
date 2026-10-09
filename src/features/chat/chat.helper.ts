import { MessageType, Prisma } from "@prisma/client";
import { getIO } from "../../config/socket";
import { TargetInput } from "./chat.types";
import { prisma } from "../../prisma/prismaClient";

export const getOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  tx: Prisma.TransactionClient,
) => {
  const existingConversation = await tx.conversation.findFirst({
    where: {
      AND: [
        {
          participants: {
            some: {
              userId: user1Id,
              deletedAt: null,
            },
          },
        },
        {
          participants: {
            some: {
              userId: user2Id,
              deletedAt: null,
            },
          },
        },
      ],
    },
    include: {
      participants: true,
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  return tx.conversation.create({
    data: {
      participants: {
        create: [
          {
            userId: user1Id,
          },
          {
            userId: user2Id,
          },
        ],
      },
    },
    include: {
      participants: true,
    },
  });
};

type MessageProgress = {
  current: number;
  target: number;
  percentage: number;
  label: string;
  type: "GIFT" | "ROSE" | "COMPLIMENT";
  giftName?: string;
  expiresAt?: Date | null;
};

export const buildMessageProgress = (message: {
  messageType: MessageType;
  gift?: {
    messagesSent: number;
    requiredMessages: number;
    isUnlocked: boolean;
    expiresAt: Date;
    giftName: string;
  } | null;
  rose?: {
    messagesSent: number;
    requiredMessages: number;
    isUnlocked: boolean;
    expiresAt: Date | null;
  } | null;
  compliment?: {
    id: string;
  } | null;
}): MessageProgress | null => {
  /**
   * GIFT
   */
  if (message.messageType === MessageType.GIFT && message.gift) {
    const current = message.gift.messagesSent;
    const target = message.gift.requiredMessages;

    const percentage =
      target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

    return {
      current,
      target,
      percentage,
      label: `${current}/${target} for ${message.gift.giftName}`,
      type: "GIFT",
      giftName: message.gift.giftName,
      expiresAt: message.gift.expiresAt,
    };
  }

  /**
   * ROSE
   */
  if (message.messageType === MessageType.ROSE && message.rose) {
    const current = message.rose.messagesSent;
    const target = message.rose.requiredMessages;

    const percentage =
      target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

    return {
      current,
      target,
      percentage,
      label: `${current}/${target} for Rose`,
      type: "ROSE",
      expiresAt: message.rose.expiresAt,
    };
  }

  /**
   * ENGAGEMENT
   *
   * If ENGAGEMENT represents Gift/Rose, use whichever
   * relation exists.
   */
  if (message.messageType === MessageType.ENGAGEMENT) {
    if (message.gift) {
      const current = message.gift.messagesSent;
      const target = message.gift.requiredMessages;

      const percentage =
        target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

      return {
        current,
        target,
        percentage,
        label: `${current}/${target} for ${message.gift.giftName}`,
        type: "GIFT",
        giftName: message.gift.giftName,
        expiresAt: message.gift.expiresAt,
      };
    }

    if (message.rose) {
      const current = message.rose.messagesSent;
      const target = message.rose.requiredMessages;

      const percentage =
        target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;

      return {
        current,
        target,
        percentage,
        label: `${current}/${target} for Rose`,
        type: "ROSE",
        expiresAt: message.rose.expiresAt,
      };
    }
  }

  return null;
};

export const isUserViewingConversation = async (
  userId: string,
  conversationId: string,
): Promise<boolean> => {
  console.log("conversationId for notification:", conversationId);

  console.log("user id for notification:", userId);

  const io = getIO();

  const sockets = await io.in(`conversation:${conversationId}`).fetchSockets();

  const isViewing = sockets.some((socket: any) => socket.userId === userId);

  return isViewing;
};

export const resolveMessageTargets = async (targets: TargetInput[]) => {
  const result = new Map<string, any>();

  const photoIds = [
    ...new Set(
      targets
        .filter((t) => t.targetType === "PHOTO" && t.targetId)
        .map((t) => t.targetId as string),
    ),
  ];

  if (photoIds.length > 0) {
    const photos = await prisma.userPhoto.findMany({
      where: {
        id: {
          in: photoIds,
        },
      },
      select: {
        id: true,
        user_id: true,
        media_url: true,
        media_type: true,
      },
    });

    for (const photo of photos) {
      result.set(`PHOTO:${photo.id}`, {
        targetType: "PHOTO",
        targetId: photo.id,
        photo: photo,
      });
    }
  }

  return result;
};
