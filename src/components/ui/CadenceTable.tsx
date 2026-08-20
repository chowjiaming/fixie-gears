import { For } from "solid-js";
import { formatSpeed } from "~/lib/format";
import type { Units } from "~/lib/state/prefs-store";
import type { SpeedRow } from "~/lib/gear/types";

export interface CadenceTableProps {
  speeds: SpeedRow[];
  units: Units;
}

export function CadenceTable(props: CadenceTableProps) {
  const unitLabel = () => (props.units === "metric" ? "km/h" : "mph");
  const speedOf = (row: SpeedRow) =>
    props.units === "metric" ? row.speedKmh : row.speedMph;

  return (
    <table class="w-full text-left text-sm">
      <caption class="sr-only">Speed at cadence</caption>
      <thead>
        <tr class="border-b border-ink/10 dark:border-paper/15">
          <th scope="col" class="py-2 pr-4 font-medium">
            Cadence (rpm)
          </th>
          <th scope="col" class="py-2 font-medium">
            Speed ({unitLabel()})
          </th>
        </tr>
      </thead>
      <tbody>
        <For each={props.speeds} keyed={(row) => row.cadenceRpm}>
          {(row) => (
            <tr
              aria-current={row().cadenceRpm === 90 ? "true" : undefined}
              class={{
                "bg-accent/15 font-medium": row().cadenceRpm === 90,
              }}
            >
              <td class="py-1.5 pr-4 tabular-nums">{row().cadenceRpm}</td>
              <td class="py-1.5 tabular-nums">{formatSpeed(speedOf(row()))}</td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
