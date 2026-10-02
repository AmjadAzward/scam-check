import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendSecurityEmail } from "@/lib/email";
import { checkRateLimit, requestFingerprint } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limit = await checkRateLimit("forgot-password", requestFingerprint(request), 5, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ success: true });
  const parsed = z.object({ email: z.string().email() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (user) {
    const token = await createAuthToken(user.id, "RESET_PASSWORD", 30);
    const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    await sendSecurityEmail(user.email, "Reset your ScamCheck password", `<p>A password reset was requested.</p><p><a href="${base}/auth/reset-password?token=${encodeURIComponent(token)}">Reset password</a></p><p>This link expires in 30 minutes.</p>`);
  }
  return NextResponse.json({ success: true, message: "If the account exists, reset instructions have been sent." });
}
