import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { afterEach, describe, expect, it } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

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

const UNITS = [
  { id: "metric", label: "Metric" },
  { id: "imperial", label: "Imperial" },
] as const;

describe("SegmentedControl", () => {
  it("exposes options as radios, not buttons", () => {
    const { getByRole, queryByRole } = renderUi(() => (
      <SegmentedControl
        legend="Units"
        name="units"
        options={UNITS}
        value="metric"
        onChange={() => {}}
      />
    ));
    expect(getByRole("radio", { name: "Metric" })).toBeTruthy();
    expect(queryByRole("button", { name: "Imperial" })).toBeNull();
  });

  it("checks only the selected option", () => {
    const { getByRole } = renderUi(() => (
      <SegmentedControl
        legend="Units"
        name="units"
        options={UNITS}
        value="imperial"
        onChange={() => {}}
      />
    ));
    expect(
      (getByRole("radio", { name: "Imperial" }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (getByRole("radio", { name: "Metric" }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("reports the chosen id", () => {
    const seen: string[] = [];
    const { getByRole } = renderUi(() => (
      <SegmentedControl
        legend="Units"
        name="units"
        options={UNITS}
        value="metric"
        onChange={(v) => seen.push(v)}
      />
    ));
    fireEvent.click(getByRole("radio", { name: "Imperial" }));
    expect(seen).toEqual(["imperial"]);
  });

  it("exposes the group under its legend", () => {
    const { getByRole } = renderUi(() => (
      <SegmentedControl
        legend="Units"
        name="units"
        options={UNITS}
        value="metric"
        onChange={() => {}}
      />
    ));
    expect(getByRole("group", { name: "Units" })).toBeTruthy();
  });

  it("keeps two instances independent", () => {
    const { getAllByRole } = renderUi(() => (
      <>
        <SegmentedControl
          legend="Units"
          name="units"
          options={UNITS}
          value="metric"
          onChange={() => {}}
        />
        <SegmentedControl
          legend="Theme"
          name="theme"
          options={
            [
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
            ] as const
          }
          value="dark"
          onChange={() => {}}
        />
      </>
    ));
    const checked = getAllByRole("radio").filter(
      (r) => (r as HTMLInputElement).checked,
    );
    expect(checked).toHaveLength(2);
  });
});
