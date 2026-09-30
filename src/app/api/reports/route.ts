import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/risk-engine/phone-normalizer";
import { maskPhoneNumber, maskUrl, sanitizeSensitiveText } from "@/lib/privacy/masking";
import crypto from "crypto";
import { z } from "zod";

const SubmitReportSchema = z.object({
  identifierType: z.enum([
    "PHONE",
    "URL",
    "EMAIL",
    "SOCIAL_MEDIA",
    "MESSAGE",
    "QR_DESTINATION",
  ]),
  rawIdentifier: z.string().min(2).max(1000),
  category: z.string().min(2).max(100),
  description: z.string().min(10, "Please provide at least 10 characters describing the incident").max(3000),
  platform: z.string().max(100).optional(),
  amountLost: z.number().nullable().optional(),
  currency: z.string().default("LKR"),
  evidenceStorageKey: z.string().optional(),
  dateEncountered: z.string().optional(),
});

// Simple in-memory rate limiting map (IP/User -> timestamps)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(key: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);
  if (validTimestamps.length >= limit) {
    return true;
  }
  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to submit a community report" },
        { status: 401 }
      );
    }

    // Rate limiting key based on userId or IP
    const clientIp = req.headers.get("x-forwarded-for") || "client";
    const rateKey = `user:${userId}`;

    if (isRateLimited(rateKey, 6, 60000)) {
      return NextResponse.json(
        { error: "Too many reports submitted. Please wait a minute before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = SubmitReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      identifierType,
      rawIdentifier,
      category,
      description,
      platform,
      amountLost,
      currency,
      evidenceStorageKey,
      dateEncountered,
    } = result.data;

    // Normalize identifier
    let normalized = rawIdentifier.trim();
    let displayMasked = rawIdentifier.trim();

    if (identifierType === "PHONE") {
      const norm = normalizePhoneNumber(rawIdentifier);
      normalized = norm.normalized;
      displayMasked = norm.masked;
    } else if (identifierType === "URL" || identifierType === "QR_DESTINATION") {
      try {
        const u = new URL(rawIdentifier.startsWith("http") ? rawIdentifier : `https://${rawIdentifier}`);
        normalized = u.hostname.toLowerCase();
        displayMasked = maskUrl(rawIdentifier);
      } catch {
        normalized = rawIdentifier.toLowerCase();
        displayMasked = maskUrl(rawIdentifier);
      }
    } else if (identifierType === "EMAIL") {
      normalized = rawIdentifier.toLowerCase();
      const parts = normalized.split("@");
      displayMasked = `${parts[0].slice(0, 2)}••••@${parts[1] || "domain.com"}`;
    }

    const identifierHash = crypto.createHash("sha256").update(normalized.toLowerCase()).digest("hex");

    // Duplicate detection: check if identical report from same user was created within the last 15 minutes
    const recentDuplicate = await prisma.communityReport.findFirst({
      where: {
        identifierValueHash: identifierHash,
        category,
        userId,
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error: "A very similar report was recently submitted for this target. Your contribution is already recorded.",
        },
        { status: 409 }
      );
    }

    // Sanitize description text from any raw passwords/PINs/card numbers
    const sanitizedDescription = sanitizeSensitiveText(description);

    const report = await prisma.communityReport.create({
      data: {
        userId,
        identifierType,
        identifierValueHash: identifierHash,
        displayValueMasked: displayMasked,
        category,
        description: sanitizedDescription,
        platform: platform || "Direct",
        amountLost: amountLost || null,
        currency: currency || "LKR",
        evidenceStorageKey: evidenceStorageKey || null,
        dateEncountered: dateEncountered ? new Date(dateEncountered) : new Date(),
        status: "VISIBLE",
      },
    });

    // Record audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "COMMUNITY_REPORT_SUBMITTED",
          metadata: JSON.stringify({ reportId: report.id, category, identifierType }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Community report submitted successfully. Thank you for protecting others.",
      reportId: report.id,
      displayMasked: report.displayValueMasked,
    });
  } catch (error) {
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving the report." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: any = {
      status: {
        in: ["VISIBLE", "CONFIRMED_BY_MODERATOR"],
      },
    };

    if (category && category !== "All Categories" && category !== "all") {
      where.category = category;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { displayValueMasked: { contains: search } },
        { description: { contains: search } },
        { platform: { contains: search } },
      ];
    }

    const [reports, totalCount] = await Promise.all([
      prisma.communityReport.findMany({
        where,
        take: Math.min(limit, 50),
        skip: (page - 1) * limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          identifierType: true,
          displayValueMasked: true,
          category: true,
          description: true,
          platform: true,
          amountLost: true,
          currency: true,
          status: true,
          dateEncountered: true,
          createdAt: true,
          // Explicitly omit userId for privacy protection!
        },
      }),
      prisma.communityReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
