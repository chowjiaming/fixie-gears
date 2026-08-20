import { describe, expect, it } from "vitest";

import {
  clampInt,
  deriveMetrics,
  gainRatio,
  snapCrankMm,
  STANDARD_CADENCES,
} from "./calculations";
import {
  gcd,
  GOOD_SKID_PATCHES,
  skidPatchAngles,
  skidPatchCount,
  suggestSkidImprovements,
} from "./skid";
import type { DrivetrainConfig } from "./types";
import { parseWheelSize, wheelCircumferenceM, wheelDiameterMm } from "./wheels";

const wheel700x25 = { beadSeatDiameterMm: 622, tireWidthMm: 25 };

const street: DrivetrainConfig = {
  chainringTeeth: 46,
  cogTeeth: 17,
  wheel: wheel700x25,
  crankLengthMm: 170,
  ambidextrousSkidder: false,
};

const track: DrivetrainConfig = {
  ...street,
  chainringTeeth: 48,
  cogTeeth: 16,
};

describe("wheels", () => {
  it("computes diameter from bead seat + tire", () => {
    expect(wheelDiameterMm(wheel700x25)).toBe(672);
    expect(wheelDiameterMm({ beadSeatDiameterMm: 584, tireWidthMm: 23 })).toBe(
      630,
    );
    expect(wheelDiameterMm({ beadSeatDiameterMm: 559, tireWidthMm: 40 })).toBe(
      639,
    );
  });

  it("computes circumference in meters", () => {
    expect(wheelCircumferenceM(wheel700x25)).toBeCloseTo(2.1112, 4);
  });

  it("parses wheel size ids", () => {
    expect(parseWheelSize("700c")).toBe("700c");
    expect(parseWheelSize("650b")).toBe("650b");
    expect(parseWheelSize("26in")).toBe("26in");
    expect(parseWheelSize("650c")).toBe("700c");
    expect(parseWheelSize("nope")).toBe("700c");
  });
});

describe("derived metrics", () => {
  it("matches published gear charts for 48/16 on 700x25c", () => {
    const m = deriveMetrics(track);
    expect(m.ratio).toBe(3);
    expect(m.gearInches).toBeCloseTo(79.37, 2);
    expect(m.developmentMeters).toBeCloseTo(6.33, 2);
    expect(m.rolloutMeters).toBe(m.developmentMeters);
    expect(m.gainRatio).toBeCloseTo(5.93, 2);
    expect(m.skidPatches).toBe(1);
  });

  it("computes speed at cadence for 46/17 on 700x25c", () => {
    const m = deriveMetrics(street);
    const row90 = m.speeds.find((r) => r.cadenceRpm === 90);
    expect(row90?.speedKmh).toBeCloseTo(30.85, 2);
    expect(row90?.speedMph).toBeCloseTo(19.17, 2);
  });

  it("uses taped circumference when set", () => {
    const taped = {
      ...street,
      wheel: { ...wheel700x25, circumferenceMm: 2130 },
    };
    const unset = deriveMetrics(street);
    const set = deriveMetrics(taped);
    expect(set.developmentMeters).toBeCloseTo((46 / 17) * 2.13, 5);
    expect(set.wheelDiameterMm).toBeCloseTo(2130 / Math.PI, 5);
    expect(set.skidPatches).toBe(unset.skidPatches);
    expect(set.developmentMeters).not.toBeCloseTo(
      unset.developmentMeters,
      5,
    );
  });

  it("emits one speed row per standard cadence", () => {
    const m = deriveMetrics(street);
    expect(m.speeds.map((r) => r.cadenceRpm)).toEqual(STANDARD_CADENCES);
  });

  it("gain ratio responds to crank length at equal gear inches", () => {
    const short = gainRatio(3, 672, 165);
    const long = gainRatio(3, 672, 175);
    expect(short).toBeGreaterThan(long);
  });
});

describe("clampInt", () => {
  it("clamps, rounds, and falls back", () => {
    expect(clampInt(46, 20, 80, 46)).toBe(46);
    expect(clampInt("46", 20, 80, 46)).toBe(46);
    expect(clampInt(999, 20, 80, 46)).toBe(80);
    expect(clampInt(1, 20, 80, 46)).toBe(20);
    expect(clampInt(46.6, 20, 80, 46)).toBe(47);
    expect(clampInt("abc", 20, 80, 46)).toBe(46);
    expect(clampInt(undefined, 20, 80, 46)).toBe(46);
    expect(clampInt(Number.NaN, 20, 80, 46)).toBe(46);
    expect(clampInt(12, 18, 50, 25)).toBe(18);
    expect(clampInt(60, 18, 50, 25)).toBe(50);
  });
});

describe("snapCrankMm", () => {
  it("keeps stock lengths and snaps the rest toward 170 on ties", () => {
    expect(snapCrankMm(167.5)).toBe(167.5);
    expect(snapCrankMm("172.5")).toBe(172.5);
    expect(snapCrankMm(168)).toBe(167.5);
    expect(snapCrankMm(168.75)).toBe(170);
    expect(snapCrankMm(999)).toBe(175);
    expect(snapCrankMm("abc")).toBe(170);
    expect(snapCrankMm(undefined)).toBe(170);
  });
});

describe("skid patches", () => {
  it("computes gcd", () => {
    expect(gcd(48, 16)).toBe(16);
    expect(gcd(49, 16)).toBe(1);
    expect(gcd(44, 11)).toBe(11);
  });

  it("matches known skid patch counts", () => {
    expect(skidPatchCount(48, 16, false)).toBe(1);
    expect(skidPatchCount(49, 16, false)).toBe(16);
    expect(skidPatchCount(48, 17, false)).toBe(17);
    expect(skidPatchCount(44, 11, false)).toBe(1);
  });

  it("doubles ambidextrous only when the chainring is odd", () => {
    expect(skidPatchCount(46, 17, true)).toBe(17);
    expect(skidPatchCount(48, 16, true)).toBe(1);
    expect(skidPatchCount(49, 16, true)).toBe(32);
  });

  it("lays patches out evenly around the wheel", () => {
    expect(skidPatchAngles(4)).toEqual([0, 90, 180, 270]);
    expect(skidPatchAngles(1)).toEqual([0]);
    expect(skidPatchAngles(0)).toEqual([]);
  });
});

describe("suggestSkidImprovements", () => {
  it("only suggests configs with more patches than current", () => {
    const suggestions = suggestSkidImprovements(track); // 48/16 → 1 patch
    expect(suggestions.length).toBe(3);
    for (const s of suggestions) {
      expect(s.skidPatches).toBeGreaterThan(1);
      expect(s.skidPatches).toBeGreaterThanOrEqual(GOOD_SKID_PATCHES);
    }
  });

  it("prefers closest ratio among ≥8-patch neighbors", () => {
    const suggestions = suggestSkidImprovements(track);
    // 50/17 is the smallest ratio delta from 48/16 that still has ≥8 patches.
    expect(suggestions[0]).toMatchObject({
      chainringTeeth: 50,
      cogTeeth: 17,
      skidPatches: 17,
    });
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1]!.ratioDeltaPct).toBeLessThanOrEqual(
        suggestions[i]!.ratioDeltaPct,
      );
    }
  });

  it("stays within valid tooth ranges", () => {
    const edge: DrivetrainConfig = {
      ...street,
      chainringTeeth: 20,
      cogTeeth: 9,
    };
    for (const s of suggestSkidImprovements(edge)) {
      expect(s.chainringTeeth).toBeGreaterThanOrEqual(20);
      expect(s.cogTeeth).toBeGreaterThanOrEqual(9);
    }
  });
});
