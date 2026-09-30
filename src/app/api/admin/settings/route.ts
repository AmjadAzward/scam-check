import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DEFAULT_WEIGHTS } from "@/lib/risk-engine/engine";
import type { RiskEngineWeights } from "@/lib/risk-engine/types";

// In-memory runtime weights holder (can be backed by DB settings)
let currentWeights: RiskEngineWeights = { ...DEFAULT_WEIGHTS };

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      weights: currentWeights,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const { weights } = body;

    if (weights && typeof weights === "object") {
      currentWeights = {
        aiMessageWeight: typeof weights.aiMessageWeight === "number" ? weights.aiMessageWeight : currentWeights.aiMessageWeight,
        urlIntelWeight: typeof weights.urlIntelWeight === "number" ? weights.urlIntelWeight : currentWeights.urlIntelWeight,
        threatIntelWeight: typeof weights.threatIntelWeight === "number" ? weights.threatIntelWeight : currentWeights.threatIntelWeight,
        impersonationWeight: typeof weights.impersonationWeight === "number" ? weights.impersonationWeight : currentWeights.impersonationWeight,
        communityWeight: typeof weights.communityWeight === "number" ? weights.communityWeight : currentWeights.communityWeight,
        sensitiveInfoWeight: typeof weights.sensitiveInfoWeight === "number" ? weights.sensitiveInfoWeight : currentWeights.sensitiveInfoWeight,
        senderVerificationWeight: typeof weights.senderVerificationWeight === "number" ? weights.senderVerificationWeight : currentWeights.senderVerificationWeight,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Risk engine weights updated successfully.",
      weights: currentWeights,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
