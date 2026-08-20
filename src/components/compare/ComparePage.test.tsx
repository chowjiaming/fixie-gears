import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { parseCalculatorSearch, seedCompareExtras } from "~/lib/search";
import { CompareView, type CompareSearch } from "./CompareView";

let dispose: (() => void) | undefined;
let host: HTMLDivElement | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  host?.remove();
  host = undefined;
});

function renderUi(ui: () => JSX.Element) {
  host = document.createElement("div");
  document.body.appendChild(host);
  dispose = solidRender(ui, host);
  return getQueriesForElement(host);
}

function renderCompare(initial: CompareSearch) {
  const [search, setSearch] = createSignal(initial);
  const queries = renderUi(() => (
    <CompareView search={search()} units="metric" onSearch={setSearch} />
  ));
  return { ...queries, search, setSearch };
}

describe("CompareView", () => {
  it("seeds cog±1 as three columns when extras are missing", () => {
    const bike = parseCalculatorSearch({ cog: 17 });
    const { getByText, queryByText } = renderCompare(bike);

    expect(getByText("Setup 1 · 46/17")).toBeTruthy();
    expect(getByText("Setup 2 · 46/18")).toBeTruthy();
    expect(getByText("Setup 3 · 46/16")).toBeTruthy();
    expect(queryByText(/Setup 4/)).toBeNull();
  });

  it("stays at two columns when only c2 is present", () => {
    const bike = parseCalculatorSearch({});
    const { getByText, queryByText } = renderCompare({
      ...bike,
      c2: "52,14,700c,25,170,0",
    });

    expect(getByText("Setup 1 · 46/17")).toBeTruthy();
    expect(getByText("Setup 2 · 52/14")).toBeTruthy();
    expect(queryByText(/Setup 3/)).toBeNull();
  });

  it("writes column 1 into shared search and keeps extras", () => {
    const bike = parseCalculatorSearch({});
    const { getAllByRole, search } = renderCompare({
      ...bike,
      ...seedCompareExtras(bike, {}),
    });

    fireEvent.input(
      getAllByRole("spinbutton", { name: "Chainring value" })[0]!,
      { target: { value: "48" } },
    );
    flush();

    expect(search().chainring).toBe(48);
    expect(search().c2).toBe("46,18,700c,25,170,0");
    expect(search().c3).toBe("46,16,700c,25,170,0");
  });

  it("copies column 1 into the next slot and re-seeds after clearing the last extra", () => {
    const bike = parseCalculatorSearch({});
    const { getByRole, getByText, queryByText, search } = renderCompare({
      ...bike,
      c2: "52,14,700c,25,170,0",
    });

    fireEvent.click(getByRole("button", { name: "Add column" }));
    flush();

    expect(getByText("Setup 3 · 46/17")).toBeTruthy();
    expect(search().c3).toBe("46,17,700c,25,170,0");

    fireEvent.click(getByRole("button", { name: "Remove setup 3" }));
    flush();
    fireEvent.click(getByRole("button", { name: "Remove setup 2" }));
    flush();

    expect(getByText("Setup 2 · 46/18")).toBeTruthy();
    expect(getByText("Setup 3 · 46/16")).toBeTruthy();
    expect(queryByText(/Setup 4/)).toBeNull();
    expect(search().c2).toBe("46,18,700c,25,170,0");
    expect(search().c3).toBe("46,16,700c,25,170,0");
  });
});
