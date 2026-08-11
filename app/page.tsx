import type { Metadata } from "next";
import { PrimeArcPage } from "./PrimeArcPage";

export const metadata: Metadata = {
  title: "AI systems that complete real work",
  description:
    "PrimeArcTech turns costly workflows into production AI systems and proves the craft through owned products like FieldRelay.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PrimeArcTech",
    url: "https://primearc.tech",
    description: "Applied AI studio building production systems and independent products.",
    knowsAbout: ["Artificial intelligence", "AI product development", "Operational AI systems"],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} /><PrimeArcPage /></>;
}
