"use client";

/**
 * Progress lives entirely in the browser: no accounts, no analytics, nothing
 * about a child leaves the device. Each profile gets its own localStorage key,
 * so siblings sharing a tablet keep separate XP, streaks and review schedules.
 */

import { activeProfileId, progressKey } from "./profiles";

export interface WordProgress {
  /** SM-2 style ease factor. */
  ease: number;
  intervalDays: number;
  dueAt: number;
  correct: number;
  wrong: number;
}

export interface Progress {
  version: 1;
  xp: number;
  streakDays: number;
  lastPracticedDay: string | null;
  words: Record<string, WordProgress>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const emptyProgress = (): Progress => ({
  version: 1,
  xp: 0,
  streakDays: 0,
  lastPracticedDay: null,
  words: {},
});

const dayKey = (at: number): string => new Date(at).toISOString().slice(0, 10);

export function loadProgress(profileId?: string): Progress {
  if (typeof window === "undefined") return emptyProgress();
  const stored = window.localStorage.getItem(progressKey(profileId ?? activeProfileId()));
  if (stored === null) return emptyProgress();
  try {
    const parsed = JSON.parse(stored) as Progress;
    return parsed.version === 1 ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: Progress, profileId?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    progressKey(profileId ?? activeProfileId()),
    JSON.stringify(progress),
  );
}

/**
 * Graduating intervals: a correct answer multiplies the interval by the ease
 * factor, a wrong answer resets it to same-day and makes the word easier to
 * re-earn, so misses come back inside the current session.
 */
export function scheduleWord(
  existing: WordProgress | undefined,
  correct: boolean,
  now = Date.now(),
): WordProgress {
  const current = existing ?? { ease: 2.3, intervalDays: 0, dueAt: now, correct: 0, wrong: 0 };
  if (!correct) {
    return {
      ease: Math.max(1.3, current.ease - 0.2),
      intervalDays: 0,
      dueAt: now,
      correct: current.correct,
      wrong: current.wrong + 1,
    };
  }
  const intervalDays = current.intervalDays === 0 ? 1 : Math.round(current.intervalDays * current.ease);
  return {
    ease: Math.min(2.8, current.ease + 0.05),
    intervalDays,
    dueAt: now + intervalDays * DAY_MS,
    correct: current.correct + 1,
    wrong: current.wrong,
  };
}

export function recordAnswer(
  progress: Progress,
  oromo: string,
  correct: boolean,
  now = Date.now(),
): Progress {
  const today = dayKey(now);
  const yesterday = dayKey(now - DAY_MS);
  const streakDays =
    progress.lastPracticedDay === today
      ? progress.streakDays
      : progress.lastPracticedDay === yesterday
        ? progress.streakDays + 1
        : 1;

  return {
    ...progress,
    xp: progress.xp + (correct ? 10 : 2),
    streakDays,
    lastPracticedDay: today,
    words: { ...progress.words, [oromo]: scheduleWord(progress.words[oromo], correct, now) },
  };
}

export function dueWords(progress: Progress, now = Date.now()): string[] {
  return Object.entries(progress.words)
    .filter(([, word]) => word.dueAt <= now)
    .sort(([, a], [, b]) => a.dueAt - b.dueAt)
    .map(([oromo]) => oromo);
}

export function unitMastery(progress: Progress, words: string[]): number {
  if (words.length === 0) return 0;
  const learned = words.filter((oromo) => (progress.words[oromo]?.intervalDays ?? 0) >= 1).length;
  return learned / words.length;
}
