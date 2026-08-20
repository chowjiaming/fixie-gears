import type { JSX } from "@solidjs/web";
import { render as solidRender } from "@solidjs/web";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { CalculatorView } from "~/components/calculator/CalculatorPage";
import { UnitToggle } from "~/components/ui/UnitToggle";
import { formatDevelopment, formatGearInches, formatRatio } from "~/lib/format";
import { deriveMetrics } from "~/lib/gear/calculations";
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

function liveText(): string {
  return host!.querySelector("[aria-live='polite']")?.textContent ?? "";
}

describe("CalculatorPage", () => {
  it("has exactly one h1 and one live region", () => {
    const { getByRole } = renderCalculator();
    expect(getByRole("heading", { level: 1 })).toBeTruthy();
    expect(host!.querySelectorAll("[aria-live]").length).toBe(1);
  });

  it("announces ratio, hero metric, and skid patches in metric", () => {
    renderCalculator();
    expect(liveText()).toBe(
      "Gear ratio 2.71, development 5.71 meters, 17 skid patches",
    );
  });

  it("swaps the middle clause to gear inches in imperial", () => {
    const { getByRole } = renderCalculator();
    fireEvent.click(getByRole("radio", { name: "Imperial" }));
    flush();
    expect(liveText()).toBe(
      "Gear ratio 2.71, 71.6 gear inches, 17 skid patches",
    );
  });

  it("says patch singular when there is one", () => {
    renderCalculator(parseCalculatorSearch({ chainring: 48, cog: 16 }));
    expect(liveText()).toContain("1 skid patch");
    expect(liveText()).not.toContain("1 skid patches");
  });

  it("preset subtitles honor the taped circumference", () => {
    const plain = renderCalculator(
      parseCalculatorSearch({ chainring: 46, cog: 17 }),
    );
    const plainLabel = plain
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"))
      .find((label) => label?.includes("″"));
    dispose?.();
    host?.remove();
    const taped = renderCalculator(
      parseCalculatorSearch({ chainring: 46, cog: 17, circ: 2200 }),
    );
    const tapedLabel = taped
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"))
      .find((label) => label?.includes("″"));
    expect(tapedLabel).not.toBe(plainLabel);
  });

  it("maps imperial chainstay through MM_PER_INCH", () => {
    const { getByRole, search } = renderCalculator();
    expect(search().stay).toBe(410); // 410 mm renders as 16.1 in
    fireEvent.click(getByRole("radio", { name: "Imperial" }));
    flush();
    const input = getByRole("spinbutton", { name: "Chainstay value" });
    // 16.5, not 16.1: ToothInput.commit returns early when the committed
    // value equals props.value, so 16.1 would be a silent no-op.
    fireEvent.change(input, { target: { value: "16.5" } });
    fireEvent.blur(input);
    flush();
    expect(search().stay).toBe(419); // clampInt rounds 16.5 × 25.4 = 419.1
  });

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

    fireEvent.click(getByRole("radio", { name: "Imperial" }));
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
    fireEvent.click(getByRole("radio", { name: "Imperial" }));
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
