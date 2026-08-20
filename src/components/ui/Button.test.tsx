import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "./Button";

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

describe("Button", () => {
  it("defaults to type=button and fires onClick", () => {
    let clicks = 0;
    const { getByRole } = renderUi(() => (
      <Button
        onClick={() => {
          clicks += 1;
        }}
      >
        Save current
      </Button>
    ));
    const el = getByRole("button", { name: "Save current" });
    expect(el.getAttribute("type")).toBe("button");
    fireEvent.click(el);
    expect(clicks).toBe(1);
  });

  it("renders the danger variant as a normal accessible button", () => {
    let clicks = 0;
    const { getByRole } = renderUi(() => (
      <Button
        variant="danger"
        onClick={() => {
          clicks += 1;
        }}
      >
        Confirm delete
      </Button>
    ));
    fireEvent.click(getByRole("button", { name: "Confirm delete" }));
    expect(clicks).toBe(1);
  });

  it("supports submit and an overriding aria-label", () => {
    const { getByRole } = renderUi(() => (
      <Button type="submit" ariaLabel="Load Track bike">
        Load
      </Button>
    ));
    const el = getByRole("button", { name: "Load Track bike" });
    expect(el.getAttribute("type")).toBe("submit");
  });
});
