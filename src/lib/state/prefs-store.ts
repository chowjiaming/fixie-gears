import { createEffect, createRoot, createStore, onSettled } from "solid-js";

export type Units = "metric" | "imperial";
export type Theme = "light" | "dark" | "system";

export interface Prefs {
  units: Units;
  theme: Theme;
}

const STORAGE_KEY = "fixie:prefs";

const DEFAULTS: Prefs = { units: "metric", theme: "system" };

function isUnits(value: unknown): value is Units {
  return value === "metric" || value === "imperial";
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function parsePrefs(raw: unknown): Prefs {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULTS };
  const rec = raw as Record<string, unknown>;
  return {
    units: isUnits(rec.units) ? rec.units : DEFAULTS.units,
    theme: isTheme(rec.theme) ? rec.theme : DEFAULTS.theme,
  };
}

function readStored(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return parsePrefs(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULTS };
  }
}

function readInitial(): Prefs {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  return readStored();
}

export function isDarkTheme(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyHtmlTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.className = isDarkTheme(theme) ? "dark" : "";
}

export const [prefs, setPrefs] = createRoot(() => {
  const [prefs, setPrefs] = createStore<Prefs>(readInitial());

  createEffect(
    () => ({ units: prefs.units, theme: prefs.theme }),
    (copy) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      }
      applyHtmlTheme(copy.theme);
    },
  );

  onSettled(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (prefs.theme === "system") applyHtmlTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  });

  return [prefs, setPrefs] as const;
});

export function setUnits(units: Units): void {
  setPrefs((d) => {
    d.units = units;
  });
}

export function setTheme(theme: Theme): void {
  setPrefs((d) => {
    d.theme = theme;
  });
}
