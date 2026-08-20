import { For } from "solid-js";

export interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  legend: string;
  name: string;
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>(
  props: SegmentedControlProps<T>,
) {
  return (
    <fieldset class="m-0 flex min-w-0 overflow-hidden rounded border border-ink/15 p-0 dark:border-paper/20">
      <legend class="sr-only">{props.legend}</legend>
      <For each={props.options} keyed={(option) => option.id}>
        {(option) => (
          <label class="flex">
            <input
              type="radio"
              class="peer sr-only"
              name={props.name}
              value={option().id}
              checked={props.value === option().id}
              onChange={() => props.onChange(option().id)}
            />
            <span class="cursor-pointer px-2.5 py-1 text-sm transition-colors motion-reduce:transition-none peer-checked:bg-accent peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink dark:peer-focus-visible:outline-accent">
              {option().label}
            </span>
          </label>
        )}
      </For>
    </fieldset>
  );
}
