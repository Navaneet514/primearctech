import { createDemoSessionSchema, runDemoSessionSchema } from "@/lib/demo/schema";
import { getDemoScenario } from "@/lib/demo/scenarios";
import { bearerToken, randomToken, safeEqual, sha256 } from "@/lib/demo/security";
import type { DemoScenarioId, DemoSession } from "@/lib/demo/types";

export const runtime = "edge";

type SandboxClaim = {
  id: string;
  demoCode: string;
  scenario: DemoScenarioId;
  issuedAt: number;
  expiresAt: number;
};

const encoder = new TextEncoder();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function sessionSecret() {
  return process.env.DEMO_SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "fieldrelay-local-demo-only" : null);
}

function encodeBase64Url(value: string) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signClaim(claim: SandboxClaim, secret: string) {
  const body = encodeBase64Url(JSON.stringify(claim));
  return `${body}.${await hmac(secret, body)}`;
}

async function verifyClaim(token: string | null, secret: string) {
  if (!token) return null;
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length || !safeEqual(signature, await hmac(secret, body))) return null;
  try {
    const claim = JSON.parse(decodeBase64Url(body)) as SandboxClaim;
    if (!claim.id || !claim.demoCode || !claim.scenario || claim.expiresAt <= Date.now()) return null;
    return claim;
  } catch {
    return null;
  }
}

function sandboxSession(claim: SandboxClaim, completed = false): DemoSession {
  const scenario = getDemoScenario(claim.scenario);
  return {
    id: claim.id,
    demoCode: claim.demoCode,
    scenario: claim.scenario,
    status: completed ? "completed" : "ready",
    provider: "sandbox",
    mode: "public",
    receipt: completed ? scenario.receipt : null,
    transcript: completed ? scenario.transcript : null,
    receiptProvenance: completed ? "sandbox" : null,
    createdAt: new Date(claim.issuedAt).toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(claim.expiresAt).toISOString(),
  };
}

function randomDemoCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

async function createLiveSession(request: Request, scenario: DemoScenarioId, secret: string) {
  const store = await import("@/lib/demo/store");
  await store.pruneExpiredDemoSessions();
  const now = Date.now();
  const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const clientHash = await sha256(`${secret}:${address.trim()}`);
  if ((await store.recentSessionCount(clientHash, now - 3_600_000)) >= 12) {
    return json({ ok: false, error: "Demo limit reached. Try again later." }, 429);
  }

  let demoCode = randomDemoCode();
  for (let attempt = 0; attempt < 8 && await store.demoCodeExists(demoCode); attempt += 1) demoCode = randomDemoCode();
  const token = randomToken();
  const session = await store.createDemoSession({
    id: crypto.randomUUID(),
    accessTokenHash: await sha256(token),
    demoCode,
    scenario,
    provider: "vapi",
    mode: "public",
    clientHash,
    now,
    expiresAt: now + 2 * 60 * 60 * 1000,
  });
  return json({ ok: true, session, accessToken: token }, 201);
}

export async function POST(request: Request) {
  const secret = sessionSecret();
  if (!secret) return json({ ok: false, error: "Demo session service is not configured." }, 503);
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON payload." }, 400); }
  const parsed = createDemoSessionSchema.safeParse(raw);
  if (!parsed.success) return json({ ok: false, error: "Choose a valid scenario." }, 400);

  try {
    if (process.env.DEMO_PROVIDER === "vapi") return await createLiveSession(request, parsed.data.scenario, secret);
    const now = Date.now();
    const claim: SandboxClaim = {
      id: crypto.randomUUID(),
      demoCode: randomDemoCode(),
      scenario: parsed.data.scenario,
      issuedAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
    };
    return json({ ok: true, session: sandboxSession(claim), accessToken: await signClaim(claim, secret) }, 201);
  } catch {
    return json({ ok: false, error: "Demo session could not start." }, 503);
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const secret = sessionSecret();
  const token = bearerToken(request);
  if (!id || !secret || !token) return json({ ok: false, error: "Session not found." }, 404);

  if (process.env.DEMO_PROVIDER !== "vapi") {
    const claim = await verifyClaim(token, secret);
    return claim && claim.id === id ? json({ ok: true, session: sandboxSession(claim) }) : json({ ok: false, error: "Session not found." }, 404);
  }

  const store = await import("@/lib/demo/store");
  const row = await store.getPrivateDemoSessionById(id);
  const tokenHash = await sha256(token);
  if (!row || row.expires_at <= Date.now() || !safeEqual(row.access_token_hash, tokenHash)) return json({ ok: false, error: "Session not found." }, 404);
  return json({ ok: true, session: await store.getDemoSessionById(id) });
}

export async function PATCH(request: Request) {
  const secret = sessionSecret();
  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON payload." }, 400); }
  const parsed = runDemoSessionSchema.safeParse(raw);
  if (!parsed.success || !secret) return json({ ok: false, error: "Session not found." }, 404);
  if (process.env.DEMO_PROVIDER === "vapi") return json({ ok: false, error: "Call live number and enter demo code." }, 409);

  const claim = await verifyClaim(bearerToken(request), secret);
  if (!claim || claim.id !== parsed.data.id) return json({ ok: false, error: "Session not found." }, 404);
  return json({ ok: true, session: sandboxSession(claim, true) });
}
