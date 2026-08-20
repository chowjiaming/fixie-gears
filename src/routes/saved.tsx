import { createFileRoute } from "@tanstack/solid-router";
import { SavedPage } from "~/components/saved/SavedPage";
import { parseCalculatorSearch } from "~/lib/search";

export const Route = createFileRoute("/saved")({
  validateSearch: (search: Record<string, unknown>) =>
    parseCalculatorSearch(search),
  component: SavedPage,
});
