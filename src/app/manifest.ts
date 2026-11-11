import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreeTourPraga",
    short_name: "FreeTourPraga",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FBFAF7",
    theme_color: "#071A35",
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
