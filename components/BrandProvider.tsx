"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_BRAND, type Brand } from "@/lib/brand";

const BrandContext = createContext<Brand>(DEFAULT_BRAND);

/** Gives client components the company's brand (logo, header layout). */
export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}
