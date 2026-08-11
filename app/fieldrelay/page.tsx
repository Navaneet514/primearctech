import type { Metadata } from "next";
import { FieldRelayPage } from "../FieldRelayPage";

export const metadata: Metadata = {
  title: "FieldRelay | Managed missed-call recovery",
  description: "FieldRelay by PrimeArcTech answers overflow calls, qualifies home-service jobs, and produces controlled provisional outcomes.",
  alternates: { canonical: "/fieldrelay" },
  openGraph: { url: "/fieldrelay", title: "FieldRelay by PrimeArcTech", description: "Managed missed-call and after-hours recovery for residential HVAC and plumbing operators.", images: ["/fieldrelay/01-hero.webp"] },
};

export default function FieldRelayRoute() { return <FieldRelayPage />; }
