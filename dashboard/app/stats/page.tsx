import StatsChart from "@/components/StatsChart";
import StatsExplorer from "@/components/StatsExplorer";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAllItemsForStats } from "@/lib/queries";

export default async function StatsPage() {
  const [items, locale] = await Promise.all([getAllItemsForStats(), getLocale()]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t(locale, "statsTitle")}
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        {t(locale, "statsDescription")}
      </p>
      <div className="mt-8">
        <StatsChart items={items} />
      </div>

      <div className="mt-12">
        <StatsExplorer items={items} />
      </div>
    </div>
  );
}
