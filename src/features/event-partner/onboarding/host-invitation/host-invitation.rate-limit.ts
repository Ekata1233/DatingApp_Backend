import { Request, Response, NextFunction } from "express";

import { createHmac } from "crypto";

import { Redis } from "@upstash/redis";

import { Ratelimit } from "@upstash/ratelimit";
import { hostInvitationLookupSchema } from "./host-invitation.validation";

const redis = Redis.fromEnv();

/* -------------------------------------------------------------------------- */
/*                                RATE LIMITERS                               */
/* -------------------------------------------------------------------------- */

const ipRateLimiter = new Ratelimit({
  redis,

  limiter: Ratelimit.slidingWindow(20, "10 m"),

  prefix: "host:invitation:ip",

  analytics: false,
});

const phoneRateLimiter = new Ratelimit({
  redis,

  limiter: Ratelimit.slidingWindow(5, "10 m"),

  prefix: "host:invitation:phone",

  analytics: false,
});

/* -------------------------------------------------------------------------- */
/*                            RATE LIMIT MIDDLEWARE                           */
/* -------------------------------------------------------------------------- */

export const hostInvitationRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const secret = process.env.HOST_LOOKUP_SECRET;

    if (!secret) {
      throw new Error("HOST_LOOKUP_SECRET is missing");
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const ipResult = await ipRateLimiter.limit(ip);

    if (!ipResult.success) {
      res.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((ipResult.reset - Date.now()) / 1000)),
      );

      return res.status(429).json({
        success: false,

        message: "Too many requests. Please try again later.",
      });
    }

    const parsed = hostInvitationLookupSchema.safeParse(req.body);

    if (!parsed.success) {
      return next();
    }

    /* Hash phone number before using it as a Redis key */

    const phoneHash = createHmac("sha256", secret)
      .update(parsed.data.phoneNumber)
      .digest("hex");

    const phoneResult = await phoneRateLimiter.limit(phoneHash);

    if (!phoneResult.success) {
      res.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((phoneResult.reset - Date.now()) / 1000)),
      );

      return res.status(429).json({
        success: false,

        message: "Too many requests. Please try again later.",
      });
    }

    return next();
  } catch (error) {
    console.error("========== HOST RATE LIMIT ERROR ==========");

    if (error instanceof Error) {
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
    } else {
      console.error("Unknown rate limit error");
    }

    console.error("===========================================");

    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable",
    });
  }
};
