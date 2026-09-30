import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "all" | "saved" | "mine"
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let whereClause: any = {};

    if (filter === "saved" && userId) {
      whereClause = { userId, isSaved: true };
    } else if (filter === "mine" && userId) {
      whereClause = { userId };
    }

    const scans = await prisma.scan.findMany({
      where: whereClause,
      take: Math.min(limit, 50),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        scanType: true,
        summary: true,
        riskLevel: true,
        riskScore: true,
        language: true,
        claimedOrg: true,
        normalizedTarget: true,
        isSaved: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, scans });
  } catch (error) {
    console.error("Error fetching recent scans:", error);
    return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
  }
}
