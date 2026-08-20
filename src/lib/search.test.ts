import { describe, expect, it } from "vitest";
import {
  compactCompareExtras,
  parseCalculatorSearch,
  parseCompareTuple,
  parseExploreSearch,
  seedCompareExtras,
  toConfig,
} from "./search";

describe("parseCalculatorSearch", () => {
  it("applies defaults on empty input", () => {
    expect(parseCalculatorSearch({})).toEqual({
      v: 1,
      chainring: 46,
      cog: 17,
      wheel: "700c",
      tire: 25,
      crank: 170,
      ambi: 0,
    });
  });

  it("keeps half-mm cranks and maps 650c to 700c", () => {
    const s = parseCalculatorSearch({
      chainring: "48",
      cog: "16",
      wheel: "650c",
      tire: "28",
      crank: "167.5",
      ambi: "1",
    });
    expect(s.chainring).toBe(48);
    expect(s.cog).toBe(16);
    expect(s.wheel).toBe("700c");
    expect(s.tire).toBe(28);
    expect(s.crank).toBe(167.5);
    expect(s.ambi).toBe(1);
  });
});

describe("compare extras", () => {
  it("parses a compact tuple", () => {
    const cfg = parseCompareTuple("48,16,700c,25,167.5,0");
    expect(cfg?.chainringTeeth).toBe(48);
    expect(cfg?.cogTeeth).toBe(16);
    expect(cfg?.wheel.beadSeatDiameterMm).toBe(622);
    expect(cfg?.crankLengthMm).toBe(167.5);
    expect(cfg?.ambidextrousSkidder).toBe(false);
  });

  it("compacts holes c3-without-c2 into c2", () => {
    expect(compactCompareExtras({ c3: "48,16,700c,25,170,0" })).toEqual({
      c2: "48,16,700c,25,170,0",
    });
  });

  it("seeds cog±1 when no extras remain", () => {
    const bike = parseCalculatorSearch({ cog: 17 });
    const seeded = seedCompareExtras(bike, {});
    expect(seeded.c2).toBe("46,18,700c,25,170,0");
    expect(seeded.c3).toBe("46,16,700c,25,170,0");
    expect(seeded.c4).toBeUndefined();
  });

  it("does not seed c3 when only c2 is present", () => {
    const bike = parseCalculatorSearch({});
    const extras = seedCompareExtras(bike, { c2: "52,14,700c,25,170,0" });
    expect(extras.c2).toBe("52,14,700c,25,170,0");
    expect(extras.c3).toBeUndefined();
  });

  it("seeds cog±1 when c2 is garbage and no other extras", () => {
    const bike = parseCalculatorSearch({ cog: 17 });
    const seeded = seedCompareExtras(bike, { c2: "garbage" });
    expect(seeded.c2).toBe("46,18,700c,25,170,0");
    expect(seeded.c3).toBe("46,16,700c,25,170,0");
    expect(seeded.c4).toBeUndefined();
  });

  it("compacts valid c3 into c2 when c2 is garbage", () => {
    const valid = "52,14,700c,25,170,0";
    expect(
      compactCompareExtras({ c2: "garbage", c3: valid }),
    ).toEqual({ c2: valid });
    const bike = parseCalculatorSearch({});
    const seeded = seedCompareExtras(bike, { c2: "garbage", c3: valid });
    expect(seeded).toEqual({ c2: valid });
  });
});

describe("parseExploreSearch", () => {
  it("defaults metric gi and minSkid 0", () => {
    expect(parseExploreSearch({})).toEqual({ metric: "gi", minSkid: 0 });
  });

  it("accepts minSkid 8", () => {
    expect(parseExploreSearch({ metric: "skid", minSkid: "8" })).toEqual({
      metric: "skid",
      minSkid: 8,
    });
  });
});

describe("toConfig", () => {
  it("maps wheel id and tire into WheelSpec", () => {
    const cfg = toConfig(parseCalculatorSearch({}));
    expect(cfg.wheel).toEqual({ beadSeatDiameterMm: 622, tireWidthMm: 25 });
    expect(cfg.chainringTeeth).toBe(46);
    expect(cfg.cogTeeth).toBe(17);
    expect(cfg.crankLengthMm).toBe(170);
    expect(cfg.ambidextrousSkidder).toBe(false);
  });
});
