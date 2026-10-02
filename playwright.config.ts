import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000", channel: "msedge", headless: true, screenshot: "only-on-failure" },
  reporter: "list",
});
