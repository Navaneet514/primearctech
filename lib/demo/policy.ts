import type { DemoDecision } from "./types";

export const SUPPORTED_DEMO_ZIPS = new Set(["78701", "78702", "78703", "78704", "78745", "78746", "78748"]);

export type CallSignals = {
  zip?: string;
  immediateDanger: boolean;
  emergencyLanguage: boolean;
  requestedEstimate: boolean;
  bookingRequested: boolean;
};

export function decideCallRoute(signals: CallSignals): DemoDecision {
  if (signals.immediateDanger || signals.emergencyLanguage) return "escalate";
  if (signals.zip && !SUPPORTED_DEMO_ZIPS.has(signals.zip)) return "capture";
  if (signals.requestedEstimate) return "capture";
  if (signals.bookingRequested && signals.zip && SUPPORTED_DEMO_ZIPS.has(signals.zip)) return "book";
  return "capture";
}

export function validateDemoServiceArea(zip: string) {
  return /^\d{5}$/.test(zip) && SUPPORTED_DEMO_ZIPS.has(zip);
}
