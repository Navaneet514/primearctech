import { expect, test } from "@playwright/test";

test.use({
  permissions: ["microphone"],
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test("configured Vapi assistant opens a real browser voice session", async ({ page }) => {
  test.skip(process.env.RUN_VAPI_LIVE_TEST !== "1", "Opt-in test consumes live provider resources.");
  test.setTimeout(60_000);

  await page.goto("/demo");
  const microphoneReady = await page.evaluate(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ready = stream.getAudioTracks().some((track) => track.readyState === "live");
    stream.getTracks().forEach((track) => track.stop());
    return ready;
  });
  expect(microphoneReady).toBe(true);
  await expect(page.getByRole("button", { name: "Talk to FieldRelay" })).toBeVisible();
  await page.getByRole("button", { name: "Talk to FieldRelay" }).click();

  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await expect(page.locator(".voice-caption p")).toContainText(/what can I help you with tonight/i, { timeout: 45_000 });

  await page.getByRole("button", { name: "Stop" }).click();
});
