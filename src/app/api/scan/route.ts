import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { runRiskEngine } from "@/lib/risk-engine/engine";
import { deletePrivateFile } from "@/lib/storage";
import { sanitizeSensitiveText } from "@/lib/privacy/masking";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse, requestFingerprint } from "@/lib/security/rate-limit";

const ScanRequestSchema = z.object({
  scanType: z.enum(["SCREENSHOT", "MESSAGE", "URL", "PHONE", "QR"]),
  text: z.string().max(10000).optional(),
  url: z.string().max(2000).optional(),
  phone: z.string().max(50).optional(),
  qrDestination: z.string().max(2000).optional(),
  storageKey: z.string().optional(),
  mimeType: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;
    const limit = checkRateLimit("scan", userId || requestFingerprint(req), userId ? 60 : 20, 60 * 60 * 1000);
    if (!limit.allowed) return rateLimitResponse(limit, "Scan limit reached. Please wait before trying again.");

    const body = await req.json();
    const parsed = ScanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid scan parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scanType, text, url, phone, qrDestination, storageKey, mimeType } = parsed.data;

    // Check user preference for deleting screenshot after analysis
    let deleteScreenshot = true; // default ON
    if (userId) {
      const pref = await prisma.userPreference.findUnique({
        where: { userId },
      });
      if (pref !== null) {
        deleteScreenshot = pref.deleteScreenshotsAfterScan;
      }
    }

    // Run modular backend risk engine
    const riskResult = await runRiskEngine({
      scanType,
      text,
      url,
      phone,
      qrDestination,
    });

    // Mask sensitive content before persistence
    const sanitizedInputText = text ? sanitizeSensitiveText(text) : undefined;

    // Persist Scan in database
    const scan = await prisma.scan.create({
      data: {
        userId,
        scanType,
        status: "COMPLETED",
        riskLevel: riskResult.riskLevel,
        riskScore: riskResult.riskScore,
        summary: riskResult.summary,
        language: riskResult.language,
        claimedOrg: riskResult.claimedOrg,
        normalizedTarget: riskResult.normalizedTarget,
        inputs: {
          create: {
            inputType:
              scanType === "MESSAGE"
                ? "TEXT"
                : scanType === "URL"
                ? "URL"
                : scanType === "PHONE"
                ? "PHONE"
                : scanType === "QR"
                ? "QR_DESTINATION"
                : "IMAGE",
            text: sanitizedInputText || url || phone || qrDestination || null,
            storageKey: deleteScreenshot ? null : storageKey || null,
            mimeType: mimeType || null,
          },
        },
        signals: {
          create: riskResult.signals.map((s) => ({
            type: s.type,
            score: s.score,
            confidence: s.confidence,
            title: s.title,
            description: s.description,
            evidence: s.evidence || null,
            source: s.source,
          })),
        },
      },
      include: {
        inputs: true,
        signals: true,
      },
    });

    // If deleteScreenshotsAfterScan is true and a screenshot was uploaded, permanently erase image bytes
    if (storageKey && deleteScreenshot) {
      await deletePrivateFile(storageKey);
    }

    // Optional audit log for user
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SCAN_CREATED",
          metadata: JSON.stringify({
            scanId: scan.id,
            scanType,
            riskLevel: scan.riskLevel,
            riskScore: scan.riskScore,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      result: {
        ...riskResult,
        id: scan.id,
        createdAt: scan.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Scan analysis error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while analyzing the input." },
      { status: 500 }
    );
  }
}
