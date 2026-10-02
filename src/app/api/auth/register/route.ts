import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, rateLimitResponse, requestFingerprint } from "@/lib/security/rate-limit";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendSecurityEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/security/turnstile";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  country: z.string().default("LK"),
  language: z.string().default("en"),
  turnstileToken: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const limit = await checkRateLimit("register", requestFingerprint(req), 5, 60 * 60 * 1000);
    if (!limit.allowed) return rateLimitResponse(limit, "Too many registration attempts. Please try again later.");

    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }
    if (!(await verifyTurnstile(result.data.turnstileToken))) return NextResponse.json({ error: "Human verification failed. Please try again." }, { status: 400 });

    const { name, email, password, country, language } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        country,
        language,
        role: "USER",
        preferences: {
          create: {
            language,
            deleteScreenshotsAfterScan: true,
            notificationsEnabled: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        metadata: JSON.stringify({ country, language }),
      },
    });

    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      const token = await createAuthToken(user.id, "VERIFY_EMAIL", 24 * 60);
      const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      await sendSecurityEmail(user.email, "Verify your ScamCheck email", `<p>Welcome to ScamCheck.</p><p><a href="${base}/auth/verify-email?token=${encodeURIComponent(token)}">Verify email address</a></p><p>This link expires in 24 hours.</p>`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account registered successfully.",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
