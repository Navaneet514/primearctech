import type { Metadata } from "next";
import { PitchConsole } from "./PitchConsole";

export const metadata: Metadata = { title: "Private FieldRelay pitch sandbox", robots: { index: false, follow: false } };

export default function PitchPage() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || null;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || null;
  return <PitchConsole publicKey={publicKey} assistantId={assistantId} webVoiceEnabled={process.env.DEMO_PROVIDER === "vapi" && Boolean(publicKey && assistantId)} />;
}
