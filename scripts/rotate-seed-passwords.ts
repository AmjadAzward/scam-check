import bcrypt from "bcryptjs";
import prisma from "../src/lib/db";

const accounts = [
  ["admin@scamcheck.lk", process.env.SEED_ADMIN_PASSWORD],
  ["moderator@scamcheck.lk", process.env.SEED_MODERATOR_PASSWORD],
  ["user@scamcheck.lk", process.env.SEED_USER_PASSWORD],
] as const;

async function main() {
  for (const [email, password] of accounts) {
    if (!password || password.length < 16) throw new Error(`A strong password is required for ${email}`);
    const result = await prisma.user.updateMany({
      where: { email },
      data: { passwordHash: await bcrypt.hash(password, 12), failedLoginAttempts: 0, lockedUntil: null },
    });
    if (result.count !== 1) throw new Error(`Expected one existing account for ${email}`);
  }
  console.log("Rotated 3 seeded account passwords successfully.");
}

main().finally(() => prisma.$disconnect());
