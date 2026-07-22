import RequestBoard from "@/components/RequestBoard";
import { getAllRequests } from "@/lib/queries";

export default async function RequestsPage() {
  const requests = await getAllRequests();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        요청
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        대시보드에 필요한 기능이나 개선사항을 자유롭게 남겨주세요. 진행 상태는 누구나 바꿀 수
        있습니다.
      </p>
      <div className="mt-8">
        <RequestBoard initialRequests={requests} />
      </div>
    </div>
  );
}
