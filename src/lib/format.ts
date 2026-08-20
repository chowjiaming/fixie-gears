const DEVELOPMENT_DECIMAL_PLACES = 2;
const GEAR_INCHES_DECIMAL_PLACES = 1;

export function formatRatio(n: number): string {
  return n.toFixed(2);
}
export function formatDevelopment(n: number): string {
  return `${n.toFixed(DEVELOPMENT_DECIMAL_PLACES)} m`;
}
export function formatDevelopmentSpoken(n: number): string {
  return `${n.toFixed(DEVELOPMENT_DECIMAL_PLACES)} meters`;
}
export function formatGearInches(n: number): string {
  return `${n.toFixed(GEAR_INCHES_DECIMAL_PLACES)}″`;
}
export function formatGearInchesSpoken(n: number): string {
  return `${n.toFixed(GEAR_INCHES_DECIMAL_PLACES)} gear inches`;
}
export function formatGain(n: number): string {
  return n.toFixed(2);
}
export function formatSpeed(n: number): string {
  return n.toFixed(1);
}
