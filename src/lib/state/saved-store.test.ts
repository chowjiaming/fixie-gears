import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCalculatorSearch, toConfig } from "~/lib/search";
import {
  compareColumnName,
  deleteSetup,
  duplicateSetup,
  exportSaved,
  importSaved,
  reloadSavedFromStorage,
  renameSetup,
  SAVED_STORAGE_KEY,
  saveCompareColumns,
  saved,
  saveSetup,
} from "./saved-store";

const SAMPLE = toConfig(parseCalculatorSearch({}));
const TRACK = toConfig(
  parseCalculatorSearch({
    chainring: 48,
    cog: 16,
    wheel: "700c",
    tire: 25,
    crank: 165,
    ambi: 1,
  }),
);

function storedRows(): unknown {
  const raw = localStorage.getItem(SAVED_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as unknown) : null;
}

beforeEach(() => {
  localStorage.removeItem(SAVED_STORAGE_KEY);
  reloadSavedFromStorage();
});

afterEach(() => {
  localStorage.removeItem(SAVED_STORAGE_KEY);
  reloadSavedFromStorage();
});

describe("saved-store", () => {
  it("round-trips a save through localStorage", () => {
    const created = saveSetup("Track", SAMPLE);
    expect(created).toMatchObject({
      name: "Track",
      config: SAMPLE,
    });
    expect(created?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const persisted = storedRows();
    expect(Array.isArray(persisted)).toBe(true);
    const row = (persisted as Record<string, unknown>[])[0]!;
    expect(Object.keys(row).sort()).toEqual([
      "config",
      "id",
      "name",
      "savedAt",
    ]);
    expect(Object.keys(row.config as object).sort()).toEqual([
      "ambidextrousSkidder",
      "chainringTeeth",
      "cogTeeth",
      "crankLengthMm",
      "wheel",
    ]);
    expect(row).not.toHaveProperty("ratio");
    expect(row).not.toHaveProperty("gearInches");

    reloadSavedFromStorage();
    expect(saved.setups).toHaveLength(1);
    expect(saved.setups[0]?.name).toBe("Track");
    expect(saved.setups[0]?.config).toEqual(SAMPLE);
    expect(saved.setups[0]?.id).toBe(created?.id);
  });

  it("rejects an import with unknown version", () => {
    saveSetup("Keep me", SAMPLE);
    const result = importSaved({ v: 2, setups: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unsupported/i);
    }
    expect(saved.setups).toHaveLength(1);
    expect(saved.setups[0]?.name).toBe("Keep me");
  });

  it("merges v1 rows and skips invalid ones", () => {
    const existing = saveSetup("Original", SAMPLE);
    expect(existing).toBeTruthy();
    const result = importSaved({
      v: 1,
      setups: [
        {
          id: existing!.id,
          name: "Overwritten",
          savedAt: "2026-08-20T12:00:00.000Z",
          config: TRACK,
        },
        {
          id: "new-id",
          name: "Street",
          savedAt: "2026-08-20T13:00:00.000Z",
          config: SAMPLE,
        },
        { id: "bad", name: "Nope" },
        {
          id: "derived",
          name: "Derived",
          savedAt: "2026-08-20T14:00:00.000Z",
          config: { ...SAMPLE, ratio: 2.71 },
        },
      ],
    });
    expect(result).toEqual({ ok: true, imported: 3, skipped: 1 });
    expect(saved.setups).toHaveLength(3);
    expect(saved.setups[0]?.name).toBe("Overwritten");
    expect(saved.setups[0]?.config).toEqual(TRACK);
    expect(saved.setups[0]?.config).not.toHaveProperty("ratio");
    expect(saved.setups[1]?.id).toBe("new-id");
    expect(saved.setups[1]?.name).toBe("Street");
    expect(saved.setups[2]?.name).toBe("Derived");
    expect(saved.setups[2]?.config).not.toHaveProperty("ratio");
  });

  it("renames, duplicates, and deletes", () => {
    const created = saveSetup("Track", SAMPLE);
    expect(created).toBeTruthy();
    renameSetup(created!.id, "  Velodrome  ");
    expect(saved.setups[0]?.name).toBe("Velodrome");

    const copy = duplicateSetup(created!.id);
    expect(copy?.name).toBe("Velodrome copy");
    expect(copy?.id).not.toBe(created!.id);
    expect(copy?.config).toEqual(SAMPLE);
    expect(saved.setups).toHaveLength(2);

    deleteSetup(created!.id);
    expect(saved.setups).toHaveLength(1);
    expect(saved.setups[0]?.id).toBe(copy?.id);
  });

  it("saves compare columns with Compare N – ring/cog names", () => {
    const bike = parseCalculatorSearch({ chainring: 46, cog: 17 });
    saveCompareColumns([bike, { ...bike, cog: 18 }, { ...bike, cog: 16 }]);
    expect(saved.setups.map((s) => s.name)).toEqual([
      compareColumnName(1, 46, 17),
      compareColumnName(2, 46, 18),
      compareColumnName(3, 46, 16),
    ]);
    expect(compareColumnName(1, 46, 17)).toBe("Compare 1 – 46/17");
  });

  it("export envelope is v1 without derived metrics", () => {
    saveSetup("Track", SAMPLE);
    const file = exportSaved();
    expect(file.v).toBe(1);
    expect(file.setups).toHaveLength(1);
    expect(Object.keys(file.setups[0]!).sort()).toEqual([
      "config",
      "id",
      "name",
      "savedAt",
    ]);
  });

  it("round-trips optional circumferenceMm and drops invalid circ", () => {
    const taped = toConfig(parseCalculatorSearch({ circ: 2130 }));
    saveSetup("Taped", taped);
    reloadSavedFromStorage();
    expect(saved.setups[0]?.config.wheel.circumferenceMm).toBe(2130);
    expect(JSON.stringify(exportSaved())).not.toMatch(/"stay"/);

    const result = importSaved({
      v: 1,
      setups: [
        {
          id: "keep",
          name: "Bad circ",
          savedAt: "2026-08-20T12:00:00.000Z",
          config: {
            ...SAMPLE,
            wheel: { ...SAMPLE.wheel, circumferenceMm: 1000 },
          },
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(
      saved.setups.find((s) => s.id === "keep")?.config.wheel.circumferenceMm,
    ).toBeUndefined();
  });
});
