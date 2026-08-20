import { clampInt, snapCrankMm } from "~/lib/gear/calculations";
import {
  CIRC_MAX_MM,
  CIRC_MIN_MM,
  STAY_DEFAULT_MM,
  STAY_MAX_MM,
  STAY_MIN_MM,
} from "~/lib/gear/chain";
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
  stay: number;
  circ?: number;
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

export function parseCirc(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) return undefined;
  if (n < CIRC_MIN_MM || n > CIRC_MAX_MM) return undefined;
  return n;
}

export function parseCalculatorSearch(
  s: Record<string, unknown>,
): CalculatorSearch {
  const circ = parseCirc(s.circ);
  const result: CalculatorSearch = {
    v: 1,
    chainring: clampInt(s.chainring, 20, 80, 46),
    cog: clampInt(s.cog, 9, 30, 17),
    wheel: parseWheelSize(s.wheel),
    tire: clampInt(s.tire, 18, 50, 25),
    crank: snapCrankMm(s.crank),
    ambi: s.ambi === 1 || s.ambi === "1" ? 1 : 0,
    stay: clampInt(s.stay, STAY_MIN_MM, STAY_MAX_MM, STAY_DEFAULT_MM),
  };
  if (circ !== undefined) result.circ = circ;
  return result;
}

export type CompareSlot = "c1" | "c2" | "c3" | "c4";
export type CompareExtraSlot = "c2" | "c3" | "c4";

export interface CompareColumn {
  slot: CompareSlot;
  bike: CalculatorSearch;
  removable: boolean;
}

export function toConfig(search: CalculatorSearch): DrivetrainConfig {
  return {
    chainringTeeth: search.chainring,
    cogTeeth: search.cog,
    wheel: {
      beadSeatDiameterMm: WHEEL_SIZES[search.wheel].bsdMm,
      tireWidthMm: search.tire,
      ...(search.circ !== undefined ? { circumferenceMm: search.circ } : {}),
    },
    crankLengthMm: search.crank,
    ambidextrousSkidder: search.ambi === 1,
  };
}

export function fromConfig(config: DrivetrainConfig): CalculatorSearch {
  const wheel =
    (Object.keys(WHEEL_SIZES) as WheelSizeId[]).find(
      (id) => WHEEL_SIZES[id].bsdMm === config.wheel.beadSeatDiameterMm,
    ) ?? "700c";
  const circ = parseCirc(config.wheel.circumferenceMm);
  const result: CalculatorSearch = {
    v: 1,
    chainring: config.chainringTeeth,
    cog: config.cogTeeth,
    wheel,
    tire: config.wheel.tireWidthMm,
    crank: config.crankLengthMm,
    ambi: config.ambidextrousSkidder ? 1 : 0,
    stay: STAY_DEFAULT_MM,
  };
  if (circ !== undefined) result.circ = circ;
  return result;
}

export function formatCompareTuple(config: DrivetrainConfig): string {
  const s = fromConfig(config);
  const fields: Array<string | number> = [
    s.chainring,
    s.cog,
    s.wheel,
    s.tire,
    s.crank,
    s.ambi,
  ];
  if (s.circ !== undefined) fields.push(s.circ);
  return fields.join(",");
}

export function parseCompareTuple(raw: unknown): DrivetrainConfig | undefined {
  if (typeof raw !== "string") return undefined;
  const parts = raw.split(",");
  if (parts.length !== 6 && parts.length !== 7) return undefined;
  const [ring, cog, wheel, tire, crank, ambi] = parts;
  return toConfig(
    parseCalculatorSearch({
      chainring: ring,
      cog,
      wheel,
      tire,
      crank,
      ambi,
      ...(parts.length === 7 ? { circ: parts[6] } : {}),
    }),
  );
}

export function applySearchPatch(
  prev: CalculatorSearch,
  partial: Partial<CalculatorSearch>,
): CalculatorSearch {
  const next: CalculatorSearch = { ...prev, ...partial };
  if ("circ" in partial && partial.circ === undefined) {
    delete next.circ;
  }
  return next;
}

export function compactCompareExtras(s: CompareExtras): CompareExtras {
  const present = [s.c2, s.c3, s.c4].filter(
    (t): t is string =>
      typeof t === "string" &&
      t.length > 0 &&
      parseCompareTuple(t) !== undefined,
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

export function extrasAfterAdd(
  bike: CalculatorSearch,
  extras: CompareExtras,
): CompareExtras {
  const compacted = compactCompareExtras(extras);
  const copy = formatCompareTuple(toConfig(bike));
  if (!compacted.c2) return { c2: copy };
  if (!compacted.c3) return { ...compacted, c3: copy };
  if (!compacted.c4) return { ...compacted, c4: copy };
  return compacted;
}

export function extrasAfterRemove(
  extras: CompareExtras,
  slot: CompareExtraSlot,
): CompareExtras {
  return compactCompareExtras({
    c2: slot === "c2" ? undefined : extras.c2,
    c3: slot === "c3" ? undefined : extras.c3,
    c4: slot === "c4" ? undefined : extras.c4,
  });
}

export function buildCompareColumns(
  bike: CalculatorSearch,
  extras: CompareExtras,
): CompareColumn[] {
  const seeded = seedCompareExtras(bike, extras);
  const columns: CompareColumn[] = [{ slot: "c1", bike, removable: false }];
  for (const slot of ["c2", "c3", "c4"] as const) {
    const parsed = parseCompareTuple(seeded[slot]);
    if (!parsed) continue;
    columns.push({
      slot,
      bike: fromConfig(parsed),
      removable: true,
    });
  }
  return columns;
}

export function parseExploreSearch(s: Record<string, unknown>): ExploreSearch {
  const metric =
    s.metric === "dev" || s.metric === "skid" || s.metric === "gi"
      ? s.metric
      : "gi";
  const minSkid = s.minSkid === 8 || s.minSkid === "8" ? 8 : 0;
  return { metric, minSkid };
}
