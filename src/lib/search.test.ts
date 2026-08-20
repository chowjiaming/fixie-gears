import { describe, expect, it } from "vitest";
import {
  buildCompareColumns,
  compactCompareExtras,
  extrasAfterAdd,
  extrasAfterRemove,
  fromConfig,
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
    expect(compactCompareExtras({ c2: "garbage", c3: valid })).toEqual({
      c2: valid,
    });
    const bike = parseCalculatorSearch({});
    const seeded = seedCompareExtras(bike, { c2: "garbage", c3: valid });
    expect(seeded).toEqual({ c2: valid });
  });

  it("adds a copy of column 1 into the next empty slot", () => {
    const bike = parseCalculatorSearch({ chainring: 48, cog: 16 });
    const copy = "48,16,700c,25,170,0";
    expect(extrasAfterAdd(bike, {})).toEqual({ c2: copy });
    expect(extrasAfterAdd(bike, { c2: "46,18,700c,25,170,0" })).toEqual({
      c2: "46,18,700c,25,170,0",
      c3: copy,
    });
    const four = extrasAfterAdd(bike, {
      c2: "46,18,700c,25,170,0",
      c3: "46,16,700c,25,170,0",
      c4: copy,
    });
    expect(four.c4).toBe(copy);
    expect(Object.keys(four)).toEqual(["c2", "c3", "c4"]);
  });

  it("compacts after remove and leaves empty extras when the last extra goes", () => {
    expect(
      extrasAfterRemove(
        { c2: "46,18,700c,25,170,0", c3: "46,16,700c,25,170,0" },
        "c2",
      ),
    ).toEqual({ c2: "46,16,700c,25,170,0" });
    expect(extrasAfterRemove({ c2: "52,14,700c,25,170,0" }, "c2")).toEqual({});
  });

  it("builds three columns from a bare bike and two from c2-only", () => {
    const bike = parseCalculatorSearch({ cog: 17 });
    const seeded = buildCompareColumns(bike, {});
    expect(seeded).toHaveLength(3);
    expect(seeded[0]?.bike.cog).toBe(17);
    expect(seeded[0]?.removable).toBe(false);
    expect(seeded[1]?.bike.cog).toBe(18);
    expect(seeded[2]?.bike.cog).toBe(16);
    expect(seeded[1]?.removable).toBe(true);

    const two = buildCompareColumns(bike, { c2: "52,14,700c,25,170,0" });
    expect(two).toHaveLength(2);
    expect(two[1]?.bike.chainring).toBe(52);
    expect(two[1]?.bike.cog).toBe(14);
  });
});

describe("fromConfig", () => {
  it("round-trips the default calculator search", () => {
    const search = parseCalculatorSearch({});
    expect(fromConfig(toConfig(search))).toEqual(search);
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
