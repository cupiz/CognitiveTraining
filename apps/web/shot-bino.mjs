import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const CHILD_ID = "f3b59107-290a-4b6f-bf2c-d708bcd64223";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "admin@cog.local", password: "Iqbal123!" } });
await page.goto(`${BASE}/dashboard/play/wide_view?childId=${CHILD_ID}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === "Mulai main!");
  b?.click();
});
await page.waitForTimeout(3000);
await page.screenshot({ path: "shot-bino.png" });
await browser.close();
console.log("captured");
