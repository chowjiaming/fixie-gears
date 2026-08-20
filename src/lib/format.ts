export function formatRatio(n: number): string {
  return n.toFixed(2);
}
export function formatDevelopment(n: number): string {
  return `${n.toFixed(2)} m`;
}
export function formatDevelopmentSpoken(n: number): string {
  return `${n.toFixed(2)} meters`;
}
export function formatGearInches(n: number): string {
  return `${n.toFixed(1)}″`;
}
export function formatGearInchesSpoken(n: number): string {
  return `${n.toFixed(1)} gear inches`;
}
export function formatGain(n: number): string {
  return n.toFixed(2);
}
export function formatSpeed(n: number): string {
  return n.toFixed(1);
}
