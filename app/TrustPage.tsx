import type { ReactNode } from "react";
/* eslint-disable @next/next/no-html-link-for-pages -- cross-route navigation intentionally uses reliable document requests. */

export function TrustPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main className="trust-page"><header className="trust-nav"><a href="/" className="prime-wordmark"><strong>PrimeArc</strong><span>Tech</span></a><nav><a href="/#studio">Studio</a><a href="/fieldrelay">FieldRelay</a><a href="/about">About</a></nav><a href="/build-brief">Get free AI audit</a></header><article><p className="prime-label">{eyebrow}</p><h1>{title}</h1><p className="trust-intro">{intro}</p><div className="trust-body">{children}</div></article><footer><span>PrimeArcTech</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/fieldrelay">FieldRelay</a></div></footer></main>;
}
