import { createSignal, onSettled } from "solid-js";

export function CopyLinkButton() {
  const [copied, setCopied] = createSignal(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  onSettled(() => {
    return () => {
      if (resetTimer !== undefined) clearTimeout(resetTimer);
    };
  });

  const copy = () => {
    const href = location.href;
    void navigator.clipboard.writeText(href).then(
      () => {
        setCopied(true);
        if (resetTimer !== undefined) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setCopied(false);
      },
    );
  };

  return (
    <button
      type="button"
      class="rounded border border-ink/15 px-2.5 py-1 text-sm hover:border-accent dark:border-paper/20"
      aria-label="Copy link to this setup"
      onClick={copy}
    >
      {copied() ? "Copied" : "Copy link"}
    </button>
  );
}
