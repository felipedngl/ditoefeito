import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Dito & Feito",
    short_name: "Dito & Feito",
    description: "Seu cantinho para avaliar filmes e séries.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080b12",
    theme_color: "#080b12",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
