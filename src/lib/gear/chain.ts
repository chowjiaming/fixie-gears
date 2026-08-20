export const STAY_MIN_MM = 350;
export const STAY_MAX_MM = 450;
export const STAY_DEFAULT_MM = 410;
export const CIRC_MIN_MM = 1800;
export const CIRC_MAX_MM = 2500;

export interface ChainLength {
  rawLinks: number;
  evenLinks: number;
  oddLinks: number;
  halfLinkCloser: boolean;
}

function nearestParity(raw: number, even: boolean): number {
  const rounded = Math.round(raw);
  const isEven = rounded % 2 === 0;
  if (isEven === even) return rounded;
  const down = rounded - 1;
  const up = rounded + 1;
  return raw - down <= up - raw ? down : up;
}

export function nearestEvenLinks(raw: number): number {
  return nearestParity(raw, true);
}

export function nearestOddLinks(raw: number): number {
  return nearestParity(raw, false);
}

export function chainLength(
  stayMm: number,
  ring: number,
  cog: number,
): ChainLength {
  const stayIn = stayMm / 25.4;
  const lengthIn = 2 * stayIn + (ring + cog) / 4 + 0.5;
  const rawLinks = lengthIn / 0.5;
  const evenLinks = nearestEvenLinks(rawLinks);
  const oddLinks = nearestOddLinks(rawLinks);
  return {
    rawLinks,
    evenLinks,
    oddLinks,
    halfLinkCloser:
      Math.abs(rawLinks - oddLinks) < Math.abs(rawLinks - evenLinks),
  };
}
