import { Request, Response, NextFunction, RequestHandler } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../../lib/redis";

/**
 * ---------------------------------------------------------
 * RATE LIMIT CONFIGURATION
 * ---------------------------------------------------------
 */

const sendMessageLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "chat:api:send-message",
});

const getMessagesLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "1 m"),
  prefix: "chat:api:get-messages",
});

const conversationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "chat:api:conversation",
});

/**
 * ---------------------------------------------------------
 * GET RATE LIMIT KEY
 * ---------------------------------------------------------
 *
 * Authenticated users:
 *     chat:api:user:<userId>
 *
 * Unauthenticated users:
 *     chat:api:ip:<ip>
 *
 * Your auth middleware should run BEFORE these rate limiters
 * if you want authenticated requests to be limited by userId.
 */
const getUserKey = (req: Request): string => {
  const userId = (req as any).user?.id;

  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${req.ip}`;
};

/**
 * ---------------------------------------------------------
 * COMMON RATE LIMIT MIDDLEWARE
 * ---------------------------------------------------------
 */

const createRateLimiterMiddleware = (
  limiter: Ratelimit,
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const key = getUserKey(req);

      const result = await limiter.limit(key);

      /**
       * Rate limit exceeded
       */
      if (!result.success) {
        res.setHeader(
          "Retry-After",
          Math.ceil(
            (result.reset - Date.now()) / 1000,
          ),
        );

        res.setHeader(
          "X-RateLimit-Limit",
          result.limit.toString(),
        );

        res.setHeader(
          "X-RateLimit-Remaining",
          result.remaining.toString(),
        );

        res.setHeader(
          "X-RateLimit-Reset",
          result.reset.toString(),
        );

        res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        });

        return;
      }

      /**
       * Rate limit headers
       */
      res.setHeader(
        "X-RateLimit-Limit",
        result.limit.toString(),
      );

      res.setHeader(
        "X-RateLimit-Remaining",
        result.remaining.toString(),
      );

      res.setHeader(
        "X-RateLimit-Reset",
        result.reset.toString(),
      );

      next();
    } catch (error) {
      console.error("Rate limiter error:", error);

      /**
       * Fail-open:
       *
       * If Upstash is temporarily unavailable,
       * don't block the API request.
       */
      next();
    }
  };
};

/**
 * ---------------------------------------------------------
 * SEND MESSAGE
 * ---------------------------------------------------------
 *
 * Maximum:
 * 30 requests / minute / user
 *
 * Example:
 * POST /api/chat/message
 */
export const sendMessageRateLimiter =
  createRateLimiterMiddleware(sendMessageLimiter);

/**
 * ---------------------------------------------------------
 * GET MESSAGES
 * ---------------------------------------------------------
 *
 * Maximum:
 * 120 requests / minute / user
 *
 * Example:
 * GET /api/chat/message/:conversationId
 */
export const getMessagesRateLimiter =
  createRateLimiterMiddleware(getMessagesLimiter);

/**
 * ---------------------------------------------------------
 * CONVERSATION APIs
 * ---------------------------------------------------------
 *
 * Maximum:
 * 60 requests / minute / user
 */
export const conversationRateLimiter =
  createRateLimiterMiddleware(conversationLimiter);