"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- full document navigation must remain reliable during active voice sessions. */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Microphone,
  PhoneCall,
  Play,
  ShieldCheck,
  SpeakerHigh,
  Stop,
  Warning,
  Waveform,
} from "@phosphor-icons/react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as VapiModule from "@vapi-ai/web";
import type Vapi from "@vapi-ai/web";
import { DEMO_SCENARIOS, getDemoScenario } from "@/lib/demo/scenarios";
import type { DemoReceipt, DemoScenarioId, DemoSession, DemoTranscriptLine, ReceiptProvenance } from "@/lib/demo/types";
import { trackFunnelEvent } from "@/lib/analytics";

type DemoExperienceProps = {
  webVoiceEnabled: boolean;
  publicKey: string | null;
  assistantId: string | null;
  livePhoneNumber: string | null;
};

type VoiceState = "idle" | "connecting" | "sample" | "live" | "processing" | "complete" | "error";

async function demoRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  const body = await response.json() as { ok: boolean; error?: string; session?: DemoSession; accessToken?: string };
  if (!response.ok || !body.ok) throw new Error(body.error || "Demo request failed.");
  return body;
}

function isFinalTranscript(message: Record<string, unknown>) {
  return message.type === "transcript" && (message.transcriptType === "final" || message.transcriptType === undefined);
}

function createVapiClient(publicKey: string) {
  const first = (VapiModule as unknown as { default?: unknown }).default ?? VapiModule;
  const constructor = typeof first === "function" ? first : (first as { default?: unknown })?.default;
  if (typeof constructor !== "function") throw new Error("Voice provider did not initialize.");
  return new (constructor as new (token: string) => Vapi)(publicKey);
}

export function DemoExperience({ webVoiceEnabled, publicKey, assistantId, livePhoneNumber }: DemoExperienceProps) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<DemoScenarioId>("routine");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [caption, setCaption] = useState<DemoTranscriptLine | null>(null);
  const [transcript, setTranscript] = useState<DemoTranscriptLine[]>([]);
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null);
  const [provenance, setProvenance] = useState<ReceiptProvenance | null>(null);
  const [error, setError] = useState("");
  const playbackId = useRef(0);
  const vapiRef = useRef<Vapi | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const remoteVolume = useMotionValue(0);
  const localVolume = useMotionValue(0);
  const combinedVolume = useTransform([remoteVolume, localVolume], ([remote, local]) => Math.max(Number(remote), Number(local)));
  const ringScale = useSpring(useTransform(combinedVolume, [0, 1], [1, 1.08]), { stiffness: 240, damping: 24 });
  const scenario = getDemoScenario(selected);

  useEffect(() => () => {
    playbackId.current += 1;
    window.speechSynthesis?.cancel();
    void vapiRef.current?.stop();
    void audioContextRef.current?.close();
  }, []);

  function reset(id = selected) {
    playbackId.current += 1;
    window.speechSynthesis?.cancel();
    void vapiRef.current?.stop();
    vapiRef.current = null;
    setSelected(id);
    setVoiceState("idle");
    setCaption(null);
    setTranscript([]);
    setReceipt(null);
    setProvenance(null);
    setError("");
    remoteVolume.set(0);
    localVolume.set(0);
  }

  function playPolicyTone() {
    try {
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 520;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      // Audio tone is enhancement only. Voice playback continues.
    }
  }

  function chooseVoice(speaker: "caller" | "fieldrelay") {
    const voices = window.speechSynthesis?.getVoices() || [];
    const agentNames = ["Aria", "Samantha", "Google US English", "Zira"];
    const callerNames = ["Guy", "Daniel", "David", "Google UK English Male"];
    const names = speaker === "fieldrelay" ? agentNames : callerNames;
    return names.map((name) => voices.find((voice) => voice.name.includes(name))).find(Boolean) || voices.find((voice) => voice.lang.startsWith("en-US"));
  }

  async function speakLine(line: DemoTranscriptLine, runId: number) {
    if (runId !== playbackId.current) return;
    setCaption(line);
    setTranscript((current) => [...current, line]);

    if (line.speaker === "system") {
      playPolicyTone();
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 80 : 620));
      return;
    }

    if (!("speechSynthesis" in window)) {
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 80 : 1200));
      return;
    }

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.voice = chooseVoice(line.speaker) || null;
      utterance.rate = line.speaker === "fieldrelay" ? 1.02 : 1.06;
      utterance.pitch = line.speaker === "fieldrelay" ? 1.04 : 0.91;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
      window.setTimeout(finish, Math.min(5200, 700 + line.text.split(/\s+/).length * 210));
    });
  }

  async function createSession() {
    const created = await demoRequest("/api/demo/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: selected }),
    });
    if (!created.session || !created.accessToken) throw new Error("Voice session did not initialize.");
    return { session: created.session, token: created.accessToken };
  }

  async function playSample() {
    if (voiceState !== "idle" && voiceState !== "complete" && voiceState !== "error") return;
    reset(selected);
    setVoiceState("connecting");
    const runId = playbackId.current;
    try {
      trackFunnelEvent("demo_started", { scenario: selected, mode: "illustrative" });
      setVoiceState("sample");
      for (const line of scenario.transcript) {
        if (runId !== playbackId.current) return;
        await speakLine(line, runId);
      }
      setReceipt(scenario.receipt);
      setProvenance("illustrative");
      setVoiceState("complete");
      trackFunnelEvent("demo_completed", { scenario: selected, provenance: "illustrative" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sample call could not start.");
      setVoiceState("error");
    }
  }

  async function refreshLiveReceipt(id: string, token: string) {
    for (let attempt = 0; attempt < 7; attempt += 1) {
      try {
        const result = await demoRequest(`/api/demo/session?id=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (result.session?.status === "completed") {
          setReceipt(result.session.receipt);
          setProvenance(result.session.receiptProvenance || (result.session.provider === "vapi" ? "provider" : "sandbox"));
          if (result.session.transcript) setTranscript(result.session.transcript);
          setVoiceState("complete");
          return;
        }
      } catch {
        break;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
    }
    setReceipt(scenario.receipt);
    setProvenance("illustrative");
    setVoiceState("complete");
  }

  async function startLiveVoice() {
    if (!webVoiceEnabled || !publicKey || !assistantId) return;
    reset(selected);
    setVoiceState("connecting");
    try {
      trackFunnelEvent("demo_started", { scenario: selected, mode: "public" });
      const startedAt = Date.now();
      let durableSession: Awaited<ReturnType<typeof createSession>> | null = null;
      try {
        durableSession = await createSession();
      } catch {
        // Browser voice must remain usable before durable storage/webhooks are deployed.
      }
      const demoCode = durableSession?.session.demoCode || String(100000 + Math.floor(Math.random() * 900000));
      const vapi = createVapiClient(publicKey);
      vapiRef.current = vapi;
      vapi.on("call-start", () => { setVoiceState("live"); trackFunnelEvent("demo_connected", { scenario: selected }); });
      vapi.on("volume-level", (level) => remoteVolume.set(level));
      vapi.on("local-volume-level", (level) => localVolume.set(level));
      vapi.on("message", (message: unknown) => {
        if (!message || typeof message !== "object") return;
        const event = message as Record<string, unknown>;
        if (!isFinalTranscript(event) || typeof event.transcript !== "string") return;
        const line: DemoTranscriptLine = {
          speaker: event.role === "user" ? "caller" : "fieldrelay",
          text: event.transcript,
          atSeconds: Math.round((Date.now() - startedAt) / 1000),
        };
        setCaption(line);
        setTranscript((current) => [...current, line]);
      });
      vapi.on("error", () => {
        setError("Voice connection failed cleanly. No booking was created.");
        setVoiceState("error");
      });
      vapi.on("call-end", () => {
        remoteVolume.set(0);
        localVolume.set(0);
        setVoiceState("processing");
        if (durableSession) {
          void refreshLiveReceipt(durableSession.session.id, durableSession.token);
        } else {
          setReceipt(scenario.receipt);
          setProvenance("illustrative");
          setVoiceState("complete");
        }
        trackFunnelEvent("demo_completed", { scenario: selected, provenance: durableSession ? "provider" : "illustrative" });
      });
      await vapi.start(assistantId, {
        variableValues: {
          demoCode,
          scenario: selected,
          callerInstruction: scenario.prompt,
          sessionMode: durableSession ? "durable" : "stateless",
        },
        maxDurationSeconds: 180,
        backgroundSound: "off",
      });
    } catch (caught) {
      const denied = caught instanceof DOMException && (caught.name === "NotAllowedError" || caught.name === "PermissionDeniedError");
      setError(denied ? "Microphone permission was denied. Use Hear sample for the audible scripted fallback." : caught instanceof Error ? caught.message : "Microphone or provider connection failed.");
      setVoiceState("error");
    }
  }

  function stopVoice() {
    playbackId.current += 1;
    window.speechSynthesis?.cancel();
    void vapiRef.current?.stop();
    vapiRef.current = null;
    remoteVolume.set(0);
    localVolume.set(0);
    if (voiceState === "sample") {
      setReceipt(scenario.receipt);
      setProvenance("illustrative");
      setVoiceState("complete");
    } else if (voiceState === "live") {
      setVoiceState("processing");
    } else {
      setVoiceState("idle");
    }
  }

  const active = ["connecting", "sample", "live", "processing"].includes(voiceState);
  const currentSpeaker = caption?.speaker === "fieldrelay" ? "FieldRelay" : caption?.speaker === "caller" ? "Homeowner" : "Policy engine";

  return (
    <main className="voice-demo-page">
      <header className="demo-nav shell">
        <a href="/" className="demo-brand" aria-label="PrimeArcTech homepage"><span>PrimeArcTech</span><small>FieldRelay voice lab</small></a>
        <div className="voice-nav-mode"><SpeakerHigh aria-hidden="true" />Audio demo</div>
        <a href="/fieldrelay" className="demo-back"><ArrowLeft aria-hidden="true" />Back to FieldRelay</a>
      </header>

      <section className="voice-hero">
        <div className="voice-hero-image" aria-hidden="true">
          <Image src="/fieldrelay/01-hero.webp" alt="" fill priority sizes="100vw" />
        </div>
        <div className="voice-hero-scrim" aria-hidden="true" />
        <div className="shell voice-hero-shell">
          <div className="voice-hero-copy">
            <p className="context-label">Hear the recovery layer</p>
            <h1>Hear it.<br />Try to break it.</h1>
            <p>Hear FieldRelay qualify, protect boundaries, and route one home-service call.</p>
          </div>

          <div className="voice-instrument" aria-label="Voice demo player">
            <div className="voice-instrument-topline">
              <span>{webVoiceEnabled ? "Browser voice ready" : "Audible sample ready"}</span>
              <span>{scenario.label}</span>
            </div>
            <div className="voice-visual">
              <motion.div className={`voice-dial ${active ? "is-active" : ""}`} style={{ scale: ringScale }}>
                <div className="voice-dial-core">
                  {voiceState === "live" ? <Microphone aria-hidden="true" weight="fill" /> : <Waveform aria-hidden="true" weight="fill" />}
                </div>
              </motion.div>
              <div className={`voice-bars ${active ? "is-active" : ""}`} aria-hidden="true">
                {Array.from({ length: 19 }, (_, index) => <span key={index} style={{ "--bar": index } as React.CSSProperties} />)}
              </div>
            </div>

            <div className="voice-caption" aria-live="polite">
              <span>{caption ? currentSpeaker : "Try this"}</span>
              <p>{caption?.text || scenario.prompt}</p>
            </div>

            <div className="voice-controls">
              {!active ? (
                <>
                  <button type="button" className="voice-primary-control" onClick={webVoiceEnabled ? startLiveVoice : playSample}>
                    {webVoiceEnabled ? <Microphone aria-hidden="true" weight="fill" /> : <Play aria-hidden="true" weight="fill" />}
                    {webVoiceEnabled ? "Talk to FieldRelay" : "Hear sample call"}
                  </button>
                  {webVoiceEnabled ? <button type="button" className="voice-secondary-control" onClick={playSample}><SpeakerHigh aria-hidden="true" />Hear sample</button> : null}
                </>
              ) : (
                <button type="button" className="voice-stop-control" onClick={stopVoice}><Stop aria-hidden="true" weight="fill" />Stop</button>
              )}
            </div>
            <p className="voice-demo-disclosure">AI demonstration. Use fictional information only. No booking, dispatch, transfer, or CRM write is executed.</p>
          </div>
        </div>
      </section>

      <section className="voice-scenario-band" aria-label="Choose call test">
        <div className="shell voice-scenario-grid">
          {Object.values(DEMO_SCENARIOS).map((item) => (
            <button key={item.id} type="button" className={selected === item.id ? "is-selected" : ""} onClick={() => { reset(item.id); trackFunnelEvent("demo_scenario_selected", { scenario: item.id }); }} aria-pressed={selected === item.id}>
              <span>{item.label}</span><strong>{item.title}</strong><small>{item.test}</small><ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="voice-proof shell">
        <div className="voice-proof-heading">
          <h2>Conversation in. Decision out.</h2>
        </div>
        <div className="voice-proof-stage">
          <div className="voice-proof-transcript">
            {transcript.length ? transcript.slice(-4).map((line, index) => (
              <div key={`${line.atSeconds}-${index}`} className={line.speaker}>
                <span>{line.speaker === "fieldrelay" ? "FieldRelay" : line.speaker === "caller" ? "Caller" : "Policy"}</span>
                <p>{line.text}</p>
              </div>
            )) : (
              <div className="voice-proof-empty"><SpeakerHigh aria-hidden="true" /><p>Play call. Voice and policy actions land here.</p></div>
            )}
          </div>
          <div className={`voice-receipt-panel ${receipt ? "is-ready" : ""}`}>
            {!receipt ? (
              <div className="voice-proof-empty"><ShieldCheck aria-hidden="true" /><p>Receipt appears when call ends.</p></div>
            ) : (
              <>
                <div className="voice-receipt-outcome"><CheckCircle aria-hidden="true" weight="fill" /><span>Outcome · {provenance === "provider" ? "Provider" : provenance === "sandbox" ? "Sandbox" : "Illustrative fallback"}</span><strong>{receipt.outcome}</strong></div>
                <div className="voice-receipt-summary"><span>Dispatch brief</span><p>{receipt.dispatcherSummary}</p></div>
                <div className="voice-receipt-rules">{receipt.safeguards.map((rule) => <p key={rule}><Check aria-hidden="true" />{rule}</p>)}</div>
              </>
            )}
          </div>
        </div>
        {error ? <div className="voice-error" role="alert"><Warning aria-hidden="true" />{error}</div> : null}
      </section>

      <section className="voice-live-strip">
        <div className="shell voice-live-inner">
          <div>
            <PhoneCall aria-hidden="true" weight="duotone" />
            <span>{webVoiceEnabled ? "Live browser conversation enabled" : "Next connection"}</span>
            <h2>{webVoiceEnabled ? "Interrupt it. Change details. Push its limits." : "Live browser voice is ready for provider keys."}</h2>
          </div>
          {livePhoneNumber ? <a href={`tel:${livePhoneNumber.replace(/[^+\d]/g, "")}`} className="button button-secondary">Call {livePhoneNumber}</a> : <a href="/fieldrelay#audit" className="button button-primary">Get my audit <ArrowRight aria-hidden="true" /></a>}
        </div>
      </section>
    </main>
  );
}
