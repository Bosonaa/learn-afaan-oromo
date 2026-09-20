"use client";

/**
 * The fluent speaker's workbench. Every answer is editable text rather than a
 * pick-list: the drafted word is often nearly right (a spelling), and the
 * alternates the lexicon offers frequently do not contain the correct word at
 * all, so the reviewer must be able to simply type it.
 *
 * This is a grown-up tool, not a lesson: typing here does not contradict the
 * choice-only rule for children's exercises.
 *
 * It also has to work for a reviewer who has no checkout: on a hosted copy the
 * API refuses to write, so corrections are kept on the reviewer's own device
 * and exported as a file that `npm run apply:corrections` folds back in.
 */

import { useEffect, useMemo, useState } from "react";

export interface ReviewWord {
  english: string;
  pos: string;
  oromo: string;
  alternates: string[];
  /** On phrases: who is speaking, and to whom. */
  note: string | null;
  confidence: string;
  verified: boolean;
}

export interface ReviewUnit {
  id: string;
  order: number;
  title: string;
  kind: "words" | "phrases";
  words: ReviewWord[];
}

export interface ReviewCourse {
  id: string;
  name: string;
  units: ReviewUnit[];
}

const REVIEWER_KEY = "learn-afaan-oromo:reviewer:v1";
const PENDING_KEY = "learn-afaan-oromo:corrections:v1";

interface Correction {
  courseId: string;
  unitId: string;
  english: string;
  oromo: string;
  alternates: string[];
  reviewer: string;
  note: string;
}

const keyOf = (courseId: string, unitId: string, english: string): string =>
  `${courseId}::${unitId}::${english}`;

function readPending(): Record<string, Correction> {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw === null ? {} : (JSON.parse(raw) as Record<string, Correction>);
  } catch {
    return {};
  }
}

type RowState = "idle" | "saving" | "saved";

interface Draft {
  oromo: string;
  alternates: string;
  note: string;
}

export function ReviewTool({ courses }: { courses: ReviewCourse[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const course =
    courses.find((candidate) => candidate.id === courseId) ?? courses[0];
  const [unitId, setUnitId] = useState(course?.units[0]?.id ?? "");
  const [reviewer, setReviewer] = useState("");
  const [editable, setEditable] = useState<boolean | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false);
  const [pending, setPending] = useState<Record<string, Correction>>({});

  useEffect(() => {
    setReviewer(window.localStorage.getItem(REVIEWER_KEY) ?? "");
    setPending(readPending());
    void fetch("/api/review")
      .then((response) => (response.ok ? response.json() : { editable: false }))
      .then((body: { editable?: boolean }) =>
        setEditable(body.editable === true),
      )
      .catch(() => setEditable(false));
  }, []);

  const unit =
    course?.units.find((candidate) => candidate.id === unitId) ??
    course?.units[0];

  const rows = useMemo(() => {
    const words = unit?.words ?? [];
    return onlyUnreviewed ? words.filter((word) => !word.verified) : words;
  }, [unit, onlyUnreviewed]);

  /** An answer already kept on this device wins: it is the reviewer's own. */
  const draftFor = (word: ReviewWord): Draft => {
    const kept =
      course === undefined || unit === undefined
        ? undefined
        : pending[keyOf(course.id, unit.id, word.english)];
    return (
      drafts[word.english] ?? {
        oromo: kept?.oromo ?? word.oromo,
        alternates: (kept?.alternates ?? word.alternates).join(", "),
        note: kept?.note ?? "",
      }
    );
  };

  const setDraft = (
    english: string,
    patch: Partial<Draft>,
    word: ReviewWord,
  ): void => {
    setDrafts((current) => ({
      ...current,
      [english]: { ...draftFor(word), ...patch },
    }));
    setStates((current) => ({ ...current, [english]: "idle" }));
  };

  const keep = (correction: Correction): void => {
    const key = keyOf(correction.courseId, correction.unitId, correction.english);
    const next = { ...readPending(), [key]: correction };
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(next));
    setPending(next);
  };

  const download = (): void => {
    const corrections = Object.values(pending);
    const blob = new Blob(
      [JSON.stringify({ version: 1, corrections }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `corrections-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const forget = (): void => {
    window.localStorage.removeItem(PENDING_KEY);
    setPending({});
  };

  const save = (word: ReviewWord): void => {
    if (course === undefined || unit === undefined) return;
    const draft = draftFor(word);
    if (draft.oromo.trim() === "") return;
    setStates((current) => ({ ...current, [word.english]: "saving" }));
    window.localStorage.setItem(REVIEWER_KEY, reviewer);
    const correction: Correction = {
      courseId: course.id,
      unitId: unit.id,
      english: word.english,
      oromo: draft.oromo.trim(),
      alternates: draft.alternates
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value !== ""),
      reviewer,
      note: draft.note,
    };

    if (editable === false) {
      keep(correction);
      setStates((current) => ({ ...current, [word.english]: "saved" }));
      return;
    }

    void fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(correction),
    })
      .then((response) => {
        if (!response.ok) throw new Error("rejected");
        setStates((current) => ({ ...current, [word.english]: "saved" }));
      })
      .catch(() => {
        keep(correction);
        setStates((current) => ({ ...current, [word.english]: "saved" }));
      });
  };

  if (course === undefined || unit === undefined) {
    return <p className="text-slate-600">No course content to review.</p>;
  }

  const outstanding = (candidate: ReviewUnit): number =>
    candidate.words.filter((word) => !word.verified).length;

  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold">Review words and phrases</h1>
        <p className="text-sm text-slate-600">
          Fix the Afaan Oromo answer for any prompt: edit the text, or type the
          right word if it is not offered at all. Phrase sets start out empty on
          purpose — nothing can translate a sentence for you, so a set stays
          locked in the app until you have answered at least four of its
          phrases.
        </p>
        {editable === true ? (
          <p className="text-sm text-slate-600">
            Saving writes <code>content/overrides.yaml</code> and updates the
            lesson, so the correction survives regenerating the content — commit
            the two changed files to keep it.
          </p>
        ) : null}
        {editable === false ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            This copy cannot write to the content files, so your answers are
            kept on this device. When you are done, download them and send the
            file back — nothing is lost as long as you stay in this browser.
          </p>
        ) : null}
      </section>

      {Object.keys(pending).length > 0 ? (
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-300 bg-sky-50 p-4">
          <span className="text-sm font-semibold text-sky-900">
            {Object.keys(pending).length} answer
            {Object.keys(pending).length === 1 ? "" : "s"} saved on this device
          </span>
          <button
            type="button"
            onClick={download}
            className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
          >
            Download and send them
          </button>
          <button
            type="button"
            onClick={forget}
            className="text-sm text-sky-900 underline"
          >
            Clear
          </button>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">
            Course
          </span>
          <select
            value={course.id}
            onChange={(event) => {
              const next = courses.find(
                (candidate) => candidate.id === event.target.value,
              );
              setCourseId(event.target.value);
              setUnitId(next?.units[0]?.id ?? "");
            }}
            className="w-full rounded-lg border border-slate-300 px-2 py-2"
          >
            {courses.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Unit</span>
          <select
            value={unit.id}
            onChange={(event) => setUnitId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-2"
          >
            {course.units.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.kind === "phrases" ? "Phrases " : ""}
                {candidate.order}. {candidate.title} ({outstanding(candidate)}{" "}
                left)
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-700">
            Your name
          </span>
          <input
            value={reviewer}
            onChange={(event) => setReviewer(event.target.value)}
            placeholder="Recorded with each fix"
            className="w-full rounded-lg border border-slate-300 px-2 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-3">
          <input
            type="checkbox"
            checked={onlyUnreviewed}
            onChange={(event) => setOnlyUnreviewed(event.target.checked)}
          />
          Show only prompts nobody has signed off yet
        </label>
      </section>

      <ul className="space-y-3">
        {rows.map((word) => {
          const draft = draftFor(word);
          const state = states[word.english] ?? "idle";
          return (
            <li
              key={word.english}
              className="space-y-2 rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold">{word.english}</span>
                <span className="text-xs text-slate-500">{word.pos}</span>
                {word.note === null ? null : (
                  <span className="text-xs text-slate-500">({word.note})</span>
                )}
                {word.verified ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                    reviewed
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    draft · {word.confidence} confidence
                  </span>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">
                    Answer to teach
                  </span>
                  <input
                    value={draft.oromo}
                    onChange={(event) =>
                      setDraft(
                        word.english,
                        { oromo: event.target.value },
                        word,
                      )
                    }
                    placeholder={
                      unit.kind === "phrases"
                        ? "Type the Afaan Oromo phrase"
                        : undefined
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-2"
                    aria-label={`Afaan Oromo for ${word.english}`}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">
                    Also acceptable (comma separated)
                  </span>
                  <input
                    value={draft.alternates}
                    onChange={(event) =>
                      setDraft(
                        word.english,
                        { alternates: event.target.value },
                        word,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-2 py-2"
                    aria-label={`Alternates for ${word.english}`}
                  />
                </label>
              </div>

              {word.alternates.length > 0 ? (
                <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  Lexicon also suggested:
                  {word.alternates.map((alternate) => (
                    <button
                      key={alternate}
                      type="button"
                      onClick={() =>
                        setDraft(word.english, { oromo: alternate }, word)
                      }
                      className="rounded-full bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
                    >
                      {alternate}
                    </button>
                  ))}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={draft.note}
                  onChange={(event) =>
                    setDraft(word.english, { note: event.target.value }, word)
                  }
                  placeholder="Note (optional)"
                  aria-label={`Note for ${word.english}`}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => save(word)}
                  disabled={state === "saving" || draft.oromo.trim() === ""}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {state === "saving" ? "Saving…" : "Save correction"}
                </button>
                {state === "saved" ? (
                  <span className="text-sm text-emerald-700">Saved</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
