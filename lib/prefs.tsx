"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storageKey } from "@/lib/site.config";
import type { Lang, DepartmentKey } from "@/lib/i18n";

export interface Prefs {
  lang: Lang;
  theme: "dark" | "light";
  fontSize: "normal" | "large" | "xlarge";
  department: DepartmentKey;
  onboarded: boolean;
}

const DEFAULT_PREFS: Prefs = {
  lang: "ko",
  theme: "dark",
  fontSize: "normal",
  department: "actors",
  onboarded: false,
};

const STORAGE_KEY = storageKey("Prefs");

interface Ctx {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  ready: boolean;
}

const PreferencesContext = createContext<Ctx | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // wait for stored prefs: applying the defaults first would flip a light-
    // theme user back to dark for a frame, undoing the pre-paint script
    if (!ready) return;
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.fontSize = prefs.fontSize;
    document.documentElement.lang = prefs.lang;
    // keep the browser chrome (iOS status bar, Android address bar) in step
    // with the page instead of a fixed dark strip over a light page
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", prefs.theme === "light" ? "#fafafa" : "#09090b");
  }, [ready, prefs.theme, prefs.fontSize, prefs.lang]);

  function setPrefs(patch: Partial<Prefs>) {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota/private-mode errors
      }
      return next;
    });
  }

  return (
    <PreferencesContext.Provider value={{ prefs, setPrefs, ready }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): Ctx {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
