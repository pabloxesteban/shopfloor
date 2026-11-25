"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";
const STORAGE_KEY = "theme";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABELS: Record<Theme, string> = { system: "System", light: "Light", dark: "Dark" };

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Runs before paint in <head> so the first frame already has the right colors. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export function ThemeToggle() {
  // The server cannot know the stored theme, so it renders "System" and the
  // client corrects it right after hydration without a mismatch error.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as const);

  // React's dev-mode remount resets attributes on <html>; put ours back.
  useLayoutEffect(() => {
    applyTheme(readTheme());
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system";
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-muted/40 px-2.5 text-xs font-medium text-brand-muted transition-colors duration-150 hover:bg-brand-2 hover:text-brand-fg"
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐"}</span>
      <span>
        <span className="sr-only">Color theme: </span>
        {LABELS[theme]}
      </span>
    </button>
  );
}
