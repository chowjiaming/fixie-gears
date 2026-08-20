import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { getQueriesForElement } from "@testing-library/dom";
import { afterEach, describe, expect, it } from "vitest";
import { type CompareColumn, parseCalculatorSearch } from "~/lib/search";
import { CompareTable, compareMetricRows } from "./CompareTable";

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

const street: CompareColumn = {
  slot: "c1",
  bike: parseCalculatorSearch({ chainring: 46, cog: 17 }),
  removable: false,
};

const track: CompareColumn = {
  slot: "c2",
  bike: parseCalculatorSearch({ chainring: 48, cog: 16 }),
  removable: true,
};

describe("compareMetricRows", () => {
  it("computes deltas vs column 1 and best only on skid patches", () => {
    const rows = compareMetricRows([street, track], "metric");
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

    expect(byId.ratio?.cells[0]?.value).toBe("2.71");
    expect(byId.ratio?.cells[1]?.value).toBe("3.00");
    expect(byId.ratio?.cells[1]?.delta).toBe("+0.29");
    expect(byId.ratio?.cells[1]?.best).toBe(false);

    expect(rows.map((r) => r.id)).toEqual([
      "ratio",
      "development",
      "gearInches",
      "gain",
      "skid",
      "speed90",
    ]);

    expect(byId.skid?.cells[0]?.value).toBe("17");
    expect(byId.skid?.cells[1]?.value).toBe("1");
    expect(byId.skid?.cells[1]?.delta).toBe("-16");
    expect(byId.skid?.cells[0]?.best).toBe(true);
    expect(byId.skid?.cells[1]?.best).toBe(false);

    const bestIds = rows
      .filter((r) => r.cells.some((c) => c.best))
      .map((r) => r.id);
    expect(bestIds).toEqual(["skid"]);
  });

  it("puts gear inches first when units are imperial", () => {
    const rows = compareMetricRows([street], "imperial");
    expect(rows.map((r) => r.id)).toEqual([
      "ratio",
      "gearInches",
      "development",
      "gain",
      "skid",
      "speed90",
    ]);
    expect(rows.find((r) => r.id === "speed90")?.cells[0]?.value).toMatch(
      /mph$/,
    );
  });
});

describe("CompareTable", () => {
  it("shows Best text on the higher skid cell only", () => {
    const { getAllByText, queryByRole } = renderUi(() => (
      <CompareTable
        columns={[street, track]}
        units="metric"
        onChange={() => undefined}
        onRemove={() => undefined}
      />
    ));

    expect(queryByRole("slider")).toBeNull();
    const best = getAllByText("Best");
    expect(best).toHaveLength(1);
    expect(best[0]?.closest("td")?.textContent).toMatch(/17/);
  });
});
