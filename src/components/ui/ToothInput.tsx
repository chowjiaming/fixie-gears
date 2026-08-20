export interface ToothInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function ToothInput(props: ToothInputProps) {
  const commit = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const step = props.step ?? 1;
    const rounded = Math.round(n / step) * step;
    const next = Math.min(props.max, Math.max(props.min, rounded));
    if (next !== props.value) props.onChange(next);
  };

  return (
    <div class="flex flex-col gap-1">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-sm">{props.label}</span>
        <span class="tabular-nums text-sm opacity-70">
          {props.value}
          {props.unit ? ` ${props.unit}` : ""}
        </span>
      </div>
      <div class="flex items-center gap-2">
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
        <input
          type="number"
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          value={props.value}
          aria-label={`${props.label} value`}
          class="w-16 rounded border border-ink/20 bg-transparent px-2 py-1 text-right tabular-nums dark:border-paper/20"
          onInput={(e) => commit(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}
