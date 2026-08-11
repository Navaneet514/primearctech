import { validateDemoServiceArea } from "@/lib/demo/policy";
import { vapiMessageSchema } from "@/lib/demo/schema";
import { getDemoScenario } from "@/lib/demo/scenarios";
import { safeEqual } from "@/lib/demo/security";
import {
  attachProviderCall,
  completeDemoSession,
  getDemoSessionByCode,
  getDemoSessionByProviderCallId,
} from "@/lib/demo/store";

export const runtime = "edge";

type ToolCall = {
  id?: string;
  function?: { name?: string; arguments?: unknown };
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function authorized(request: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get("authorization");
  const supplied = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : request.headers.get("x-vapi-secret");
  return Boolean(supplied && safeEqual(secret, supplied));
}

function toolArguments(call: ToolCall) {
  const value = call.function?.arguments;
  if (typeof value === "string") {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function toolCallsFor(message: Record<string, unknown>) {
  const list = message.toolCallList ?? message.toolCalls;
  return Array.isArray(list) ? list as ToolCall[] : [];
}

async function toolResult(call: ToolCall, callId: string | undefined) {
  const name = call.function?.name;
  const args = toolArguments(call);

  if (name === "load_demo_session") {
    const code = String(args.demoCode ?? "").replace(/\D/g, "");
    const row = await getDemoSessionByCode(code);
    if (!row) return { ok: false, message: "Demo code not found or expired." };
    if (callId) await attachProviderCall(row.id, callId);
    const scenario = getDemoScenario(row.scenario);
    let profile: { companyName?: string; trades?: string[]; serviceAreaZips?: string[]; provisionalWindows?: string[]; escalationLabel?: string } | null = null;
    if (row.mode === "pitch" && row.profile_json) {
      try { profile = JSON.parse(row.profile_json); } catch { profile = null; }
    }
    return {
      ok: true,
      scenario: scenario.title,
      callerInstruction: scenario.prompt,
      contractorName: profile?.companyName || "FieldRelay demo contractor",
      trades: profile?.trades || ["hvac", "plumbing"],
      allowedServiceZips: profile?.serviceAreaZips || ["78701", "78702", "78703", "78704", "78745", "78746", "78748"],
      provisionalWindows: profile?.provisionalWindows || ["Dispatcher confirmation required"],
      escalationLabel: profile?.escalationLabel || "On-call human",
      policy: "Never diagnose, quote prices, or promise service. Escalate danger or uncertainty. Mark bookings provisional.",
    };
  }

  if (name === "validate_service_area") {
    const zip = String(args.zip ?? "");
    if (callId) {
      const row = await getDemoSessionByProviderCallId(callId);
      if (row?.mode === "pitch" && row.profile_json) {
        try { const profile = JSON.parse(row.profile_json) as { serviceAreaZips?: string[] }; return { ok: true, zip, supported: Boolean(profile.serviceAreaZips?.includes(zip)) }; } catch { /* use public sandbox boundary */ }
      }
    }
    return { ok: true, zip, supported: validateDemoServiceArea(zip) };
  }

  if (name === "create_provisional_booking") {
    return { ok: true, status: "provisional", bookingWindow: String(args.bookingWindow ?? "Dispatcher confirmation required") };
  }

  if (name === "request_human_handoff") {
    return { ok: true, status: "handoff-requested", note: "Demo handoff recorded. No real emergency dispatch occurs in sandbox." };
  }

  return { ok: false, message: "Unsupported tool." };
}

function transcriptFromVapi(message: Record<string, unknown>) {
  const artifact = message.artifact && typeof message.artifact === "object" ? message.artifact as Record<string, unknown> : null;
  const messages = artifact && Array.isArray(artifact.messages) ? artifact.messages : [];
  return messages.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const line = item as Record<string, unknown>;
    const role = line.role === "user" ? "caller" : line.role === "assistant" ? "fieldrelay" : "system";
    const text = typeof line.message === "string" ? line.message : typeof line.content === "string" ? line.content : "";
    return text ? [{ speaker: role, text, atSeconds: index * 8 }] : [];
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ ok: false, error: "Unauthorized." }, 401);

  let raw: unknown;
  try { raw = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON payload." }, 400); }
  const parsed = vapiMessageSchema.safeParse(raw);
  if (!parsed.success) return json({ ok: false, error: "Invalid Vapi payload." }, 400);

  const message = parsed.data.message as Record<string, unknown> & { type: string; call?: { id?: string } };
  const callId = message.call?.id;

  if (message.type === "assistant-request") {
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    return assistantId ? json({ assistantId }) : json({ error: "Demo assistant is not configured." }, 503);
  }

  if (message.type === "tool-calls") {
    const results = await Promise.all(toolCallsFor(message).map(async (call) => ({
      toolCallId: call.id,
      result: JSON.stringify(await toolResult(call, callId)),
    })));
    return json({ results });
  }

  if (message.type === "transfer-destination-request") {
    return json({ error: "Human handoff is illustrative and unavailable in this sandbox." }, 503);
  }

  if (message.type === "end-of-call-report" && callId) {
    const row = await getDemoSessionByProviderCallId(callId);
    if (row) {
      const scenario = getDemoScenario(row.scenario);
      const transcript = transcriptFromVapi(message);
      await completeDemoSession(row.id, scenario.receipt, transcript.length ? transcript : scenario.transcript);
    }
  }

  return json({ ok: true });
}
