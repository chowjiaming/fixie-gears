import { createMemo, createSignal, Show } from "solid-js";
import { CompareTable } from "~/components/compare/CompareTable";
import { Button } from "~/components/ui/Button";
import {
  applySearchPatch,
  buildCompareColumns,
  type CalculatorSearch,
  type CompareExtraSlot,
  type CompareExtras,
  type CompareSlot,
  compactCompareExtras,
  extrasAfterAdd,
  extrasAfterRemove,
  formatCompareTuple,
  seedCompareExtras,
  toConfig,
} from "~/lib/search";
import type { Units } from "~/lib/state/prefs-store";
import { saveCompareColumns } from "~/lib/state/saved-store";

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
    stay: search.stay,
    ...(search.circ !== undefined ? { circ: search.circ } : {}),
  };
}

export function CompareView(props: CompareViewProps) {
  const [saveAllStatus, setSaveAllStatus] = createSignal<string | undefined>();
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
      commit(applySearchPatch(bike(), partial), extras());
      return;
    }
    const col = columns().find((c) => c.slot === slot);
    if (!col) return;
    const updated = applySearchPatch(col.bike, partial);
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

  const onSaveAll = () => {
    const cols = columns();
    saveCompareColumns(cols.map((c) => c.bike));
    setSaveAllStatus(`Saved ${cols.length} setups.`);
  };

  return (
    <div class="mx-auto flex max-w-6xl flex-col gap-4">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h1 class="text-xl font-semibold">Compare</h1>
        <div class="flex flex-wrap items-center gap-2">
          <Button onClick={onSaveAll}>Save all</Button>
          <Show when={columns().length < 4}>
            <Button onClick={onAdd}>Add column</Button>
          </Show>
        </div>
      </div>
      <p class="text-sm opacity-70">
        Column 1 is your current setup. Editing it updates the calculator too.
      </p>
      <Show when={saveAllStatus()}>
        {(message) => (
          <p class="text-sm opacity-70" aria-live="polite">
            {message()}
          </p>
        )}
      </Show>
      <CompareTable
        columns={columns()}
        units={props.units}
        onChange={onChange}
        onRemove={onRemove}
      />
    </div>
  );
}
