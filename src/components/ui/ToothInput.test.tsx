import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToothInput } from "./ToothInput";

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

describe("ToothInput", () => {
  it("keeps slider and stepper in sync and emits one change", () => {
    const onChange = vi.fn();
    const { getByRole } = renderUi(() => {
      const [value, setValue] = createSignal(46);
      return (
        <ToothInput
          label="Chainring teeth"
          value={value()}
          min={20}
          max={80}
          onChange={(n) => {
            onChange(n);
            setValue(n);
          }}
        />
      );
    });

    const slider = getByRole("slider", {
      name: "Chainring teeth",
    }) as HTMLInputElement;
    const stepper = getByRole("spinbutton", {
      name: "Chainring teeth value",
    }) as HTMLInputElement;

    fireEvent.input(slider, { target: { value: "48" } });
    flush();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(48);
    expect(slider.value).toBe("48");
    expect(stepper.value).toBe("48");

    fireEvent.input(stepper, { target: { value: "50" } });
    flush();

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(slider.value).toBe("50");
    expect(stepper.value).toBe("50");
  });
});
