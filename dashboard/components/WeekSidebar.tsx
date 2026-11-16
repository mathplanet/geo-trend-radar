import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { formatWeekRange, getAllDigestWeeks, getItemsForWeek } from "@/lib/queries";

export default async function WeekSidebar({
  currentWeek,
  locale,
}: {
  currentWeek: string;
  locale: Locale;
}) {
  const weeks = await getAllDigestWeeks();
  const items = await getItemsForWeek(currentWeek);
  const latestWeek = weeks[0];

  return (
    <div className="space-y-8 text-sm">
      <div>
        <h2 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          {t(locale, "weeklyViewHeading")}
        </h2>
        <ul className="mt-2 space-y-1">
          {weeks.map((week) => {
            const active = week === currentWeek;
            return (
              <li key={week}>
                <Link
                  href={week === latestWeek ? "/" : `/${week}`}
                  className={`block rounded-md px-2 py-1.5 transition-colors ${
                    active
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="font-medium">{week}</div>
                  <div className="text-xs text-neutral-400 dark:text-neutral-500">
                    {formatWeekRange(week)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          {t(locale, "weekSummaryHeading")}
        </h2>
        <p className="mt-2">
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {items.length}
          </span>
          <span className="ml-1 text-neutral-400 dark:text-neutral-500">
            {t(locale, "collectedCountSuffix")}
          </span>
        </p>
      </div>
    </div>
  );
}
