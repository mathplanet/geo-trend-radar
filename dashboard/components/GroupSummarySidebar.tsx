import { getItemsForWeek } from "@/lib/queries";
import { CATEGORY_ORDER, getCategoryColor } from "@/lib/stats";

export default async function GroupSummarySidebar({ week }: { week: string }) {
  const items = await getItemsForWeek(week);

  const counts = new Map<string, number>();
  for (const item of items) {
    for (const category of item.categories ?? []) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  const ordered = CATEGORY_ORDER.filter((c) => counts.has(c));

  if (ordered.length === 0) return null;

  return (
    <div className="text-sm">
      <h2 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
        그룹별 현황
      </h2>
      <ul className="mt-2 space-y-1.5">
        {ordered.map((cat) => (
          <li key={cat} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: getCategoryColor(cat).light }}
              />
              <span className="truncate">{cat}</span>
            </span>
            <span className="shrink-0 tabular-nums text-neutral-400 dark:text-neutral-500">
              {counts.get(cat)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
