import { Prisma } from "@prisma/client";

export const updateEngagementProgress = async (
  tx: Prisma.TransactionClient,
  senderId: string,
  receiverId: string,
) => {
  /* -------------------------------------------------------------------------- */
  /*                    Find Active Progress                                    */
  /* -------------------------------------------------------------------------- */

  const progress = await tx.userRose.findFirst({
    where: {
      senderId,
      receiverId,

      // Only update an active/unlocked progress
      isUnlocked: false,

      // Ignore expired progress
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: new Date(),
          },
        },
      ],
    },

    // If multiple progress records exist,
    // update the latest one.
    orderBy: {
      createdAt: "desc",
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                       No Active Progress                                   */
  /* -------------------------------------------------------------------------- */

  if (!progress) {
    return null;
  }

  /* -------------------------------------------------------------------------- */
  /*                    Already Reached Target                                  */
  /* -------------------------------------------------------------------------- */

  if (
    progress.messagesSent >=
    progress.requiredMessages
  ) {
    return progress;
  }

  // Receiver sent ONE actual chat message
  const messagesSent = Math.min(
    progress.messagesSent + 1,
    progress.requiredMessages,
  );

  /* -------------------------------------------------------------------------- */
  /*                         Check Unlock                                       */
  /* -------------------------------------------------------------------------- */

  const isUnlocked =
    messagesSent >=
    progress.requiredMessages;

  /* -------------------------------------------------------------------------- */
  /*                         Update Progress                                    */
  /* -------------------------------------------------------------------------- */

  const updatedProgress =
    await tx.userRose.update({
      where: {
        id: progress.id,
      },

      data: {
        messagesSent,

        isUnlocked,

        unlockedAt: isUnlocked
          ? new Date()
          : null,
      },
    });

  /* -------------------------------------------------------------------------- */
  /*                              Return                                        */
  /* -------------------------------------------------------------------------- */

  return updatedProgress;
};