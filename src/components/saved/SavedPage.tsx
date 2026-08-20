import { useNavigate, useSearch } from "@tanstack/solid-router";
import { createSignal, For, Show } from "solid-js";
import { formatDevelopment, formatGearInches, formatRatio } from "~/lib/format";
import { deriveMetrics } from "~/lib/gear/calculations";
import { WHEEL_SIZES } from "~/lib/gear/wheels";
import { type CalculatorSearch, fromConfig, toConfig } from "~/lib/search";
import { prefs, type Units } from "~/lib/state/prefs-store";
import {
  deleteSetup,
  duplicateSetup,
  exportSavedJson,
  importSaved,
  renameSetup,
  type SavedSetup,
  saved,
  saveSetup,
} from "~/lib/state/saved-store";

function setupSummary(setup: SavedSetup, units: Units): string {
  const bike = fromConfig(setup.config);
  const metrics = deriveMetrics(setup.config);
  const hero =
    units === "metric"
      ? formatDevelopment(metrics.developmentMeters)
      : formatGearInches(metrics.gearInches);
  const wheel = WHEEL_SIZES[bike.wheel].label;
  return [
    `${bike.chainring}/${bike.cog}`,
    `${wheel} × ${bike.tire} mm`,
    formatRatio(metrics.ratio),
    hero,
    `${metrics.skidPatches} skid patches`,
  ].join(" · ");
}

export function keepCurrentStay(
  bike: CalculatorSearch,
  stay: number,
): CalculatorSearch {
  return { ...bike, stay };
}

export function SavedPage() {
  const search = useSearch({ from: "/saved" });
  const go = useNavigate();
  return (
    <SavedView
      search={search()}
      onLoad={(bike) => {
        void go({
          to: "/",
          search: keepCurrentStay(bike, search().stay),
        });
      }}
    />
  );
}

export function SavedView(props: {
  search: CalculatorSearch;
  onLoad: (bike: CalculatorSearch) => void;
}) {
  const search = () => props.search;
  const [newName, setNewName] = createSignal("");
  const [editingId, setEditingId] = createSignal<string | undefined>();
  const [draftName, setDraftName] = createSignal("");
  const [status, setStatus] = createSignal<string | undefined>();
  const [error, setError] = createSignal<string | undefined>();
  let fileInput: HTMLInputElement | undefined;

  const currentConfig = () => toConfig(search());

  const saveCurrent = () => {
    const created = saveSetup(newName(), currentConfig());
    if (!created) {
      setError("Name this setup before saving.");
      setStatus(undefined);
      return;
    }
    setNewName("");
    setError(undefined);
    setStatus(`Saved “${created.name}”.`);
  };

  const load = (setup: SavedSetup) => {
    props.onLoad(fromConfig(setup.config));
  };

  const startRename = (setup: SavedSetup) => {
    setDraftName(setup.name);
    setEditingId(setup.id);
  };

  const commitRename = (id: string) => {
    renameSetup(id, draftName());
    setEditingId(undefined);
  };

  const onExport = () => {
    const blob = new Blob([exportSavedJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixie-saved.json";
    a.click();
    URL.revokeObjectURL(url);
    setError(undefined);
    setStatus("Exported saved setups.");
  };

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown;
        const result = importSaved(parsed);
        if (!result.ok) {
          setStatus(undefined);
          setError(result.error);
          return;
        }
        setError(undefined);
        const skip =
          result.skipped > 0 ? `, skipped ${result.skipped} invalid` : "";
        setStatus(
          `Imported ${result.imported} setup${result.imported === 1 ? "" : "s"}${skip}.`,
        );
      } catch {
        setStatus(undefined);
        setError("Could not parse that JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div class="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 class="text-xl font-semibold">Saved</h1>
      <p class="text-sm opacity-70">
        Named bikes stay on this device. Loading one opens it in the calculator.
      </p>

      <form
        class="flex flex-col gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/15 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          saveCurrent();
        }}
      >
        <label class="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          Name
          <input
            class="rounded border border-ink/20 bg-transparent px-2 py-1.5 dark:border-paper/20"
            name="name"
            autocomplete="off"
            placeholder={`${search().chainring}/${search().cog}`}
            aria-label="Name for current setup"
            value={newName()}
            onInput={(e) => setNewName(e.currentTarget.value)}
          />
        </label>
        <button
          type="submit"
          class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
        >
          Save current
        </button>
      </form>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
          onClick={onExport}
        >
          Export
        </button>
        <button
          type="button"
          class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
          onClick={() => fileInput?.click()}
        >
          Import
        </button>
        <input
          ref={(el) => {
            fileInput = el;
          }}
          type="file"
          accept="application/json,.json"
          class="sr-only"
          aria-label="Import saved setups JSON"
          onChange={(e) => {
            onImportFile(e.currentTarget.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <Show when={error()}>
        {(message) => (
          <p class="text-sm text-accent" role="alert">
            {message()}
          </p>
        )}
      </Show>
      <Show when={status()}>
        {(message) => (
          <p class="text-sm opacity-70" aria-live="polite">
            {message()}
          </p>
        )}
      </Show>

      <Show
        when={saved.setups.length > 0}
        fallback={
          <p class="text-sm opacity-70">No saved setups on this device.</p>
        }
      >
        <ul class="flex flex-col gap-3">
          <For each={saved.setups} keyed={(setup) => setup.id}>
            {(setup) => {
              return (
                <li class="rounded-lg border border-ink/10 p-4 dark:border-paper/15">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <Show
                      when={editingId() === setup().id}
                      fallback={
                        <h2 class="text-base font-medium">{setup().name}</h2>
                      }
                    >
                      <input
                        class="rounded border border-ink/20 bg-transparent px-2 py-1 text-base dark:border-paper/20"
                        aria-label={`Rename ${setup().name}`}
                        value={draftName()}
                        onInput={(e) => setDraftName(e.currentTarget.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitRename(setup().id);
                          }
                          if (e.key === "Escape") setEditingId(undefined);
                        }}
                        onBlur={() => commitRename(setup().id)}
                      />
                    </Show>
                    <time class="text-xs opacity-60" datetime={setup().savedAt}>
                      {new Date(setup().savedAt).toLocaleString()}
                    </time>
                  </div>
                  <p class="mt-1 font-mono text-sm tabular-nums opacity-80">
                    {setupSummary(setup(), prefs.units)}
                  </p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
                      onClick={() => load(setup())}
                    >
                      {`Load ${setup().name}`}
                    </button>
                    <button
                      type="button"
                      class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
                      onClick={() => startRename(setup())}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
                      onClick={() => duplicateSetup(setup().id)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
                      onClick={() => deleteSetup(setup().id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
}
