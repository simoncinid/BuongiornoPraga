import type { MetadataRoute } from "next";
import { catalog } from "@/lib/platform/public";
export const dynamic="force-dynamic";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const tours=await catalog();
  const now = new Date();
  const routes = [
    "",
    "/tour",
    "/tour-privati",
    "/partner-europa",
    "/contatti",
    "/privacy",
    "/termini",
    "/llms.txt",
    "/llms-full.txt",
    "/ai-context.json"
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8
  }));

  const tourRoutes = tours.map((tour) => ({
    url: absoluteUrl(`/tour/${tour.slug}`),
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9
  }));

  return [...routes, ...tourRoutes];
}
