"use client";

import { useEffect, useRef, useState } from "react";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=Zs0hrmBwihs";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 브라우저는 소리 있는 오디오의 완전 자동재생을 막는다 - 음소거 autoplay로 먼저 걸어두고,
 * 사용자가 페이지 아무 곳이나 처음 클릭/키 입력하는 순간(정책이 허용하는 "사용자 상호작용")에
 * 음소거를 풀어서 "들어오면 바로 재생되는" 느낌에 가장 가깝게 흉내낸다. */
export default function BgmBanner() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      window.removeEventListener("pointerdown", unmuteOnFirstInteraction);
      window.removeEventListener("keydown", unmuteOnFirstInteraction);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800">
      <audio ref={audioRef} src="/Always.mp3" loop muted autoPlay />
      <button
        type="button"
        onClick={toggleMute}
        className="shrink-0 rounded-md px-1.5 py-1 text-xs font-semibold text-neutral-500 transition-colors hover:bg-white/60 dark:text-neutral-400 dark:hover:bg-neutral-700/60"
        title={muted ? "BGM 켜기" : "BGM 끄기"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={handleSeek}
        className="h-1 w-20 cursor-pointer accent-neutral-500 dark:accent-neutral-400 sm:w-28"
        title="재생 위치 이동"
      />
      <span className="w-8 shrink-0 text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
        {formatTime(currentTime)}
      </span>
      <a
        href={YOUTUBE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        title="유튜브에서 보기"
      >
        ▶ YouTube
      </a>
    </div>
  );
}
