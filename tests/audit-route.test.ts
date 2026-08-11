import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/audit/route";

const baseSubmission = () => ({
  name: "Jordan Lee",
  email: "jordan@example.com",
  company: "Reliable Air",
  website: "reliableair.com",
  monthlyCalls: "150-299",
  currentSystem: "Office line",
  challenge: "missed-calls",
  consent: true,
  startedAt: Date.now() - 5000,
  utmSource: "test",
});

function requestFor(body: unknown) {
  return new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("audit API route", () => {
  beforeEach(() => {
    delete process.env.AUDIT_WEBHOOK_URL;
    delete process.env.AUDIT_WEBHOOK_SECRET;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AUDIT_WEBHOOK_URL;
    delete process.env.AUDIT_WEBHOOK_SECRET;
  });

  it("rejects invalid and unknown payload fields", async () => {
    const response = await POST(requestFor({ ...baseSubmission(), unknown: true }));
    expect(response.status).toBe(400);
  });

  it("rejects the honeypot", async () => {
    const response = await POST(requestFor({ ...baseSubmission(), companyFax: "555-0100" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("reports missing webhook configuration without false success", async () => {
    const response = await POST(requestFor(baseSubmission()));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "The audit line is not connected yet. Your details were not submitted.",
    });
  });

  it("signs and forwards normalized submissions", async () => {
    process.env.AUDIT_WEBHOOK_URL = "https://hooks.example.com/audit";
    process.env.AUDIT_WEBHOOK_SECRET = "test-secret-with-enough-entropy";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const response = await POST(requestFor(baseSubmission()));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hooks.example.com/audit");
    expect(new Headers(init?.headers).get("X-FieldRelay-Signature")).toMatch(/^sha256=[a-f0-9]{64}$/);
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      website: "https://reliableair.com/",
      source: "website-audit",
      utmSource: "test",
    });
    expect(body.submissionId).toEqual(expect.any(String));
    expect(body.submittedAt).toEqual(expect.any(String));
    expect(body).not.toHaveProperty("companyFax");
    expect(body).not.toHaveProperty("startedAt");
  });

  it("returns an honest downstream error", async () => {
    process.env.AUDIT_WEBHOOK_URL = "https://hooks.example.com/audit";
    process.env.AUDIT_WEBHOOK_SECRET = "test-secret-with-enough-entropy";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("Timed out", "TimeoutError"));

    const response = await POST(requestFor(baseSubmission()));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });
});
