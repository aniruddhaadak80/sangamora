"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { create } from "zustand";

export type Locale = "en" | "hi";

interface UIState {
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useUI = create<UIState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
  locale: "en",
  setLocale: (l) => {
    set({ locale: l });
    if (typeof window !== "undefined") localStorage.setItem("sangamora.locale", l);
  },
}));

export function UIProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = (localStorage.getItem("sangamora.locale") as Locale | null) ?? "en";
    useUI.getState().setLocale(saved);
  }, []);
  return <>{children}</>;
}

export function useLocale() {
  const locale = useUI((s) => s.locale);
  const setLocale = useUI((s) => s.setLocale);
  return { locale, setLocale };
}

export const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void } | null>(null);
export function useLocaleCtx() {
  const ctx = useContext(LocaleContext);
  if (!ctx) return { locale: "en" as Locale, setLocale: () => {} };
  return ctx;
}