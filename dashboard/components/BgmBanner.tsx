"use client";

import { useEffect, useRef, useState } from "react";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=Zs0hrmBwihs";
const TRACK_TITLE = "GEO Radar Theme";
const DEFAULT_VOLUME = 20;

function HeadphonesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

/** 브라우저는 소리 있는 오디오의 완전 자동재생을 막는다 - 음소거 autoplay로 먼저 걸어두고,
 * 사용자가 페이지 아무 곳이나 처음 클릭/키 입력하는 순간(정책이 허용하는 "사용자 상호작용")에
 * 음소거를 풀어서 "들어오면 바로 재생되는" 느낌에 가장 가깝게 흉내낸다. */
export default function BgmBanner() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = DEFAULT_VOLUME / 100;

    audio.play().catch(() => {
      // 음소거 autoplay도 막히는 환경(드묾) - 수동 재생 버튼으로 대체되니 무시.
    });

    const unmuteOnFirstInteraction = () => {
      audio.muted = false;
      audio.play().catch(() => {});
    };

    window.addEventListener("pointerdown", unmuteOnFirstInteraction, { once: true });
    window.addEventListener("keydown", unmuteOnFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unmuteOnFirstInteraction);
      window.removeEventListener("keydown", unmuteOnFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.muted = false;
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.volume = value / 100;
    audio.muted = false;
    setVolume(value);
  };

  return (
    <div ref={panelRef} className="relative">
      <audio ref={audioRef} src="/api/bgm" loop muted autoPlay />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        title="배경음악"
      >
        <HeadphonesIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              title={playing ? "일시정지" : "재생"}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div className="min-w-0">
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">지금 재생 중</p>
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {TRACK_TITLE}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">볼륨</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 flex-1 cursor-pointer accent-neutral-500 dark:accent-neutral-400"
            />
            <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500">
              {volume}%
            </span>
          </div>

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-[11px] text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            YouTube에서 듣기 ↗
          </a>
        </div>
      )}
    </div>
  );
}
