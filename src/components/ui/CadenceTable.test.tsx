import { getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { afterEach, describe, expect, it } from "vitest";
import { deriveMetrics } from "~/lib/gear/calculations";
import { parseCalculatorSearch, toConfig } from "~/lib/search";
import { CadenceTable } from "./CadenceTable";

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

describe("CadenceTable", () => {
  it("renders nine rows, highlights 90 rpm, and shows one speed column", () => {
    const metrics = deriveMetrics(toConfig(parseCalculatorSearch({})));
    const { getAllByRole, getByText, queryByText } = renderUi(() => (
      <CadenceTable speeds={metrics.speeds} units="metric" />
    ));

    const rows = getAllByRole("row");
    expect(rows).toHaveLength(10);
    expect(getByText("90").closest("tr")?.getAttribute("aria-current")).toBe(
      "true",
    );
    expect(getByText(/km\/h/)).toBeTruthy();
    expect(queryByText(/mph/i)).toBeNull();

    const headerCells = rows[0].querySelectorAll("th");
    expect(headerCells).toHaveLength(2);
  });
});
