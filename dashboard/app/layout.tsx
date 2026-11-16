import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import BgmBanner from "@/components/BgmBanner";
import LocaleToggle from "@/components/LocaleToggle";
import NavLinks from "@/components/NavLinks";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
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
  title: "GEO Trend Radar",
  description: "GEO/SEO 트렌드 주간 다이제스트",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto flex max-w-6xl items-end justify-between px-6 py-4">
            <div>
              <Link href="/" className="text-lg font-semibold tracking-tight">
                GEO Trend Radar
              </Link>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t(locale, "headerSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NavLinks locale={locale} />
              <LocaleToggle locale={locale} />
              <BgmBanner />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
