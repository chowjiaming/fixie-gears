import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyLinkButton } from "./CopyLinkButton";

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

describe("CopyLinkButton", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("copies location.href and shows feedback", async () => {
    const { getByRole } = renderUi(() => <CopyLinkButton />);
    fireEvent.click(getByRole("button", { name: "Copy link to this setup" }));
    await writeText.mock.results[0]?.value;
    flush();
    expect(writeText).toHaveBeenCalledWith(location.href);
    expect(
      getByRole("button", { name: "Copy link to this setup" }).textContent,
    ).toBe("Copied");
  });
});
