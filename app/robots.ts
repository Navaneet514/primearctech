import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://primearc.tech";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/fieldrelay/pitch", "/api/"] }], sitemap: `${origin}/sitemap.xml`, host: origin };
}
