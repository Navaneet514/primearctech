import { auditSubmissionSchema, normalizeWebsite } from "@/lib/audit-schema";

export const runtime = "edge";

const encoder = new TextEncoder();

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

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  const parsed = auditSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: "Please check the highlighted fields." }, 400);
  }

  if (parsed.data.companyFax) {
    return json({ ok: false, error: "Submission rejected." }, 400);
  }

  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 2_500 || elapsed > 86_400_000) {
    return json({ ok: false, error: "Please refresh and try again." }, 400);
  }

  let website: string | undefined;
  try {
    website = normalizeWebsite(parsed.data.website);
  } catch {
    return json({ ok: false, error: "Enter a valid business website." }, 400);
  }

  const webhookUrl = process.env.AUDIT_WEBHOOK_URL;
  const webhookSecret = process.env.AUDIT_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return json(
      {
        ok: false,
        error:
          "The audit line is not connected yet. Your details were not submitted.",
      },
      503,
    );
  }

  const submission = Object.fromEntries(
    Object.entries(parsed.data).filter(
      ([key]) => key !== "companyFax" && key !== "startedAt",
    ),
  );
  let landingPath = "/fieldrelay";
  let demoScenario: string | undefined;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const sourceUrl = new URL(referer);
      landingPath = sourceUrl.pathname;
      demoScenario = sourceUrl.searchParams.get("scenario") || undefined;
    } catch { /* retain server-owned safe defaults */ }
  }
  const payload = JSON.stringify({
    ...submission,
    website,
    submissionId: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    source: "website-audit",
    brand: "primearctech",
    product: "fieldrelay",
    landingPath,
    demoScenario,
  });
  const signature = await signatureFor(webhookSecret, payload);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FieldRelay-Signature": `sha256=${signature}`,
      },
      body: payload,
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return json(
        { ok: false, error: "The audit line is temporarily unavailable." },
        502,
      );
    }

    return json({ ok: true }, 200);
  } catch {
    return json(
      { ok: false, error: "The audit line is temporarily unavailable." },
      502,
    );
  }
}
