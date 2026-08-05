import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/self-service"]
      }
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url
  };
}
