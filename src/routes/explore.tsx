import { createFileRoute } from "@tanstack/solid-router";
import {
  parseCalculatorSearch,
  parseExploreSearch,
  type CalculatorSearch,
  type ExploreSearch,
} from "~/lib/search";

export const Route = createFileRoute("/explore")({
  validateSearch: (
    search: Record<string, unknown>,
  ): CalculatorSearch & ExploreSearch => ({
    ...parseCalculatorSearch(search),
    ...parseExploreSearch(search),
  }),
  component: ExplorePage,
});

function ExplorePage() {
  return <h1>Explore</h1>;
}
