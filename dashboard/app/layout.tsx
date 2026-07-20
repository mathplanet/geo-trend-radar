import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto flex max-w-4xl items-end justify-between px-6 py-4">
            <div>
              <Link href="/" className="text-lg font-semibold tracking-tight">
                GEO Trend Radar
              </Link>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                GEO/SEO 트렌드 주간 다이제스트
              </p>
            </div>
            <Link
              href="/stats"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              수집 현황
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
