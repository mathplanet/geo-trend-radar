import StatsChart from "@/components/StatsChart";
import { getAllItemsForStats } from "@/lib/queries";

export default async function StatsPage() {
  const items = await getAllItemsForStats();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        수집 현황
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        주차별·일자별로 그룹(카테고리)마다 몇 건이 수집됐는지 확인합니다.
      </p>
      <div className="mt-8">
        <StatsChart items={items} />
      </div>
    </div>
  );
}
