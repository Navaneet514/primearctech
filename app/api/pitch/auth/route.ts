import { z } from "zod";
import { makePitchToken, pitchAuthorized, PITCH_COOKIE } from "@/lib/pitch-auth";
import { safeEqual } from "@/lib/demo/security";

export const runtime = "edge";

const bodySchema = z.object({ password: z.string().min(1).max(256) }).strict();

function response(body: unknown, status: number, cookie?: string) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (cookie) headers.set("Set-Cookie", cookie);
  return Response.json(body, { status, headers });
}

export async function POST(request: Request) {
  const expected = process.env.PITCH_ACCESS_SECRET;
  if (!expected) return response({ ok: false, error: "Pitch access is not configured." }, 503);
  let raw: unknown;
  try { raw = await request.json(); } catch { return response({ ok: false, error: "Invalid request." }, 400); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success || !safeEqual(expected, parsed.data.password)) return response({ ok: false, error: "Incorrect presenter password." }, 401);
  const token = await makePitchToken(expected);
  return response({ ok: true }, 200, `${PITCH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`);
}

export async function GET(request: Request) {
  return response({ ok: true, authenticated: await pitchAuthorized(request) }, 200);
}

export async function DELETE() {
  return response({ ok: true }, 200, `${PITCH_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
}
