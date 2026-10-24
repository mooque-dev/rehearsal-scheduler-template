import { brandCss, brandFontsHref, type Brand } from "@/lib/brand";
import { storageKey } from "@/lib/site.config";

/** The brand's stylesheet for a branded page (not /admin, which stays neutral). */
export default function BrandStyle({ brand }: { brand: Brand }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={brandFontsHref(brand)} />
      <style dangerouslySetInnerHTML={{ __html: brandCss(brand) }} />
      {/* first visit (no saved preferences): open in the company's theme without a flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(!localStorage.getItem(${JSON.stringify(storageKey("Prefs"))}))document.documentElement.dataset.theme=${JSON.stringify(brand.theme)}}catch(e){}`,
        }}
      />
    </>
  );
}
