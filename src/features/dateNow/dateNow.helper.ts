export const dateNowConfirmMessage = {


async createDateConfirmedMessage(
  tx: any,
  conversationId: string,
  senderId: string,
  datePlanId: string,
  confirmedDateId: string,
) {
  return tx.chatMessage.create({
    data: {
      conversationId,
      senderId,

      messageType: "DATE_CONFIRMED",

      datePlanId,

      metadata: {
        confirmedDateId,

        // Chat card status
        status: "ACTIVE",
      },
    },

    include: {
      datePlan: {
        include: {
          user: true,

          activity: true,

          quickTitle: true,

          whoPays: true,

          joinRequestGender: true,

          visibility: true,

          vibes: {
            include: {
              option: true,
            },
          },

          requests: {
            select: {
              id: true,
              requesterId: true,
              status: true,
            },
          },
        },
      },

      sender: true,
    },
  });
}

}