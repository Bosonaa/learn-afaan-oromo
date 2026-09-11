"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Word } from "@/lib/content";
import { buildLesson, isCorrect, type Exercise } from "@/lib/exercises";
import { loadProfiles, type Profile } from "@/lib/profiles";
import { dueWords, loadProgress, recordAnswer, saveProgress } from "@/lib/progress";
import { ReportWord } from "@/app/report-word";

const LESSON_LENGTH = 10;

type Verdict = { correct: boolean; expected: string } | null;

export function Lesson({
  courseId,
  unitId,
  title,
  levelLabel,
  words,
}: {
  courseId: string;
  unitId: string;
  title: string;
  levelLabel: string;
  words: Word[];
}) {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [score, setScore] = useState(0);
  // Pinned at mount: whoever started the lesson is credited with it, even if
  // the profile is switched in another tab.
  const [learner, setLearner] = useState<Profile | null>(null);

  // Built after mount because lesson composition depends on locally stored progress.
  useEffect(() => {
    const { profiles, activeId } = loadProfiles();
    setLearner(profiles.find((profile) => profile.id === activeId) ?? null);
    const progress = loadProgress(courseId, activeId);
    setExercises(
      buildLesson(words, `${unitId}:${progress.xp}`, {
        due: dueWords(progress),
        length: LESSON_LENGTH,
      }),
    );
  }, [courseId, unitId, words]);

  const exercise = exercises?.[index] ?? null;

  const submit = (response: string): void => {
    if (exercise === null || verdict !== null) return;
    const correct = isCorrect(exercise, response);
    setVerdict({ correct, expected: exercise.answer });
    if (correct) setScore((current) => current + 1);
    const profileId = learner?.id;
    saveProgress(
      recordAnswer(loadProgress(courseId, profileId), exercise.word.oromo, correct),
      courseId,
      profileId,
    );
  };

  const next = (): void => {
    setVerdict(null);
    setIndex((current) => current + 1);
  };

  if (exercises === null) {
    return (
      <div className="space-y-4">
        <BackToLevels courseId={courseId} />
        <p className="text-slate-500">Loading lesson…</p>
      </div>
    );
  }

  if (exercise === null) {
    return (
      <div className="space-y-4 rounded-xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-teal-700">Lesson complete</h1>
        <p className="text-slate-600">
          {score} of {exercises.length} correct
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href={`/${courseId}`}
            className="rounded-lg bg-slate-100 px-4 py-2 font-semibold"
          >
            Back to levels
          </Link>
          <button
            type="button"
            onClick={() => {
              const progress = loadProgress(courseId, learner?.id);
              setExercises(
                buildLesson(words, `${unitId}:${progress.xp}`, {
                  due: dueWords(progress),
                  length: LESSON_LENGTH,
                }),
              );
              setIndex(0);
              setScore(0);
            }}
            className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white"
          >
            Practise again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3 text-sm text-slate-500">
          <BackToLevels courseId={courseId} />
          <span className="truncate">
            {levelLabel} · {title}
            {learner === null ? "" : ` · ${learner.name}`}
          </span>
          <span className="whitespace-nowrap">
            {index + 1} / {exercises.length}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-teal-600 transition-all"
            style={{ width: `${(100 * index) / exercises.length}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {promptLabel(exercise)}
        </p>

        <p
          className={`mt-2 font-bold ${exercise.prompt.length > 24 ? "text-2xl" : "text-3xl"}`}
          data-testid="prompt"
        >
          {exercise.prompt}
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {exercise.choices.map((choice) => (
            <li key={choice}>
              <button
                type="button"
                onClick={() => submit(choice)}
                disabled={verdict !== null}
                className={choiceClass(choice, exercise, verdict)}
              >
                {choice}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {verdict !== null ? (
        <div
          role="status"
          className={`rounded-xl p-4 ${
            verdict.correct ? "bg-teal-50 text-teal-900" : "bg-rose-50 text-rose-900"
          }`}
        >
          <p className="font-semibold">
            {verdict.correct ? "Sirrii! (Correct)" : `Answer: ${verdict.expected}`}
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-3 block w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Continue
          </button>
          <ReportWord
            courseId={courseId}
            unitId={unitId}
            english={exercise.word.english}
            oromo={exercise.word.oromo}
          />
        </div>
      ) : null}
    </div>
  );
}

function BackToLevels({ courseId }: { courseId: string }) {
  return (
    <Link href={`/${courseId}`} className="text-sm font-medium text-teal-700 hover:underline">
      ← Levels
    </Link>
  );
}

function promptLabel(exercise: Exercise): string {
  switch (exercise.kind) {
    case "en-to-om":
      return "Which one means…";
    case "om-to-en":
      return "What does this mean?";
  }
}

function choiceClass(choice: string, exercise: Exercise, verdict: Verdict): string {
  const base = "w-full rounded-lg border px-4 py-3 text-left text-lg transition";
  if (verdict === null) return `${base} border-slate-300 bg-white hover:border-teal-500`;
  if (choice === exercise.answer) return `${base} border-teal-600 bg-teal-50 font-semibold`;
  return `${base} border-slate-200 bg-white text-slate-400`;
}
