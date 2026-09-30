import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Sign in to view your checks" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "all" | "saved" | "mine"
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let whereClause: any = { userId };

    if (filter === "saved") {
      whereClause = { userId, isSaved: true };
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
