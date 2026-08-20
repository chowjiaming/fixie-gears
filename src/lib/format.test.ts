import { describe, expect, it } from "vitest";
import {
  formatDevelopment,
  formatDevelopmentSpoken,
  formatGearInches,
  formatGearInchesSpoken,
  formatRatio,
} from "./format";

describe("existing formatters stay put", () => {
  it("formats with symbols", () => {
    expect(formatRatio(2.70588)).toBe("2.71");
    expect(formatDevelopment(2.1112)).toBe("2.11 m");
    expect(formatGearInches(88.42)).toBe("88.4″");
  });
});

describe("spoken variants", () => {
  it("spells out units for screen readers", () => {
    expect(formatDevelopmentSpoken(2.1112)).toBe("2.11 meters");
    expect(formatGearInchesSpoken(88.42)).toBe("88.4 gear inches");
  });

  it("keeps the same digits as the visible formatters", () => {
    expect(formatDevelopmentSpoken(2.1112).startsWith("2.11")).toBe(true);
    expect(formatGearInchesSpoken(88.42).startsWith("88.4")).toBe(true);
  });

  it("does not say one meters", () => {
    expect(formatDevelopmentSpoken(1)).toBe("1.00 meters");
  });
});
