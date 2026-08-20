import { CIRC_MAX_MM, CIRC_MIN_MM } from "./chain";
import type { WheelSizeId, WheelSpec } from "./types";

export const WHEEL_SIZES: Record<
  WheelSizeId,
  { label: string; bsdMm: number }
> = {
  "700c": { label: '700c / 29"', bsdMm: 622 },
  "650b": { label: '650b / 27.5"', bsdMm: 584 },
  "26in": { label: '26"', bsdMm: 559 },
};

export function parseWheelSize(value: unknown): WheelSizeId {
  if (value === "700c" || value === "650b" || value === "26in") {
    return value;
  }
  return "700c";
}

function measuredCircumferenceMm(wheel: WheelSpec): number | undefined {
  const n = wheel.circumferenceMm;
  if (
    typeof n !== "number" ||
    !Number.isInteger(n) ||
    n < CIRC_MIN_MM ||
    n > CIRC_MAX_MM
  ) {
    return undefined;
  }
  return n;
}

export function wheelDiameterMm(wheel: WheelSpec): number {
  const circ = measuredCircumferenceMm(wheel);
  if (circ !== undefined) return circ / Math.PI;
  return wheel.beadSeatDiameterMm + 2 * wheel.tireWidthMm;
}

export function wheelCircumferenceM(wheel: WheelSpec): number {
  const circ = measuredCircumferenceMm(wheel);
  if (circ !== undefined) return circ / 1000;
  return (Math.PI * wheelDiameterMm(wheel)) / 1000;
}
