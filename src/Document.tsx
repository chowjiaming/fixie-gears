import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";

const THEME_BOOTSTRAP = `(function(){try{var t="system";var raw=localStorage.getItem("fixie:prefs");if(raw){var p=JSON.parse(raw);if(p&&(p.theme==="light"||p.theme==="dark"||p.theme==="system"))t=p.theme;}var dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.className=dark?"dark":"";}catch(e){}})();`;

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <title>Fixie Gears</title>
        <script innerHTML={THEME_BOOTSTRAP} />
        <HydrationScript />
      </head>
      <body class="min-h-screen bg-paper text-ink antialiased dark:bg-ink dark:text-paper">
        {props.children}
      </body>
    </html>
  );
}
