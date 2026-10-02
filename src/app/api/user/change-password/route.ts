import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ currentPassword: z.string(), newPassword: z.string().min(10).max(128) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "The new password must contain at least 10 characters." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  await prisma.auditLog.create({ data: { userId, action: "PASSWORD_CHANGED" } });
  return NextResponse.json({ success: true });
}
