"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProfiles, type Profiles } from "@/lib/profiles";
import { dueWords, loadProgress, unitMastery, type Progress } from "@/lib/progress";
import { ProfileSwitcher } from "./profile-switcher";

export interface CourseSummary {
  id: string;
  name: string;
  nativeName: string | null;
  from: string;
  badge: string;
  available: boolean;
  levels: number;
  units: number;
  /** Every word in the course, for this child's mastery and review counts. */
  words: string[];
}

const readProgress = (
  courses: CourseSummary[],
  profileId: string,
): Record<string, Progress> =>
  Object.fromEntries(courses.map((course) => [course.id, loadProgress(course.id, profileId)]));

/**
 * The app's front door: which language to learn, and who is learning it. A
 * child picks a course here and everything below `/[course]` belongs to it.
 */
export function CourseGrid({ courses }: { courses: CourseSummary[] }) {
  // Progress is client-only, so render the server view first and fill it in after mount.
  const [profiles, setProfiles] = useState<Profiles | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});

  useEffect(() => {
    const stored = loadProfiles();
    setProfiles(stored);
    setProgress(readProgress(courses, stored.activeId));
  }, [courses]);

  const switchProfiles = (next: Profiles): void => {
    setProfiles(next);
    setProgress(readProgress(courses, next.activeId));
  };

  return (
    <div className="space-y-6">
      {profiles === null ? null : (
        <ProfileSwitcher profiles={profiles} onChange={switchProfiles} />
      )}

      <div>
        <h1 className="text-2xl font-bold">What would you like to learn?</h1>
        <p className="mt-1 text-slate-500">Short lessons, ten questions at a time.</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const courseProgress = progress[course.id];
          const mastery =
            courseProgress === undefined
              ? 0
              : Math.round(100 * unitMastery(courseProgress, course.words));
          const due =
            courseProgress === undefined
              ? 0
              : dueWords(courseProgress).filter((word) => course.words.includes(word)).length;

          const inner = (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    course.available ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {course.badge}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold">{course.name}</span>
                  <span className="block truncate text-sm text-slate-500">
                    {course.nativeName === null
                      ? `from ${course.from}`
                      : `${course.nativeName} · from ${course.from}`}
                  </span>
                </span>
              </div>

              {course.available ? (
                <>
                  <p className="mt-3 text-sm text-slate-500">
                    {course.levels} levels · {course.units} units · {course.words.length} words
                    {due > 0 ? ` · ${due} to review` : ""}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-teal-600" style={{ width: `${mastery}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {courseProgress === undefined
                      ? "\u00a0"
                      : `${mastery}% learned · ${courseProgress.xp} XP`}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Coming later</p>
              )}
            </>
          );

          return (
            <li key={course.id}>
              {course.available ? (
                <Link
                  href={`/${course.id}`}
                  className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  aria-disabled
                  className="block rounded-xl bg-white p-4 opacity-60 shadow-sm"
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
