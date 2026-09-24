import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated pages a crawler would either bounce off of (redirected
      // to /kirish) or that carry no public content worth indexing.
      disallow: ["/api/", "/xabarlar", "/mening-belgilarim", "/belgilash"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
