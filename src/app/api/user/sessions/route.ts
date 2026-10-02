import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

async function current() { const session = await getServerSession(authOptions); return { userId: (session?.user as any)?.id as string | undefined, sessionId: (session?.user as any)?.sessionId as string | undefined }; }

export async function GET() {
  const { userId, sessionId } = await current();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await prisma.userSession.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
  return NextResponse.json({ sessions: sessions.map((item) => ({ id: item.id, label: item.label, createdAt: item.createdAt, lastSeenAt: item.lastSeenAt, current: item.id === sessionId })) });
}

export async function DELETE(request: Request) {
  const { userId, sessionId } = await current();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (body.all === true) await prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  else if (typeof body.id === "string") await prisma.userSession.updateMany({ where: { id: body.id, userId }, data: { revokedAt: new Date() } });
  else return NextResponse.json({ error: "Session id required." }, { status: 400 });
  return NextResponse.json({ success: true, currentRevoked: body.all === true || body.id === sessionId });
}
