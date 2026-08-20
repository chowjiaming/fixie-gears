import { Show } from "solid-js";
import { Tooltip } from "./Tooltip";

export interface MetricCardProps {
  label: string;
  value: string;
  tooltip: string;
  warning?: boolean;
}

export function MetricCard(props: MetricCardProps) {
  const tooltipId = () =>
    `metric-${props.label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <article
      class={[
        "rounded-lg border border-ink/10 p-4 dark:border-paper/15",
        { "border-accent bg-accent/10": props.warning === true },
      ]}
    >
      <div class="flex items-start justify-between gap-2">
        <p class="text-xs uppercase tracking-wide opacity-70">{props.label}</p>
        <Tooltip id={tooltipId()}>{props.tooltip}</Tooltip>
      </div>
      <p class="mt-1 font-mono text-3xl tabular-nums" aria-live="polite">
        {props.value}
      </p>
      <Show when={props.warning}>
        <p class="mt-2 flex items-center gap-1 text-sm text-accent">
          <span aria-hidden="true">⚠</span>
          <span>Few skid patches — tire wear will concentrate.</span>
        </p>
      </Show>
    </article>
  );
}
