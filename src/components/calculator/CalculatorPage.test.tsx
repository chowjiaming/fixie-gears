import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { render as solidRender } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { CalculatorView } from "~/components/calculator/CalculatorPage";
import { UnitToggle } from "~/components/ui/UnitToggle";
import { deriveMetrics } from "~/lib/gear/calculations";
import { formatDevelopment, formatGearInches, formatRatio } from "~/lib/format";
import {
  applySearchPatch,
  parseCalculatorSearch,
  toConfig,
} from "~/lib/search";
import { setUnits } from "~/lib/state/prefs-store";

let dispose: (() => void) | undefined;
let host: HTMLDivElement | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  host?.remove();
  host = undefined;
  setUnits("metric");
});

function renderUi(ui: () => JSX.Element) {
  host = document.createElement("div");
  document.body.appendChild(host);
  dispose = solidRender(ui, host);
  return getQueriesForElement(host);
}

function renderCalculator(initial = parseCalculatorSearch({})) {
  const [search, setSearch] = createSignal(initial);
  const queries = renderUi(() => (
    <>
      <UnitToggle />
      <CalculatorView
        search={search()}
        onPatch={(partial) => setSearch(applySearchPatch(search(), partial))}
      />
    </>
  ));
  return { ...queries, search };
}

function cardLabels(): string[] {
  return [...host!.querySelectorAll("article")].map(
    (article) => article.querySelector("p")?.textContent ?? "",
  );
}

describe("CalculatorPage", () => {
  it("writes chainring into the navigate payload and updates metric cards", () => {
    const { getAllByRole, getByText, search } = renderCalculator();
    const before = deriveMetrics(toConfig(search()));
    expect(getByText(formatRatio(before.ratio))).toBeTruthy();

    fireEvent.input(getAllByRole("slider", { name: "Chainring teeth" })[0]!, {
      target: { value: "48" },
    });
    flush();

    expect(search().chainring).toBe(48);
    const after = deriveMetrics(toConfig(search()));
    expect(after.ratio).not.toBe(before.ratio);
    expect(getByText(formatRatio(after.ratio))).toBeTruthy();
    expect(getByText(formatDevelopment(after.developmentMeters))).toBeTruthy();
    expect(getByText(formatGearInches(after.gearInches))).toBeTruthy();
  });

  it("shows the skid warning for ?chainring=48&cog=16", () => {
    const { getByText } = renderCalculator(
      parseCalculatorSearch({ chainring: 48, cog: 16 }),
    );

    expect(getByText("1")).toBeTruthy();
    expect(getByText(/few skid patches/i)).toBeTruthy();
  });

  it("swaps hero and secondary length when units change", () => {
    const { getByRole, getByText } = renderCalculator();

    expect(cardLabels().slice(1, 3)).toEqual(["Development", "Gear inches"]);
    expect(getByText(/km\/h/)).toBeTruthy();

    fireEvent.click(getByRole("button", { name: "Imperial" }));
    flush();

    expect(cardLabels().slice(1, 3)).toEqual(["Gear inches", "Development"]);
    expect(getByText(/mph/)).toBeTruthy();
  });

  it("shows 98 links and the half-link warning on the default bike", () => {
    const { getByText } = renderCalculator();
    expect(getByText("98 links")).toBeTruthy();
    expect(getByText(/won’t tension well/i)).toBeTruthy();
    expect(getByText(/97 with a half-link/)).toBeTruthy();
  });

  it("omits circ from search when the circumference field is cleared", () => {
    const { getByRole, search } = renderCalculator(
      parseCalculatorSearch({ circ: 2130 }),
    );
    const input = getByRole("spinbutton", {
      name: "Measured circumference",
    });
    fireEvent.change(input, { target: { value: "" } });
    flush();
    expect(search()).not.toHaveProperty("circ");
  });

  it("clears circ from search for out-of-range and non-integer commits", () => {
    const { getByRole, search } = renderCalculator(
      parseCalculatorSearch({ circ: 2130 }),
    );
    const input = getByRole("spinbutton", {
      name: "Measured circumference",
    });

    fireEvent.change(input, { target: { value: "1000" } });
    fireEvent.blur(input);
    flush();
    expect(search()).not.toHaveProperty("circ");

    fireEvent.change(input, { target: { value: "2130" } });
    fireEvent.blur(input);
    flush();
    expect(search().circ).toBe(2130);

    fireEvent.change(input, { target: { value: "2501" } });
    fireEvent.blur(input);
    flush();
    expect(search()).not.toHaveProperty("circ");

    fireEvent.change(input, { target: { value: "2130" } });
    fireEvent.blur(input);
    flush();
    expect(search().circ).toBe(2130);

    fireEvent.change(input, { target: { value: "2130.5" } });
    fireEvent.blur(input);
    flush();
    expect(search()).not.toHaveProperty("circ");
  });

  it("sets circ when a valid taped circumference is committed", () => {
    const { getByRole, search } = renderCalculator();
    const input = getByRole("spinbutton", {
      name: "Measured circumference",
    });

    fireEvent.input(input, { target: { value: "2130" } });
    flush();
    expect(search()).not.toHaveProperty("circ");

    fireEvent.change(input, { target: { value: "2130" } });
    fireEvent.blur(input);
    flush();
    expect(search().circ).toBe(2130);
  });

  it("writes clamped millimetres to stay when editing chainstay in imperial", () => {
    const { getByRole, getAllByRole, search } = renderCalculator(
      parseCalculatorSearch({ stay: 405 }),
    );
    fireEvent.click(getByRole("button", { name: "Imperial" }));
    flush();

    const stepper = getAllByRole("spinbutton", {
      name: "Chainstay value",
    })[0]!;
    fireEvent.change(stepper, { target: { value: "16.1" } });
    fireEvent.blur(stepper);
    flush();

    expect(search().stay).toBe(409);
  });

  it("shows the taped circumference tip on development and gain tooltips", () => {
    const { getAllByRole, getByRole } = renderCalculator(
      parseCalculatorSearch({ circ: 2130 }),
    );
    const tips = getAllByRole("button", { name: "About this metric" });
    const developmentTip = tips[1]!;
    fireEvent.click(developmentTip);
    flush();
    expect(getByRole("tooltip").textContent).toBe(
      "Using a taped circumference of 2130 mm. Clear the field to return to bead-seat plus twice the tire width.",
    );
  });
});
