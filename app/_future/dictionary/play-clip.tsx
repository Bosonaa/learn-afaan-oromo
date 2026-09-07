"use client";

import { useRef } from "react";

export function PlayClip({ src, label }: { src: string; label: string }) {
  const player = useRef<HTMLAudioElement | null>(null);

  const play = (): void => {
    player.current?.pause();
    const next = new Audio(src);
    player.current = next;
    void next.play().catch(() => undefined);
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Play ${label}`}
      className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800 hover:bg-teal-100"
    >
      ▶︎ Listen
    </button>
  );
}
