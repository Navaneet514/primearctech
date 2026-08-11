# PrimeArcTech production implementation requirements

## Required before staging calls

- Rotate the Vapi private key previously shared in chat.
- Configure hosted demo, Vapi, webhook, public key, assistant, and presenter secrets from `.env.example`.
- Run `npm run vapi:sync`, then verify the existing assistant ID was updated.
- Point authenticated Vapi server events to `/api/demo/vapi`.
- Apply both D1 migrations and verify the pitch columns exist.
- Keep recording disabled and do not set a real escalation number.

## Required before production publication

- Connect and test the audit webhook.
- Supply verified founder name, operating location, privacy contact, and company details.
- Obtain professional review of privacy, terms, call-consent language, and both names.
- Configure `primearc.tech`, TLS, canonical URLs, and hosted secrets.
- Complete 50 adversarial call-policy tests with zero invented bookings, prices, or missed danger routes.
- Capture the real-audio 90-second demo and three LinkedIn clips from staging.
- Run Playwright, Lighthouse, DNS/TLS checks, and one real-call smoke test.

## Client-call sequence

1. Minute 0-1: quantify the missed-call problem.
2. Minute 1-2: configure fictional prospect details in the private console.
3. Minute 2-5: run one adversarial call.
4. Minute 5-6: inspect transcript, policy events, provenance, and dispatcher receipt.
5. Minute 6-8: explain Audit, Train, Test, Go live, Monitor.
6. Minute 8-10: present the founding offer and request the audit.

Never enter real caller data, a real transfer number, arbitrary prompts, or editable safety policy in the pitch console.
