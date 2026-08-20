import type { JSX } from "@solidjs/web";
import { createSignal, Show } from "solid-js";

export interface TooltipProps {
  id: string;
  children: JSX.Element;
}

export function Tooltip(props: TooltipProps) {
  const [open, setOpen] = createSignal(false);

  return (
    <span class="relative inline-block">
      <button
        type="button"
        class="grid h-6 w-6 place-items-center rounded-full border border-ink/25 text-xs leading-none dark:border-paper/30"
        aria-label="About this metric"
        aria-expanded={open() ? "true" : "false"}
        aria-describedby={open() ? props.id : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        ?
      </button>
      <Show when={open()}>
        <div
          id={props.id}
          role="tooltip"
          class="absolute right-0 top-full z-20 mt-1 w-64 rounded border border-ink/15 bg-paper p-3 text-left text-sm font-normal normal-case tracking-normal text-ink shadow-lg dark:border-paper/20 dark:bg-ink dark:text-paper"
        >
          {props.children}
        </div>
      </Show>
    </span>
  );
}
