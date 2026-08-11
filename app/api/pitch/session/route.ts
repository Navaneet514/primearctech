import { pitchProfileSchema } from "@/lib/demo/schema";
import { randomToken, sha256 } from "@/lib/demo/security";
import { pitchAuthorized } from "@/lib/pitch-auth";

export const runtime = "edge";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function randomDemoCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

export async function POST(request: Request) {
  if (!await pitchAuthorized(request)) return json({ ok: false, error: "Presenter access required." }, 401);
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON payload." }, 400); }
  const parsed = pitchProfileSchema.safeParse(raw);
  if (!parsed.success) return json({ ok: false, error: "Check the prospect configuration." }, 400);
  const secret = process.env.DEMO_SESSION_SECRET;
  if (!secret) return json({ ok: false, error: "Pitch session storage is not configured." }, 503);

  try {
    const store = await import("@/lib/demo/store");
    await store.pruneExpiredDemoSessions();
    let demoCode = randomDemoCode();
    for (let attempt = 0; attempt < 8 && await store.demoCodeExists(demoCode); attempt += 1) demoCode = randomDemoCode();
    const token = randomToken();
    const now = Date.now();
    const session = await store.createDemoSession({
      id: crypto.randomUUID(),
      accessTokenHash: await sha256(token),
      demoCode,
      scenario: parsed.data.scenario,
      provider: process.env.DEMO_PROVIDER === "vapi" ? "vapi" : "sandbox",
      mode: "pitch",
      profile: parsed.data,
      clientHash: await sha256(`${secret}:pitch`),
      now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });
    return json({ ok: true, session, accessToken: token }, 201);
  } catch {
    if (process.env.DEMO_PROVIDER !== "vapi") {
      const now = new Date();
      return json({
        ok: true,
        session: {
          id: crypto.randomUUID(),
          demoCode: randomDemoCode(),
          scenario: parsed.data.scenario,
          mode: "pitch",
          status: "ready",
          provider: "sandbox",
          profileSnapshot: parsed.data,
          receipt: null,
          transcript: null,
          receiptProvenance: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        accessToken: randomToken(),
        durable: false,
      }, 201);
    }
    return json({ ok: false, error: "Pitch session could not start." }, 503);
  }
}
