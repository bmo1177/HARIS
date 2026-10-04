import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import MissingEnvNotice from "./components/MissingEnvNotice.tsx";
import { I18nProvider } from "@/lib/i18n";
import { missingEnv } from "@/lib/env";
/* Self-hosted via @fontsource: subset woff2 bundled by Vite, no external CDN
   request. That matters twice over for a school audience — a cold load on a weak
   connection, and a third party learning which students are reading security
   material.

   IBM Plex is one superfamily across Latin, Arabic and mono, which is what makes
   the bilingual case work: Plex Sans Arabic is designed to sit beside Plex Sans
   rather than being an unrelated Arabic face bolted on.

   Only the weights actually used are imported. Imported from JS rather than CSS
   `@import` because that is the path Vite resolves and fingerprints; a CSS
   `@import` of a package specifier silently emits nothing. */
import "@fontsource-variable/ibm-plex-sans/wght.css";
// Subset-specific imports. The umbrella `400.css` pulls in cyrillic,
// vietnamese and greek-ext as well; `unicode-range` means the browser never
// downloads them, but they still bloat the deploy artifact by ~3x for nothing.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element in index.html");

createRoot(container).render(
  // React.StrictMode double-invokes effects in development, which surfaces
  // effect bugs that otherwise only show up once in production.
  <React.StrictMode>
    <I18nProvider>
      {missingEnv.length > 0 ? <MissingEnvNotice /> : <App />}
    </I18nProvider>
  </React.StrictMode>,
);
