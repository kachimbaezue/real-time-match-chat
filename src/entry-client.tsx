/**
 * Client-side SPA entry point.
 * Used for static Vercel deployment (no SSR).
 * Uses createRoot instead of hydrateRoot since there is no server-rendered HTML.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
