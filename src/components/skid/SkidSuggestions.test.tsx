import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseCalculatorSearch, toConfig } from "~/lib/search";
import { SkidSuggestions } from "./SkidSuggestions";

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

describe("SkidSuggestions", () => {
  it("applies only ring and cog when a suggestion is clicked", () => {
    const onApply = vi.fn();
    const config = toConfig(parseCalculatorSearch({ chainring: 48, cog: 16 }));
    const { getByRole } = renderUi(() => (
      <SkidSuggestions config={config} onApply={onApply} />
    ));

    fireEvent.click(getByRole("button", { name: /apply 50\/17/i }));
    flush();

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(50, 17);
  });

  it("keeps the panel when no nearby change improves patches", () => {
    const config = toConfig(parseCalculatorSearch({ chainring: 79, cog: 30 }));
    const { getByText, queryByRole } = renderUi(() => (
      <SkidSuggestions config={config} onApply={() => undefined} />
    ));

    expect(getByText("Improve this")).toBeTruthy();
    expect(
      getByText(/no nearby tooth change improves skid patches/i),
    ).toBeTruthy();
    expect(queryByRole("button", { name: /apply /i })).toBeNull();
  });
});
