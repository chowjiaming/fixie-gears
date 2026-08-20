import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SITE_ACCENT,
  SITE_DESCRIPTION,
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_ALT,
  SITE_ORIGIN,
  SITE_TITLE,
} from "~/lib/site";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "Document.tsx"),
  "utf8",
);

describe("Document head", () => {
  it("imports site copy instead of duplicating strings", () => {
    expect(source).toContain('from "~/lib/site"');
    expect(source).toContain("SITE_DESCRIPTION");
    expect(source).toContain("SITE_ORIGIN");
    expect(source).toContain("SITE_TITLE");
    expect(source).toContain("SITE_ACCENT");
    expect(source).toContain("SITE_OG_IMAGE");
    expect(source).toContain("SITE_OG_IMAGE_ALT");
  });

  it("emits discoverability and share tags", () => {
    expect(source).toContain('name="description"');
    expect(source).toContain('rel="canonical"');
    expect(source).toContain('name="theme-color"');
    expect(source).toContain('property="og:title"');
    expect(source).toContain('property="og:description"');
    expect(source).toContain('property="og:url"');
    expect(source).toContain('property="og:image"');
    expect(source).toContain('property="og:image:alt"');
    expect(source).toContain('property="og:image:width"');
    expect(source).toContain('property="og:image:height"');
    expect(source).toContain('property="og:type"');
    expect(source).toContain('name="twitter:card"');
    expect(source).toContain("summary_large_image");
    expect(source).toContain('name="twitter:title"');
    expect(source).toContain('name="twitter:description"');
    expect(source).toContain('href="/favicon.ico"');
    expect(source).toContain('href="/favicon.svg"');
    expect(source).toContain('rel="apple-touch-icon"');
    expect(source).toContain('href="/apple-touch-icon.png"');
    expect(source).toContain('href="/manifest.webmanifest"');
    expect(source).toContain("1200");
    expect(source).toContain("630");
  });

  it("matches the locked copy constants", () => {
    expect(SITE_TITLE).toBe("Fixie Gears");
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(40);
    expect(SITE_ORIGIN).toBe("https://fixie-gears.netlify.app");
    expect(SITE_OG_IMAGE).toBe(`${SITE_ORIGIN}/og.png`);
    expect(SITE_OG_IMAGE_ALT).toContain("Fixie Gears");
    expect(SITE_ACCENT).toBe("#FF5A1F");
  });
});
