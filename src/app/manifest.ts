import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stars House Club",
    short_name: "Stars House",
    description: "A cultural space for art, music & creativity in Algiers.",
    start_url: "/",
    display: "standalone",
    background_color: "#101522",
    theme_color: "#101522",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
