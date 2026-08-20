import { registerSW } from "virtual:pwa-register";
import { describe, expect, it } from "vitest";

describe("PWA registration under Vitest", () => {
  it("resolves virtual:pwa-register to a no-op", () => {
    const update = registerSW({ immediate: true });
    expect(typeof update).toBe("function");
  });

  it("accepts the App side-effect import", async () => {
    await expect(import("~/pwa")).resolves.toBeTypeOf("object");
  });
});
