"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export default function NavLinks({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const LINKS = [
    { href: "/", label: t(locale, "navDigest") },
    { href: "/search", label: t(locale, "navSearch") },
    { href: "/stats", label: t(locale, "navStats") },
    { href: "/ai-usage", label: t(locale, "navAiUsage") },
    { href: "/requests", label: t(locale, "navRequests") },
  ];

  return (
    <nav className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                : href === "/stats"
                  ? "text-indigo-600 hover:bg-white/60 dark:text-indigo-400 dark:hover:bg-neutral-700/60"
                  : "text-neutral-500 hover:bg-white/60 dark:text-neutral-400 dark:hover:bg-neutral-700/60"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
