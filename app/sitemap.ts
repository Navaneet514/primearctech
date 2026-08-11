import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://primearc.tech";
  return ["", "/build-brief", "/fieldrelay", "/fieldrelay/demo", "/about", "/security", "/privacy", "/terms"].map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly", priority: path === "" ? 1 : path === "/fieldrelay" ? .9 : path === "/build-brief" ? .8 : .6 }));
}
