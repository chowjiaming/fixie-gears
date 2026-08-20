import { clampInt, snapCrankMm } from "~/lib/gear/calculations";
import type { DrivetrainConfig, WheelSizeId } from "~/lib/gear/types";
import { parseWheelSize, WHEEL_SIZES } from "~/lib/gear/wheels";

export interface CalculatorSearch {
  v: 1;
  chainring: number;
  cog: number;
  wheel: WheelSizeId;
  tire: number;
  crank: number;
  ambi: 0 | 1;
}

export interface CompareExtras {
  c2?: string;
  c3?: string;
  c4?: string;
}

export interface ExploreSearch {
  metric: "gi" | "dev" | "skid";
  minSkid: 0 | 8;
}

export function parseCalculatorSearch(
  s: Record<string, unknown>,
): CalculatorSearch {
  return {
    v: 1,
    chainring: clampInt(s.chainring, 20, 80, 46),
    cog: clampInt(s.cog, 9, 30, 17),
    wheel: parseWheelSize(s.wheel),
    tire: clampInt(s.tire, 18, 50, 25),
    crank: snapCrankMm(s.crank),
    ambi: s.ambi === 1 || s.ambi === "1" ? 1 : 0,
  };
}

export function toConfig(search: CalculatorSearch): DrivetrainConfig {
  return {
    chainringTeeth: search.chainring,
    cogTeeth: search.cog,
    wheel: {
      beadSeatDiameterMm: WHEEL_SIZES[search.wheel].bsdMm,
      tireWidthMm: search.tire,
    },
    crankLengthMm: search.crank,
    ambidextrousSkidder: search.ambi === 1,
  };
}

export function formatCompareTuple(config: DrivetrainConfig): string {
  const wheel =
    (Object.keys(WHEEL_SIZES) as WheelSizeId[]).find(
      (id) => WHEEL_SIZES[id].bsdMm === config.wheel.beadSeatDiameterMm,
    ) ?? "700c";
  return [
    config.chainringTeeth,
    config.cogTeeth,
    wheel,
    config.wheel.tireWidthMm,
    config.crankLengthMm,
    config.ambidextrousSkidder ? 1 : 0,
  ].join(",");
}

export function parseCompareTuple(raw: unknown): DrivetrainConfig | undefined {
  if (typeof raw !== "string") return undefined;
  const parts = raw.split(",");
  if (parts.length !== 6) return undefined;
  const [ring, cog, wheel, tire, crank, ambi] = parts;
  return toConfig(
    parseCalculatorSearch({
      chainring: ring,
      cog,
      wheel,
      tire,
      crank,
      ambi,
    }),
  );
}

export function compactCompareExtras(s: CompareExtras): CompareExtras {
  const present = [s.c2, s.c3, s.c4].filter(
    (t): t is string =>
      typeof t === "string" && t.length > 0 && parseCompareTuple(t) !== undefined,
  );
  const out: CompareExtras = {};
  if (present[0]) out.c2 = present[0];
  if (present[1]) out.c3 = present[1];
  if (present[2]) out.c4 = present[2];
  return out;
}

export function seedCompareExtras(
  bike: CalculatorSearch,
  extras: CompareExtras,
): CompareExtras {
  const compacted = compactCompareExtras(extras);
  if (compacted.c2) return compacted;
  const config = toConfig(bike);
  const plus = { ...config, cogTeeth: clampInt(bike.cog + 1, 9, 30, 18) };
  const minus = { ...config, cogTeeth: clampInt(bike.cog - 1, 9, 30, 16) };
  return {
    c2: formatCompareTuple(plus),
    c3: formatCompareTuple(minus),
  };
}

export function parseExploreSearch(s: Record<string, unknown>): ExploreSearch {
  const metric =
    s.metric === "dev" || s.metric === "skid" || s.metric === "gi"
      ? s.metric
      : "gi";
  const minSkid = s.minSkid === 8 || s.minSkid === "8" ? 8 : 0;
  return { metric, minSkid };
}
