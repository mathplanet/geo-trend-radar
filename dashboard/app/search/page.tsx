import GlobalSearch from "@/components/GlobalSearch";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAllItemsForSearch } from "@/lib/queries";

export default async function SearchPage() {
  const [items, locale] = await Promise.all([getAllItemsForSearch(), getLocale()]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t(locale, "searchTitle")}
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        {t(locale, "searchDescription")}
      </p>
      <div className="mt-8">
        <GlobalSearch items={items} locale={locale} />
      </div>
    </div>
  );
}
