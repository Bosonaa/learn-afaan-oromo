"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfiles, type Profiles } from "@/lib/profiles";
import { dueWords, emptyProgress, loadProgress, unitMastery, type Progress } from "@/lib/progress";
import { ProfileSwitcher } from "./profile-switcher";

export interface UnitSummary {
  id: string;
  title: string;
  order: number;
  reviewed: boolean;
  words: string[];
  withAudio: number;
  verified: number;
}

export function UnitList({ units }: { units: UnitSummary[] }) {
  // Progress is client-only, so render the server view first and fill it in after mount.
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  useEffect(() => {
    const stored = loadProfiles();
    setProfiles(stored);
    setProgress(loadProgress(stored.activeId));
  }, []);

  const switchProfiles = (next: Profiles): void => {
    setProfiles(next);
    setProgress(loadProgress(next.activeId));
  };

  const due = new Set(dueWords(progress));
  const anyUnreviewed = units.some((unit) => !unit.reviewed);
  const verified = units.reduce((sum, unit) => sum + unit.verified, 0);
  const total = units.reduce((sum, unit) => sum + unit.words.length, 0);

  return (
    <div className="space-y-6">
      {profiles === null ? null : (
        <ProfileSwitcher profiles={profiles} onChange={switchProfiles} />
      )}

      <div className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
        <Stat label="XP" value={String(progress.xp)} />
        <Stat label="Day streak" value={String(progress.streakDays)} />
        <Stat label="Words to review" value={String(due.size)} />
      </div>

      {anyUnreviewed ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {verified} of {total} words are <strong>checked by a fluent speaker</strong>. The rest are
          still a machine-generated draft from open dictionary data — some are wrong, so check them
          against the review sheet before trusting a lesson.
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
                  {unit.words.length} words · {unit.withAudio} with native audio ·{" "}
                  {unit.verified} checked
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
