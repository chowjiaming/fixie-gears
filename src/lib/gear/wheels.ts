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

export function wheelDiameterMm(wheel: WheelSpec): number {
  return wheel.beadSeatDiameterMm + 2 * wheel.tireWidthMm;
}

export function wheelCircumferenceM(wheel: WheelSpec): number {
  return (Math.PI * wheelDiameterMm(wheel)) / 1000;
}
