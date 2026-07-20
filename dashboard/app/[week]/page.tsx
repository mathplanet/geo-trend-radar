import Link from "next/link";
import { notFound } from "next/navigation";
import DigestView from "@/components/DigestView";
import GroupSummarySidebar from "@/components/GroupSummarySidebar";
import WeekSidebar from "@/components/WeekSidebar";
import { getAllDigestWeeks, getDigestByWeek } from "@/lib/queries";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const [digest, weeks] = await Promise.all([
    getDigestByWeek(week),
    getAllDigestWeeks(),
  ]);

  if (!digest) {
    notFound();
  }

  const otherWeeks = weeks.filter((w) => w !== digest.week);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
      <aside className="hidden lg:block">
        <WeekSidebar currentWeek={digest.week} />
      </aside>

      <div className="min-w-0">
        <DigestView digest={digest} />

        {otherWeeks.length > 0 && (
          <section className="mt-10 border-t border-neutral-200 pt-6 lg:hidden dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              다른 주차 보기
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {otherWeeks.map((w) => (
                <li key={w}>
                  <Link
                    href={w === weeks[0] ? "/" : `/${w}`}
                    className="rounded border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {w}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="hidden lg:block">
        <GroupSummarySidebar week={digest.week} />
      </aside>
    </div>
  );
}
