import Link from "next/link";
import DigestView from "@/components/DigestView";
import { getAllDigestWeeks, getLatestDigest } from "@/lib/queries";

export default async function HomePage() {
  const [digest, weeks] = await Promise.all([
    getLatestDigest(),
    getAllDigestWeeks(),
  ]);

  if (!digest) {
    return (
      <p className="text-neutral-500">
        아직 발행된 다이제스트가 없습니다. 첫 주간 배치가 실행되면 여기에
        표시됩니다.
      </p>
    );
  }

  const pastWeeks = weeks.filter((week) => week !== digest.week);

  return (
    <div className="space-y-10">
      <DigestView digest={digest} />
      {pastWeeks.length > 0 && (
        <section className="border-t border-neutral-200 pt-6">
          <h2 className="text-sm font-semibold text-neutral-500">
            지난 주차 아카이브
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {pastWeeks.map((week) => (
              <li key={week}>
                <Link
                  href={`/${week}`}
                  className="rounded border border-neutral-300 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {week}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
