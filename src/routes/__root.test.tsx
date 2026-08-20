import { render as solidRender } from "@solidjs/web";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/solid-router";
import { fireEvent, getQueriesForElement } from "@testing-library/dom";
import { flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "~/routeTree.gen";

let dispose: (() => void) | undefined;
let host: HTMLDivElement | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  host?.remove();
  host = undefined;
});

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const testRouter = createRouter({
    routeTree,
    history,
    defaultPendingMinMs: 0,
  });
  host = document.createElement("div");
  document.body.appendChild(host);
  dispose = solidRender(
    () => <RouterProvider router={testRouter as never} />,
    host,
  );
  await testRouter.load();
  flush();
  await vi.waitFor(() => {
    expect(host?.querySelector("nav")).toBeTruthy();
  });
  return { ...getQueriesForElement(host!), testRouter };
}

describe("root nav search", () => {
  it("puts a skip link first and points it at main", async () => {
    const { getByRole } = await renderAt("/");
    const skip = getByRole("link", { name: /skip to (main )?content/i });
    expect(skip.getAttribute("href")).toBe("#main");
    // first focusable element in the document order
    const focusables = host!.querySelectorAll(
      "a[href], button, input, select, textarea, [tabindex]",
    );
    expect(focusables[0]).toBe(skip);
    expect(host!.querySelector("#main")).toBeTruthy();
  });

  it.each([
    { path: "/", activeLabel: "Calculator" },
    { path: "/explore", activeLabel: "Explore" },
  ])(
    "identifies the active nav link at $path without relying on color",
    async ({ path, activeLabel }) => {
      const { getByRole } = await renderAt(path);
      const labels = ["Calculator", "Compare", "Explore", "Saved"];
      const active = getByRole("link", { name: activeLabel });

      expect(active.getAttribute("aria-current")).toBe("page");
      expect(active.classList.contains("underline")).toBe(true);

      for (const label of labels.filter((label) => label !== activeLabel)) {
        expect(
          getByRole("link", { name: label }).getAttribute("aria-current"),
        ).toBeNull();
      }
    },
  );

  it("makes the wordmark a link home that keeps the setup", async () => {
    const { getByRole } = await renderAt("/?chainring=46&cog=17");
    const home = getByRole("link", { name: "Fixie Gears" });
    expect(home.getAttribute("href")).toContain("chainring=46");
  });

  it("preserves calculator search keys from / to /explore", async () => {
    const { getByRole, testRouter } = await renderAt(
      "/?chainring=48&cog=16&wheel=650b",
    );

    fireEvent.click(getByRole("link", { name: "Explore" }));
    flush();
    await testRouter.load();
    flush();

    await vi.waitFor(() => {
      expect(testRouter.state.location.pathname).toBe("/explore");
    });
    expect(testRouter.state.location.search).toMatchObject({
      chainring: 48,
      cog: 16,
      wheel: "650b",
    });
    expect(
      getByRole("button", {
        name: /48 tooth chainring, 16 tooth cog/,
      }).getAttribute("aria-current"),
    ).toBe("true");
  });

  it("preserves stay and circ from / to /explore", async () => {
    const { getByRole, testRouter } = await renderAt(
      "/?chainring=48&cog=16&stay=405&circ=2130",
    );
    fireEvent.click(getByRole("link", { name: "Explore" }));
    flush();
    await testRouter.load();
    flush();
    await vi.waitFor(() => {
      expect(testRouter.state.location.pathname).toBe("/explore");
    });
    expect(testRouter.state.location.search).toMatchObject({
      chainring: 48,
      cog: 16,
      stay: 405,
      circ: 2130,
    });
  });

  it("keeps compare extras when using the Compare nav link", async () => {
    const { getByRole, getByText, queryByText, testRouter } = await renderAt(
      "/compare?c2=52,14,700c,25,170,0",
    );

    expect(getByText("Setup 2 · 52/14")).toBeTruthy();
    expect(queryByText(/Setup 3/)).toBeNull();

    fireEvent.click(getByRole("link", { name: "Compare" }));
    flush();
    await testRouter.load();
    flush();

    expect(testRouter.state.location.pathname).toBe("/compare");
    expect(testRouter.state.location.search).toMatchObject({
      c2: "52,14,700c,25,170,0",
    });
    expect(getByText("Setup 2 · 52/14")).toBeTruthy();
    expect(queryByText(/Setup 3/)).toBeNull();
  });
});
