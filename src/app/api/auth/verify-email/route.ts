import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-tokens";

export async function POST(request: Request) {
  const token = String((await request.json()).token || "");
  const record = await consumeAuthToken(token, "VERIFY_EMAIL");
  if (!record) return NextResponse.json({ error: "This verification link is invalid or expired." }, { status: 400 });
  await prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.json({ success: true });
}
