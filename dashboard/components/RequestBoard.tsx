"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RequestItem, RequestStatus } from "@/lib/types";

const STATUSES: RequestStatus[] = ["요청", "진행 중", "완료"];

function formatDate(ts: string): string {
  // ItemCard.tsx와 동일한 이유로 timeZone 명시 (서버/클라이언트 타임존 차이로 인한
  // 하이드레이션 불일치 방지, React #418).
  return new Date(ts).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

export default function RequestBoard({ initialRequests }: { initialRequests: RequestItem[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("requests")
      .insert({ content: trimmed, author: author.trim() || null, status: "요청" })
      .select()
      .single();
    setSubmitting(false);

    if (error || !data) return;
    setRequests((prev) => [data, ...prev]);
    setContent("");
  }

  async function handleStatusChange(id: number, status: RequestStatus) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await supabase.from("requests").update({ status }).eq("id", id);
  }

  function startEdit(r: RequestItem) {
    setEditingId(r.id);
    setEditContent(r.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function handleSaveEdit(id: number) {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, content: trimmed } : r)));
    setEditingId(null);
    await supabase.from("requests").update({ content: trimmed }).eq("id", id);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("이 요청을 삭제할까요?")) return;
    setRequests((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("requests").delete().eq("id", id);
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="어떤 기능이나 개선이 필요한가요?"
          rows={3}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="이름(선택)"
            className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="ml-auto rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            등록
          </button>
        </div>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {STATUSES.map((status) => {
          const columnItems = requests.filter((r) => r.status === status);
          return (
            <section key={status}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {status}
                <span className="font-normal text-neutral-400 dark:text-neutral-500">
                  {columnItems.length}건
                </span>
              </h2>
              <div className="mt-3 space-y-3">
                {columnItems.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {editingId === r.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          autoFocus
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-xs text-neutral-400 hover:underline dark:text-neutral-500"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(r.id)}
                            disabled={!editContent.trim()}
                            className="rounded bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                        {r.content}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                      <span>
                        {r.author || "익명"} · {formatDate(r.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="hover:text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                        <select
                          value={r.status}
                          onChange={(e) =>
                            handleStatusChange(r.id, e.target.value as RequestStatus)
                          }
                          className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {columnItems.length === 0 && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">없음</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
