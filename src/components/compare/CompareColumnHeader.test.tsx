import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseCalculatorSearch } from "~/lib/search";
import { CompareColumnHeader } from "./CompareColumnHeader";

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

describe("CompareColumnHeader", () => {
  it("uses steppers and selects with no sliders", () => {
    const onChange = vi.fn();
    const { queryByRole, getByRole } = renderUi(() => (
      <CompareColumnHeader
        index={2}
        bike={parseCalculatorSearch({})}
        removable
        onChange={onChange}
        onRemove={() => undefined}
      />
    ));

    expect(queryByRole("slider")).toBeNull();
    expect(getByRole("spinbutton", { name: "Chainring value" })).toBeTruthy();
    expect(getByRole("spinbutton", { name: "Cog value" })).toBeTruthy();
    expect(getByRole("spinbutton", { name: "Tire value" })).toBeTruthy();
    expect(getByRole("combobox", { name: "Wheel size" })).toBeTruthy();
    expect(getByRole("combobox", { name: "Crank length" })).toBeTruthy();
    expect(
      getByRole("checkbox", { name: "Ambidextrous skidder" }),
    ).toBeTruthy();

    fireEvent.change(getByRole("spinbutton", { name: "Cog value" }), {
      target: { value: "18" },
    });
    flush();
    expect(onChange).toHaveBeenCalledWith({ cog: 18 });
  });

  it("omits remove on column 1 and fires it on extras", () => {
    const onRemove = vi.fn();
    const locked = renderUi(() => (
      <CompareColumnHeader
        index={1}
        bike={parseCalculatorSearch({})}
        removable={false}
        onChange={() => undefined}
        onRemove={onRemove}
      />
    ));
    expect(locked.queryByRole("button", { name: /remove/i })).toBeNull();

    dispose?.();
    host?.remove();

    const extra = renderUi(() => (
      <CompareColumnHeader
        index={2}
        bike={parseCalculatorSearch({})}
        removable
        onChange={() => undefined}
        onRemove={onRemove}
      />
    ));
    fireEvent.click(extra.getByRole("button", { name: "Remove setup 2" }));
    flush();
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
