import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
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

  it("shows the caller's warning text", () => {
    const { getByText } = renderUi(() => (
      <MetricCard
        label="Skid patches"
        value="1"
        tooltip="skid patch count"
        warning="Few skid patches — tire wear will concentrate."
      />
    ));
    expect(getByText("1")).toBeTruthy();
    expect(getByText(/few skid patches/i)).toBeTruthy();
  });

  it("no longer announces its own value", () => {
    const { getByText } = renderUi(() => (
      <MetricCard label="Gear ratio" value="3.00" tooltip="t" />
    ));
    expect(getByText("3.00").getAttribute("aria-live")).toBeNull();
  });

  it("stays silent when no warning is given", () => {
    const { queryByText } = renderUi(() => (
      <MetricCard label="Gear ratio" value="3.00" tooltip="t" />
    ));
    expect(queryByText(/tire wear/i)).toBeNull();
    expect(queryByText("⚠")).toBeNull();
  });
});
