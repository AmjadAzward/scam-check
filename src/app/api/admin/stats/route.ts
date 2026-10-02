import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if ((userRole !== "ADMIN" && userRole !== "MODERATOR") || !(session?.user as any)?.twoFactorEnabled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalChecks,
      highRiskChecks,
      reportsToday,
      pendingModeration,
      totalThreats,
      topCategoriesRaw,
    ] = await Promise.all([
      prisma.scan.count(),
      prisma.scan.count({
        where: { riskLevel: { in: ["HIGH_RISK", "KNOWN_MALICIOUS"] } },
      }),
      prisma.communityReport.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.communityReport.count({
        where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.threatIndicator.count({ where: { active: true } }),
      prisma.communityReport.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
        take: 5,
      }),
    ]);

    const topCategories = topCategoriesRaw.map((tc) => ({
      category: tc.category,
      count: tc._count.category,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalChecks,
        highRiskChecks,
        reportsToday,
        pendingModeration,
        totalThreats,
        topCategories,
        systemHealth: {
          database: "CONNECTED",
          riskEngine: "ONLINE",
          storage: "READY",
          uptimeSeconds: process.uptime(),
        },
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
