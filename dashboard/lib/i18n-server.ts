import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "./i18n";

/** 서버 컴포넌트 전용 - "use client" 컴포넌트는 lib/i18n.ts(타입/사전)만 import할 것.
 * next/headers는 클라이언트 번들에 들어가면 빌드가 깨진다. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
}
