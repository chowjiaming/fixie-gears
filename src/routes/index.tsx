import { createFileRoute } from "@tanstack/solid-router";
import { CalculatorPage } from "~/components/calculator/CalculatorPage";
import { parseCalculatorSearch } from "~/lib/search";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) =>
    parseCalculatorSearch(search),
  component: CalculatorPage,
});
