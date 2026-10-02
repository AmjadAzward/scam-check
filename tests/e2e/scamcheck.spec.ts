import { expect, test } from "@playwright/test";

test("home and all checker pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /is this safe/i })).toBeVisible();
  for (const path of ["message", "screenshot", "link", "phone", "qr"]) {
    const response = await page.goto(`/check/${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("account recovery and verification pages render", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  await page.goto("/auth/forgot-password");
  await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
  await page.goto("/auth/register");
  await expect(page.getByRole("heading", { name: /create your scamcheck account/i })).toBeVisible();
});

test("protected and admin pages require authentication", async ({ page }) => {
  for (const path of ["/history", "/settings", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login/);
  }
});

test("mobile navigation and core layout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /is this safe/i })).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  await page.goto("/check/phone");
  await expect(page.getByRole("button", { name: /look up/i })).toBeVisible();
});
