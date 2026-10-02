import { NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/risk-engine/url-analyzer";
import { checkRateLimit, rateLimitResponse, requestFingerprint } from "@/lib/security/rate-limit";
import { lookupCommunityIntelligence } from "@/lib/risk-engine/community-intelligence";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const limit = await checkRateLimit("url-lookup", requestFingerprint(req), 20, 60 * 60 * 1000);
    if (!limit.allowed) return rateLimitResponse(limit, "URL lookup limit reached. Please try again later.");
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");
    const claimedBrand = searchParams.get("claimedBrand");

    if (!rawUrl || rawUrl.trim().length < 3) {
      return NextResponse.json({ error: "Please provide a valid URL" }, { status: 400 });
    }

    const urlAnalysis = await analyzeUrl(rawUrl, claimedBrand || null);
    const commIntel = await lookupCommunityIntelligence(urlAnalysis.hostname, urlAnalysis.hostname);

    return NextResponse.json({
      success: true,
      data: {
        ...urlAnalysis,
        communityReports: commIntel.totalReports,
        communityBreakdown: commIntel.categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("URL lookup error:", error);
    return NextResponse.json({ error: "Failed to analyze URL" }, { status: 500 });
  }
}
