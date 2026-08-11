# PrimeArcTech Funnel Specification

Status: build-ready working specification  
Owner: PrimeArcTech  
Primary product: FieldRelay  
Last updated: 2026-08-11

## 1. Funnel shape

Chosen shape: **Application funnel**.

Reason: PrimeArcTech sells founder-led services and a managed product priced above $500. Buyers need proof, qualification, and a sales conversation. Instant checkout would create poor-fit customers and operational risk.

Primary path:

```text
Founder-led LinkedIn / email / referral
  -> PrimeArcTech studio page
  -> Free AI Workflow Audit qualification page
  -> Confirmation page
  -> Direct fit review
  -> Scoped implementation proposal
  -> Managed operation or FieldRelay offer
```

Product path:

```text
Home-service outreach / product mention
  -> FieldRelay product page
  -> Public voice demo
  -> Audit request
  -> Direct qualification
  -> Founding offer
```

## 2. Fixed inputs and assumptions

| Input | Working decision |
| --- | --- |
| Offer | Founder-led AI system design, deployment, and monitored operation. FieldRelay is first owned product. |
| Traffic | Cold or lightly warmed founder-led LinkedIn and email, referrals, mentor introductions, and future search. |
| Awareness | Problem-aware and AI-skeptical. Buyer knows workflow is expensive but may not know correct system shape. |
| Fulfilment | Service delivery, qualification, scoped proposal, direct founder involvement. No instant checkout. |
| Existing assets | PrimeArcTech homepage, FieldRelay product page, live demo, audit API, Build Brief API, legal and security pages. |
| Missing assets | Real founder identity, real customer proof, scheduling link, CRM/webhook, analytics ID, final domain configuration. |

Working commercial structure:

- AI Workflow Audit: $0.
- Custom implementation: quoted after audit. Internal qualification floor: $5,000 project budget.
- FieldRelay founding offer remains $1,000 setup plus $750/month for 90 days. Usage billed separately.

## 3. Page specifications

### PrimeArcTech studio page - type: LANDING

Route: `/`

Goal (one action): send a qualified visitor to the free AI Workflow Audit application.

Traffic in: founder LinkedIn profile, direct outreach, referrals, mentor introductions, and visitors moving from FieldRelay to the parent company. Visitor is skeptical, comparing competence and trust.

Above the fold:

- Headline: `We build AI systems that complete real work.`
- Subhead: `PrimeArcTech turns costly workflows into production systems, then proves the craft through products like FieldRelay.`
- Hero: technical workbench showing system maps and prototype materials.
- Primary CTA: `Get free AI audit`.
- Secondary CTA: `See FieldRelay`.

Body sections, in order:

1. Situation selector. Buyer chooses a costly workflow, an AI product idea, or a prototype that cannot survive production.
2. FieldRelay specimen. Show the working voice demo, transcript, and operational receipt.
3. Evidence standard. Show architecture, boundary policy, adversarial testing, and operator receipts.
4. Free AI Workflow Audit. Show opportunity, likely scope, key risks, and recommended next move.
5. Delivery rail. Frame, Prototype, Test, Ship, Monitor.
6. AI Workflow Audit CTA. Move qualification to the dedicated application page and state there is no automated sales sequence.

Proof required:

- Working FieldRelay voice demo.
- Real FieldRelay transcript and illustrative dispatcher receipt.
- Downloadable or visible sample AI Workflow Audit.
- Real founder name, photo, location, and relevant experience before public launch.
- First real pilot case study when permission exists.

Objections handled here:

- `Is this another generic automation agency?` FieldRelay proves an owned system and operating discipline.
- `Will a junior account manager handle me?` Buyer works directly with the person framing and building the system.
- `Will you promise magic?` Page states policy, testing, monitoring, and human boundaries.
- `What happens first?` AI Workflow Audit identifies the strongest opportunity, likely scope, key risks, and next move.
- `Do you work only in HVAC?` PrimeArcTech presents broad system capability. FieldRelay remains one product, not whole studio.

Fields collected: none on landing page. CTA moves buyer to qualification page. Keeping the first page form-free preserves one clear decision.

Price shown: AI Workflow Audit marked free. Custom implementation remains quoted.

Exit path if visitor does not convert: FieldRelay demo and company notes. No newsletter until a real publishing cadence exists.

Success metric + target:

- Qualified sessions to AI Workflow Audit click: 5-10% starting operating threshold.
- FieldRelay product click: measure separately, no target until 100 qualified sessions.

Targets are operating thresholds, not promises. Replace after 100 qualified sessions.

### AI Workflow Audit qualification page - type: LANDING

Route: `/build-brief`

Goal (one action): complete a qualified AI Workflow Audit request.

Traffic in: PrimeArcTech CTA, direct outreach, founder profile, or post-demo follow-up. Visitor understands PrimeArcTech and wants a fit decision.

Above the fold:

- Headline: `Start with one workflow worth fixing.`
- Subhead: `Share the bottleneck. Receive a direct fit decision, likely first scope, key risks, and recommended next move.`
- Hero: blank technical workflow audit sheet.
- Primary CTA: `Get free AI audit`.

Body sections, in order:

1. What buyer submits: company, workflow, current process, consequence of failure.
2. What PrimeArcTech returns: fit/no-fit decision, likely system, smallest useful scope, risks, next move.
3. What this is not: no free architecture project, no automated proposal, no guaranteed outcome.
4. If fit: a scoped implementation proposal defines build, testing, launch, and monitoring.
5. Single-column qualification form.

Proof required:

- Redacted sample AI Workflow Audit before paid promotion.
- Plain explanation of review process.
- Security and privacy links beside form.

Objections handled here:

- `Will I enter a sales sequence?` No automated sales sequence.
- `Will my information be used to train models?` Use only for request review and response, subject to privacy policy.
- `Do I need a technical specification?` No. Buyer describes current work and failure cost in plain language.
- `Is this a promise to build?` No. It is a fit review.

Fields collected:

- Work email: required for response.
- Company website: required for basic fit and context.
- Workflow/problem description: required for diagnosis.
- Name: optional until founder requests stronger qualification.
- Consent: required.
- Honeypot and start timestamp: abuse control.

Price shown: `Free AI Workflow Audit`. Implementation stays quoted and optional.

Exit path if visitor does not convert: return to studio or try FieldRelay demo.

Success metric + target:

- Form start to valid submission: 35-55% starting threshold.
- Submission to qualified request: at least 40% after first 20 submissions.
- Qualified request to discovery conversation: at least 50% after first 10 qualified requests.

### AI Workflow Audit confirmation - type: THANKYOU

Route: `/build-brief/received`

Goal (one action): set expectations and send interested home-service buyers to FieldRelay demo.

Traffic in: successful AI Workflow Audit form submission.

Above the fold:

- Headline: `Your workflow is in review.`
- Subhead: `No booking or build has been created. PrimeArcTech will review fit and reply directly.`
- Primary CTA: `Return to PrimeArcTech`.
- Secondary CTA: `Hear FieldRelay`.

Body sections, in order:

1. What happens next: review, fit decision, response.
2. What was not created: no contract, booking, dispatch, or automated sequence.
3. Optional proof path: FieldRelay demo.

Proof required: honest status only. No fake calendar confirmation.

Objections handled here:

- `Did I commit to anything?` No.
- `Was a meeting booked?` No.
- `What should I do now?` Nothing required. Optional FieldRelay demo.

Fields collected: none.

Price shown: no.

Exit path if visitor does not convert: PrimeArcTech homepage.

Success metric + target:

- Successful submissions reaching confirmation: 100% client navigation target.
- Confirmation to FieldRelay demo: observation metric only.

### FieldRelay product page - type: LANDING

Route: `/fieldrelay`

Goal (one action): request a FieldRelay audit.

Traffic in: targeted HVAC/plumbing outreach, PrimeArcTech product specimen, demo follow-up, and future search.

Above the fold:

- Existing product promise and industrial hero retained.
- Primary CTA: `Get my audit`.
- Secondary CTA: `See how it works` or demo.

Body sections, in order:

1. Sourced market evidence.
2. Revenue opportunity calculator.
3. Call journey.
4. Capabilities.
5. Human handoff and safeguards.
6. Founding offer.
7. Audit form.

Proof required:

- Invoca and ServiceTitan evidence links.
- Live voice demo.
- Transcript and receipt with clear provenance.
- First real pilot data when available.

Objections handled here:

- Emergency handling.
- Service-area validation.
- Firm-price refusal.
- Human handoff.
- No unverified integration claims.

Fields collected: existing audit schema. Every field must support qualification or follow-up.

Price shown: yes. $1,000 setup, $750/month for 90 days, usage separate.

Exit path if visitor does not convert: public demo.

Success metric + target:

- Product page to demo start: 10-20% starting threshold for targeted traffic.
- Completed demo to audit click: 10-20% starting threshold.
- Audit form start to submission: 30-50% starting threshold.

### FieldRelay public demo - type: LANDING

Route: `/fieldrelay/demo`

Goal (one action): complete one voice scenario and request an audit.

Traffic in: FieldRelay product page, LinkedIn clips, direct outreach, pitch follow-up.

Above the fold:

- Headline and scenario choice.
- AI demonstration disclosure.
- Primary CTA: `Talk to FieldRelay`.
- No form gate.

Body sections, in order:

1. Scenario selection.
2. Live voice instrument.
3. Transcript and receipt.
4. Provenance and sandbox limitation.
5. Audit CTA.

Proof required: real provider audio when available, audible scripted fallback when unavailable, visible transcript, honest provenance.

Objections handled here: microphone permission, provider failure, fake action, privacy, safety boundaries.

Fields collected: scenario only. No company-specific prompt text.

Price shown: no. Audit CTA leads to product offer.

Exit path if visitor does not convert: return to FieldRelay.

Success metric + target:

- Scenario selection to demo start: 50% starting threshold.
- Demo start to completion: 50% starting threshold.
- Demo completion to audit click: 10% starting threshold.

## 4. Price ladder

This is a service ladder, not an ecommerce upsell chain.

1. Entry: AI Workflow Audit, $0.
2. Core service: scoped custom system build, assumed internal minimum $5,000. Quote after audit.
3. Back end: monitored operation, maintenance, evaluation, and improvement. Quote by system risk and usage.
4. Owned-product alternative: FieldRelay founding offer, $1,000 setup plus $750/month for 90 days, usage separate.

No immediate one-click upsell. No artificial downsell. Poor-fit leads receive an honest no-fit response or referral direction, not a cheaper low-quality service.

## 5. Instrumentation blockers

Launch blockers:

- Analytics provider and ID supplied.
- Stable event names implemented:
  - `primearc_view`
  - `build_brief_clicked`
  - `build_brief_started`
  - `build_brief_submitted`
  - `build_brief_qualified`
  - `discovery_booked`
  - `blueprint_purchased`
  - `implementation_closed`
  - Existing FieldRelay events remain unchanged.
- UTM values and click IDs (`gclid`, `fbclid`, `ttclid`, `msclkid`) captured at entry and forwarded with server-owned submission metadata.
- No PII, workflow text, transcript, company name, email, ZIP, or caller text attached to analytics.
- Server-side conversion reporting added once ad platform exists.
- Revenue value and currency included only for real paid events.
- First A/B test slot: PrimeArcTech hero headline. Metric: AI Workflow Audit click rate. Minimum sample: 500 qualified sessions before decision unless effect is extreme.

## 6. Build order

1. Confirm AI Workflow Audit review capacity and response time before launch.
2. Build `/build-brief/received` confirmation state.
3. Build `/build-brief` qualification page.
4. Update Build Brief API and form to carry source/UTM/click IDs.
5. Update PrimeArcTech homepage promise and CTA destination.
6. Remove placeholder founder claims and draft content from public homepage.
7. Add real founder information.
8. Add analytics provider and event wrapper.
9. Connect production webhook and scheduling link.
10. Run first 100 qualified sessions, then replace thresholds with actual baseline.

## 7. Open assumptions

Owner must confirm before public promotion:

- Is the AI Workflow Audit free for all qualified submissions or capped by volume?
- Is $5,000 the minimum custom implementation budget?
- What response time can PrimeArcTech consistently honor?
- Founder legal/public name, location, portrait, and verified experience.
- Production webhook destination.
- Scheduling link.
- Analytics provider.

Until confirmed, site may show the AI Workflow Audit as free but must not publish implementation prices as contractual promises.
