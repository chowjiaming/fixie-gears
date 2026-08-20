import { For } from "solid-js";
import { prefs, setTheme, type Theme } from "~/lib/state/prefs-store";

const OPTIONS: { id: Theme; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function ThemeToggle() {
  return (
    <fieldset
      class="m-0 flex min-w-0 rounded border border-ink/15 p-0 dark:border-paper/20"
      aria-label="Theme"
    >
      <For each={OPTIONS} keyed={(option) => option.id}>
        {(option) => (
          <button
            type="button"
            class={[
              "px-2.5 py-1 text-sm",
              {
                "bg-accent text-paper": prefs.theme === option().id,
              },
            ]}
            aria-pressed={prefs.theme === option().id ? "true" : "false"}
            onClick={() => setTheme(option().id)}
          >
            {option().label}
          </button>
        )}
      </For>
    </fieldset>
  );
}
