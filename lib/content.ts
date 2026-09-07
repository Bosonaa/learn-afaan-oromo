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
  ipa: string | null;
  /** Playable clip, or null when nobody has recorded this word yet. */
  audio: string | null;
  /** Wikimedia mirror, or a recording made by the family. */
  audioSource: "commons" | "family" | null;
  confidence: "high" | "medium" | "low" | "none";
  /** Signed off by a fluent speaker rather than machine-proposed. */
  verified: boolean;
}

export interface Unit {
  id: string;
  order: number;
  title: string;
  reviewed: boolean;
  words: Word[];
}

export interface Level {
  order: number;
  title: string;
  units: Unit[];
}

interface RawWord {
  english: string;
  pos: string;
  oromo: string | null;
  alternates: string[];
  ipa: string | null;
  confidence: Word["confidence"];
  verified?: boolean;
}

interface RawUnit {
  id: string;
  order: number;
  title: string;
  status: string;
  words: RawWord[];
}

const unitsRoot = (courseId: string): string =>
  resolve(process.cwd(), "content", "courses", courseId, "units");

export async function loadUnits(courseId: string): Promise<Unit[]> {
  const root = unitsRoot(courseId);
  const clips = await mirroredClips();
  const recorded = new Map((await loadRecordings()).map((rec) => [rec.oromo, rec.file]));
  const files = (await readdir(root)).filter((name) => name.endsWith(".yaml"));

  const units = await Promise.all(
    files.map(async (name): Promise<Unit> => {
      const raw = parse(await readFile(resolve(root, name), "utf8")) as RawUnit;
      return {
        id: raw.id,
        order: raw.order,
        title: raw.title,
        reviewed: raw.status !== "draft-unreviewed",
        words: raw.words.flatMap((word): Word[] => {
          if (word.oromo === null) return [];
          const file = `${slugify(word.oromo)}.mp3`;
          // A licensed native recording wins; a family recording fills the gaps.
          const ownRecording = recorded.get(word.oromo);
          const audio = clips.has(file)
            ? `/audio/${file}`
            : ownRecording === undefined
              ? null
              : `/audio/recorded/${ownRecording}`;
          return [
            {
              english: word.english,
              pos: word.pos,
              oromo: word.oromo,
              alternates: word.alternates,
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

export async function loadUnit(courseId: string, unitId: string): Promise<Unit | null> {
  const units = await loadUnits(courseId);
  return units.find((unit) => unit.id === unitId) ?? null;
}

export async function loadLevels(course: Course | string): Promise<Level[]> {
  const resolved = typeof course === "string" ? courseById(course) : course;
  if (resolved === null) return [];

  const byLevel = new Map<number, Unit[]>();
  for (const unit of await loadUnits(resolved.id)) {
    const level = levelOf(unit.order);
    const existing = byLevel.get(level);
    if (existing === undefined) byLevel.set(level, [unit]);
    else existing.push(unit);
  }

  return [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([order, units]) => ({ order, title: levelTitle(resolved, order), units }));
}
