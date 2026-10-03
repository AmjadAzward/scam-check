import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-tokens";

export async function POST(request: Request) {
  const parsed = z.object({ token: z.string().min(20), password: z.string().min(10).max(128) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid or weak password." }, { status: 400 });
  const record = await consumeAuthToken(parsed.data.token, "RESET_PASSWORD");
  if (!record) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12), failedLoginAttempts: 0, lockedUntil: null },
  });
  await prisma.userSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  return NextResponse.json({ success: true });
}
