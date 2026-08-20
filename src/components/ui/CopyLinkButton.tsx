import { createSignal, onSettled } from "solid-js";
import { Button } from "~/components/ui/Button";

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
    <Button ariaLabel="Copy link to this setup" onClick={copy}>
      {copied() ? "Copied" : "Copy link"}
    </Button>
  );
}
