/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    ...(process.env.VITEST
      ? []
      : [
          tanstackRouter({
            target: "solid",
            autoCodeSplitting: true,
            routeFileIgnorePattern: "\\.test\\.",
          }),
        ]),
    solid({ start: true }),
    tailwindcss(),
  ] satisfies PluginOption[],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
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
