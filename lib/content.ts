import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";

export interface Word {
  english: string;
  pos: string;
  oromo: string;
  alternates: string[];
  ipa: string | null;
  /** Local mirrored clip, or null when no correctly-licensed recording exists. */
  audio: string | null;
  confidence: "high" | "medium" | "low" | "none";
}

export interface Unit {
  id: string;
  order: number;
  title: string;
  reviewed: boolean;
  words: Word[];
}

interface RawWord {
  english: string;
  pos: string;
  oromo: string | null;
  alternates: string[];
  ipa: string | null;
  confidence: Word["confidence"];
}

interface RawUnit {
  id: string;
  order: number;
  title: string;
  status: string;
  words: RawWord[];
}

interface Credit {
  file: string;
}

const CONTENT_ROOT = resolve(process.cwd(), "content", "units");
const CREDITS_PATH = resolve(process.cwd(), "public", "audio", "credits.json");

/** Mirrors scripts/mirror-audio.ts so a word resolves to its clip without a lookup table. */
function slugify(oromo: string): string {
  return oromo
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function mirroredClips(): Promise<Set<string>> {
  try {
    const credits = JSON.parse(await readFile(CREDITS_PATH, "utf8")) as Credit[];
    return new Set(credits.map((credit) => credit.file));
  } catch {
    return new Set();
  }
}

export async function loadUnits(): Promise<Unit[]> {
  const clips = await mirroredClips();
  const files = (await readdir(CONTENT_ROOT)).filter((name) => name.endsWith(".yaml"));

  const units = await Promise.all(
    files.map(async (name): Promise<Unit> => {
      const raw = parse(await readFile(resolve(CONTENT_ROOT, name), "utf8")) as RawUnit;
      return {
        id: raw.id,
        order: raw.order,
        title: raw.title,
        reviewed: raw.status !== "draft-unreviewed",
        words: raw.words.flatMap((word): Word[] => {
          if (word.oromo === null) return [];
          const file = `${slugify(word.oromo)}.mp3`;
          return [
            {
              english: word.english,
              pos: word.pos,
              oromo: word.oromo,
              alternates: word.alternates,
              ipa: word.ipa,
              audio: clips.has(file) ? `/audio/${file}` : null,
              confidence: word.confidence,
            },
          ];
        }),
      };
    }),
  );

  return units.sort((a, b) => a.order - b.order);
}

export async function loadUnit(unitId: string): Promise<Unit | null> {
  const units = await loadUnits();
  return units.find((unit) => unit.id === unitId) ?? null;
}
