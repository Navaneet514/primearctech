import { getD1 } from "@/db";
import type { DemoMode, DemoReceipt, DemoScenarioId, DemoSession, DemoSessionStatus, DemoTranscriptLine, PitchProfile, ReceiptProvenance } from "./types";

type DemoRow = {
  id: string;
  access_token_hash: string;
  demo_code: string;
  scenario: DemoScenarioId;
  status: DemoSessionStatus;
  provider: "sandbox" | "vapi";
  mode: DemoMode;
  profile_json: string | null;
  provider_call_id: string | null;
  client_hash: string;
  receipt_json: string | null;
  transcript_json: string | null;
  receipt_provenance: ReceiptProvenance | null;
  failure_code: string | null;
  created_at: number;
  updated_at: number;
  expires_at: number;
};

let schemaReady = false;

export async function ensureDemoSchema() {
  if (schemaReady) return;
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS demo_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      access_token_hash TEXT NOT NULL,
      demo_code TEXT NOT NULL UNIQUE,
      scenario TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'public',
      profile_json TEXT,
      provider_call_id TEXT UNIQUE,
      client_hash TEXT NOT NULL,
      receipt_json TEXT,
      transcript_json TEXT,
      receipt_provenance TEXT,
      failure_code TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_demo_sessions_code ON demo_sessions(demo_code)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_demo_sessions_client_created ON demo_sessions(client_hash, created_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_demo_sessions_expires ON demo_sessions(expires_at)"),
  ]);
  const columns = await db.prepare("PRAGMA table_info(demo_sessions)").all<{ name: string }>();
  const names = new Set((columns.results ?? []).map((column) => column.name));
  const upgrades = [
    ["mode", "ALTER TABLE demo_sessions ADD COLUMN mode TEXT NOT NULL DEFAULT 'public'"],
    ["profile_json", "ALTER TABLE demo_sessions ADD COLUMN profile_json TEXT"],
    ["receipt_provenance", "ALTER TABLE demo_sessions ADD COLUMN receipt_provenance TEXT"],
    ["failure_code", "ALTER TABLE demo_sessions ADD COLUMN failure_code TEXT"],
  ] as const;
  for (const [name, statement] of upgrades) if (!names.has(name)) await db.prepare(statement).run();
  schemaReady = true;
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function publicSession(row: DemoRow): DemoSession {
  return {
    id: row.id,
    demoCode: row.demo_code,
    scenario: row.scenario,
    status: row.status,
    provider: row.provider,
    mode: row.mode || "public",
    profileSnapshot: parseJson<PitchProfile>(row.profile_json) ?? undefined,
    receipt: parseJson<DemoReceipt>(row.receipt_json),
    transcript: parseJson<DemoTranscriptLine[]>(row.transcript_json),
    receiptProvenance: row.receipt_provenance,
    failureCode: row.failure_code,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

export async function recentSessionCount(clientHash: string, since: number) {
  await ensureDemoSchema();
  const result = await getD1()
    .prepare("SELECT COUNT(*) AS count FROM demo_sessions WHERE client_hash = ? AND created_at >= ?")
    .bind(clientHash, since)
    .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function demoCodeExists(code: string) {
  await ensureDemoSchema();
  const row = await getD1().prepare("SELECT id FROM demo_sessions WHERE demo_code = ? LIMIT 1").bind(code).first();
  return Boolean(row);
}

export async function createDemoSession(input: {
  id: string;
  accessTokenHash: string;
  demoCode: string;
  scenario: DemoScenarioId;
  provider: "sandbox" | "vapi";
  mode?: DemoMode;
  profile?: PitchProfile;
  clientHash: string;
  now: number;
  expiresAt: number;
}) {
  await ensureDemoSchema();
  await getD1().prepare(`INSERT INTO demo_sessions (
    id, access_token_hash, demo_code, scenario, status, provider, mode, profile_json, client_hash, created_at, updated_at, expires_at
  ) VALUES (?, ?, ?, ?, 'ready', ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(input.id, input.accessTokenHash, input.demoCode, input.scenario, input.provider, input.mode ?? "public", input.profile ? JSON.stringify(input.profile) : null, input.clientHash, input.now, input.now, input.expiresAt)
    .run();
  return getDemoSessionById(input.id);
}

export async function getDemoSessionById(id: string) {
  await ensureDemoSchema();
  const row = await getD1().prepare("SELECT * FROM demo_sessions WHERE id = ? LIMIT 1").bind(id).first<DemoRow>();
  return row ? publicSession(row) : null;
}

export async function getPrivateDemoSessionById(id: string) {
  await ensureDemoSchema();
  return getD1().prepare("SELECT * FROM demo_sessions WHERE id = ? LIMIT 1").bind(id).first<DemoRow>();
}

export async function getDemoSessionByCode(code: string) {
  await ensureDemoSchema();
  return getD1().prepare("SELECT * FROM demo_sessions WHERE demo_code = ? AND expires_at > ? LIMIT 1")
    .bind(code, Date.now())
    .first<DemoRow>();
}

export async function getDemoSessionByProviderCallId(callId: string) {
  await ensureDemoSchema();
  return getD1().prepare("SELECT * FROM demo_sessions WHERE provider_call_id = ? LIMIT 1").bind(callId).first<DemoRow>();
}

export async function attachProviderCall(id: string, callId: string) {
  await ensureDemoSchema();
  await getD1().prepare("UPDATE demo_sessions SET provider_call_id = ?, status = 'in-progress', updated_at = ? WHERE id = ?")
    .bind(callId, Date.now(), id)
    .run();
}

export async function completeDemoSession(id: string, receipt: DemoReceipt, transcript: DemoTranscriptLine[], provenance: ReceiptProvenance = "provider") {
  await ensureDemoSchema();
  await getD1().prepare("UPDATE demo_sessions SET status = 'completed', receipt_json = ?, transcript_json = ?, receipt_provenance = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(receipt), JSON.stringify(transcript), provenance, Date.now(), id)
    .run();
  return getDemoSessionById(id);
}

export async function pruneExpiredDemoSessions() {
  await ensureDemoSchema();
  await getD1().prepare("DELETE FROM demo_sessions WHERE expires_at < ?").bind(Date.now() - 86_400_000).run();
}
