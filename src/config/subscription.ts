export type SubscriptionType = "FREE" | "A" | "B" | "C";


export const SUBSCRIPTION_LIMITS: Record<
  SubscriptionType,
  { swipeLimit: number; likeLimit: number }
> = {
  FREE: { swipeLimit: 10, likeLimit: 20 },
  A: { swipeLimit: 50, likeLimit: 100 },
  B: { swipeLimit: 100, likeLimit: 200 },
  C: { swipeLimit: 1000, likeLimit: 2000 },
};


