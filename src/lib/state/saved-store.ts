import { createRoot, createStore, flush } from "solid-js";
import { ALLOWED_CRANKS_MM } from "~/lib/gear/calculations";
import type { DrivetrainConfig } from "~/lib/gear/types";
import { WHEEL_SIZES } from "~/lib/gear/wheels";
import { toConfig, type CalculatorSearch } from "~/lib/search";

export const SAVED_STORAGE_KEY = "fixie:saved";

export interface SavedSetup {
  id: string;
  name: string;
  savedAt: string;
  config: DrivetrainConfig;
}

export interface SavedExport {
  v: 1;
  setups: SavedSetup[];
}

export type ImportResult =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string };

interface SavedState {
  setups: SavedSetup[];
}

const ALLOWED_CRANKS: ReadonlySet<number> = new Set(ALLOWED_CRANKS_MM);
const ALLOWED_BSD: ReadonlySet<number> = new Set(
  Object.values(WHEEL_SIZES).map((w) => w.bsdMm),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIntInRange(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function cloneConfig(config: DrivetrainConfig): DrivetrainConfig {
  return {
    chainringTeeth: config.chainringTeeth,
    cogTeeth: config.cogTeeth,
    wheel: {
      beadSeatDiameterMm: config.wheel.beadSeatDiameterMm,
      tireWidthMm: config.wheel.tireWidthMm,
    },
    crankLengthMm: config.crankLengthMm,
    ambidextrousSkidder: config.ambidextrousSkidder,
  };
}

function cloneSetup(setup: SavedSetup): SavedSetup {
  return {
    id: setup.id,
    name: setup.name,
    savedAt: setup.savedAt,
    config: cloneConfig(setup.config),
  };
}

function parseConfig(raw: unknown): DrivetrainConfig | undefined {
  if (!isRecord(raw) || !isRecord(raw.wheel)) return undefined;
  const wheel = raw.wheel;
  if (
    !isIntInRange(raw.chainringTeeth, 20, 80) ||
    !isIntInRange(raw.cogTeeth, 9, 30) ||
    !isIntInRange(wheel.tireWidthMm, 18, 50) ||
    typeof wheel.beadSeatDiameterMm !== "number" ||
    !ALLOWED_BSD.has(wheel.beadSeatDiameterMm) ||
    typeof raw.crankLengthMm !== "number" ||
    !ALLOWED_CRANKS.has(raw.crankLengthMm) ||
    typeof raw.ambidextrousSkidder !== "boolean"
  ) {
    return undefined;
  }
  return cloneConfig({
    chainringTeeth: raw.chainringTeeth,
    cogTeeth: raw.cogTeeth,
    wheel: {
      beadSeatDiameterMm: wheel.beadSeatDiameterMm,
      tireWidthMm: wheel.tireWidthMm,
    },
    crankLengthMm: raw.crankLengthMm,
    ambidextrousSkidder: raw.ambidextrousSkidder,
  });
}

export function parseSavedSetup(raw: unknown): SavedSetup | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.id !== "string" || raw.id.length === 0) return undefined;
  if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
    return undefined;
  }
  if (
    typeof raw.savedAt !== "string" ||
    Number.isNaN(Date.parse(raw.savedAt))
  ) {
    return undefined;
  }
  const config = parseConfig(raw.config);
  if (!config) return undefined;
  return {
    id: raw.id,
    name: raw.name.trim(),
    savedAt: raw.savedAt,
    config,
  };
}

/**
 * Unknown `v` refuses the whole file. v1 rows that fail validation are
 * skipped so a mixed export can still merge.
 */
export function parseSavedExport(raw: unknown): ImportResult & {
  setups: SavedSetup[];
} {
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: "This file is not a Fixie Gears export.",
      setups: [],
    };
  }
  if (raw.v !== 1) {
    return {
      ok: false,
      error: "Unsupported saved-setups version.",
      setups: [],
    };
  }
  if (!Array.isArray(raw.setups)) {
    return {
      ok: false,
      error: "This file is not a Fixie Gears export.",
      setups: [],
    };
  }
  const setups: SavedSetup[] = [];
  let skipped = 0;
  for (const row of raw.setups) {
    const parsed = parseSavedSetup(row);
    if (parsed) setups.push(parsed);
    else skipped += 1;
  }
  return { ok: true, imported: setups.length, skipped, setups };
}

function readStored(): SavedSetup[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const setups: SavedSetup[] = [];
    for (const row of parsed) {
      const parsedRow = parseSavedSetup(row);
      if (parsedRow) setups.push(parsedRow);
    }
    return setups;
  } catch {
    return [];
  }
}

function readInitial(): SavedSetup[] {
  if (typeof localStorage === "undefined") return [];
  return readStored();
}

export const [saved, setSaved] = createRoot(() => {
  const [saved, setSaved] = createStore<SavedState>({
    setups: readInitial(),
  });
  return [saved, setSaved] as const;
});

function snapshot(): SavedSetup[] {
  return saved.setups.map(cloneSetup);
}

function persist(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(snapshot()));
}

function commit(mutate: (d: SavedState) => void): void {
  setSaved(mutate);
  // Store writes batch on a microtask; persist needs the applied list.
  flush();
  persist();
}

export function reloadSavedFromStorage(): void {
  const loaded = typeof localStorage === "undefined" ? [] : readStored();
  setSaved((d) => {
    d.setups.splice(0, d.setups.length, ...loaded);
  });
  flush();
}

export function saveSetup(
  name: string,
  config: DrivetrainConfig,
): SavedSetup | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) return undefined;
  const setup: SavedSetup = {
    id: crypto.randomUUID(),
    name: trimmed,
    savedAt: new Date().toISOString(),
    config: cloneConfig(config),
  };
  commit((d) => {
    d.setups.push(setup);
  });
  return cloneSetup(setup);
}

export function compareColumnName(
  indexFromOne: number,
  chainring: number,
  cog: number,
): string {
  return `Compare ${indexFromOne} – ${chainring}/${cog}`;
}

export function saveCompareColumns(bikes: CalculatorSearch[]): void {
  for (const [i, bike] of bikes.entries()) {
    saveSetup(
      compareColumnName(i + 1, bike.chainring, bike.cog),
      toConfig(bike),
    );
  }
}

export function renameSetup(id: string, name: string): void {
  const trimmed = name.trim();
  if (trimmed.length === 0) return;
  commit((d) => {
    const row = d.setups.find((s) => s.id === id);
    if (row) row.name = trimmed;
  });
}

export function duplicateSetup(id: string): SavedSetup | undefined {
  const source = saved.setups.find((s) => s.id === id);
  if (!source) return undefined;
  return saveSetup(`${source.name} copy`, source.config);
}

export function deleteSetup(id: string): void {
  commit((d) => {
    const i = d.setups.findIndex((s) => s.id === id);
    if (i >= 0) d.setups.splice(i, 1);
  });
}

export function exportSaved(): SavedExport {
  return { v: 1, setups: snapshot() };
}

export function exportSavedJson(): string {
  return JSON.stringify(exportSaved(), null, 2);
}

export function importSaved(raw: unknown): ImportResult {
  const parsed = parseSavedExport(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  commit((d) => {
    for (const incoming of parsed.setups) {
      const i = d.setups.findIndex((s) => s.id === incoming.id);
      if (i >= 0) d.setups[i] = cloneSetup(incoming);
      else d.setups.push(cloneSetup(incoming));
    }
  });
  return {
    ok: true,
    imported: parsed.imported,
    skipped: parsed.skipped,
  };
}
