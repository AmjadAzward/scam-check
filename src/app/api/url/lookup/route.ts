import { NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/risk-engine/url-analyzer";
import { lookupCommunityIntelligence } from "@/lib/risk-engine/community-intelligence";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
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
