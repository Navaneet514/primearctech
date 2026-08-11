export const runtime = "edge";

export function GET() {
  return Response.json({
    ok: true,
    readiness: {
      demoProvider: process.env.DEMO_PROVIDER === "vapi" ? "vapi" : "sandbox",
      browserVoice: Boolean(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY && process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID),
      durableSessions: Boolean(process.env.DEMO_SESSION_SECRET),
      auditWebhook: Boolean(process.env.AUDIT_WEBHOOK_URL && process.env.AUDIT_WEBHOOK_SECRET),
      pitchAccess: Boolean(process.env.PITCH_ACCESS_SECRET),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
