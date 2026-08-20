import { createMemo } from "solid-js";
import { deriveMetrics } from "~/lib/gear/calculations";
import { type CalculatorSearch, toConfig } from "~/lib/search";

export function useCurrentSetup(search: () => CalculatorSearch) {
  const config = createMemo(() => toConfig(search()));
  const metrics = createMemo(() => deriveMetrics(config()));
  return { config, metrics };
}
