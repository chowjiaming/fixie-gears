import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { deriveMetrics } from "~/lib/gear/calculations";
import { GOOD_SKID_PATCHES } from "~/lib/gear/skid";
import { parseCalculatorSearch, toConfig } from "~/lib/search";
import {
  buildHeatmapCells,
  buildHeatmapScale,
  heatmapAriaLabel,
  heatmapFill,
  HEATMAP_COGS,
  HEATMAP_RINGS,
  HeatmapGrid,
  isInHeatmapWindow,
} from "./HeatmapGrid";

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

function renderGrid(
  bike = parseCalculatorSearch({}),
  extras: {
    metric?: "gi" | "dev" | "skid";
    minSkid?: 0 | 8;
    onMetricChange?: (metric: "gi" | "dev" | "skid") => void;
    onMinSkidChange?: (minSkid: 0 | 8) => void;
    onSelect?: (chainring: number, cog: number) => void;
  } = {},
) {
  const queries = renderUi(() => (
    <HeatmapGrid
      bike={bike}
      metric={extras.metric ?? "gi"}
      minSkid={extras.minSkid ?? 0}
      onMetricChange={extras.onMetricChange ?? (() => {})}
      onMinSkidChange={extras.onMinSkidChange ?? (() => {})}
      onSelect={extras.onSelect ?? (() => {})}
    />
  ));
  return queries;
}

describe("heatmap window", () => {
  it("covers chainrings 38–60 and cogs 11–23", () => {
    expect(HEATMAP_RINGS[0]).toBe(38);
    expect(HEATMAP_RINGS[HEATMAP_RINGS.length - 1]).toBe(60);
    expect(HEATMAP_RINGS).toHaveLength(23);
    expect(HEATMAP_COGS[0]).toBe(11);
    expect(HEATMAP_COGS[HEATMAP_COGS.length - 1]).toBe(23);
    expect(HEATMAP_COGS).toHaveLength(13);
    expect(buildHeatmapCells(parseCalculatorSearch({}))).toHaveLength(23 * 13);
    expect(isInHeatmapWindow(46, 17)).toBe(true);
    expect(isInHeatmapWindow(70, 17)).toBe(false);
    expect(isInHeatmapWindow(46, 9)).toBe(false);
  });
});

describe("heatmapFill", () => {
  it("centers diverging color on the current value and clamps endpoints", () => {
    const scale = {
      kind: "diverging" as const,
      center: 70,
      halfRange: 10,
    };
    expect(heatmapFill(70, scale)).toBe(heatmapFill(70, scale));
    expect(heatmapFill(50, scale)).toBe(heatmapFill(60, scale));
    expect(heatmapFill(90, scale)).toBe(heatmapFill(80, scale));
    expect(heatmapFill(60, scale)).not.toBe(heatmapFill(80, scale));
  });

  it("uses sequential green for skid and clamps above the max", () => {
    const scale = { kind: "sequential" as const, min: 0, max: 8 };
    expect(heatmapFill(32, scale)).toBe(heatmapFill(8, scale));
    expect(heatmapFill(-4, scale)).toBe(heatmapFill(0, scale));
    expect(heatmapFill(0, scale)).not.toBe(heatmapFill(8, scale));
  });

  it("builds a diverging scale from grid values around the current setup", () => {
    const scale = buildHeatmapScale("gi", [50, 70, 90], 70);
    expect(scale).toEqual({
      kind: "diverging",
      center: 70,
      halfRange: 20,
    });
    const skid = buildHeatmapScale("skid", [1, 17], 1);
    expect(skid).toEqual({ kind: "sequential", min: 0, max: 17 });
  });
});

describe("HeatmapGrid", () => {
  it("renders a button per cell with a descriptive aria-label", () => {
    const { getAllByRole, getByRole } = renderGrid();
    const cells = getAllByRole("button");
    expect(cells).toHaveLength(23 * 13);

    const street = deriveMetrics(toConfig(parseCalculatorSearch({})));
    expect(
      getByRole("button", {
        name: heatmapAriaLabel(46, 17, street.gearInches, "gi"),
      }),
    ).toBeTruthy();
  });

  it("outlines the current cell when it falls in the window", () => {
    const { getByRole } = renderGrid();
    const current = getByRole("button", {
      name: /46 tooth chainring, 17 tooth cog/,
    });
    expect(current.getAttribute("aria-current")).toBe("true");
  });

  it("does not outline when the current setup is outside the window", () => {
    const { queryByRole } = renderGrid(
      parseCalculatorSearch({ chainring: 70, cog: 17 }),
    );
    expect(queryByRole("button", { current: true })).toBeNull();
  });

  it("writes ring and cog on click", () => {
    let selected: { chainring: number; cog: number } | undefined;
    const { getByRole } = renderGrid(parseCalculatorSearch({}), {
      onSelect: (chainring, cog) => {
        selected = { chainring, cog };
      },
    });

    fireEvent.click(
      getByRole("button", { name: /48 tooth chainring, 16 tooth cog/ }),
    );
    flush();

    expect(selected).toEqual({ chainring: 48, cog: 16 });
  });

  it("dims cells below GOOD_SKID_PATCHES when minSkid is 8, without hiding them", () => {
    const bike = parseCalculatorSearch({ chainring: 48, cog: 16 });
    const { getByRole } = renderGrid(bike, { minSkid: GOOD_SKID_PATCHES });

    const low = getByRole("button", {
      name: /48 tooth chainring, 16 tooth cog/,
    });
    const high = getByRole("button", {
      name: /49 tooth chainring, 16 tooth cog/,
    });

    expect(low.className).toContain("opacity-35");
    expect(high.className).not.toContain("opacity-35");
    expect(low.getAttribute("aria-current")).toBe("true");
  });

  it("updates the metric via radios and the minSkid toggle", () => {
    const metrics: Array<"gi" | "dev" | "skid"> = [];
    const filters: Array<0 | 8> = [];
    const { getByLabelText, getByRole } = renderGrid(
      parseCalculatorSearch({}),
      {
        onMetricChange: (metric) => metrics.push(metric),
        onMinSkidChange: (minSkid) => filters.push(minSkid),
      },
    );

    fireEvent.click(getByRole("radio", { name: "Development" }));
    fireEvent.click(getByRole("radio", { name: "Skid patches" }));
    fireEvent.click(
      getByLabelText("Dim setups with fewer than 8 skid patches"),
    );
    flush();

    expect(metrics).toEqual(["dev", "skid"]);
    expect(filters).toEqual([GOOD_SKID_PATCHES]);
  });
});
