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
      return NextResponse.json({ error: "Authentication required to export data" }, { status: 401 });
    }

    const [user, scans, reports] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          language: true,
          createdAt: true,
          preferences: true,
        },
      }),
      prisma.scan.findMany({
        where: { userId },
        include: { inputs: true, signals: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.communityReport.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      account: user,
      scansCount: scans.length,
      reportsCount: reports.length,
      scans,
      reports,
    };

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DATA_EXPORTED",
        metadata: JSON.stringify({ scansCount: scans.length, reportsCount: reports.length }),
      },
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="scamcheck-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
