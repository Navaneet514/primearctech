# PrimeArcTech + FieldRelay

PrimeArcTech is a founder-led applied AI studio. It builds selected client systems and independent products; FieldRelay is its first owned product.

- `/` - PrimeArcTech studio homepage and build-brief funnel
- `/fieldrelay` - flagship managed missed-call recovery product
- `/fieldrelay/demo` - public, un-gated voice demonstration
- `/fieldrelay/pitch` - unlinked password-protected presenter console
- `/demo` - permanent redirect to the public demo
- `/security`, `/about`, `/privacy`, `/terms` - trust and legal surfaces

## Product behavior

The single public offer is the `14-Day Missed-Call Recovery System`. FieldRelay demonstrates routine qualification, provisional booking, emergency restraint, service-area boundaries, and honest failure behavior without pretending a real action occurred.

Demo sessions use expiring access tokens and D1 receipts. Public sessions expire after two hours; pitch sessions after 24 hours. Browser voice stays usable when durable storage fails, and every receipt identifies provider, sandbox, or illustrative provenance.

## Stack

- Next.js App Router through vinext
- TypeScript, Tailwind CSS v4, Motion, and Phosphor Icons
- Vapi Web SDK with an audible browser fallback
- D1, Zod, Vitest, Playwright, and Lighthouse

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example`. Keep every private provider key server-only. Without a configured webhook, audit and build-brief forms report honest configuration errors and never display false success.

## Quality commands

```bash
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

`npm run vapi:sync` patches the existing assistant ID. It never creates a duplicate.

## Deployment status

The project builds cleanly but remains intentionally unpublished. Rotate the exposed Vapi private key, connect the production audit webhook, approve legal copy, supply verified founder/company details, and configure hosted secrets before release. The target origin is `https://primearc.tech`.

Evidence links: [Invoca home-services conversion report](https://www.invoca.com/reports/the-invoca-home-services-lead-conversion-benchmarks-report-2026) and [ServiceTitan top-performer profile](https://www.servicetitan.com/toolbox/state-of-the-trades/trends/top-performer-profile).
