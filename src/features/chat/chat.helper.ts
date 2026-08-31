import { MessageType, Prisma } from "@prisma/client";

export const getOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  tx: Prisma.TransactionClient
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

export const buildMessageProgress = (
  message: {
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
  },
): MessageProgress | null => {
  /**
   * GIFT
   */
  if (message.messageType === MessageType.GIFT && message.gift) {
    const current = message.gift.messagesSent;
    const target = message.gift.requiredMessages;

    const percentage =
      target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : 100;

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
      target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : 100;

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
        target > 0
          ? Math.min(100, Math.round((current / target) * 100))
          : 100;

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
        target > 0
          ? Math.min(100, Math.round((current / target) * 100))
          : 100;

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
