import { createMemo, Show } from "solid-js";
import { Tooltip } from "~/components/ui/Tooltip";
import { chainLength } from "~/lib/gear/chain";

const CHAIN_TIP =
  "Chain length in ½″ links: 2 × chainstay (inches) + (ring + cog) / 4 + 0.5, then round. Connecting-pin chains want an even count. An odd count needs a half-link.";

const HALF_LINK_WARNING =
  "Even chain won’t tension well. Use a half-link, or change ring or cog by 2 teeth.";

export interface ChainPanelProps {
  stay: number;
  ring: number;
  cog: number;
}

export function ChainPanel(props: ChainPanelProps) {
  const chain = createMemo(() =>
    chainLength(props.stay, props.ring, props.cog),
  );

  return (
    <div class="rounded-lg border border-ink/10 p-4 dark:border-paper/15">
      <div class="flex items-start justify-between gap-2">
        <h2 class="text-sm font-medium uppercase tracking-wide opacity-70">
          Chain
        </h2>
        <Tooltip id="chain-length">{CHAIN_TIP}</Tooltip>
      </div>
      <p class="mt-1 font-mono text-3xl tabular-nums" aria-live="polite">
        {`${chain().evenLinks} links`}
      </p>
      <p class="mt-1 text-sm opacity-70">
        {`${chain().oddLinks} with a half-link`}
      </p>
      <Show when={chain().halfLinkCloser}>
        <p class="mt-2 flex items-start gap-1 text-sm text-accent">
          <span aria-hidden="true">⚠</span>
          <span>{HALF_LINK_WARNING}</span>
        </p>
      </Show>
    </div>
  );
}
