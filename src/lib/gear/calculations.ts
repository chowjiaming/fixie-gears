import { skidPatchCount } from "./skid";
import type { DerivedMetrics, DrivetrainConfig, SpeedRow } from "./types";
import { wheelCircumferenceM, wheelDiameterMm } from "./wheels";

export const STANDARD_CADENCES = [40, 60, 70, 80, 90, 100, 110, 120, 140];

export const MM_PER_INCH = 25.4;
export const KM_PER_MILE = 1.609344;

export const ALLOWED_CRANKS_MM = [165, 167.5, 170, 172.5, 175] as const;

/** Parse unknown input to an int in [min, max]; fallback when unparsable. */
export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Snap to a stock crank length. Equal distance to two sizes resolves
 * toward 170 (the default).
 */
export function snapCrankMm(value: unknown, fallback = 170): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  let best = fallback;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const crank of ALLOWED_CRANKS_MM) {
    const dist = Math.abs(crank - n);
    const closerToDefault =
      dist === bestDist && Math.abs(crank - 170) < Math.abs(best - 170);
    if (dist < bestDist || closerToDefault) {
      best = crank;
      bestDist = dist;
    }
  }
  return best;
}

export function gearRatio(chainringTeeth: number, cogTeeth: number): number {
  return chainringTeeth / cogTeeth;
}

export function gearInches(ratio: number, diameterMm: number): number {
  return ratio * (diameterMm / MM_PER_INCH);
}

export function developmentMeters(
  ratio: number,
  circumferenceM: number,
): number {
  return ratio * circumferenceM;
}

export function gainRatio(
  ratio: number,
  diameterMm: number,
  crankLengthMm: number,
): number {
  return (diameterMm / 2 / crankLengthMm) * ratio;
}

export function speedKmh(cadenceRpm: number, developmentM: number): number {
  return (cadenceRpm * developmentM * 60) / 1000;
}

export function kmhToMph(kmh: number): number {
  return kmh / KM_PER_MILE;
}

export function deriveMetrics(config: DrivetrainConfig): DerivedMetrics {
  const ratio = gearRatio(config.chainringTeeth, config.cogTeeth);
  const diameterMm = wheelDiameterMm(config.wheel);
  const circumferenceM = wheelCircumferenceM(config.wheel);
  const development = developmentMeters(ratio, circumferenceM);

  const speeds: SpeedRow[] = STANDARD_CADENCES.map((cadenceRpm) => {
    const kmh = speedKmh(cadenceRpm, development);
    return { cadenceRpm, speedKmh: kmh, speedMph: kmhToMph(kmh) };
  });

  return {
    ratio,
    gearInches: gearInches(ratio, diameterMm),
    developmentMeters: development,
    gainRatio: gainRatio(ratio, diameterMm, config.crankLengthMm),
    rolloutMeters: development,
    wheelDiameterMm: diameterMm,
    skidPatches: skidPatchCount(
      config.chainringTeeth,
      config.cogTeeth,
      config.ambidextrousSkidder,
    ),
    speeds,
  };
}

export const PRESETS = [
  { name: "Track sprint", chainring: 52, cog: 14 },
  { name: "Track endurance", chainring: 48, cog: 15 },
  { name: "Street all-rounder", chainring: 46, cog: 17 },
  { name: "Hilly city", chainring: 44, cog: 17 },
  { name: "Track 48/14", chainring: 48, cog: 14 },
] as const;
