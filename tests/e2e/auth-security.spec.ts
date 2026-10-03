import { expect, test, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import prisma from "../../src/lib/db";
import { hashRecoveryCode } from "../../src/lib/security/totp";
import { createAuthToken } from "../../src/lib/auth-tokens";

const runId = Date.now().toString(36);
const password = "ScamCheck-E2E-Strong-2048!";
const recoveryCode = "e2e1-recovery9";
const emails = {
  lockout: `e2e-lockout-${runId}@example.invalid`,
  session: `e2e-session-${runId}@example.invalid`,
  admin: `e2e-admin-${runId}@example.invalid`,
  verify: `e2e-verify-${runId}@example.invalid`,
  reset: `e2e-reset-${runId}@example.invalid`,
};

async function login(page: Page, email: string, suppliedPassword: string, otp = "") {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(suppliedPassword);
  if (otp) await page.getByPlaceholder("6-digit code").fill(otp);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

test.describe.serial("real authentication security flows", () => {
  test.beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.createMany({
      data: [
        { email: emails.lockout, passwordHash, role: "USER", emailVerifiedAt: new Date() },
        { email: emails.session, passwordHash, role: "USER", emailVerifiedAt: new Date() },
        { email: emails.admin, passwordHash, role: "ADMIN", emailVerifiedAt: new Date(), twoFactorEnabled: true, twoFactorRecoveryCodes: [hashRecoveryCode(recoveryCode)] },
        { email: emails.verify, passwordHash, role: "USER" },
        { email: emails.reset, passwordHash, role: "USER", emailVerifiedAt: new Date() },
      ],
    });
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.$disconnect();
  });

  test("locks an account after five failed passwords", async ({ page }) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(page, emails.lockout, "Incorrect-password-2048!");
      await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    }
    const locked = await prisma.user.findUniqueOrThrow({ where: { email: emails.lockout } });
    expect(locked.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
    await login(page, emails.lockout, password);
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("opens and consumes an email-verification link", async ({ page }) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails.verify } });
    const token = await createAuthToken(user.id, "VERIFY_EMAIL", 30);
    await page.goto(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    await expect(page.getByText(/email verified successfully/i)).toBeVisible();
    const verified = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(verified.emailVerifiedAt).not.toBeNull();
  });

  test("opens an expiring reset link and changes the password", async ({ page }) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails.reset } });
    const token = await createAuthToken(user.id, "RESET_PASSWORD", 30);
    const newPassword = "ScamCheck-E2E-New-4096!";
    await page.goto(`/auth/reset-password?token=${encodeURIComponent(token)}`);
    await page.getByPlaceholder(/at least 10 characters/i).fill(newPassword);
    await page.getByRole("button", { name: /update password/i }).click();
    await expect(page.getByText(/password updated/i)).toBeVisible();
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare(newPassword, updated.passwordHash)).toBe(true);
  });

  test("accepts a recovery code once", async ({ page, browser }) => {
    await login(page, emails.admin, password, recoveryCode);
    await expect(page).toHaveURL("/", { timeout: 15_000 });
    const updated = await prisma.user.findUniqueOrThrow({ where: { email: emails.admin } });
    expect(updated.twoFactorRecoveryCodes).toEqual([]);

    const secondContext = await browser.newContext();
    const second = await secondContext.newPage();
    await login(second, emails.admin, password, recoveryCode);
    await expect(second.getByText(/invalid email or password/i)).toBeVisible();
    await secondContext.close();
  });

  test("tracks two browsers and revokes individual and all sessions", async ({ browser }) => {
    const firstContext = await browser.newContext();
    const secondContext = await browser.newContext();
    const first = await firstContext.newPage();
    const second = await secondContext.newPage();
    await login(first, emails.session, password);
    await expect(first).toHaveURL("/", { timeout: 15_000 });
    await login(second, emails.session, password);
    await expect(second).toHaveURL("/", { timeout: 15_000 });

    await first.goto("/settings/sessions");
    await expect(first.getByText("Browser session")).toHaveCount(2);
    const sessions = await first.evaluate(async () => (await fetch("/api/user/sessions")).json());
    const other = sessions.sessions.find((item: { current: boolean }) => !item.current);
    const revoked = await first.evaluate(async (id) => {
      const response = await fetch("/api/user/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      return response.ok;
    }, other.id);
    expect(revoked).toBe(true);
    await first.reload();
    await expect(first.getByText("Browser session")).toHaveCount(1);
    await first.getByRole("button", { name: /sign out everywhere/i }).click();
    await expect(first).toHaveURL(/\/auth\/login/);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: emails.session } });
    expect(await prisma.userSession.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
    await firstContext.close();
    await secondContext.close();
  });
});
