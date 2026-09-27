"use client";

/**
 * Progress lives entirely in the browser: no accounts, no analytics, nothing
 * about a child leaves the device. Each profile gets its own localStorage key
 * per course, so siblings sharing a tablet keep separate points, streaks and review
 * schedules, and one child's languages do not share a streak either.
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
  /** Shown to children as "Points"; the key stays `xp` so saved progress reads back. */
  xp: number;
  /** Consecutive days the daily goal was met. */
  streakDays: number;
  lastPracticedDay: string | null;
  words: Record<string, WordProgress>;
  /** Correct answers wanted each day; absent on progress saved before goals. */
  goal?: number;
  today?: { day: string; correct: number };
  lastGoalDay?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Words a day a child can pick from; ten is a few minutes of practice. */
export const GOAL_CHOICES = [5, 10, 20, 30];
export const DEFAULT_GOAL = 10;

export const emptyProgress = (): Progress => ({
  version: 1,
  xp: 0,
  streakDays: 0,
  lastPracticedDay: null,
  words: {},
  goal: DEFAULT_GOAL,
  today: undefined,
  lastGoalDay: null,
});

/**
 * The child's own calendar day, not UTC: a goal reached at 8pm must not count
 * for tomorrow, which is what UTC does west of Greenwich.
 */
const dayKey = (at: number): string => {
  const date = new Date(at);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${`${date.getDate()}`.padStart(2, "0")}`;
};

export function loadProgress(courseId: string, profileId?: string): Progress {
  if (typeof window === "undefined") return emptyProgress();
  const stored = window.localStorage.getItem(
    progressKey(profileId ?? activeProfileId(), courseId),
  );
  if (stored === null) return emptyProgress();
  try {
    const parsed = JSON.parse(stored) as Progress;
    return parsed.version === 1 ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: Progress, courseId: string, profileId?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    progressKey(profileId ?? activeProfileId(), courseId),
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

export const dailyGoal = (progress: Progress): number => progress.goal ?? DEFAULT_GOAL;

/** Correct answers given today, in any unit of this course. */
export function answeredToday(progress: Progress, now = Date.now()): number {
  return progress.today?.day === dayKey(now) ? progress.today.correct : 0;
}

export const goalMet = (progress: Progress, now = Date.now()): boolean =>
  answeredToday(progress, now) >= dailyGoal(progress);

export function setDailyGoal(progress: Progress, goal: number): Progress {
  return { ...progress, goal };
}

/**
 * The streak counts days the daily goal was met, not days the app was opened,
 * so "keep the streak" and "do today's practice" are the same thing.
 */
export function recordAnswer(
  progress: Progress,
  oromo: string,
  correct: boolean,
  now = Date.now(),
): Progress {
  const today = dayKey(now);
  const yesterday = dayKey(now - DAY_MS);
  const correctToday = answeredToday(progress, now) + (correct ? 1 : 0);
  const met = correctToday >= dailyGoal(progress);
  // Progress saved before goals existed has no goal day at all: treat its last
  // practice day as one, so an existing streak is not thrown away. A stored
  // `null` means "goal never met" and must not fall back.
  const lastGoalDay =
    progress.lastGoalDay === undefined ? progress.lastPracticedDay : progress.lastGoalDay;
  const streakDays =
    lastGoalDay === today
      ? progress.streakDays
      : met
        ? lastGoalDay === yesterday
          ? progress.streakDays + 1
          : 1
        : progress.streakDays;

  return {
    ...progress,
    xp: progress.xp + (correct ? 10 : 2),
    streakDays,
    lastPracticedDay: today,
    lastGoalDay: met ? today : lastGoalDay ?? null,
    today: { day: today, correct: correctToday },
    words: { ...progress.words, [oromo]: scheduleWord(progress.words[oromo], correct, now) },
  };
}

export function dueWords(progress: Progress, now = Date.now()): string[] {
  return Object.entries(progress.words)
    .filter(([, word]) => word.dueAt <= now)
    .sort(([, a], [, b]) => a.dueAt - b.dueAt)
    .map(([oromo]) => oromo);
}

/** A word counts as learned once it has been answered correctly and scheduled ahead. */
export const isLearned = (progress: Progress, oromo: string): boolean =>
  (progress.words[oromo]?.intervalDays ?? 0) >= 1;

export function learnedCount(progress: Progress, words: string[]): number {
  return words.filter((oromo) => isLearned(progress, oromo)).length;
}

/** Forgets a unit so its words are all asked again; points and streak are kept. */
export function resetWords(progress: Progress, words: string[]): Progress {
  const forget = new Set(words);
  return {
    ...progress,
    words: Object.fromEntries(
      Object.entries(progress.words).filter(([oromo]) => !forget.has(oromo)),
    ),
  };
}

export function unitMastery(progress: Progress, words: string[]): number {
  if (words.length === 0) return 0;
  return learnedCount(progress, words) / words.length;
}
