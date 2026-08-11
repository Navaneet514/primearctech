import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/build-brief/route";

const baseSubmission = () => ({
  email: "founder@example.com",
  website: "example.com",
  problem: "Our intake workflow is split across email, documents, and manual review.",
  consent: true,
  startedAt: Date.now() - 5_000,
});

function requestFor(body: unknown) {
  return new Request("http://localhost/api/build-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("build brief API route", () => {
  beforeEach(() => {
    delete process.env.BUILD_BRIEF_WEBHOOK_URL;
    delete process.env.BUILD_BRIEF_WEBHOOK_SECRET;
    delete process.env.AUDIT_WEBHOOK_URL;
    delete process.env.AUDIT_WEBHOOK_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.BUILD_BRIEF_WEBHOOK_URL;
    delete process.env.BUILD_BRIEF_WEBHOOK_SECRET;
    delete process.env.AUDIT_WEBHOOK_URL;
    delete process.env.AUDIT_WEBHOOK_SECRET;
  });

  it("rejects unknown fields and short problem statements", async () => {
    expect((await POST(requestFor({ ...baseSubmission(), unknown: true }))).status).toBe(400);
    expect((await POST(requestFor({ ...baseSubmission(), problem: "Too short" }))).status).toBe(400);
  });

  it("rejects honeypot submissions", async () => {
    const response = await POST(requestFor({ ...baseSubmission(), companyFax: "555-0100" }));
    expect(response.status).toBe(400);
  });

  it("reports missing configuration without false success", async () => {
    const response = await POST(requestFor(baseSubmission()));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Build brief intake is not connected yet. Nothing was submitted.",
    });
  });

  it("normalizes, signs, and forwards a valid build brief", async () => {
    process.env.BUILD_BRIEF_WEBHOOK_URL = "https://hooks.example.com/build-brief";
    process.env.BUILD_BRIEF_WEBHOOK_SECRET = "test-secret-with-enough-entropy";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const response = await POST(requestFor({
      ...baseSubmission(),
      source: "build-brief-page",
      utmSource: "linkedin",
      utmCampaign: "founder-outreach",
      gclid: "example-click-id",
    }));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hooks.example.com/build-brief");
    expect(new Headers(init?.headers).get("X-PrimeArcTech-Signature")).toMatch(/^sha256=[a-f0-9]{64}$/);
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      website: "https://example.com/",
      source: "website-build-brief",
      brand: "primearctech",
      landingSource: "build-brief-page",
      utm: { source: "linkedin", campaign: "founder-outreach" },
      clickIds: { gclid: "example-click-id" },
    });
    expect(body).not.toHaveProperty("companyFax");
    expect(body).not.toHaveProperty("startedAt");
  });
});
