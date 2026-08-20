import { createSignal, Show } from "solid-js";

export interface ToothInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  compact?: boolean;
}

export function ToothInput(props: ToothInputProps) {
  const [draft, setDraft] = createSignal<string | undefined>(undefined);
  let lastSent: number | undefined;

  const commit = (raw: string) => {
    setDraft(undefined);
    if (raw.trim() === "") return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const step = props.step ?? 1;
    const rounded = Math.round(n / step) * step;
    const next = Math.min(props.max, Math.max(props.min, rounded));
    if (next === props.value) {
      lastSent = next;
      return;
    }
    if (lastSent !== undefined && next === lastSent) return;
    lastSent = next;
    props.onChange(next);
  };

  return (
    <div class="flex flex-col gap-1">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm">{props.label}</span>
        <Show when={!props.compact}>
          <span class="tabular-nums text-sm opacity-70">
            {props.value}
            {props.unit ? ` ${props.unit}` : ""}
          </span>
        </Show>
        <Show when={props.compact && props.unit}>
          <span class="text-sm opacity-70">{props.unit}</span>
        </Show>
      </div>
      <div class="flex items-center gap-2">
        <Show when={!props.compact}>
          <input
            type="range"
            min={props.min}
            max={props.max}
            step={props.step ?? 1}
            value={props.value}
            aria-label={props.label}
            class="min-w-0 flex-1 accent-accent"
            onInput={(e) => commit(e.currentTarget.value)}
          />
        </Show>
        <input
          type="number"
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          value={draft() ?? String(props.value)}
          aria-label={`${props.label} value`}
          class={[
            "rounded border border-ink/20 bg-transparent px-2 py-1 text-right tabular-nums dark:border-paper/20",
            props.compact ? "w-full" : "w-16",
          ]}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onChange={(e) => commit(e.currentTarget.value)}
          onBlur={(e) => commit(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}
