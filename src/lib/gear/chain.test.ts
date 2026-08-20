import { describe, expect, it } from "vitest";
import { chainLength, nearestEvenLinks, nearestOddLinks } from "./chain";

describe("nearest parity", () => {
  it("picks the lower neighbor on a tie", () => {
    expect(nearestEvenLinks(97)).toBe(96);
    expect(nearestOddLinks(97)).toBe(97);
    expect(nearestEvenLinks(97.5)).toBe(98);
    expect(nearestOddLinks(97.5)).toBe(97);
  });
});

describe("chainLength", () => {
  it("warns on 46/17 at 410 mm stay", () => {
    const c = chainLength(410, 46, 17);
    expect(c.rawLinks).toBeCloseTo(97.067, 3);
    expect(c.evenLinks).toBe(98);
    expect(c.oddLinks).toBe(97);
    expect(c.halfLinkCloser).toBe(true);
  });

  it("does not warn on 46/17 at 405 mm stay", () => {
    const c = chainLength(405, 46, 17);
    expect(c.evenLinks).toBe(96);
    expect(c.oddLinks).toBe(97);
    expect(c.halfLinkCloser).toBe(false);
  });

  it("does not warn at the even/odd midpoint", () => {
    expect(
      Math.abs(97.5 - nearestOddLinks(97.5)) <
        Math.abs(97.5 - nearestEvenLinks(97.5)),
    ).toBe(false);
  });
});
