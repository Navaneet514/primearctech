import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const origin = "http://127.0.0.1:4173";
const widths = [390, 768, 1024, 1440, 1920];
const routes = [["primearc", "/"], ["fieldrelay", "/fieldrelay"]];
const output = "output/site-audit";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const problems = [];

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: width <= 768 ? 844 : 1000 }, reducedMotion: "reduce" });
  page.on("console", (message) => { if (message.type() === "error") problems.push(`${width}: console ${message.text()}`); });
  page.on("pageerror", (error) => problems.push(`${width}: page ${error.message}`));
  for (const [name, route] of routes) {
    await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const step = Math.max(500, window.innerHeight * 0.75);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
      window.scrollTo(0, 0);
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) problems.push(`${width}: horizontal overflow on ${route}`);
    await page.screenshot({ path: `${output}/${name}-${width}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`Captured ${widths.length * routes.length} responsive screenshots with no horizontal overflow or console errors.`);
