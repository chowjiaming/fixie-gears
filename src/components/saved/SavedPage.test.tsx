import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { flush } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { keepCurrentStay, SavedView } from "~/components/saved/SavedPage";
import { STAY_DEFAULT_MM } from "~/lib/gear/chain";
import { fromConfig, parseCalculatorSearch, toConfig } from "~/lib/search";
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

function seed(q: ReturnType<typeof renderSaved>, name: string): void {
  fireEvent.input(q.getByLabelText("Name for current setup"), {
    target: { value: name },
  });
  flush();
  fireEvent.click(q.getByRole("button", { name: "Save current" }));
  flush();
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

  it("keepCurrentStay overlays the live stay onto a fromConfig bike", () => {
    const fromSaved = fromConfig(
      toConfig(parseCalculatorSearch({ chainring: 48, cog: 16 })),
    );
    expect(fromSaved.stay).toBe(STAY_DEFAULT_MM);
    expect(keepCurrentStay(fromSaved, 405).stay).toBe(405);
  });

  it("keeps stay 405 when loading a saved bike whose fromConfig stay is 410", () => {
    const loaded: Array<ReturnType<typeof parseCalculatorSearch>> = [];
    const current = parseCalculatorSearch({
      chainring: 48,
      cog: 16,
      stay: 405,
    });
    const { getByLabelText, getByRole } = renderSaved(current, (bike) => {
      loaded.push(keepCurrentStay(bike, current.stay));
    });

    fireEvent.input(getByLabelText("Name for current setup"), {
      target: { value: "Street" },
    });
    flush();
    fireEvent.click(getByRole("button", { name: "Save current" }));
    flush();
    fireEvent.click(getByRole("button", { name: "Load Street" }));
    flush();

    expect(fromConfig(toConfig(current)).stay).toBe(STAY_DEFAULT_MM);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.stay).toBe(405);
    expect(loaded[0]?.chainring).toBe(48);
    expect(loaded[0]?.cog).toBe(16);
  });

  it("requires confirmation before deleting", () => {
    const q = renderSaved();
    seed(q, "Track");
    fireEvent.click(q.getByRole("button", { name: "Delete" }));
    flush();
    expect(q.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(q.getByRole("button", { name: "Confirm delete" })).toBeTruthy();
    expect(q.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(q.getByRole("heading", { name: "Track" })).toBeTruthy();
    expect(saved.setups).toHaveLength(1);
  });

  it("moves focus to Confirm delete when armed", () => {
    const q = renderSaved();
    seed(q, "Track");
    const deleteButton = q.getByRole("button", { name: "Delete" });
    deleteButton.focus();

    fireEvent.click(deleteButton);
    flush();

    expect(document.activeElement).toBe(
      q.getByRole("button", { name: "Confirm delete" }),
    );
  });

  it("returns focus to Delete when cancelled", () => {
    const q = renderSaved();
    seed(q, "Track");
    fireEvent.click(q.getByRole("button", { name: "Delete" }));
    flush();

    fireEvent.click(q.getByRole("button", { name: "Cancel" }));
    flush();

    expect(document.activeElement).toBe(
      q.getByRole("button", { name: "Delete" }),
    );
  });

  it("returns focus to Delete when dismissed with Escape", () => {
    const q = renderSaved();
    seed(q, "Track");
    fireEvent.click(q.getByRole("button", { name: "Delete" }));
    flush();

    fireEvent.keyDown(q.getByRole("button", { name: "Confirm delete" }), {
      key: "Escape",
    });
    flush();

    expect(document.activeElement).toBe(
      q.getByRole("button", { name: "Delete" }),
    );
  });

  it("does not steal focus on initial render or when saving", () => {
    const sentinel = document.createElement("button");
    document.body.appendChild(sentinel);
    sentinel.focus();

    const q = renderSaved();
    expect(document.activeElement).toBe(sentinel);

    const nameInput = q.getByLabelText("Name for current setup");
    nameInput.focus();
    fireEvent.input(nameInput, { target: { value: "Track" } });
    flush();
    fireEvent.click(q.getByRole("button", { name: "Save current" }));
    flush();

    expect(document.activeElement).toBe(nameInput);
    sentinel.remove();
  });

  it("deletes on confirm", () => {
    const q = renderSaved();
    seed(q, "Track");
    fireEvent.click(q.getByRole("button", { name: "Delete" }));
    flush();
    fireEvent.click(q.getByRole("button", { name: "Confirm delete" }));
    flush();
    expect(q.queryByRole("heading", { name: "Track" })).toBeNull();
    expect(saved.setups).toHaveLength(0);
  });

  it("disarms on cancel and on Escape", () => {
    const q = renderSaved();
    seed(q, "Track");
    fireEvent.click(q.getByRole("button", { name: "Delete" }));
    flush();
    fireEvent.click(q.getByRole("button", { name: "Cancel" }));
    flush();
    expect(q.getByRole("button", { name: "Delete" })).toBeTruthy();

    fireEvent.click(q.getByRole("button", { name: "Delete" }));
    flush();
    fireEvent.keyDown(q.getByRole("button", { name: "Confirm delete" }), {
      key: "Escape",
    });
    flush();
    expect(q.getByRole("button", { name: "Delete" })).toBeTruthy();
    expect(saved.setups).toHaveLength(1);
  });

  it("arms only one row at a time", () => {
    const q = renderSaved();
    seed(q, "Track");
    seed(q, "Street");
    fireEvent.click(q.getAllByRole("button", { name: "Delete" })[0]!);
    flush();
    fireEvent.click(q.getAllByRole("button", { name: "Delete" })[0]!);
    flush();
    expect(q.queryAllByRole("button", { name: "Confirm delete" })).toHaveLength(
      1,
    );
    expect(document.activeElement).toBe(
      q.getByRole("button", { name: "Confirm delete" }),
    );
  });

  it("keeps the bike name out of the visible Load label", () => {
    const q = renderSaved();
    seed(q, "Track");
    expect(q.getByRole("button", { name: "Load Track" }).textContent).toBe(
      "Load",
    );
  });
});
