import type { Metadata } from "next";
import { PreferencesProvider } from "@/lib/prefs";
import { getBrandSafe } from "@/lib/data";
import { BrandProvider } from "@/components/BrandProvider";
import BrandStyle from "@/components/BrandStyle";
import StartGuide from "@/components/StartGuide";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Make your own · 우리 팀 출석부 만들기",
  description: "Get your own copy of this rehearsal scheduler in about ten minutes, no coding.",
};

export default async function StartPage() {
  const brand = await getBrandSafe();
  return (
    <BrandProvider brand={brand}>
      <BrandStyle brand={brand} />
      <PreferencesProvider defaultTheme={brand.theme}>
        <StartGuide />
      </PreferencesProvider>
    </BrandProvider>
  );
}
