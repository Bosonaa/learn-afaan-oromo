import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import { courseById, type Course } from "./courses";
import { levelOf, levelTitle } from "./levels";
import { mirroredClips, slugify } from "./audio";
import { loadRecordings } from "./recordings";

export interface Word {
  english: string;
  pos: string;
  oromo: string;
  alternates: string[];
  /** Context for a translator, on phrases: who is speaking, and to whom. */
  note: string | null;
  ipa: string | null;
  /** Playable clip, or null when nobody has recorded this word yet. */
  audio: string | null;
  /** Wikimedia mirror, or a recording made by the family. */
  audioSource: "commons" | "family" | null;
  confidence: "high" | "medium" | "low" | "none";
  /** Signed off by a fluent speaker rather than machine-proposed. */
  verified: boolean;
}

/** Words are drafted from the lexicon; phrases only ever come from a person. */
export type UnitKind = "words" | "phrases";

export interface Unit {
  id: string;
  order: number;
  title: string;
  kind: UnitKind;
  reviewed: boolean;
  words: Word[];
  /** Prompts nobody has answered yet, so they cannot be taught. */
  unanswered: number;
}

export interface Level {
  kind: UnitKind;
  order: number;
  title: string;
  units: Unit[];
}

interface RawWord {
  english: string;
  pos: string;
  oromo: string | null;
  alternates: string[];
  note?: string | null;
  ipa: string | null;
  confidence: Word["confidence"];
  verified?: boolean;
}

interface RawUnit {
  id: string;
  order: number;
  title: string;
  kind?: UnitKind;
  status: string;
  words: RawWord[];
}

const contentDir = (courseId: string, kind: UnitKind): string =>
  resolve(process.cwd(), "content", "courses", courseId, kind === "words" ? "units" : "phrases");

export interface LoadOptions {
  /**
   * Keep prompts with no answer, as the empty string. The review tool needs
   * them — an unanswered phrase is exactly what a reviewer is there to fix —
   * but lessons must never show one.
   */
  includeUnanswered?: boolean;
}

async function loadDir(
  courseId: string,
  kind: UnitKind,
  { includeUnanswered = false }: LoadOptions,
): Promise<Unit[]> {
  const root = contentDir(courseId, kind);
  const clips = await mirroredClips();
  const recorded = new Map((await loadRecordings()).map((rec) => [rec.oromo, rec.file]));
  const files = (await readdir(root).catch(() => [])).filter((name) => name.endsWith(".yaml"));

  const units = await Promise.all(
    files.map(async (name): Promise<Unit> => {
      const raw = parse(await readFile(resolve(root, name), "utf8")) as RawUnit;
      return {
        id: raw.id,
        order: raw.order,
        title: raw.title,
        kind: raw.kind ?? "words",
        reviewed: raw.status !== "draft-unreviewed",
        unanswered: raw.words.filter((word) => word.oromo === null).length,
        words: raw.words.flatMap((word): Word[] => {
          if (word.oromo === null && !includeUnanswered) return [];
          const oromo = word.oromo ?? "";
          const file = `${slugify(oromo)}.mp3`;
          // A licensed native recording wins; a family recording fills the gaps.
          const ownRecording = recorded.get(oromo);
          const audio = clips.has(file)
            ? `/audio/${file}`
            : ownRecording === undefined
              ? null
              : `/audio/recorded/${ownRecording}`;
          return [
            {
              english: word.english,
              pos: word.pos,
              oromo,
              alternates: word.alternates,
              note: word.note ?? null,
              ipa: word.ipa,
              audio,
              audioSource: audio === null ? null : clips.has(file) ? "commons" : "family",
              confidence: word.confidence,
              verified: word.verified ?? false,
            },
          ];
        }),
      };
    }),
  );

  return units.sort((a, b) => a.order - b.order);
}

export async function loadUnits(courseId: string, options: LoadOptions = {}): Promise<Unit[]> {
  return loadDir(courseId, "words", options);
}

export async function loadPhraseSets(courseId: string, options: LoadOptions = {}): Promise<Unit[]> {
  return loadDir(courseId, "phrases", options);
}

export async function loadUnit(courseId: string, unitId: string): Promise<Unit | null> {
  const units = [...(await loadUnits(courseId)), ...(await loadPhraseSets(courseId))];
  return units.find((unit) => unit.id === unitId) ?? null;
}

/** A lesson needs a correct answer plus three distractors from the same unit. */
export const MIN_TEACHABLE = 4;

function group(units: Unit[], title: (order: number) => string, kind: UnitKind): Level[] {
  const byLevel = new Map<number, Unit[]>();
  for (const unit of units) {
    const level = levelOf(unit.order);
    const existing = byLevel.get(level);
    if (existing === undefined) byLevel.set(level, [unit]);
    else existing.push(unit);
  }

  return [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([order, grouped]) => ({ kind, order, title: title(order), units: grouped }));
}

/**
 * Word levels first, then phrase levels: phrases build on words the child has
 * already met, so they come after the whole word course rather than inside it.
 */
export async function loadLevels(course: Course | string): Promise<Level[]> {
  const resolved = typeof course === "string" ? courseById(course) : course;
  if (resolved === null) return [];

  return [
    ...group(await loadUnits(resolved.id), (order) => levelTitle(resolved, order), "words"),
    ...group(
      await loadPhraseSets(resolved.id),
      (order) => (order === 1 ? "Phrases" : `More phrases ${order - 1}`),
      "phrases",
    ),
  ];
}
