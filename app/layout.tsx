import type { Metadata, Viewport } from "next";
import { SITE, storageKey } from "@/lib/site.config";
import { getBrandSafe, getSiteSettingsSafe } from "@/lib/data";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The name and icon come from /admin (site name, uploaded logo), with the
// defaults in site.config.ts when nothing is set or the database is unreachable.
export async function generateMetadata(): Promise<Metadata> {
  const [site, brand] = await Promise.all([getSiteSettingsSafe(), getBrandSafe()]);
  const logo = brand.logoVersion ? `/api/brand/logo?v=${brand.logoVersion}` : null;
  return {
    title: site.title.en,
    description: SITE.description,
    openGraph: { title: site.title.en, description: SITE.description, siteName: site.title.en },
    appleWebApp: { title: site.title.en, capable: true, statusBarStyle: "black-translucent" },
    ...(logo ? { icons: { icon: logo, apple: logo } } : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // lets the page draw under the notch / home indicator; the save bar and
  // sheets pad themselves with env(safe-area-inset-bottom)
  viewportFit: "cover",
  // single value so PreferencesProvider can retint it when the theme changes
  themeColor: "#09090b",
};

// Runs before first paint. Preferences live in localStorage, so without this
// a light-theme or large-text user saw the dark/normal page for a beat on
// every load until React hydrated and caught up.
const PREPAINT = `try{var p=JSON.parse(localStorage.getItem("${storageKey("Prefs")}")||"{}"),d=document.documentElement;if(p.theme)d.dataset.theme=p.theme;if(p.fontSize)d.dataset.fontSize=p.fontSize;if(p.lang)d.lang=p.lang;if(p.theme==="light"){var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute("content","#fafafa")}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950">{children}</body>
    </html>
  );
}
