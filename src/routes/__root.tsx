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
      <a
        class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:border focus:border-accent focus:bg-paper focus:px-3 focus:py-2 focus:dark:bg-ink"
        href="#main"
      >
        Skip to main content
      </a>
      <header class="flex flex-wrap items-center gap-4 border-b border-ink/10 px-4 py-3 dark:border-paper/15">
        <Link
          to="/"
          search={bike}
          class="focus-ring font-semibold tracking-tight"
        >
          Fixie Gears
        </Link>
        <nav class="flex flex-wrap gap-4">
          <Link
            to="/"
            search={bike}
            class="focus-ring hover:text-accent-ink dark:hover:text-accent"
            activeProps={{
              class:
                "text-accent-ink underline underline-offset-4 dark:text-accent",
            }}
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
            class="focus-ring hover:text-accent-ink dark:hover:text-accent"
            activeProps={{
              class:
                "text-accent-ink underline underline-offset-4 dark:text-accent",
            }}
          >
            Compare
          </Link>
          <Link
            to="/explore"
            search={() => ({ ...bike(), ...parseExploreSearch(raw()) })}
            class="focus-ring hover:text-accent-ink dark:hover:text-accent"
            activeProps={{
              class:
                "text-accent-ink underline underline-offset-4 dark:text-accent",
            }}
          >
            Explore
          </Link>
          <Link
            to="/saved"
            search={bike}
            class="focus-ring hover:text-accent-ink dark:hover:text-accent"
            activeProps={{
              class:
                "text-accent-ink underline underline-offset-4 dark:text-accent",
            }}
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
      <main id="main" class="p-4 sm:p-6" tabindex="-1">
        <Outlet />
      </main>
    </>
  );
}
