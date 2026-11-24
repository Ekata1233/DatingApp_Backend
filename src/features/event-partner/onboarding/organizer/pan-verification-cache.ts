import { randomUUID } from "node:crypto";
import { redis } from "../../../../lib/redis";

const businessPanKey = (id: string) => `event-partner:business-pan:${id}`;

interface BusinessPanVerification {
  partnerId: string;
  businessId: string;
  panNumberEncrypted: string;
  panLastFour: string;
  panName: string;
  panCategory: string;
  panStatus: string;
  isAadhaarLinked: boolean | null;
  verifiedAt: string;
}

export const cacheBusinessPan = async (verification: BusinessPanVerification) => {
  const verificationId = randomUUID();
  await redis.set(businessPanKey(verificationId), verification, { ex: 600 });
  return verificationId;
};

export const getCachedBusinessPan = (verificationId: string) =>
  redis.get<BusinessPanVerification>(businessPanKey(verificationId));
