import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateSignedFileUrl } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const report = await prisma.communityReport.findUnique({
      where: { id: params.id },
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
        evidenceStorageKey: true,
        dateEncountered: true,
        createdAt: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let signedEvidenceUrl: string | null = null;
    if (report.evidenceStorageKey) {
      signedEvidenceUrl = generateSignedFileUrl(report.evidenceStorageKey, 600);
    }

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        evidenceUrl: signedEvidenceUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching single report:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
