import {
  createRootRoute,
  Link,
  Outlet,
  useSearch,
} from "@tanstack/solid-router";
import {
  parseCalculatorSearch,
  parseExploreSearch,
  type CalculatorSearch,
} from "~/lib/search";

export const Route = createRootRoute({
  component: RootLayout,
});

function searchRecord(search: object): Record<string, unknown> {
  return { ...search } as Record<string, unknown>;
}

function RootLayout() {
  const search = useSearch({ strict: false });
  const raw = () => searchRecord(search());
  const bike = (): CalculatorSearch => parseCalculatorSearch(raw());

  return (
    <>
      <header class="flex items-center gap-6 border-b px-4 py-3">
        <span class="font-semibold">Fixie Gears</span>
        <nav class="flex gap-4">
          <Link to="/" search={bike}>
            Calculator
          </Link>
          <Link to="/compare" search={bike}>
            Compare
          </Link>
          <Link
            to="/explore"
            search={() => ({ ...bike(), ...parseExploreSearch(raw()) })}
          >
            Explore
          </Link>
          <Link to="/saved" search={bike}>
            Saved
          </Link>
        </nav>
      </header>
      <main class="p-4">
        <Outlet />
      </main>
    </>
  );
}
