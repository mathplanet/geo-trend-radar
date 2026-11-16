import Link from "next/link";
import DigestView from "@/components/DigestView";
import GroupSummarySidebar from "@/components/GroupSummarySidebar";
import WeekSidebar from "@/components/WeekSidebar";
import { getLocale } from "@/lib/i18n-server";
import { getAllDigestWeeks, getLatestDigest } from "@/lib/queries";

export default async function HomePage() {
  const [digest, weeks, locale] = await Promise.all([
    getLatestDigest(),
    getAllDigestWeeks(),
    getLocale(),
  ]);

  if (!digest) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400">
        {locale === "en"
          ? "No digest has been published yet. It will appear here once the first weekly batch runs."
          : "아직 발행된 다이제스트가 없습니다. 첫 주간 배치가 실행되면 여기에 표시됩니다."}
      </p>
    );
  }

  const pastWeeks = weeks.filter((week) => week !== digest.week);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
      <aside className="hidden lg:block">
        <WeekSidebar currentWeek={digest.week} locale={locale} />
      </aside>

      <div className="min-w-0">
        <DigestView digest={digest} locale={locale} isLatest />

        {pastWeeks.length > 0 && (
          <section className="mt-10 border-t border-neutral-200 pt-6 lg:hidden dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              {locale === "en" ? "Past Weeks" : "지난 주차 아카이브"}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {pastWeeks.map((week) => (
                <li key={week}>
                  <Link
                    href={`/${week}`}
                    className="rounded border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {week}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="hidden lg:block">
        <GroupSummarySidebar week={digest.week} locale={locale} />
      </aside>
    </div>
  );
}
