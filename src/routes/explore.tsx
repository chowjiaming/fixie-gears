import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/solid-router";
import { HeatmapGrid } from "~/components/explore/HeatmapGrid";
import {
  type CalculatorSearch,
  type ExploreSearch,
  parseCalculatorSearch,
  parseExploreSearch,
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

function bikeFromSearch(search: CalculatorSearch): CalculatorSearch {
  return {
    v: 1,
    chainring: search.chainring,
    cog: search.cog,
    wheel: search.wheel,
    tire: search.tire,
    crank: search.crank,
    ambi: search.ambi,
    stay: search.stay,
    ...(search.circ !== undefined ? { circ: search.circ } : {}),
  };
}

function ExplorePage() {
  const search = useSearch({ from: "/explore" });
  const navigate = useNavigate({ from: "/explore" });
  const go = useNavigate();

  const patchExplore = (partial: Partial<ExploreSearch>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...partial }),
      replace: true,
    });
  };

  return (
    <div class="flex w-full flex-col gap-4">
      <h1 class="text-xl font-semibold">Explore</h1>
      <p class="text-sm opacity-70">
        Nearby chainrings and cogs on this wheel and crank. Click a cell to open
        it in the calculator.
      </p>
      <HeatmapGrid
        bike={bikeFromSearch(search())}
        metric={search().metric}
        minSkid={search().minSkid}
        onMetricChange={(metric) => patchExplore({ metric })}
        onMinSkidChange={(minSkid) => patchExplore({ minSkid })}
        onSelect={(chainring, cog) => {
          void go({
            to: "/",
            search: { ...bikeFromSearch(search()), chainring, cog },
          });
        }}
      />
    </div>
  );
}
