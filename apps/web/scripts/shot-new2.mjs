import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const CHILD_ID = "f3b59107-290a-4b6f-bf2c-d708bcd64223";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.request.post(`${BASE}/api/auth/login`, { data: { email: "admin@cog.local", password: "Iqbal123!" } });
for (const key of ["tap_critter", "pair_cards"]) {
  await page.goto(`${BASE}/dashboard/play/${key}?childId=${CHILD_ID}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  await page.evaluate(() => { [...document.querySelectorAll("button")].find(x => x.textContent?.trim() === "Mulai main!")?.click(); });
  await page.waitForTimeout(key === "tap_critter" ? 5000 : 4500);
  await page.screenshot({ path: `shot-${key}.png` });
  console.log("captured", key);
}
await browser.close();
