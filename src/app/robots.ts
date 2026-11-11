import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/self-service", "/gestisci-prenotazione", "/api/", "/account", "/accesso", "/checkout", "/carrello", "/prenotazione"]
      }
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url
  };
}
