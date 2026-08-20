import { Show, createMemo } from "solid-js";
import { CompareTable } from "~/components/compare/CompareTable";
import {
  buildCompareColumns,
  compactCompareExtras,
  extrasAfterAdd,
  extrasAfterRemove,
  formatCompareTuple,
  seedCompareExtras,
  toConfig,
  type CalculatorSearch,
  type CompareExtras,
  type CompareExtraSlot,
  type CompareSlot,
} from "~/lib/search";
import type { Units } from "~/lib/state/prefs-store";

export type CompareSearch = CalculatorSearch & CompareExtras;

export interface CompareViewProps {
  search: CompareSearch;
  units: Units;
  onSearch: (next: CompareSearch) => void;
}

function bikeFromSearch(search: CalculatorSearch): CalculatorSearch {
  return {
    v: 1,
    chainring: search.chainring,
    cog: search.cog,
    wheel: search.wheel,
    tire: search.tire,
    crank: search.crank,
    ambi: search.ambi,
  };
}

export function CompareView(props: CompareViewProps) {
  const bike = createMemo(() => bikeFromSearch(props.search));
  const extras = createMemo(() =>
    compactCompareExtras({
      c2: props.search.c2,
      c3: props.search.c3,
      c4: props.search.c4,
    }),
  );
  const columns = createMemo(() => buildCompareColumns(bike(), extras()));

  const commit = (nextBike: CalculatorSearch, nextExtras: CompareExtras) => {
    const seeded = seedCompareExtras(
      nextBike,
      compactCompareExtras(nextExtras),
    );
    props.onSearch({ ...nextBike, ...seeded });
  };

  const onChange = (slot: CompareSlot, partial: Partial<CalculatorSearch>) => {
    if (slot === "c1") {
      commit({ ...bike(), ...partial }, extras());
      return;
    }
    const col = columns().find((c) => c.slot === slot);
    if (!col) return;
    const updated = { ...col.bike, ...partial };
    commit(bike(), {
      ...extras(),
      [slot]: formatCompareTuple(toConfig(updated)),
    });
  };

  const onRemove = (slot: CompareExtraSlot) => {
    commit(bike(), extrasAfterRemove(extras(), slot));
  };

  const onAdd = () => {
    commit(bike(), extrasAfterAdd(bike(), extras()));
  };

  return (
    <div class="mx-auto flex max-w-6xl flex-col gap-4">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h1 class="text-xl font-semibold">Compare</h1>
        <Show when={columns().length < 4}>
          <button
            type="button"
            class="rounded border border-ink/20 px-3 py-1.5 text-sm hover:border-accent dark:border-paper/20"
            onClick={onAdd}
          >
            Add column
          </button>
        </Show>
      </div>
      <p class="text-sm opacity-70">
        Column 1 is your current setup. Editing it updates the calculator too.
      </p>
      <CompareTable
        columns={columns()}
        units={props.units}
        onChange={onChange}
        onRemove={onRemove}
      />
    </div>
  );
}
