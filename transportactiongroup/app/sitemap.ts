import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.transportactiongroup.com";
  const now = new Date();

  const pages = [
    { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/green-freight", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/electric-truck", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "/services", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/books", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/ecosystem-partners", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/academy", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/partner-with-tag", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/contact", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return pages.map(({ url, priority, changeFrequency }) => ({
    url: `${base}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
