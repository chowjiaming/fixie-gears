import { For } from "solid-js";
import { prefs, setUnits, type Units } from "~/lib/state/prefs-store";

const OPTIONS: { id: Units; label: string }[] = [
  { id: "metric", label: "Metric" },
  { id: "imperial", label: "Imperial" },
];

export function UnitToggle() {
  return (
    <div
      class="flex rounded border border-ink/15 dark:border-paper/20"
      role="group"
      aria-label="Units"
    >
      <For each={OPTIONS} keyed={(option) => option.id}>
        {(option) => (
          <button
            type="button"
            class={[
              "px-2.5 py-1 text-sm",
              {
                "bg-accent text-paper": prefs.units === option().id,
              },
            ]}
            aria-pressed={prefs.units === option().id ? "true" : "false"}
            onClick={() => setUnits(option().id)}
          >
            {option().label}
          </button>
        )}
      </For>
    </div>
  );
}
