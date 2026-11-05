import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";

export default defineConfig({
  site: "https://gabrielreis.dev",
  // EmDash content is queried at request time, so every CMS route is server-rendered.
  output: "server",
  // Pulumi sets WRANGLER_CONFIG=wrangler.production.jsonc (real D1/R2 IDs) at
  // deploy time; locally this falls back to ./wrangler.jsonc.
  adapter: cloudflare({ configPath: process.env.WRANGLER_CONFIG }),
  integrations: [
    // Our UI components are React, and the EmDash admin is a React app too.
    react(),
    emdash({
      database: d1({ binding: "DB", session: "auto", coalesce: true }),
      storage: r2({ binding: "MEDIA" }),
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "IBM Plex Sans",
      cssVariable: "--font-ibm-plex-sans",
      weights: [400, 500, 600, 700],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Inconsolata",
      cssVariable: "--font-inconsolata",
      weights: [400, 500],
      fallbacks: ["monospace"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  devToolbar: { enabled: false },
});
