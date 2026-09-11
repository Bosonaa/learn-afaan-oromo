"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfiles, type Profiles } from "@/lib/profiles";
import {
  dueWords,
  emptyProgress,
  loadProgress,
  unitMastery,
  type Progress,
} from "@/lib/progress";
import { ProfileSwitcher } from "@/app/profile-switcher";

export interface UnitSummary {
  id: string;
  title: string;
  /** Position inside its level, so a child sees "Unit 3 of 10". */
  position: number;
  reviewed: boolean;
  words: string[];
  verified: number;
  /** Prompts still waiting for a fluent speaker to supply the answer. */
  unanswered: number;
  locked: boolean;
}

export interface LevelSummary {
  kind: "words" | "phrases";
  order: number;
  title: string;
  units: UnitSummary[];
}

const levelKey = (level: LevelSummary): string => `${level.kind}-${level.order}`;

export function LevelList({
  courseId,
  courseName,
  levels,
}: {
  courseId: string;
  courseName: string;
  levels: LevelSummary[];
}) {
  // Progress is client-only, so render the server view first and fill it in after mount.
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  const [openLevel, setOpenLevel] = useState(
    levels[0] === undefined ? "" : levelKey(levels[0]),
  );

  useEffect(() => {
    const stored = loadProfiles();
    setProfiles(stored);
    const loaded = loadProgress(courseId, stored.activeId);
    setProgress(loaded);
    setOpenLevel(currentLevel(levels, loaded));
  }, [courseId, levels]);

  const switchProfiles = (next: Profiles): void => {
    setProfiles(next);
    const loaded = loadProgress(courseId, next.activeId);
    setProgress(loaded);
    setOpenLevel(currentLevel(levels, loaded));
  };

  const due = new Set(dueWords(progress));
  const wordUnits = levels
    .filter((level) => level.kind === "words")
    .flatMap((level) => level.units);
  const anyUnreviewed = wordUnits.some((unit) => !unit.reviewed);
  const verified = wordUnits.reduce((sum, unit) => sum + unit.verified, 0);
  const total = wordUnits.reduce((sum, unit) => sum + unit.words.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">{courseName}</h1>
        <Link
          href="/"
          className="text-sm font-medium text-teal-700 hover:underline"
        >
          Change language
        </Link>
      </div>

      {profiles === null ? null : (
        <ProfileSwitcher profiles={profiles} onChange={switchProfiles} />
      )}

      <div className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
        <Stat label="Points" value={String(progress.xp)} />
        <Stat label="Day streak" value={String(progress.streakDays)} />
        <Stat label="Words to review" value={String(due.size)} />
      </div>

      {anyUnreviewed ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {verified} of {total} words are{" "}
          <strong>checked by a fluent speaker</strong>. The rest are still a
          machine-generated draft from open dictionary data — some are wrong, so
          check them against the review sheet before trusting a lesson.{" "}
          <Link href="/review" className="font-semibold underline">
            Fix a word
          </Link>
        </p>
      ) : null}

      <ul className="space-y-4">
        {levels.map((level) => {
          const words = level.units.flatMap((unit) => unit.words);
          const mastery = Math.round(100 * unitMastery(progress, words));
          const open = levelKey(level) === openLevel;
          const phrases = level.kind === "phrases";
          const waiting = level.units.reduce(
            (sum, unit) => sum + unit.unanswered,
            0,
          );
          return (
            <li
              key={levelKey(level)}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenLevel(open ? "" : levelKey(level))}
                aria-expanded={open}
                className="w-full p-4 text-left"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    {phrases ? null : (
                      <span className="text-slate-400">
                        Level {level.order} ·{" "}
                      </span>
                    )}
                    {level.title}
                  </h2>
                  <span className="whitespace-nowrap text-sm text-slate-500">
                    {mastery}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-teal-600"
                    style={{ width: `${mastery}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {level.units.length} {phrases ? "sets" : "units"} ·{" "}
                  {words.length} {phrases ? "phrases" : "words"}
                  {waiting > 0 ? ` · ${waiting} awaiting a translation` : ""}
                  {open ? "" : " · tap to open"}
                </p>
              </button>

              {open ? (
                <ul className="border-t border-slate-100">
                  {level.units.map((unit) => {
                    const unitDone = Math.round(
                      100 * unitMastery(progress, unit.words),
                    );
                    const dueHere = unit.words.filter((word) =>
                      due.has(word),
                    ).length;
                    const detail = (
                      <>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                          {unit.position}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {unit.title}
                          </span>
                          <span className="block text-sm text-slate-500">
                            {unit.locked
                              ? `${unit.unanswered} phrases waiting for a fluent speaker`
                              : `${unit.words.length} ${phrases ? "phrases" : "words"} · ${unit.verified} checked${
                                  dueHere > 0 ? ` · ${dueHere} to review` : ""
                                }`}
                          </span>
                        </span>
                        <span className="text-sm text-slate-500">
                          {unit.locked ? "Locked" : `${unitDone}%`}
                        </span>
                      </>
                    );
                    return (
                      <li key={unit.id}>
                        {unit.locked ? (
                          <div className="flex items-center gap-3 px-4 py-3 opacity-60">
                            {detail}
                          </div>
                        ) : (
                          <Link
                            href={`/${courseId}/learn/${unit.id}`}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                          >
                            {detail}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The first level with words left to learn — where a child should carry on. */
function currentLevel(levels: LevelSummary[], progress: Progress): string {
  const teachable = levels.filter((level) =>
    level.units.some((unit) => !unit.locked),
  );
  const unfinished = teachable.find(
    (level) =>
      unitMastery(
        progress,
        level.units.flatMap((unit) => unit.words),
      ) < 1,
  );
  const fallback = teachable[teachable.length - 1] ?? levels[0];
  const level = unfinished ?? fallback;
  return level === undefined ? "" : levelKey(level);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="text-2xl font-bold text-teal-700">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}
