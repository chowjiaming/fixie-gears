import { createFileRoute } from "@tanstack/solid-router";
import { ComparePage } from "~/components/compare/ComparePage";
import {
  type CalculatorSearch,
  type CompareExtras,
  parseCalculatorSearch,
  seedCompareExtras,
} from "~/lib/search";

export const Route = createFileRoute("/compare")({
  validateSearch: (
    search: Record<string, unknown>,
  ): CalculatorSearch & CompareExtras => {
    const bike = parseCalculatorSearch(search);
    const extras = seedCompareExtras(bike, {
      c2: typeof search.c2 === "string" ? search.c2 : undefined,
      c3: typeof search.c3 === "string" ? search.c3 : undefined,
      c4: typeof search.c4 === "string" ? search.c4 : undefined,
    });
    return { ...bike, ...extras };
  },
  component: ComparePage,
});
