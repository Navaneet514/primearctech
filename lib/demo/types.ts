export const DEMO_SCENARIO_IDS = ["routine", "emergency", "boundary"] as const;

export type DemoScenarioId = (typeof DEMO_SCENARIO_IDS)[number];
export type DemoDecision = "book" | "escalate" | "capture" | "decline";
export type DemoSessionStatus = "ready" | "in-progress" | "completed" | "failed";
export type DemoMode = "public" | "pitch";
export type ReceiptProvenance = "provider" | "sandbox" | "illustrative";

export type PitchProfile = {
  companyName: string;
  trades: ("hvac" | "plumbing")[];
  serviceAreaZips: string[];
  provisionalWindows: string[];
  escalationLabel: string;
  scenario: DemoScenarioId;
};

export type DemoTranscriptLine = {
  speaker: "caller" | "fieldrelay" | "system";
  text: string;
  atSeconds: number;
};

export type DemoReceipt = {
  decision: DemoDecision;
  outcome: string;
  callerName: string;
  service: string;
  location: string;
  serviceArea: "inside" | "outside" | "unconfirmed";
  urgency: "routine" | "priority" | "emergency";
  appointment: string | null;
  handoff: string | null;
  safeguards: string[];
  dispatcherSummary: string;
};

export type DemoScenario = {
  id: DemoScenarioId;
  index: string;
  label: string;
  title: string;
  prompt: string;
  test: string;
  duration: string;
  transcript: DemoTranscriptLine[];
  receipt: DemoReceipt;
};

export type DemoSession = {
  id: string;
  demoCode: string;
  scenario: DemoScenarioId;
  status: DemoSessionStatus;
  provider: "sandbox" | "vapi";
  mode: DemoMode;
  profileSnapshot?: PitchProfile;
  receipt: DemoReceipt | null;
  transcript: DemoTranscriptLine[] | null;
  receiptProvenance: ReceiptProvenance | null;
  failureCode?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};
