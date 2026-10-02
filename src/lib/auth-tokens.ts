import crypto from "crypto";
import prisma from "@/lib/db";

export async function createAuthToken(userId: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD", minutes: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await prisma.authToken.create({
    data: { userId, type, tokenHash, expiresAt: new Date(Date.now() + minutes * 60_000) },
  });
  return token;
}

export async function consumeAuthToken(token: string, type: "VERIFY_EMAIL" | "RESET_PASSWORD") {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return prisma.$transaction(async (tx) => {
    const record = await tx.authToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) return null;
    await tx.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return record;
  });
}
