import prisma from "@/lib/db";
import crypto from "crypto";

export interface CommunityIntelligenceSummary {
  identifier: string;
  displayMasked: string;
  totalReports: number;
  confirmedReports: number;
  firstReportedAt: Date | null;
  lastReportedAt: Date | null;
  categoryBreakdown: { category: string; count: number }[];
  platformBreakdown: { platform: string; count: number }[];
  riskScore: number;
  signalText: string;
}

export async function lookupCommunityIntelligence(
  normalizedIdentifier: string,
  displayMasked: string
): Promise<CommunityIntelligenceSummary> {
  const hash = crypto.createHash("sha256").update(normalizedIdentifier.trim().toLowerCase()).digest("hex");

  // Query only approved, visible, or under review reports (exclude rejected)
  const reports = await prisma.communityReport.findMany({
    where: {
      identifierValueHash: hash,
      status: {
        in: ["VISIBLE", "CONFIRMED_BY_MODERATOR", "UNDER_REVIEW"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalReports = reports.length;
  const confirmedReports = reports.filter((r) => r.status === "CONFIRMED_BY_MODERATOR").length;

  const firstReportedAt = reports.length > 0 ? reports[reports.length - 1].createdAt : null;
  const lastReportedAt = reports.length > 0 ? reports[0].createdAt : null;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};

  reports.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    if (r.platform) {
      platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
    }
  });

  const categoryBreakdown = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const platformBreakdown = Object.entries(platformCounts)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  // Compute community risk score
  // Important rule: Community reports alone must NOT produce KNOWN MALICIOUS (which requires authoritative verification or moderator confirmation + high volume)
  let riskScore = 0;
  let signalText = "";

  if (totalReports === 0) {
    riskScore = 0;
    signalText = "No community reports on record for this identifier.";
  } else if (totalReports === 1) {
    riskScore = 40;
    signalText = `This has received 1 community report (${categoryBreakdown[0]?.category || "Suspicious"}).`;
  } else if (totalReports <= 5) {
    riskScore = 65;
    signalText = `This has received ${totalReports} community reports across ${categoryBreakdown.map((c) => c.category).join(", ")}.`;
  } else if (totalReports <= 15) {
    riskScore = 80;
    signalText = `This has received ${totalReports} community reports. Common categories: ${categoryBreakdown.slice(0, 3).map((c) => `${c.category} (${c.count})`).join(", ")}.`;
  } else {
    riskScore = 88;
    signalText = `This has received ${totalReports} community reports. Top categories: ${categoryBreakdown.slice(0, 3).map((c) => `${c.category} (${c.count})`).join(", ")}.`;
  }

  // Moderator confirmation boost
  if (confirmedReports > 0) {
    riskScore = Math.min(94, riskScore + 10);
  }

  return {
    identifier: normalizedIdentifier,
    displayMasked,
    totalReports,
    confirmedReports,
    firstReportedAt,
    lastReportedAt,
    categoryBreakdown,
    platformBreakdown,
    riskScore,
    signalText,
  };
}
