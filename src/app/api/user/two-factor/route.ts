import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { decryptTotpSecret, encryptTotpSecret, generateRecoveryCodes, generateTotpSecret, verifyTotp } from "@/lib/security/totp";

async function adminUser() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  return id && (role === "ADMIN" || role === "MODERATOR") ? { id, email: session?.user?.email || "admin" } : null;
}

export async function GET() {
  const current = await adminUser();
  if (!current) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const user = await prisma.user.findUnique({ where: { id: current.id }, select: { twoFactorEnabled: true } });
  return NextResponse.json({ enabled: user?.twoFactorEnabled || false });
}

export async function POST(request: Request) {
  const current = await adminUser();
  if (!current) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const body = await request.json();
  if (body.action === "start") {
    const secret = generateTotpSecret();
    await prisma.user.update({ where: { id: current.id }, data: { twoFactorPendingSecret: encryptTotpSecret(secret) } });
    const uri = `otpauth://totp/ScamCheck:${encodeURIComponent(current.email)}?secret=${secret}&issuer=ScamCheck&digits=6&period=30`;
    return NextResponse.json({ secret, qrCode: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) });
  }
  if (body.action === "confirm") {
    const user = await prisma.user.findUnique({ where: { id: current.id } });
    if (!user?.twoFactorPendingSecret) return NextResponse.json({ error: "Start setup first." }, { status: 400 });
    const secret = decryptTotpSecret(user.twoFactorPendingSecret);
    if (!verifyTotp(secret, String(body.code || ""))) return NextResponse.json({ error: "Invalid authenticator code." }, { status: 400 });
    const recovery = generateRecoveryCodes();
    await prisma.user.update({ where: { id: current.id }, data: { twoFactorEnabled: true, twoFactorSecret: user.twoFactorPendingSecret, twoFactorPendingSecret: null, twoFactorRecoveryCodes: recovery.hashes } });
    return NextResponse.json({ success: true, recoveryCodes: recovery.plain });
  }
  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

export async function DELETE() {
  const current = await adminUser();
  if (!current) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  await prisma.user.update({ where: { id: current.id }, data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorPendingSecret: null, twoFactorRecoveryCodes: [] } });
  return NextResponse.json({ success: true });
}
