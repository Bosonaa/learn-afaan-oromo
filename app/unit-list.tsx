"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dueWords, emptyProgress, loadProgress, unitMastery, type Progress } from "@/lib/progress";

export interface UnitSummary {
  id: string;
  title: string;
  order: number;
  reviewed: boolean;
  words: string[];
  withAudio: number;
}

export function UnitList({ units }: { units: UnitSummary[] }) {
  // Progress is client-only, so render the server view first and fill it in after mount.
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const due = new Set(dueWords(progress));
  const anyUnreviewed = units.some((unit) => !unit.reviewed);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
        <Stat label="XP" value={String(progress.xp)} />
        <Stat label="Day streak" value={String(progress.streakDays)} />
        <Stat label="Words to review" value={String(due.size)} />
      </div>

      {anyUnreviewed ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          These words are an <strong>unreviewed draft</strong> generated from open dictionary data.
          Some are wrong — check them against the review sheet before trusting a lesson.
        </p>
      ) : null}

      <ul className="space-y-3">
        {units.map((unit) => {
          const mastery = Math.round(100 * unitMastery(progress, unit.words));
          const dueHere = unit.words.filter((word) => due.has(word)).length;
          return (
            <li key={unit.id}>
              <Link
                href={`/learn/${unit.id}`}
                className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-semibold">
                    <span className="text-slate-400">Unit {unit.order} · </span>
                    {unit.title}
                  </h2>
                  <span className="text-sm text-slate-500">{mastery}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-teal-600" style={{ width: `${mastery}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {unit.words.length} words · {unit.withAudio} with native audio
                  {dueHere > 0 ? ` · ${dueHere} to review` : ""}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="text-2xl font-bold text-teal-700">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
