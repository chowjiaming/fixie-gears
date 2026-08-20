import { createSignal } from "solid-js";
import { CIRC_MAX_MM, CIRC_MIN_MM } from "~/lib/gear/chain";
import { parseCirc } from "~/lib/search";

export interface CircumferenceInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  compact?: boolean;
}

export function CircumferenceInput(props: CircumferenceInputProps) {
  const [draft, setDraft] = createSignal<string | undefined>(undefined);
  let lastSent: number | undefined;
  let sent = false;

  const commit = (raw: string) => {
    setDraft(undefined);
    const next = raw.trim() === "" ? undefined : parseCirc(raw);
    if (sent && Object.is(lastSent, next)) return;
    sent = true;
    lastSent = next;
    props.onChange(next);
  };

  return (
    <label class="flex flex-col gap-1 text-sm">
      {props.label}
      <input
        type="number"
        min={CIRC_MIN_MM}
        max={CIRC_MAX_MM}
        step={1}
        class={[
          "rounded border border-ink/20 bg-transparent dark:border-paper/20",
          props.compact ? "w-full px-2 py-1 text-sm" : "px-2 py-1.5",
        ].join(" ")}
        aria-label="Measured circumference"
        placeholder="optional"
        value={
          draft() ?? (props.value !== undefined ? String(props.value) : "")
        }
        onInput={(e) => setDraft(e.currentTarget.value)}
        onChange={(e) => commit(e.currentTarget.value)}
        onBlur={(e) => commit(e.currentTarget.value)}
      />
    </label>
  );
}
