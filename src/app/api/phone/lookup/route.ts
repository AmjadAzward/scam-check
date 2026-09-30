import { NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/risk-engine/phone-normalizer";
import { lookupCommunityIntelligence } from "@/lib/risk-engine/community-intelligence";
import prisma from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNumber = searchParams.get("number");

    if (!rawNumber || rawNumber.trim().length < 3) {
      return NextResponse.json({ error: "Please provide a valid phone number" }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(rawNumber);
    const commIntel = await lookupCommunityIntelligence(
      normalized.normalized,
      normalized.masked
    );

    // Check Threat Indicators DB
    const phoneHash = crypto.createHash("sha256").update(normalized.normalized.toLowerCase()).digest("hex");
    const threatMatch = await prisma.threatIndicator.findFirst({
      where: { indicatorValueHash: phoneHash, active: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        raw: rawNumber,
        normalized: normalized.normalized,
        displayFormatted: normalized.displayFormatted,
        masked: normalized.masked,
        isValid: normalized.isValid,
        networkOperator: normalized.networkOperator || null,
        totalCommunityReports: commIntel.totalReports,
        confirmedReports: commIntel.confirmedReports,
        firstReported: commIntel.firstReportedAt,
        mostRecentlyReported: commIntel.lastReportedAt,
        categories: commIntel.categoryBreakdown,
        platforms: commIntel.platformBreakdown,
        riskScore: threatMatch ? 95 : commIntel.riskScore,
        riskLevel: threatMatch
          ? threatMatch.riskLevel
          : commIntel.riskScore >= 70
          ? "HIGH_RISK"
          : commIntel.riskScore >= 40
          ? "MEDIUM_RISK"
          : "LOW_RISK",
        statement:
          commIntel.totalReports > 0
            ? `This number has received ${commIntel.totalReports} community reports.`
            : "This number has received 0 community reports on ScamCheck.",
        threatIntelRecord: threatMatch
          ? {
              source: threatMatch.source,
              riskLevel: threatMatch.riskLevel,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Phone lookup error:", error);
    return NextResponse.json({ error: "Failed to perform phone lookup" }, { status: 500 });
  }
}
