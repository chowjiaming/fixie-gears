import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { deriveMetrics } from "~/lib/gear/calculations";
import { parseCalculatorSearch, toConfig } from "~/lib/search";
import { MetricCard } from "./MetricCard";

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

describe("MetricCard", () => {
  it("renders the formatted value and opens the tooltip", () => {
    const { getByText, getByRole } = renderUi(() => (
      <MetricCard
        label="Gear ratio"
        value="3.00"
        tooltip="chainring teeth ÷ cog teeth"
      />
    ));

    expect(getByText("3.00")).toBeTruthy();
    expect(getByText("Gear ratio")).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "About this metric" }));
    flush();

    expect(getByRole("tooltip").textContent).toContain(
      "chainring teeth ÷ cog teeth",
    );
  });

  it("shows a warning for 48/16", () => {
    const metrics = deriveMetrics(
      toConfig(parseCalculatorSearch({ chainring: 48, cog: 16 })),
    );
    expect(metrics.skidPatches).toBe(1);

    const { getByText } = renderUi(() => (
      <MetricCard
        label="Skid patches"
        value={String(metrics.skidPatches)}
        tooltip="skid patch count"
        warning={metrics.skidPatches <= 2}
      />
    ));

    expect(getByText("1")).toBeTruthy();
    expect(getByText(/few skid patches/i)).toBeTruthy();
  });
});
