import { cookies } from "next/headers";
import { verifyToken, ARCHIVE_COOKIE } from "@/lib/archiveAuth";
import { PreferencesProvider } from "@/lib/prefs";
import ArchivePinGate from "@/components/ArchivePinGate";
import ArchiveApp from "@/components/ArchiveApp";
import { getBrandSafe } from "@/lib/data";
import { BrandProvider } from "@/components/BrandProvider";
import BrandStyle from "@/components/BrandStyle";

export default async function ArchivePage() {
  const store = await cookies();
  const authed = verifyToken(store.get(ARCHIVE_COOKIE)?.value);

  const brand = await getBrandSafe();
  return (
    <BrandProvider brand={brand}>
      <BrandStyle brand={brand} />
      {authed ? (
        <PreferencesProvider defaultTheme={brand.theme}>
          <ArchiveApp />
        </PreferencesProvider>
      ) : (
        <ArchivePinGate />
      )}
    </BrandProvider>
  );
}
