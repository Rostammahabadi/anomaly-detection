// Simple in-memory rate limiter for API protection
// In production, use Redis or a more robust solution

import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return false;
    }

    if (entry.count >= this.maxRequests) {
      return true; // Rate limit exceeded
    }

    entry.count++;
    return false;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.store.get(identifier);
    if (!entry) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.store.get(identifier);
    return entry?.resetTime || Date.now() + this.windowMs;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Export singleton instances for different use cases
export const authRateLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 auth attempts per 15 minutes
export const uploadRateLimiter = new RateLimiter(60 * 1000, 10); // 10 uploads per minute
export const apiRateLimiter = new RateLimiter(60 * 1000, 60); // 60 requests per minute

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  identifierFn?: (request: NextRequest) => string
) {
  return function (
    handler: (
      request: NextRequest,
      ...args: unknown[]
    ) => Promise<NextResponse> | NextResponse
  ) {
    return async function (request: NextRequest, ...args: unknown[]) {
      // Get client identifier (IP address or user ID)
      const identifier = identifierFn
        ? identifierFn(request)
        : request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";

      if (rateLimiter.isRateLimited(identifier)) {
        const resetTime = new Date(rateLimiter.getResetTime(identifier));
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
            retryAfter: resetTime.toISOString(),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil(
                (resetTime.getTime() - Date.now()) / 1000
              ).toString(),
              "X-RateLimit-Remaining": rateLimiter
                .getRemainingRequests(identifier)
                .toString(),
            },
          }
        );
      }

      return handler(request, ...args);
    };
  };
}
