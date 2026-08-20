import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { flush } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SavedView } from "~/components/saved/SavedPage";
import { parseCalculatorSearch } from "~/lib/search";
import {
  reloadSavedFromStorage,
  SAVED_STORAGE_KEY,
  saved,
} from "~/lib/state/saved-store";

let dispose: (() => void) | undefined;
let host: HTMLDivElement | undefined;

beforeEach(() => {
  localStorage.removeItem(SAVED_STORAGE_KEY);
  reloadSavedFromStorage();
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  host?.remove();
  host = undefined;
  localStorage.removeItem(SAVED_STORAGE_KEY);
  reloadSavedFromStorage();
});

function renderUi(ui: () => JSX.Element) {
  host = document.createElement("div");
  document.body.appendChild(host);
  dispose = solidRender(ui, host);
  return getQueriesForElement(host);
}

function renderSaved(
  search = parseCalculatorSearch({ chainring: 46, cog: 17 }),
  onLoad: (bike: ReturnType<typeof parseCalculatorSearch>) => void = () =>
    undefined,
) {
  return renderUi(() => <SavedView search={search} onLoad={onLoad} />);
}

describe("SavedPage", () => {
  it("saves the current setup and still lists it after a storage reload", () => {
    const { getByLabelText, getByRole, getByText } = renderSaved();

    fireEvent.input(getByLabelText("Name for current setup"), {
      target: { value: "Track" },
    });
    flush();
    fireEvent.click(getByRole("button", { name: "Save current" }));
    flush();

    expect(getByRole("heading", { name: "Track" })).toBeTruthy();
    expect(getByText(/46\/17/)).toBeTruthy();
    expect(saved.setups).toHaveLength(1);

    dispose?.();
    host?.remove();
    reloadSavedFromStorage();

    const reloaded = renderSaved();
    expect(reloaded.getByRole("heading", { name: "Track" })).toBeTruthy();
    expect(reloaded.getByText(/46\/17/)).toBeTruthy();
  });

  it("rejects an import of { v: 2, setups: [] }", async () => {
    const { getByLabelText, getByRole } = renderSaved();
    const file = new File([JSON.stringify({ v: 2, setups: [] })], "bad.json", {
      type: "application/json",
    });

    fireEvent.change(getByLabelText("Import saved setups JSON"), {
      target: { files: [file] },
    });

    await vi.waitFor(() => {
      expect(getByRole("alert").textContent).toMatch(/unsupported/i);
    });
    expect(saved.setups).toHaveLength(0);
  });

  it("loads a saved setup through onLoad", () => {
    const loaded: Array<ReturnType<typeof parseCalculatorSearch>> = [];
    const { getByLabelText, getByRole } = renderSaved(
      parseCalculatorSearch({ chainring: 48, cog: 16 }),
      (bike) => {
        loaded.push(bike);
      },
    );

    fireEvent.input(getByLabelText("Name for current setup"), {
      target: { value: "Velodrome" },
    });
    flush();
    fireEvent.click(getByRole("button", { name: "Save current" }));
    flush();
    fireEvent.click(getByRole("button", { name: "Load Velodrome" }));
    flush();

    expect(loaded).toEqual([parseCalculatorSearch({ chainring: 48, cog: 16 })]);
  });
});
