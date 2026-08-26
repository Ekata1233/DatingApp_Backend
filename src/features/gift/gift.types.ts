import { TargetType } from "@prisma/client";

export interface SendGiftDTO {
  receiverId: string;
  giftId: number;
  message?: string;
  targetType?: TargetType | null;
  targetId?: string | null;
}