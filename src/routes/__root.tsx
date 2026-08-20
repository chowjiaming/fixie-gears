import {
  createRootRoute,
  Link,
  Outlet,
  useSearch,
} from "@tanstack/solid-router";
import { CopyLinkButton } from "~/components/ui/CopyLinkButton";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { UnitToggle } from "~/components/ui/UnitToggle";
import {
  type CalculatorSearch,
  compactCompareExtras,
  parseCalculatorSearch,
  parseExploreSearch,
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
      <header class="flex flex-wrap items-center gap-4 border-b border-ink/10 px-4 py-3 dark:border-paper/15">
        <span class="font-semibold tracking-tight">Fixie Gears</span>
        <nav class="flex flex-wrap gap-4">
          <Link
            to="/"
            search={bike}
            class="hover:text-accent"
            activeProps={{ class: "text-accent" }}
          >
            Calculator
          </Link>
          <Link
            to="/compare"
            search={() => {
              const rec = raw();
              return {
                ...bike(),
                ...compactCompareExtras({
                  c2: typeof rec.c2 === "string" ? rec.c2 : undefined,
                  c3: typeof rec.c3 === "string" ? rec.c3 : undefined,
                  c4: typeof rec.c4 === "string" ? rec.c4 : undefined,
                }),
              };
            }}
            class="hover:text-accent"
            activeProps={{ class: "text-accent" }}
          >
            Compare
          </Link>
          <Link
            to="/explore"
            search={() => ({ ...bike(), ...parseExploreSearch(raw()) })}
            class="hover:text-accent"
            activeProps={{ class: "text-accent" }}
          >
            Explore
          </Link>
          <Link
            to="/saved"
            search={bike}
            class="hover:text-accent"
            activeProps={{ class: "text-accent" }}
          >
            Saved
          </Link>
        </nav>
        <div class="ml-auto flex flex-wrap items-center gap-3">
          <UnitToggle />
          <ThemeToggle />
          <CopyLinkButton />
        </div>
      </header>
      <main class="p-4">
        <Outlet />
      </main>
    </>
  );
}
