import GlobalSearch from "@/components/GlobalSearch";
import { getAllItemsForSearch } from "@/lib/queries";

export default async function SearchPage() {
  const items = await getAllItemsForSearch();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        검색
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        특정 주차에 한정되지 않고, 지금까지 수집된 모든 글에서 찾습니다.
      </p>
      <div className="mt-8">
        <GlobalSearch items={items} />
      </div>
    </div>
  );
}
