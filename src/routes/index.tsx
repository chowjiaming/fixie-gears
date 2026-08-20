import { createFileRoute } from "@tanstack/solid-router";
import { parseCalculatorSearch } from "~/lib/search";
import { useCurrentSetup } from "~/lib/state/setup-store";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) =>
    parseCalculatorSearch(search),
  component: CalculatorPage,
});

function CalculatorPage() {
  const search = Route.useSearch();
  useCurrentSetup(search);
  return <h1>Calculator</h1>;
}
