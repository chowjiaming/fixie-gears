import { For, Show } from "solid-js";
import { Button } from "~/components/ui/Button";
import { CircumferenceInput } from "~/components/ui/CircumferenceInput";
import { ToothInput } from "~/components/ui/ToothInput";
import { ALLOWED_CRANKS_MM, snapCrankMm } from "~/lib/gear/calculations";
import type { WheelSizeId } from "~/lib/gear/types";
import { parseWheelSize, WHEEL_SIZES } from "~/lib/gear/wheels";
import type { CalculatorSearch } from "~/lib/search";

const WHEEL_IDS: WheelSizeId[] = ["700c", "650b", "26in"];

const selectClass =
  "focus-ring w-full rounded border border-ink/20 bg-transparent px-2 py-1 text-sm dark:border-paper/20";

export interface CompareColumnHeaderProps {
  index: number;
  bike: CalculatorSearch;
  removable: boolean;
  onChange: (partial: Partial<CalculatorSearch>) => void;
  onRemove: () => void;
}

export function CompareColumnHeader(props: CompareColumnHeaderProps) {
  const title = () =>
    `Setup ${props.index} · ${props.bike.chainring}/${props.bike.cog}`;

  return (
    <fieldset class="flex min-w-[11rem] flex-col gap-2 text-left">
      <legend class="mb-1 w-full font-medium">{title()}</legend>
      <Show when={props.removable}>
        <span class="self-start">
          <Button
            ariaLabel={`Remove setup ${props.index}`}
            onClick={() => props.onRemove()}
          >
            Remove
          </Button>
        </span>
      </Show>
      <ToothInput
        compact
        label="Chainring"
        value={props.bike.chainring}
        min={20}
        max={80}
        onChange={(chainring) => props.onChange({ chainring })}
      />
      <ToothInput
        compact
        label="Cog"
        value={props.bike.cog}
        min={9}
        max={30}
        onChange={(cog) => props.onChange({ cog })}
      />
      <label class="flex flex-col gap-1 text-sm">
        Wheel
        <select
          class={selectClass}
          aria-label="Wheel size"
          value={props.bike.wheel}
          onChange={(e) =>
            props.onChange({
              wheel: parseWheelSize(e.currentTarget.value),
            })
          }
        >
          <For each={WHEEL_IDS} keyed={(id) => id}>
            {(id) => <option value={id()}>{WHEEL_SIZES[id()].label}</option>}
          </For>
        </select>
      </label>
      <ToothInput
        compact
        label="Tire"
        value={props.bike.tire}
        min={18}
        max={50}
        unit="mm"
        onChange={(tire) => props.onChange({ tire })}
      />
      <CircumferenceInput
        compact
        label="Circ"
        value={props.bike.circ}
        onChange={(circ) => props.onChange({ circ })}
      />
      <label class="flex flex-col gap-1 text-sm">
        Crank
        <select
          class={selectClass}
          aria-label="Crank length"
          value={String(props.bike.crank)}
          onChange={(e) =>
            props.onChange({ crank: snapCrankMm(e.currentTarget.value) })
          }
        >
          <For each={ALLOWED_CRANKS_MM} keyed={(mm) => mm}>
            {(mm) => <option value={String(mm())}>{`${mm()} mm`}</option>}
          </For>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="focus-ring accent-accent"
          aria-label="Ambidextrous skidder"
          checked={props.bike.ambi === 1}
          onChange={(e) =>
            props.onChange({ ambi: e.currentTarget.checked ? 1 : 0 })
          }
        />
        Ambi
      </label>
    </fieldset>
  );
}
