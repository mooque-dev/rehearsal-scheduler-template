import { PreferencesProvider } from "@/lib/prefs";
import { getBrandSafe } from "@/lib/data";
import { BrandProvider } from "@/components/BrandProvider";
import BrandStyle from "@/components/BrandStyle";
import ScheduleApp from "@/components/ScheduleApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const brand = await getBrandSafe();
  return (
    <BrandProvider brand={brand}>
      <BrandStyle brand={brand} />
      <PreferencesProvider defaultTheme={brand.theme}>
        <ScheduleApp />
      </PreferencesProvider>
    </BrandProvider>
  );
}
