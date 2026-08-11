export const FUNNEL_EVENTS = ["fieldrelay_view", "demo_scenario_selected", "demo_started", "demo_connected", "demo_completed", "audit_clicked", "audit_submitted", "pitch_started", "pitch_completed"] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

const allowedKeys = new Set(["scenario", "path", "provenance", "mode"]);

export function trackFunnelEvent(event: FunnelEvent, properties: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const safe = Object.fromEntries(Object.entries(properties).filter(([key, value]) => allowedKeys.has(key) && value.length <= 80));
  window.dispatchEvent(new CustomEvent("primearc:analytics", { detail: { event, ...safe } }));
  const target = window as Window & { dataLayer?: Record<string, unknown>[] };
  target.dataLayer?.push({ event, ...safe });
}
