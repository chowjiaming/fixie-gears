import { prefs, setUnits, type Units } from "~/lib/state/prefs-store";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "./SegmentedControl";

const OPTIONS: readonly SegmentedControlOption<Units>[] = [
  { id: "metric", label: "Metric" },
  { id: "imperial", label: "Imperial" },
];

export function UnitToggle() {
  return (
    <SegmentedControl
      legend="Units"
      name="units"
      options={OPTIONS}
      value={prefs.units}
      onChange={setUnits}
    />
  );
}
