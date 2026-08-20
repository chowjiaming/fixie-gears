import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../../public");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngSize(name: string): { width: number; height: number } {
  const buf = readFileSync(join(publicDir, name));
  expect(buf.subarray(0, 8).equals(PNG_SIG)).toBe(true);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

describe("public icons", () => {
  it("ships an SVG favicon in the token palette", () => {
    const svg = readFileSync(join(publicDir, "favicon.svg"), "utf8");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("#FF5A1F");
    expect(svg).toContain("#FAFAF8");
  });

  it("ships a non-empty ICO", () => {
    const ico = readFileSync(join(publicDir, "favicon.ico"));
    expect(ico.byteLength).toBeGreaterThan(16);
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
  });

  it("ships PNG icons at the locked sizes", () => {
    expect(pngSize("apple-touch-icon.png")).toEqual({
      width: 180,
      height: 180,
    });
    expect(pngSize("pwa-192.png")).toEqual({
      width: 192,
      height: 192,
    });
    expect(pngSize("pwa-512.png")).toEqual({
      width: 512,
      height: 512,
    });
    expect(pngSize("pwa-192-maskable.png")).toEqual({
      width: 192,
      height: 192,
    });
    expect(pngSize("pwa-512-maskable.png")).toEqual({
      width: 512,
      height: 512,
    });
    expect(pngSize("og.png")).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
