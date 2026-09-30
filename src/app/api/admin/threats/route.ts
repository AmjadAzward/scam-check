import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import crypto from "crypto";
import { z } from "zod";

const ThreatCreateSchema = z.object({
  indicatorType: z.enum(["URL", "DOMAIN", "PHONE", "EMAIL", "KEYWORD"]),
  value: z.string().min(2),
  source: z.string().default("MODERATOR"),
  riskLevel: z.enum(["HIGH_RISK", "KNOWN_MALICIOUS"]).default("KNOWN_MALICIOUS"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const threats = await prisma.threatIndicator.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, threats });
  } catch (error) {
    console.error("Threat query error:", error);
    return NextResponse.json({ error: "Failed to fetch threat indicators" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ThreatCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid threat input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { indicatorType, value, source, riskLevel } = parsed.data;
    const cleanVal = value.trim().toLowerCase();
    const hash = crypto.createHash("sha256").update(cleanVal).digest("hex");

    const created = await prisma.threatIndicator.create({
      data: {
        indicatorType,
        indicatorValueHash: hash,
        displayValue: value.trim(),
        source,
        riskLevel,
        active: true,
      },
    });

    return NextResponse.json({ success: true, threat: created });
  } catch (error: any) {
    console.error("Threat create error:", error);
    return NextResponse.json({ error: "Failed to create threat indicator" }, { status: 500 });
  }
}
