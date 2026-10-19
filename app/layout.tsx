import type { Metadata, Viewport } from "next";
import { SITE, storageKey } from "@/lib/site.config";
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

export const metadata: Metadata = {
  title: SITE.title.en,
  description: SITE.description,
  openGraph: { title: SITE.title.en, description: SITE.description, siteName: SITE.title.en },
  appleWebApp: { title: SITE.shortName, capable: true, statusBarStyle: "black-translucent" },
};

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
