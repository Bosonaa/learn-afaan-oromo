"use client";

/**
 * The daily goal is the only thing pushing a child to come back tomorrow, so it
 * is deliberately small, visible before any lesson, and chosen by the child.
 * Nothing is locked or taken away when the goal is missed; the streak simply
 * stops.
 */

import { useState } from "react";
import {
  answeredToday,
  dailyGoal,
  GOAL_CHOICES,
  saveProgress,
  setDailyGoal,
  type Progress,
} from "@/lib/progress";

export function DailyGoal({
  courseId,
  profileId,
  progress,
  onChange,
}: {
  courseId: string;
  profileId: string;
  progress: Progress;
  onChange: (progress: Progress) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const goal = dailyGoal(progress);
  const done = answeredToday(progress);
  const met = done >= goal;

  const choose = (next: number): void => {
    const updated = setDailyGoal(progress, next);
    saveProgress(updated, courseId, profileId);
    setChoosing(false);
    onChange(updated);
  };

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">
            {met ? "Today's goal is done!" : "Today's goal"}
          </div>
          <div className="text-sm text-slate-500">
            {met
              ? `${done} right answers today — the streak is safe`
              : `${done} of ${goal} right answers today`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setChoosing((open) => !open)}
          aria-expanded={choosing}
          className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold"
        >
          Change goal
        </button>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${met ? "bg-amber-500" : "bg-teal-600"}`}
          style={{ width: `${Math.min(100, Math.round((100 * done) / goal))}%` }}
        />
      </div>

      {choosing ? (
        <div className="flex flex-wrap gap-2">
          {GOAL_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => choose(choice)}
              aria-pressed={choice === goal}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                choice === goal
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {choice} a day
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
