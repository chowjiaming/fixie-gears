import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SITE_ACCENT,
  SITE_DESCRIPTION,
  SITE_INK,
  SITE_MANIFEST_ID,
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_ALT,
  SITE_ORIGIN,
  SITE_PAPER,
  SITE_ROUTES,
  SITE_TITLE,
} from "./site";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../../public");

describe("site constants", () => {
  it("keeps origin, manifest id, and copy distinct", () => {
    expect(SITE_ORIGIN).toBe("https://fixie-gears.netlify.app");
    expect(SITE_MANIFEST_ID).toBe(`${SITE_ORIGIN}/`);
    expect(SITE_TITLE).toBe("Fixie Gears");
    expect(SITE_DESCRIPTION).toBe(
      "Street-fixie ratio calculator. Gear inches, development, skid patches, and chain links — every setup is a URL.",
    );
    expect(SITE_OG_IMAGE_ALT).toBe(
      "Fixie Gears — street-fixie ratio calculator",
    );
    expect(SITE_OG_IMAGE).toBe(`${SITE_ORIGIN}/og.png`);
    expect(SITE_ACCENT).toBe("#FF5A1F");
    expect(SITE_PAPER).toBe("#FAFAF8");
    expect(SITE_INK).toBe("#111214");
    expect(SITE_ROUTES).toEqual(["/", "/compare", "/explore", "/saved"]);
  });
});

describe("crawler files", () => {
  it("serves robots.txt for the production origin", () => {
    const text = readFileSync(join(publicDir, "robots.txt"), "utf8");
    expect(text.includes("<html")).toBe(false);
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");
    expect(text).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it("lists the four routes and no query strings", () => {
    const text = readFileSync(join(publicDir, "sitemap.xml"), "utf8");
    expect(text.includes("<html")).toBe(false);
    expect(text.startsWith("<?xml")).toBe(true);
    const locUrls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    for (const loc of locUrls) {
      expect(loc).not.toContain("?");
    }
    for (const route of SITE_ROUTES) {
      const loc = route === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}`;
      expect(text).toContain(`<loc>${loc}</loc>`);
    }
  });
});
