import { getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { parseCalculatorSearch, toConfig } from "~/lib/search";
import { SkidVisualizer } from "./SkidVisualizer";

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

function patchCircles(container: HTMLElement): SVGCircleElement[] {
  return [
    ...container.querySelectorAll<SVGCircleElement>("circle[data-skid-patch]"),
  ];
}

describe("SkidVisualizer", () => {
  it("renders one marker circle per skid patch", () => {
    const config = toConfig(parseCalculatorSearch({ chainring: 48, cog: 17 }));
    renderUi(() => <SkidVisualizer config={config} />);

    expect(patchCircles(host!)).toHaveLength(17);
  });

  it("keeps even-ring ambidextrous markers one color", () => {
    const config = toConfig(
      parseCalculatorSearch({ chainring: 46, cog: 17, ambi: 1 }),
    );
    const { getByText } = renderUi(() => <SkidVisualizer config={config} />);

    const fills = new Set(
      patchCircles(host!).map((c) => c.getAttribute("fill")),
    );
    expect(patchCircles(host!)).toHaveLength(17);
    expect(fills.size).toBe(1);
    expect(getByText(/opposite foot hits the same patches/i)).toBeTruthy();
  });

  it("uses two colors only for ambidextrous odd chainrings", () => {
    const config = toConfig(
      parseCalculatorSearch({ chainring: 49, cog: 16, ambi: 1 }),
    );
    renderUi(() => <SkidVisualizer config={config} />);

    const fills = new Set(
      patchCircles(host!).map((c) => c.getAttribute("fill")),
    );
    expect(patchCircles(host!)).toHaveLength(32);
    expect(fills.size).toBe(2);
  });

  it("keeps exiting markers at opacity 0 when the patch count drops", () => {
    const [config, setConfig] = createSignal(
      toConfig(parseCalculatorSearch({ chainring: 48, cog: 17 })),
    );
    renderUi(() => <SkidVisualizer config={config()} />);
    expect(patchCircles(host!)).toHaveLength(17);

    setConfig(toConfig(parseCalculatorSearch({ chainring: 48, cog: 16 })));
    flush();

    const groups = [...host!.querySelectorAll<SVGGElement>("g.skid-marker")];
    expect(groups).toHaveLength(17);
    expect(groups.filter((g) => g.style.opacity === "0")).toHaveLength(16);
    expect(groups.filter((g) => g.style.opacity === "1")).toHaveLength(1);
  });
});
