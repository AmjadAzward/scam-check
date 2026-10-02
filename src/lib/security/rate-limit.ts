import crypto from "crypto";
import prisma from "@/lib/db";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function requestFingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return crypto.createHash("sha256").update(address).digest("hex").slice(0, 24);
}

export async function checkRateLimit(scope: string, identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `${scope}:${identifier}`;
  const resetAt = new Date(now + windowMs);

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      INSERT INTO "ApiRateLimit" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${resetAt}, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "ApiRateLimit"."resetAt" <= NOW() THEN 1
          ELSE "ApiRateLimit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "ApiRateLimit"."resetAt" <= NOW() THEN ${resetAt}
          ELSE "ApiRateLimit"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `;
    const bucket = rows[0];
    return {
      allowed: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt.getTime() - now) / 1000)),
    };
  } catch (error) {
    console.warn("Distributed rate limiter unavailable; using local fallback:", error instanceof Error ? error.message : "Unknown error");
  }

  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (buckets.size > 10_000) {
    buckets.forEach((value, bucketKey) => {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    });
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult, message: string): Response {
  return Response.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
