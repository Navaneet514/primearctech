import { expect, test } from "@playwright/test";

test("navigation, calculator, and keyboard accordion work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "We build revenue systems for calls your team cannot take." })).toBeVisible();
  await page.getByRole("link", { name: "FieldRelay", exact: true }).first().click();
  await expect(page).toHaveURL(/\/fieldrelay$/);
  await expect(page.getByRole("heading", { name: "Every missed call is already choosing a contractor." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole("heading", { name: "Know what to fix before buying anything." })).toBeVisible();
  await page.waitForTimeout(1200);

  const increaseCalls = page.getByRole("button", { name: "Increase monthly inbound calls" });
  for (let increment = 0; increment < 8; increment += 1) {
    await increaseCalls.click();
  }
  await expect(page.locator(".primary-result strong")).toHaveText("35,700");

  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: /One call/ })).toBeVisible();

  const capability = page.getByRole("listitem").filter({ hasText: "Human escalation" });
  await capability.focus();
  await expect(capability).toHaveClass(/is-active/);

  await page.locator("#offer").scrollIntoViewIfNeeded();
  const firstQuestion = page.locator(".offer-questions details").first();
  await firstQuestion.locator("summary").click();
  await expect(firstQuestion.locator("p")).toBeVisible();
});

test("form never reports false success when the webhook is absent", async ({ page }) => {
  await page.goto("/fieldrelay#audit");
  await page.getByLabel("Name").fill("Jordan Lee");
  await page.getByLabel("Work email").fill("jordan@example.com");
  await page.getByLabel("Company", { exact: true }).fill("Reliable Air");
  await page.locator('select[name="monthlyCalls"]').selectOption("150-299");
  await page.locator('select[name="challenge"]').selectOption("missed-calls");
  await page.locator('input[name="consent"]').check();
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: "Get my audit" }).click();
  const formStatus = page.locator(".form-status");
  await expect(formStatus).toContainText("not connected", { timeout: 15_000 });
  await expect(formStatus).not.toContainText("request is in");
});

test("reduced motion is honored without hiding content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fieldrelay");
  await expect(page.getByRole("heading", { name: "The gap between ringing and revenue." })).toBeVisible();
  await expect(page.locator(".journey-scene").first()).toHaveCSS("opacity", "1");
});

test("systems lab runs an honest scenario and produces a receipt", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/fieldrelay/demo");
  await expect(page.getByRole("heading", { name: "Hear it. Try to break it." })).toBeVisible();
  await page.getByRole("button", { name: /Emergency handoff/ }).click();
  await page.getByRole("button", { name: /^Hear sample(?: call)?$/ }).click();
  await expect(page.getByText("Emergency handoff triggered")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Troubleshooting prohibited")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("legacy demo redirect and document navigation are reliable", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/fieldrelay\/demo$/);
  await page.getByRole("link", { name: "Back to FieldRelay" }).click();
  await expect(page).toHaveURL(/\/fieldrelay$/);
  await page.getByRole("link", { name: "FieldRelay product home" }).click();
  await expect(page).toHaveURL(/\/fieldrelay$/);
});

test("private pitch console authenticates and runs a fictional sandbox", async ({ page }) => {
  await page.goto("/fieldrelay/pitch");
  await page.getByLabel("Password").fill("playwright-pitch-access-secret");
  await page.getByRole("button", { name: "Unlock console" }).click();
  await expect(page.getByRole("heading", { name: "Shape the sandbox." })).toBeVisible();
  await page.getByLabel("Company name").fill("Sample Air Co");
  await page.getByRole("button", { name: "Start call" }).click();
  await expect(page.getByText("Audible scripted fallback")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Stop call" }).click();
  await expect(page.getByText("Illustrative", { exact: false })).toBeVisible();
});
