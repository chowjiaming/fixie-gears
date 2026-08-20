import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CircumferenceInput } from "./CircumferenceInput";

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

describe("CircumferenceInput", () => {
  it("does not commit a partial multi-digit value until change/blur", () => {
    const onChange = vi.fn();
    const { getByRole } = renderUi(() => {
      const [value, setValue] = createSignal<number | undefined>(undefined);
      return (
        <CircumferenceInput
          label="Measured circumference"
          value={value()}
          onChange={(n) => {
            onChange(n);
            setValue(n);
          }}
        />
      );
    });

    const input = getByRole("spinbutton", {
      name: "Measured circumference",
    }) as HTMLInputElement;

    fireEvent.input(input, { target: { value: "2" } });
    flush();
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("2");

    fireEvent.input(input, { target: { value: "21" } });
    flush();
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("21");

    fireEvent.input(input, { target: { value: "213" } });
    flush();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.input(input, { target: { value: "2130" } });
    flush();
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("2130");

    fireEvent.change(input, { target: { value: "2130" } });
    fireEvent.blur(input);
    flush();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2130);
    expect(input.value).toBe("2130");
  });

  it("commits undefined for out-of-range and non-integer values", () => {
    const onChange = vi.fn();
    const { getByRole } = renderUi(() => {
      const [value, setValue] = createSignal<number | undefined>(2130);
      return (
        <CircumferenceInput
          label="Measured circumference"
          value={value()}
          onChange={(n) => {
            onChange(n);
            setValue(n);
          }}
        />
      );
    });

    const input = getByRole("spinbutton", {
      name: "Measured circumference",
    }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "1000" } });
    fireEvent.blur(input);
    flush();
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    fireEvent.change(input, { target: { value: "2130" } });
    fireEvent.blur(input);
    flush();
    onChange.mockClear();
    fireEvent.change(input, { target: { value: "2501" } });
    fireEvent.blur(input);
    flush();
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    fireEvent.change(input, { target: { value: "2130" } });
    fireEvent.blur(input);
    flush();
    onChange.mockClear();
    fireEvent.change(input, { target: { value: "2130.5" } });
    fireEvent.blur(input);
    flush();
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("commits undefined on empty so the search key can be deleted", () => {
    const onChange = vi.fn();
    const { getByRole } = renderUi(() => (
      <CircumferenceInput
        label="Measured circumference"
        value={2130}
        onChange={onChange}
      />
    ));

    const input = getByRole("spinbutton", {
      name: "Measured circumference",
    });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    flush();
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
