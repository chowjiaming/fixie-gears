import { For } from "solid-js";
import { formatGearInches } from "~/lib/format";
import { gearInches, gearRatio, PRESETS } from "~/lib/gear/calculations";
import type { WheelSpec } from "~/lib/gear/types";
import { wheelDiameterMm } from "~/lib/gear/wheels";

export interface PresetChipsProps {
  wheel: WheelSpec;
  onApply: (chainring: number, cog: number) => void;
}

export function PresetChips(props: PresetChipsProps) {
  return (
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium">Presets</p>
      <div class="flex flex-wrap gap-2">
        <For each={PRESETS} keyed={(preset) => preset.name}>
          {(preset) => {
            const subtitle = () =>
              formatGearInches(
                gearInches(
                  gearRatio(preset().chainring, preset().cog),
                  wheelDiameterMm(props.wheel),
                ),
              );
            return (
              <button
                type="button"
                class="focus-ring rounded border border-ink/15 px-3 py-2 text-left text-sm hover:border-accent dark:border-paper/20"
                aria-label={`${preset().name}, ${subtitle()}`}
                onClick={() => props.onApply(preset().chainring, preset().cog)}
              >
                <span class="block font-medium">{preset().name}</span>
                <span class="block tabular-nums text-xs opacity-70">
                  {subtitle()}
                </span>
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
}
