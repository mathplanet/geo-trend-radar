"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export default function CopyButton({ text, locale = "ko" }: { text: string; locale?: Locale }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const label = locale === "en" ? (copied ? "Copied" : "Copy") : copied ? "복사됨" : "복사";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
    >
      {label}
    </button>
  );
}
