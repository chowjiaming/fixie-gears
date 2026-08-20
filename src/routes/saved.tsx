import { createFileRoute } from "@tanstack/solid-router";
import { parseCalculatorSearch } from "~/lib/search";

export const Route = createFileRoute("/saved")({
  validateSearch: (search: Record<string, unknown>) =>
    parseCalculatorSearch(search),
  component: SavedPage,
});

function SavedPage() {
  return <h1>Saved</h1>;
}
