export interface SendEngagementResponse {
  success: boolean;
  message: string;
  data: {
    message: {
      id: string;
      conversationId: string;
      senderId: string;
      messageType: string;
      roseId: string | null;
      complimentId: string | null;
      giftId: string | null;
      content: string | null;
      metadata: unknown;
      createdAt: Date;
    };

    remainingBalance: {
      totalRoses: number;
      lastResetAt: Date | null;
    };
  };
}