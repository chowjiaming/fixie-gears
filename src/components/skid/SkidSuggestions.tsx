import { createMemo, For, Show } from "solid-js";
import { suggestSkidImprovements } from "~/lib/gear/skid";
import type { DrivetrainConfig } from "~/lib/gear/types";

export interface SkidSuggestionsProps {
  config: DrivetrainConfig;
  onApply: (chainring: number, cog: number) => void;
}

function isOddRing(teeth: number): boolean {
  return Math.round(teeth) % 2 === 1;
}

function ratioDeltaLabel(ratioDeltaPct: number): string {
  return `${(ratioDeltaPct * 100).toFixed(1)}% ratio change`;
}

export function SkidSuggestions(props: SkidSuggestionsProps) {
  const suggestions = createMemo(() => suggestSkidImprovements(props.config));
  const evenRingAmbi = createMemo(
    () =>
      props.config.ambidextrousSkidder &&
      !isOddRing(props.config.chainringTeeth),
  );

  return (
    <section class="rounded-lg border border-ink/10 p-4 dark:border-paper/15">
      <h3 class="text-sm font-medium uppercase tracking-wide opacity-70">
        Improve this
      </h3>
      <Show
        when={suggestions().length > 0}
        fallback={
          <div class="mt-3 space-y-2 text-sm opacity-80">
            <p>No nearby tooth change improves skid patches.</p>
            <Show when={evenRingAmbi()}>
              <p>Opposite foot hits the same patches.</p>
            </Show>
          </div>
        }
      >
        <ul class="mt-3 flex flex-col gap-2">
          <For
            each={suggestions()}
            keyed={(s) => `${s.chainringTeeth}/${s.cogTeeth}`}
          >
            {(s) => (
              <li>
                <button
                  type="button"
                  class="focus-ring w-full rounded border border-ink/15 px-3 py-2 text-left text-sm hover:border-accent dark:border-paper/20"
                  aria-label={`Apply ${s().chainringTeeth}/${s().cogTeeth}, ${s().skidPatches} skid patches`}
                  onClick={() =>
                    props.onApply(s().chainringTeeth, s().cogTeeth)
                  }
                >
                  <span class="block font-medium tabular-nums">
                    {s().chainringTeeth}/{s().cogTeeth}
                  </span>
                  <span class="block text-xs opacity-70">
                    {s().skidPatches} patches ·{" "}
                    {ratioDeltaLabel(s().ratioDeltaPct)}
                  </span>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
