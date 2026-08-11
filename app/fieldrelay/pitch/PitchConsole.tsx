"use client";

import { ArrowLeft, ArrowsOut, Check, ClipboardText, LockKey, Microphone, SignOut, Stop, Waveform } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import * as VapiModule from "@vapi-ai/web";
import type Vapi from "@vapi-ai/web";
import { getDemoScenario } from "@/lib/demo/scenarios";
import type { DemoReceipt, DemoScenarioId, DemoTranscriptLine, PitchProfile, ReceiptProvenance } from "@/lib/demo/types";

type Props = { publicKey: string | null; assistantId: string | null; webVoiceEnabled: boolean };
type CallState = "idle" | "connecting" | "live" | "sample" | "complete" | "error";

function createVapiClient(publicKey: string) {
  const first = (VapiModule as unknown as { default?: unknown }).default ?? VapiModule;
  const constructor = typeof first === "function" ? first : (first as { default?: unknown })?.default;
  if (typeof constructor !== "function") throw new Error("Voice provider did not initialize.");
  return new (constructor as new (token: string) => Vapi)(publicKey);
}

export function PitchConsole({ publicKey, assistantId, webVoiceEnabled }: Props) {
  const [auth, setAuth] = useState<"checking" | "locked" | "ready">("checking");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState<PitchProfile>({ companyName: "Prospect Home Services", trades: ["hvac"], serviceAreaZips: ["78701", "78704"], provisionalWindows: ["Tomorrow, 9-11 AM"], escalationLabel: "On-call manager", scenario: "routine" });
  const [zipText, setZipText] = useState("78701, 78704");
  const [state, setState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<DemoTranscriptLine[]>([]);
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);
  const [provenance, setProvenance] = useState<ReceiptProvenance | null>(null);
  const [error, setError] = useState("");
  const [prospectView, setProspectView] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const runRef = useRef(0);

  useEffect(() => { void fetch("/api/pitch/auth", { cache: "no-store" }).then((res) => res.json()).then((data) => setAuth(data.authenticated ? "ready" : "locked")).catch(() => setAuth("locked")); }, []);
  useEffect(() => () => { runRef.current += 1; window.speechSynthesis?.cancel(); void vapiRef.current?.stop(); }, []);

  async function authenticate(event: FormEvent) {
    event.preventDefault(); setAuthError("");
    const response = await fetch("/api/pitch/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) return setAuthError(data.error || "Access denied.");
    setPassword(""); setAuth("ready");
  }

  async function logout() { await fetch("/api/pitch/auth", { method: "DELETE" }); stop(); setAuth("locked"); }
  function update<K extends keyof PitchProfile>(key: K, value: PitchProfile[K]) { setProfile((current) => ({ ...current, [key]: value })); }
  function reset(scenario: DemoScenarioId = profile.scenario) { runRef.current += 1; window.speechSynthesis?.cancel(); void vapiRef.current?.stop(); vapiRef.current = null; update("scenario", scenario); setState("idle"); setTranscript([]); setReceipt(null); setProvenance(null); setError(""); }
  function stop() { runRef.current += 1; window.speechSynthesis?.cancel(); void vapiRef.current?.stop(); vapiRef.current = null; if (state === "sample") { setReceipt(getDemoScenario(profile.scenario).receipt); setProvenance("illustrative"); setState("complete"); } else setState("idle"); }

  async function playScripted(run: number) {
    const scenario = getDemoScenario(profile.scenario);
    setState("sample");
    for (const line of scenario.transcript) {
      if (run !== runRef.current) return;
      setTranscript((current) => [...current, line]);
      if (line.speaker === "system") { await new Promise((resolve) => setTimeout(resolve, 300)); continue; }
      if ("speechSynthesis" in window) await new Promise<void>((resolve) => { const speech = new SpeechSynthesisUtterance(line.text); speech.rate = 1.08; speech.onend = () => resolve(); speech.onerror = () => resolve(); window.speechSynthesis.speak(speech); setTimeout(resolve, 4500); });
    }
    if (run !== runRef.current) return;
    setReceipt(scenario.receipt); setProvenance("illustrative"); setState("complete");
  }

  async function start() {
    reset(profile.scenario); setState("connecting"); setZipText(profile.serviceAreaZips.join(", "));
    try {
      const response = await fetch("/api/pitch/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pitch session could not start.");
      const run = ++runRef.current;
      if (!webVoiceEnabled || !publicKey || !assistantId) return await playScripted(run);
      const vapi = createVapiClient(publicKey); vapiRef.current = vapi; const startedAt = Date.now();
      vapi.on("call-start", () => setState("live"));
      vapi.on("message", (value: unknown) => { if (!value || typeof value !== "object") return; const event = value as Record<string, unknown>; if (event.type !== "transcript" || event.transcriptType !== "final" || typeof event.transcript !== "string") return; setTranscript((current) => [...current, { speaker: event.role === "user" ? "caller" : "fieldrelay", text: event.transcript as string, atSeconds: Math.round((Date.now() - startedAt) / 1000) }]); });
      vapi.on("error", () => { setError("Provider connection failed. No external action occurred."); setState("error"); });
      vapi.on("call-end", () => { setReceipt(getDemoScenario(profile.scenario).receipt); setProvenance("illustrative"); setState("complete"); });
      await vapi.start(assistantId, { variableValues: { demoCode: data.session.demoCode, contractorName: profile.companyName, trade: profile.trades.join(" and "), supportedZips: profile.serviceAreaZips.join(","), provisionalWindows: profile.provisionalWindows.join(" | "), scenario: profile.scenario, escalationDisplayName: profile.escalationLabel }, maxDurationSeconds: 180, backgroundSound: "off" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Pitch demo failed safely."); setState("error"); }
  }

  if (auth === "checking") return <main className="pitch-auth"><p>Checking private pitch access…</p></main>;
  if (auth === "locked") return <main className="pitch-auth"><form onSubmit={authenticate}><LockKey aria-hidden="true" weight="duotone" /><p>Private pitch sandbox</p><h1>Presenter access</h1><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button type="submit">Unlock console</button>{authError ? <p role="alert">{authError}</p> : null}<a href="/fieldrelay"><ArrowLeft aria-hidden="true" />Return to FieldRelay</a></form></main>;

  const scenario = getDemoScenario(profile.scenario);
  return <main className={`pitch-page ${prospectView ? "is-prospect" : ""}`}>
    <header className="pitch-header"><div><a href="/fieldrelay">FieldRelay <span>by PrimeArcTech</span></a><strong>Private pitch sandbox</strong></div><div><button onClick={() => setProspectView((value) => !value)}><ArrowsOut aria-hidden="true" />{prospectView ? "Exit prospect view" : "Prospect view"}</button><button onClick={logout}><SignOut aria-hidden="true" />Logout</button></div></header>
    <section className="pitch-layout">
      <aside className="pitch-config"><p className="prime-label">Prospect configuration</p><h2>Shape the sandbox.</h2><label>Company name<input value={profile.companyName} onChange={(e) => update("companyName", e.target.value)} maxLength={80} /></label><fieldset><legend>Trades</legend>{(["hvac", "plumbing"] as const).map((trade) => <label key={trade}><input type="checkbox" checked={profile.trades.includes(trade)} onChange={() => update("trades", profile.trades.includes(trade) ? profile.trades.filter((item) => item !== trade) : [...profile.trades, trade])} />{trade.toUpperCase()}</label>)}</fieldset><label>Service ZIPs<input value={zipText} onChange={(e) => { setZipText(e.target.value); update("serviceAreaZips", e.target.value.split(",").map((zip) => zip.trim()).filter(Boolean).slice(0, 20)); }} /><small>Comma separated. Maximum 20.</small></label><label>Provisional window<input value={profile.provisionalWindows[0] || ""} onChange={(e) => update("provisionalWindows", e.target.value ? [e.target.value] : [])} maxLength={60} /></label><label>Escalation display name<input value={profile.escalationLabel} onChange={(e) => update("escalationLabel", e.target.value)} maxLength={50} /></label><label>Scenario<select value={profile.scenario} onChange={(e) => reset(e.target.value as DemoScenarioId)}><option value="routine">Routine</option><option value="emergency">Emergency</option><option value="boundary">Boundary</option></select></label></aside>
      <section className="pitch-instrument"><div className="pitch-company"><span>{profile.companyName}</span><small>Fictional prospect configuration</small></div><div className={`pitch-orb ${["live", "sample"].includes(state) ? "is-live" : ""}`}><Waveform aria-hidden="true" weight="fill" /></div><p className="pitch-state">{state === "idle" ? scenario.prompt : state === "connecting" ? "Connecting safely…" : state === "live" ? "Live browser call" : state === "sample" ? "Audible scripted fallback" : state === "complete" ? "Call complete" : "Stopped safely"}</p><div className="pitch-caption" aria-live="polite"><span>{transcript.at(-1)?.speaker || "Ready"}</span><p>{transcript.at(-1)?.text || "Start one fictional, adversarial home-service call."}</p></div><div className="pitch-controls">{["live", "sample", "connecting"].includes(state) ? <button onClick={stop}><Stop aria-hidden="true" />Stop call</button> : <button onClick={start}><Microphone aria-hidden="true" />Start call</button>}<button onClick={() => reset(profile.scenario)}>Reset scenario</button></div><p className="pitch-disclosure">AI demonstration. Fictional data only. No booking, dispatch, transfer, or CRM write.</p></section>
      <aside className="pitch-receipt"><div className="pitch-receipt-head"><p className="prime-label">Dispatcher receipt</p><span>{provenance || "pending"}</span></div>{receipt ? <><h2>{receipt.outcome}</h2><dl><div><dt>Company</dt><dd>{profile.companyName}</dd></div><div><dt>Decision</dt><dd>{receipt.decision}</dd></div><div><dt>Service area</dt><dd>{receipt.serviceArea}</dd></div><div><dt>Urgency</dt><dd>{receipt.urgency}</dd></div></dl><p>{receipt.dispatcherSummary}</p><div className="pitch-policy-events">{receipt.safeguards.map((item) => <span key={item}><Check aria-hidden="true" />{item}</span>)}</div><button onClick={() => void navigator.clipboard.writeText(`${profile.companyName}: ${receipt.dispatcherSummary}`)}><ClipboardText aria-hidden="true" />Copy dispatcher summary</button></> : <div className="pitch-receipt-empty"><p>Transcript, policy events, and a provisional receipt appear here after the call.</p></div>}{error ? <p className="pitch-error" role="alert">{error}</p> : null}</aside>
    </section>
  </main>;
}
