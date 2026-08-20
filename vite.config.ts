/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import {
  SITE_ACCENT,
  SITE_DESCRIPTION,
  SITE_MANIFEST_ID,
  SITE_PAPER,
  SITE_TITLE,
} from "./src/lib/site";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

const pwaPlugins: PluginOption[] = process.env.VITEST
  ? []
  : [
      tanstackRouter({
        target: "solid",
        autoCodeSplitting: true,
        routeFileIgnorePattern: "\\.test\\.",
      }),
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: false,
        filename: "sw.js",
        manifestFilename: "manifest.webmanifest",
        includeAssets: [
          "favicon.ico",
          "favicon.svg",
          "apple-touch-icon.png",
          "pwa-192.png",
          "pwa-512.png",
          "pwa-192-maskable.png",
          "pwa-512-maskable.png",
          "og.png",
          "robots.txt",
          "sitemap.xml",
        ],
        manifest: {
          id: SITE_MANIFEST_ID,
          name: SITE_TITLE,
          short_name: SITE_TITLE,
          description: SITE_DESCRIPTION,
          lang: "en",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: SITE_PAPER,
          theme_color: SITE_ACCENT,
          icons: [
            {
              src: "/pwa-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-192-maskable.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/pwa-512-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "index.html",
          cleanupOutdatedCaches: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,xml,txt}"],
        },
        devOptions: { enabled: false },
      }),
    ];

export default defineConfig({
  plugins: [
    ...pwaPlugins,
    solid({ start: true }),
    tailwindcss(),
  ] satisfies PluginOption[],
  resolve: {
    alias: {
      "~": srcDir,
      ...(process.env.VITEST
        ? {
            "virtual:pwa-register": fileURLToPath(
              new URL("./src/pwa-register.stub.ts", import.meta.url),
            ),
          }
        : {}),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
  },
  test: {
    environment: "jsdom",
  },
});
