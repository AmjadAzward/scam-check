import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const ModerationActionSchema = z.object({
  reportId: z.string(),
  action: z.enum(["APPROVE", "REJECT", "CONFIRM", "ADD_THREAT_INDICATOR"]),
  moderatorNotes: z.string().optional(),
  threatIndicatorDetails: z
    .object({
      indicatorType: z.string(),
      displayValue: z.string(),
      riskLevel: z.string().default("KNOWN_MALICIOUS"),
    })
    .optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized: Moderator privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    let where: any = {};
    if (status !== "ALL") {
      where.status = status;
    }

    const reports = await prisma.communityReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        identifierType: true,
        displayValueMasked: true,
        category: true,
        description: true,
        platform: true,
        amountLost: true,
        currency: true,
        status: true,
        moderatorNotes: true,
        evidenceStorageKey: true,
        dateEncountered: true,
        createdAt: true,
        // Notice: Reporter user private email/id is NOT displayed to preserve user privacy!
      },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("Moderation queue fetch error:", error);
    return NextResponse.json({ error: "Failed to load moderation queue" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ModerationActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { reportId, action, moderatorNotes, threatIndicatorDetails } = parsed.data;

    const report = await prisma.communityReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let newStatus = report.status;
    if (action === "APPROVE") {
      newStatus = "VISIBLE";
    } else if (action === "CONFIRM") {
      newStatus = "CONFIRMED_BY_MODERATOR";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    }

    const updated = await prisma.communityReport.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        moderatorNotes: moderatorNotes || report.moderatorNotes,
      },
    });

    // If moderator chose to escalate into a formal Threat Indicator
    if (action === "ADD_THREAT_INDICATOR" && threatIndicatorDetails) {
      await prisma.threatIndicator.upsert({
        where: { id: "new" },
        update: {},
        create: {
          indicatorType: threatIndicatorDetails.indicatorType,
          indicatorValueHash: report.identifierValueHash,
          displayValue: threatIndicatorDetails.displayValue,
          source: "MODERATOR",
          riskLevel: threatIndicatorDetails.riskLevel,
          active: true,
        },
      });

      await prisma.communityReport.update({
        where: { id: reportId },
        data: { status: "CONFIRMED_BY_MODERATOR" },
      });
    }

    // Log moderator action
    await prisma.auditLog.create({
      data: {
        userId,
        action: `MODERATOR_${action}`,
        metadata: JSON.stringify({
          reportId,
          previousStatus: report.status,
          newStatus: updated.status,
          moderatorNotes,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report status updated to ${updated.status}`,
      report: updated,
    });
  } catch (error) {
    console.error("Moderation action error:", error);
    return NextResponse.json({ error: "Failed to perform moderation action" }, { status: 500 });
  }
}
