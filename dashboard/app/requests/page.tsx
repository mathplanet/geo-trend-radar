import RequestBoard from "@/components/RequestBoard";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAllRequests } from "@/lib/queries";

export default async function RequestsPage() {
  const [requests, locale] = await Promise.all([getAllRequests(), getLocale()]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t(locale, "requestsTitle")}
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        {locale === "en"
          ? "Leave any feature requests or improvements for the dashboard. Anyone can update the status."
          : "대시보드에 필요한 기능이나 개선사항을 자유롭게 남겨주세요. 진행 상태는 누구나 바꿀 수 있습니다."}
      </p>
      <div className="mt-8">
        <RequestBoard initialRequests={requests} />
      </div>
    </div>
  );
}
