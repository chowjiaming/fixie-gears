import { For } from "solid-js";
import { prefs, setUnits, type Units } from "~/lib/state/prefs-store";

const OPTIONS: { id: Units; label: string }[] = [
  { id: "metric", label: "Metric" },
  { id: "imperial", label: "Imperial" },
];

export function UnitToggle() {
  return (
    <fieldset
      class="m-0 flex min-w-0 rounded border border-ink/15 p-0 dark:border-paper/20"
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
    </fieldset>
  );
}
