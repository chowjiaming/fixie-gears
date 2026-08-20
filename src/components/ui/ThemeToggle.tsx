import { prefs, setTheme, type Theme } from "~/lib/state/prefs-store";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "./SegmentedControl";

const OPTIONS: readonly SegmentedControlOption<Theme>[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export function ThemeToggle() {
  return (
    <SegmentedControl
      legend="Theme"
      name="theme"
      options={OPTIONS}
      value={prefs.theme}
      onChange={setTheme}
    />
  );
}
