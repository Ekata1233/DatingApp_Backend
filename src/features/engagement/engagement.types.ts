// export interface SendEngagementResponse {
//   success: boolean;
//   message: string;
//   data: {
//     message: {
//       id: string;
//       conversationId: string;
//       senderId: string;
//       messageType: string;
//       roseId: string | null;
//       complimentId: string | null;
//       giftId: string | null;
//       content: string | null;
//       metadata: unknown;
//       createdAt: Date;
//     };

//     remainingBalance: {
//       totalRoses: number;
//       lastResetAt: Date | null;
//     };
//   };
// }


export interface SendEngagementResponse {
  success: boolean;
  message: string;

  data: {
    matched: boolean;
    matchId: string | null;

    message: {
      id: string;
      conversationId: string;
      senderId: string;
      messageType: string;
      roseId: string | null;
      complimentId: string | null;
      giftId: string | null;
      content: string | null;
      mediaUrl: string | null;
      metadata: unknown;
      createdAt: Date;
    };

    rose: {
      id: string;
    } | null;

    compliment: {
      id: string;
    } | null;

    gift: {
      id: string;
      name: string;
    } | null;

    payment: {
      rose: {
        method: "ROSE_BALANCE" | "WALLET";
        amount: number;
        walletBalance: string | null;
      } | null;

      compliment: {
        method: "COMPLIMENT_BALANCE" | "WALLET";
        amount: number;
        walletBalance: string | null;
      } | null;

      gift: {
        method: "WALLET";
        amount: number;
        walletBalance: string;
      } | null;

      walletBalance: string | null;
    };

    remainingBalance: {
      totalRoses: number;
      lastResetAt: Date | null;
    };

    remainingComplimentBalance: {
      totalCompliments: number;
      lastResetAt: Date | null;
    } | null;
  };
}
