import type { Metadata } from "next";
/* eslint-disable @next/next/no-html-link-for-pages -- full document navigation avoids the production vinext prefetch failure. */

export const metadata: Metadata = {
  title: "AI Workflow Audit Received",
  description: "PrimeArcTech has received your AI Workflow Audit request for direct review.",
  robots: { index: false, follow: false },
};

export default function BuildBriefReceivedPage() {
  return (
    <main className="studio-page brief-received-page">
      <nav className="brief-funnel-nav studio-shell" aria-label="Confirmation navigation">
        <a href="/" className="studio-wordmark" aria-label="PrimeArcTech home"><strong>PrimeArc</strong><span>Tech</span></a>
        <a href="/">Back to studio</a>
      </nav>
      <section className="studio-shell brief-received-content">
        <p className="studio-label">Request received</p>
        <h1>Your workflow is in review.</h1>
        <p>No booking, contract, or build has been created. PrimeArcTech will review fit and reply directly.</p>
        <div className="brief-received-next">
          <div><strong>Review</strong><span>Problem, fit, scope, and key risks.</span></div>
          <div><strong>Decision</strong><span>Proceed, narrow, use an existing tool, or stop.</span></div>
          <div><strong>Reply</strong><span>Direct response. No automated sales sequence.</span></div>
        </div>
        <div className="studio-actions">
          <a href="/" className="studio-button">Return to PrimeArcTech</a>
          <a href="/fieldrelay/demo" className="studio-link">Hear FieldRelay</a>
        </div>
      </section>
    </main>
  );
}
