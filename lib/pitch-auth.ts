import { safeEqual } from "./demo/security";

const encoder = new TextEncoder();
export const PITCH_COOKIE = "primearc_pitch";

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function makePitchToken(secret: string, expiresAt = Date.now() + 8 * 60 * 60 * 1000) {
  const claim = String(expiresAt);
  return `${claim}.${await hmac(secret, claim)}`;
}

export async function verifyPitchToken(token: string | null, secret: string) {
  if (!token) return false;
  const [expiresAt, supplied, extra] = token.split(".");
  if (extra || !expiresAt || !supplied || Number(expiresAt) <= Date.now()) return false;
  return safeEqual(await hmac(secret, expiresAt), supplied);
}

export function cookieValue(request: Request, name: string) {
  const match = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function pitchAuthorized(request: Request) {
  const secret = process.env.PITCH_ACCESS_SECRET;
  return Boolean(secret && await verifyPitchToken(cookieValue(request, PITCH_COOKIE), secret));
}
