import type { Metadata } from "next";
import { DemoExperience } from "../../demo/DemoExperience";

export const metadata: Metadata = {
  title: "FieldRelay live voice demo",
  description: "Challenge a safe, fictional FieldRelay call and inspect the resulting transcript and dispatcher receipt.",
  alternates: { canonical: "/fieldrelay/demo" },
};

export default function DemoPage() {
  const livePhoneNumber = process.env.DEMO_LIVE_PHONE_NUMBER || null;
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || null;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || null;
  const webVoiceEnabled = process.env.DEMO_PROVIDER === "vapi" && Boolean(publicKey && assistantId);
  return <DemoExperience webVoiceEnabled={webVoiceEnabled} publicKey={publicKey} assistantId={assistantId} livePhoneNumber={livePhoneNumber} />;
}
