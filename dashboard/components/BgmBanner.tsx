"use client";

import { useEffect, useRef, useState } from "react";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=Zs0hrmBwihs";

/** 브라우저는 소리 있는 오디오의 완전 자동재생을 막는다 - 음소거 autoplay로 먼저 걸어두고,
 * 사용자가 페이지 아무 곳이나 처음 클릭/키 입력하는 순간(정책이 허용하는 "사용자 상호작용")에
 * 음소거를 풀어서 "들어오면 바로 재생되는" 느낌에 가장 가깝게 흉내낸다. */
export default function BgmBanner() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play().catch(() => {
      // 음소거 autoplay도 막히는 환경(드묾) - 수동 재생 버튼으로 대체되니 무시.
    });

    const unmuteOnFirstInteraction = () => {
      audio.muted = false;
      setMuted(false);
      audio.play().catch(() => {});
    };

    window.addEventListener("pointerdown", unmuteOnFirstInteraction, { once: true });
    window.addEventListener("keydown", unmuteOnFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unmuteOnFirstInteraction);
      window.removeEventListener("keydown", unmuteOnFirstInteraction);
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted) {
      audio.play().catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
      <audio ref={audioRef} src="/Always.mp3" loop muted autoPlay />
      <button
        type="button"
        onClick={toggleMute}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-neutral-500 transition-colors hover:bg-white/60 dark:text-neutral-400 dark:hover:bg-neutral-700/60"
        title={muted ? "BGM 켜기" : "BGM 끄기"}
      >
        {muted ? "🔇" : "🔊"} BGM
      </button>
      <a
        href={YOUTUBE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        title="유튜브에서 보기"
      >
        ▶ YouTube
      </a>
    </div>
  );
}
