import { normalizeWebsite } from "@/lib/audit-schema";
import { buildBriefSchema } from "@/lib/build-brief-schema";

export const runtime = "edge";

const encoder = new TextEncoder();

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function signatureFor(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const parsed = buildBriefSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: "Check the form and try again." }, 400);
  }

  if (parsed.data.companyFax) {
    return json({ ok: false, error: "Submission rejected." }, 400);
  }

  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 2_500 || elapsed > 86_400_000) {
    return json({ ok: false, error: "Refresh the page and try again." }, 400);
  }

  let website: string;
  try {
    website = normalizeWebsite(parsed.data.website) || "";
  } catch {
    return json({ ok: false, error: "Enter a valid company website." }, 400);
  }

  const webhookUrl = process.env.BUILD_BRIEF_WEBHOOK_URL || process.env.AUDIT_WEBHOOK_URL;
  const webhookSecret = process.env.BUILD_BRIEF_WEBHOOK_SECRET || process.env.AUDIT_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return json({ ok: false, error: "Build brief intake is not connected yet. Nothing was submitted." }, 503);
  }

  let landingPath = "/";
  const referer = request.headers.get("referer");
  if (referer) {
    try { landingPath = new URL(referer).pathname; } catch { /* keep safe default */ }
  }

  const payload = JSON.stringify({
    name: parsed.data.name,
    email: parsed.data.email,
    website,
    problem: parsed.data.problem,
    consent: parsed.data.consent,
    submissionId: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    source: "website-build-brief",
    brand: "primearctech",
    landingPath,
    landingSource: parsed.data.source,
    utm: {
      source: parsed.data.utmSource,
      medium: parsed.data.utmMedium,
      campaign: parsed.data.utmCampaign,
      content: parsed.data.utmContent,
      term: parsed.data.utmTerm,
    },
    clickIds: {
      gclid: parsed.data.gclid,
      fbclid: parsed.data.fbclid,
      ttclid: parsed.data.ttclid,
      msclkid: parsed.data.msclkid,
    },
  });
  const signature = await signatureFor(webhookSecret, payload);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-PrimeArcTech-Signature": `sha256=${signature}`,
      },
      body: payload,
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return json({ ok: false, error: "Build brief intake is temporarily unavailable." }, 502);
    }
    return json({ ok: true }, 200);
  } catch {
    return json({ ok: false, error: "Build brief intake is temporarily unavailable." }, 502);
  }
}
