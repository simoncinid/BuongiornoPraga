import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Buongiorno Praga",
    short_name: "Buongiorno Praga",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F4F9FF",
    theme_color: "#1268D6",
    lang: "it-IT",
    categories: ["travel", "navigation", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
