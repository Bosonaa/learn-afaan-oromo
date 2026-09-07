import type { Word } from "./content";

/**
 * Both directions are multiple choice. Answers are never typed and audio is a
 * future phase, so there is no listening or spelling kind.
 */
export type ExerciseKind = "en-to-om" | "om-to-en";

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  word: Word;
  prompt: string;
  choices: string[];
  answer: string;
}

/** Seeded so a lesson is stable across re-renders and identical on server and client. */
export function makeRandom(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const a = result[index];
    const b = result[swap];
    if (a === undefined || b === undefined) continue;
    result[index] = b;
    result[swap] = a;
  }
  return result;
}

function distractors(
  correct: string,
  pool: string[],
  random: () => number,
  count: number,
): string[] {
  const options = shuffle(
    [...new Set(pool)].filter((option) => option !== correct),
    random,
  ).slice(0, count);
  return shuffle([correct, ...options], random);
}

function build(word: Word, kind: ExerciseKind, unit: Word[], random: () => number): Exercise {
  const id = `${word.oromo}:${kind}`;
  switch (kind) {
    case "en-to-om":
      return {
        id,
        kind,
        word,
        prompt: word.english,
        choices: distractors(
          word.oromo,
          unit.map((other) => other.oromo),
          random,
          3,
        ),
        answer: word.oromo,
      };
    case "om-to-en":
      return {
        id,
        kind,
        word,
        prompt: word.oromo,
        choices: distractors(
          word.english,
          unit.map((other) => other.english),
          random,
          3,
        ),
        answer: word.english,
      };
  }
}

export interface LessonOptions {
  /** Words the learner is due to review, in priority order. */
  due?: string[];
  length?: number;
}

/**
 * A lesson mixes words due for review with new words from the unit, then draws
 * one exercise kind per word so the same word is never asked twice in a row.
 */
export function buildLesson(
  unit: Word[],
  seed: string,
  { due = [], length = 10 }: LessonOptions = {},
): Exercise[] {
  const random = makeRandom(seed);
  const byOromo = new Map(unit.map((word) => [word.oromo, word]));
  const dueWords = due.flatMap((oromo) => {
    const word = byOromo.get(oromo);
    return word === undefined ? [] : [word];
  });
  const rest = shuffle(
    unit.filter((word) => !due.includes(word.oromo)),
    random,
  );

  const selected = [...dueWords, ...rest].slice(0, length);
  return selected.map((word) => {
    const kind: ExerciseKind = random() < 0.5 ? "en-to-om" : "om-to-en";
    return build(word, kind, unit, random);
  });
}

export function isCorrect(exercise: Exercise, response: string): boolean {
  return response === exercise.answer;
}
