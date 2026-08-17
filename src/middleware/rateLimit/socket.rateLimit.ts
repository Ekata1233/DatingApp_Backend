import { redis } from "../../lib/redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfter?: number;
}

/**
 * Generic Socket.IO rate limiter using Upstash Redis.
 *
 * Fixed-window rate limiting.
 *
 * Example:
 *
 * checkSocketRateLimit(
 *   userId,
 *   "message-send",
 *   30,
 *   60,
 * );
 *
 * Means:
 * 30 requests
 * within 60 seconds
 * for this user/action.
 */
export const checkSocketRateLimit = async (
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> => {
  if (!userId) {
    return {
      allowed: false,
      remaining: 0,
      limit,
    };
  }

  const key = `chat:socket:rate:${action}:${userId}`;

  try {
    /**
     * Increment request counter.
     */
    const current = await redis.incr(key);

    /**
     * Set expiration only when the key is created.
     */
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    /**
     * Calculate remaining requests.
     */
    const remaining = Math.max(0, limit - current);

    /**
     * Check whether request is allowed.
     */
    const allowed = current <= limit;

    /**
     * If limit is exceeded, calculate retry time.
     */
    let retryAfter: number | undefined;

    if (!allowed) {
      const ttl = await redis.ttl(key);

      retryAfter = ttl > 0 ? ttl : windowSeconds;
    }

    return {
      allowed,
      remaining,
      limit,
      retryAfter,
    };
  } catch (error) {
    console.error(
      `Socket rate limiter error [${action}]:`,
      error,
    );

    /**
     * Fail-open:
     *
     * If Redis is temporarily unavailable,
     * don't break the Socket.IO functionality.
     */
    return {
      allowed: true,
      remaining: limit,
      limit,
    };
  }
};

/**
 * ---------------------------------------------------------
 * SEND MESSAGE
 * ---------------------------------------------------------
 *
 * 30 messages / minute / user
 */
export const messageSendRateLimit = async (
  userId: string,
): Promise<RateLimitResult> => {
  return checkSocketRateLimit(
    userId,
    "message-send",
    30,
    60,
  );
};

/**
 * ---------------------------------------------------------
 * JOIN CONVERSATION
 * ---------------------------------------------------------
 *
 * 30 joins / minute / user
 */
export const conversationJoinRateLimit = async (
  userId: string,
): Promise<RateLimitResult> => {
  return checkSocketRateLimit(
    userId,
    "conversation-join",
    30,
    60,
  );
};

/**
 * ---------------------------------------------------------
 * MESSAGE READ
 * ---------------------------------------------------------
 *
 * 120 events / minute / user
 */
export const messageReadRateLimit = async (
  userId: string,
): Promise<RateLimitResult> => {
  return checkSocketRateLimit(
    userId,
    "message-read",
    120,
    60,
  );
};

/**
 * ---------------------------------------------------------
 * MESSAGE SEEN
 * ---------------------------------------------------------
 *
 * 120 events / minute / user
 */
export const messageSeenRateLimit = async (
  userId: string,
): Promise<RateLimitResult> => {
  return checkSocketRateLimit(
    userId,
    "message-seen",
    120,
    60,
  );
};

/**
 * ---------------------------------------------------------
 * TYPING
 * ---------------------------------------------------------
 *
 * 10 typing events / second / user
 */
export const typingRateLimit = async (
  userId: string,
): Promise<RateLimitResult> => {
  return checkSocketRateLimit(
    userId,
    "typing",
    10,
    1,
  );
};