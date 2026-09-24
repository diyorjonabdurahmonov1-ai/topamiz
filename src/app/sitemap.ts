import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Evergreen, publicly indexable marketing/discovery pages only — auth pages
// and private dashboards are excluded here and in robots.ts.
const ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/elonlar", priority: 0.9, changeFrequency: "hourly" },
  { path: "/mukofotli", priority: 0.7, changeFrequency: "daily" },
  { path: "/ai-yordamchi", priority: 0.6, changeFrequency: "monthly" },
  { path: "/reklama", priority: 0.5, changeFrequency: "monthly" },
  { path: "/elon-qoshish", priority: 0.6, changeFrequency: "monthly" },
  { path: "/kirish", priority: 0.3, changeFrequency: "yearly" },
  { path: "/royxatdan-otish", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
