import type { JSX } from "@solidjs/web";

export interface ButtonProps {
  children: JSX.Element;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "default" | "danger";
  ariaLabel?: string;
}

export function Button(props: ButtonProps) {
  return (
    <button
      type={props.type ?? "button"}
      class={[
        "focus-ring rounded border border-ink/20 px-3 py-1.5 text-sm",
        "transition-colors motion-reduce:transition-none",
        "hover:border-accent dark:border-paper/20",
        {
          "text-accent-ink dark:text-accent": props.variant === "danger",
          "active:bg-ink/5 dark:active:bg-paper/10": props.variant !== "danger",
          "active:bg-accent/10": props.variant === "danger",
        },
      ]}
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
