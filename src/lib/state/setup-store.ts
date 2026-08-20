import { createMemo } from "solid-js";
import { deriveMetrics } from "~/lib/gear/calculations";
import { toConfig, type CalculatorSearch } from "~/lib/search";

export function useCurrentSetup(search: () => CalculatorSearch) {
  const config = createMemo(() => toConfig(search()));
  const metrics = createMemo(() => deriveMetrics(config()));
  return { config, metrics };
}
