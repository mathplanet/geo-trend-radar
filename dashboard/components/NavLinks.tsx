"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "다이제스트" },
  { href: "/search", label: "검색" },
  { href: "/stats", label: "수집 현황" },
];

export default function NavLinks() {
  const pathname = usePathname();

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
                : label === "수집 현황"
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
