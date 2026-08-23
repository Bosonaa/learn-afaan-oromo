import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
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
  const recorded = new Map((await loadRecordings()).map((rec) => [rec.oromo, rec.file]));
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

export async function loadUnit(unitId: string): Promise<Unit | null> {
  const units = await loadUnits();
  return units.find((unit) => unit.id === unitId) ?? null;
}
