import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

type Source = { file: string; text: string };
type Violation = { file: string; snippet: string };

/**
 * Only `.tsx` is scanned, and that is load-bearing: this guard is a `.ts`
 * file, so restricting the glob keeps it from matching the forbidden class
 * strings quoted in its own source. Widening it to `.ts` makes the test
 * fail against itself.
 *
 * `.test.tsx` files are deliberately in scope — a test that asserts a
 * forbidden pairing is itself a signal worth catching.
 *
 * The directory comes from this module's own location so the test does not
 * depend on the working directory it is invoked from. It must not be
 * written as `new URL("..", import.meta.url)`: Vite rewrites that pattern
 * into an asset URL and it resolves to `http://localhost:3000/src`.
 */
const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

const sources: Source[] = readdirSync(SRC_DIR, {
  recursive: true,
  encoding: "utf8",
})
  .filter((entry) => entry.endsWith(".tsx"))
  .map((entry) => ({
    file: `src/${entry.split(sep).join("/")}`,
    text: readFileSync(join(SRC_DIR, entry), "utf8"),
  }));

const violations = (pattern: RegExp): Violation[] =>
  sources.flatMap(({ file, text }) =>
    [...text.matchAll(pattern)].map((match) => ({
      file,
      snippet: match[0],
    })),
  );

const ACCENT_FILL_WITH_PAPER_TEXT =
  /bg-accent(?![-/\w])[^"'`]*text-paper|text-paper[^"'`]*bg-accent(?![-/\w])/g;

const ACCENT_TEXT_TOKEN = /[\w:-]*\btext-accent(?![-\w])/g;

const NATIVE_CONTROL = /<(?:button|input|select|textarea)[\s/>]/;

const FOCUS_INDICATOR = /focus-ring|focus-visible/;

describe("design contracts", () => {
  // Paper `#FAFAF8` on accent `#FF5A1F` is 2.98:1, under the 4.5:1 WCAG AA
  // floor — accent-filled surfaces take ink text instead. Both class orders
  // are checked because order inside a `class` string is arbitrary. The
  // lookahead stops `bg-accent-ink` and `bg-accent/20` reading as
  // `bg-accent`.
  it("never pairs bg-accent with text-paper", () => {
    expect(violations(ACCENT_FILL_WITH_PAPER_TEXT)).toEqual([]);
  });

  // Accent as *text* is legal only as the dark half of
  // `text-accent-ink dark:text-accent`; a bare `text-accent` is the bug.
  // This matches the whole utility token and looks for `dark:` anywhere in
  // its variant chain. A lookbehind — `/(?<!dark:)text-accent/` — is wrong:
  // `dark:hover:text-accent` is preceded by `hover:`, so it false-positives.
  it("only uses text-accent behind a dark: variant", () => {
    const accentTextTokens = violations(ACCENT_TEXT_TOKEN);
    expect(
      accentTextTokens.filter(({ snippet }) => !snippet.includes("dark:")),
    ).toEqual([]);
  });

  // Deliberately coarse and file-level: this catches a whole component
  // shipped with no focus style at all. It is NOT proof that every
  // individual control in a passing file is covered.
  //
  // `focus-visible` is accepted alongside the `focus-ring` utility because
  // `SegmentedControl.tsx` legitimately puts `peer-focus-visible:` on a
  // sibling span rather than the input itself.
  it("gives every file with controls a focus indicator", () => {
    const filesMissingFocus: Violation[] = sources.flatMap(({ file, text }) => {
      const control = text.match(NATIVE_CONTROL);
      if (!control || FOCUS_INDICATOR.test(text)) return [];
      return [{ file, snippet: control[0] }];
    });
    expect(filesMissingFocus).toEqual([]);
  });
});
