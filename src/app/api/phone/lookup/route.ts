import { NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/risk-engine/phone-normalizer";
import { lookupCommunityIntelligence } from "@/lib/risk-engine/community-intelligence";
import prisma from "@/lib/db";
import crypto from "crypto";
import { calculateIpqsPhoneRisk, lookupIpqsPhone } from "@/lib/ipqs-phone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNumber = searchParams.get("number");

    if (!rawNumber || rawNumber.trim().length < 3) {
      return NextResponse.json({ error: "Please provide a valid phone number" }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(rawNumber);
    const [commIntel, ipqs] = await Promise.all([
      lookupCommunityIntelligence(normalized.normalized, normalized.masked),
      lookupIpqsPhone(normalized.normalized),
    ]);

    // Check Threat Indicators DB
    const phoneHash = crypto.createHash("sha256").update(normalized.normalized.toLowerCase()).digest("hex");
    const threatMatch = await prisma.threatIndicator.findFirst({
      where: { indicatorValueHash: phoneHash, active: true },
    });

    const externalRisk = calculateIpqsPhoneRisk(ipqs);
    const combinedRiskScore = threatMatch
      ? 95
      : Math.max(commIntel.riskScore, externalRisk, ipqs.available ? 5 : 0);

    return NextResponse.json({
      success: true,
      data: {
        raw: rawNumber,
        normalized: normalized.normalized,
        displayFormatted: normalized.displayFormatted,
        masked: normalized.masked,
        isValid: normalized.isValid,
        countryName: normalized.countryName,
        countryCallingCode: normalized.countryCode === "unknown" ? null : `+${normalized.countryCode}`,
        numberType: normalized.numberType,
        localFormat: normalized.localFormat || null,
        dialingPrefix: normalized.dialingPrefix || null,
        networkOperator: normalized.networkOperator || null,
        carrierLookupMethod: normalized.carrierLookupMethod || null,
        carrierDisclaimer: normalized.networkOperator
          ? "Carrier is inferred from the original number prefix and may differ if the number was ported."
          : null,
        totalCommunityReports: commIntel.totalReports,
        confirmedReports: commIntel.confirmedReports,
        firstReported: commIntel.firstReportedAt,
        mostRecentlyReported: commIntel.lastReportedAt,
        categories: commIntel.categoryBreakdown,
        platforms: commIntel.platformBreakdown,
        riskScore: combinedRiskScore,
        riskLevel: threatMatch
          ? threatMatch.riskLevel
          : combinedRiskScore >= 70
          ? "HIGH_RISK"
          : combinedRiskScore >= 40
          ? "MEDIUM_RISK"
          : "LOW_RISK",
        statement:
          commIntel.totalReports > 0
            ? `This number has received ${commIntel.totalReports} community reports.`
            : "This number has received 0 community reports on ScamCheck.",
        verificationNote:
          "ScamCheck does not identify the number owner or verify the caller's identity. No reports does not guarantee that a number is safe.",
        externalIntelligence: ipqs,
        assessmentConfidence: threatMatch
          ? "High - authoritative threat match found"
          : commIntel.confirmedReports > 0
          ? "High - moderator-confirmed reports found"
          : commIntel.totalReports > 0
          ? "Moderate - based on community reports"
          : "Limited - no negative records found",
        intelligenceSources: [
          { name: "ScamCheck community reports", checked: true, matches: commIntel.totalReports },
          { name: "ScamCheck threat indicators", checked: true, matches: threatMatch ? 1 : 0 },
          { name: "Phone format validation", checked: true, matches: normalized.isValid ? 1 : 0 },
          { name: "Sri Lankan prefix directory", checked: normalized.countryCode === "94", matches: normalized.networkOperator ? 1 : 0 },
          { name: "IPQS phone reputation", checked: ipqs.available, matches: ipqs.risky || ipqs.recentAbuse || ipqs.spammer ? 1 : 0 },
        ],
        recommendedActions:
          threatMatch || commIntel.riskScore >= 40
            ? [
                "Do not share OTPs, PINs, passwords or card details.",
                "Do not use links or payment instructions sent by this caller.",
                "Verify the request using the organization's official published number.",
                "Block the number and submit a report if the contact was fraudulent.",
              ]
            : [
                "Verify unexpected requests using an official published number.",
                "Never share OTPs, PINs, passwords or card details.",
                "Do not install apps or open payment links at a caller's request.",
                "Report suspicious contact so future checks can warn others.",
              ],
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
