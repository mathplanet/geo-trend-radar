"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

function writeLocaleCookie(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
}

export default function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    writeLocaleCookie(next);
    router.refresh();
  };

  return (
    <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
      {(["ko", "en"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
            locale === value
              ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
              : "text-neutral-500 hover:bg-white/60 dark:text-neutral-400 dark:hover:bg-neutral-700/60"
          }`}
        >
          {value === "ko" ? "KR" : "EN"}
        </button>
      ))}
    </div>
  );
}
