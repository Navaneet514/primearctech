"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { FormEvent, useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export function BuildBriefForm({
  source = "build-brief-page",
  successRedirect,
}: {
  source?: string;
  successRedirect?: string;
}) {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    setState("loading");
    setMessage("Sending your problem for review...");

    try {
      const response = await fetch("/api/build-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name") || undefined,
          email: data.get("email"),
          website: data.get("website"),
          problem: data.get("problem"),
          consent: data.get("consent") === "on",
          companyFax: data.get("companyFax"),
          startedAt,
          source,
          utmSource: params.get("utm_source") || undefined,
          utmMedium: params.get("utm_medium") || undefined,
          utmCampaign: params.get("utm_campaign") || undefined,
          utmContent: params.get("utm_content") || undefined,
          utmTerm: params.get("utm_term") || undefined,
          gclid: params.get("gclid") || undefined,
          fbclid: params.get("fbclid") || undefined,
          ttclid: params.get("ttclid") || undefined,
          msclkid: params.get("msclkid") || undefined,
        }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "AI audit request line is unavailable.");

      setState("success");
      setMessage("Request received. PrimeArcTech will review it directly.");
      form.reset();
      setStartedAt(Date.now());
      if (successRedirect) window.location.assign(successRedirect);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "AI audit request line is unavailable.");
    }
  }

  return (
    <form className="studio-brief-form" onSubmit={submit} noValidate>
      <div className="studio-field"><label htmlFor="brief-email">Work email</label><input id="brief-email" name="email" type="email" autoComplete="email" required maxLength={160} /></div>
      <div className="studio-field"><label htmlFor="brief-website">Company website</label><input id="brief-website" name="website" inputMode="url" placeholder="company.com" required maxLength={240} /></div>
      <div className="studio-field studio-field-wide"><label htmlFor="brief-problem">What should work better?</label><textarea id="brief-problem" name="problem" rows={3} required minLength={20} maxLength={1200} placeholder="Describe one workflow, decision, or product problem." /></div>
      <div className="studio-honeypot" aria-hidden="true"><label htmlFor="brief-fax">Company fax</label><input id="brief-fax" name="companyFax" tabIndex={-1} autoComplete="off" /></div>
      <label className="studio-consent"><input type="checkbox" name="consent" required /><span>PrimeArcTech may use this information to review and respond to my request.</span></label>
      <button type="submit" disabled={state === "loading"}>{state === "loading" ? "Reviewing..." : "Get free AI audit"}<ArrowRight aria-hidden="true" /></button>
      <p className={`studio-form-status is-${state}`} role="status" aria-live="polite">{message || "Free workflow audit. Reviewed directly. No automated sales sequence."}</p>
    </form>
  );
}
