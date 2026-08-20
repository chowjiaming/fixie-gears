import { HydrationScript } from "@solidjs/web";
import type { ParentProps } from "solid-js";
import {
  SITE_ACCENT,
  SITE_DESCRIPTION,
  SITE_OG_IMAGE,
  SITE_OG_IMAGE_ALT,
  SITE_ORIGIN,
  SITE_TITLE,
} from "~/lib/site";

const THEME_BOOTSTRAP = `(function(){try{var t="system";var raw=localStorage.getItem("fixie:prefs");if(raw){var p=JSON.parse(raw);if(p&&(p.theme==="light"||p.theme==="dark"||p.theme==="system"))t=p.theme;}var dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.className=dark?"dark":"";}catch(e){}})();`;

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="theme-color" content={SITE_ACCENT} />
        <link rel="canonical" href={SITE_ORIGIN} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={SITE_ORIGIN} />
        <meta property="og:image" content={SITE_OG_IMAGE} />
        <meta property="og:image:alt" content={SITE_OG_IMAGE_ALT} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <title>{SITE_TITLE}</title>
        <script innerHTML={THEME_BOOTSTRAP} />
        <HydrationScript />
      </head>
      <body class="min-h-screen bg-paper text-ink antialiased dark:bg-ink dark:text-paper">
        {props.children}
      </body>
    </html>
  );
}
