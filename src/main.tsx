import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import MissingEnvNotice from "./components/MissingEnvNotice.tsx";
import { I18nProvider } from "@/lib/i18n";
import { missingEnv } from "@/lib/env";
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
