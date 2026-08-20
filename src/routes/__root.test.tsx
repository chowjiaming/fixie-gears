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
