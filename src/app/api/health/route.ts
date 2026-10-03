import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        services: {
          phoneReputation: Boolean(process.env.IPQS_API_KEY),
          urlReputation: Boolean(process.env.IPQS_API_KEY),
          aiAnalysis: Boolean(process.env.OPENAI_API_KEY),
          transactionalEmail: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
          captcha: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
          cloudStorage: process.env.STORAGE_DRIVER !== "local",
        },
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
