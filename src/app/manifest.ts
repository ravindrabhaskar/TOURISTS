import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sanchari — Andhra Pradesh Tourism",
    short_name: "Sanchari",
    description: "AI-planned journeys across Andhra Pradesh.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F3",
    theme_color: "#177C64",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
