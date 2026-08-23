import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface Recording {
  /** Oromo word as spelled in the unit files. */
  oromo: string;
  /** File name inside public/audio/recorded. */
  file: string;
  /** Whose voice this is, for the credits page. */
  speaker: string;
  recordedAt: string;
}

export const RECORDINGS_PATH = resolve(process.cwd(), "content", "recordings.json");
export const RECORDED_DIR = resolve(process.cwd(), "public", "audio", "recorded");

export async function loadRecordings(): Promise<Recording[]> {
  try {
    return JSON.parse(await readFile(RECORDINGS_PATH, "utf8")) as Recording[];
  } catch {
    return [];
  }
}
