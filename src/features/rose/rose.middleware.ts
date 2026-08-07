// src/middleware/rateLimiter.middleware.ts

import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  windowMs: number;      // Time window in milliseconds
  max: number;           // Maximum number of requests within the window
  keyGenerator?: (req: Request) => string;  // Custom key generator function
  skipFailedRequests?: boolean;  // Don't count failed requests
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  message?: string;      // Custom error message
  statusCode?: number;   // Custom status code
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

class RateLimiterStore {
  private store: Map<string, RateLimitInfo>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, info] of this.store.entries()) {
      if (now > info.resetTime) {
        this.store.delete(key);
      }
    }
  }

  increment(key: string, windowMs: number, max: number): {
    success: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      // Create new window
      const newRecord: RateLimitInfo = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, newRecord);

      return {
        success: true,
        remaining: max - 1,
        resetTime: newRecord.resetTime,
      };
    }

    if (record.count >= max) {
      return {
        success: false,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    record.count++;
    this.store.set(key, record);

    return {
      success: true,
      remaining: max - record.count,
      resetTime: record.resetTime,
    };
  }

  decrement(key: string): void {
    const record = this.store.get(key);
    if (record && record.count > 0) {
      record.count--;
      this.store.set(key, record);
    }
  }

  resetKey(key: string): void {
    this.store.delete(key);
  }

  resetAll(): void {
    this.store.clear();
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Create singleton instance
const rateLimiterStore = new RateLimiterStore();

/**
 * Default key generator using IP and optional user ID
 */
const defaultKeyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  const user = (req as any).user;
  if (user?.id) {
    return `rate-limit:${user.id}`;
  }

  // Fallback to IP address
  const ip = req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown';

  return `rate-limit:${ip}`;
};

/**
 * Express rate limiter middleware factory
 * 
 * @param options - Rate limiter configuration options
 * @returns Express middleware function
 * 
 * @example
 * // Basic usage
 * app.use(rateLimiter({ windowMs: 60000, max: 10 }));
 * 
 * @example
 * // Custom key generator
 * app.use(rateLimiter({
 *   windowMs: 60000,
 *   max: 10,
 *   keyGenerator: (req) => req.user?.id || req.ip
 * }));
 */
export function rateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    max,
    keyGenerator = defaultKeyGenerator,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const key = keyGenerator(req);

      // Skip rate limiting if needed (useful for health checks, etc.)
      if (req.path === '/health' || req.path === '/metrics') {
        return next();
      }

      const result = rateLimiterStore.increment(key, windowMs, max);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.success) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', String(retryAfter));

        res.status(statusCode).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter,
            resetTime: new Date(result.resetTime).toISOString(),
          },
        });

        return;
      }

      // Store rate limit info on response for potential undo
      const originalEnd = res.end;
      const originalJson = res.json;

      res.json = function (body) {
        // If skipping successful/failed requests, adjust count
        if (skipSuccessfulRequests && res.statusCode < 400) {
          rateLimiterStore.decrement(key);
        }
        if (skipFailedRequests && res.statusCode >= 400) {
          rateLimiterStore.decrement(key);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue on rate limiter errors to avoid blocking users
      next();
    }
  };
}

/**
 * Rate limiter with route-specific configuration
 * Can be used to create route-specific limiters
 */
export function createRouteRateLimiter(
  windowMs: number,
  max: number,
  customMessage?: string
) {
  return rateLimiter({
    windowMs,
    max,
    message: customMessage || `Too many requests. Please try again later.`,
  });
}

/**
 * More restrictive rate limiter for sensitive operations
 */
export function strictRateLimiter() {
  return rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    message: 'Too many sensitive operations. Please try again later.',
  });
}

/**
 * General API rate limiter
 */
export function apiRateLimiter() {
  return rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'API rate limit exceeded. Please slow down.',
  });
}

/**
 * Authentication-specific rate limiter (for login endpoints)
 */
export function authRateLimiter() {
  return rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyGenerator: (req) => {
      // Use IP and email combination for auth limiter
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const email = req.body?.email || '';
      return `auth-limit:${ip}:${email}`;
    },
    message: 'Too many login attempts. Please try again later.',
  });
}

// Export store for testing and manual management
export { rateLimiterStore, RateLimiterStore };
export type { RateLimiterOptions, RateLimitInfo };