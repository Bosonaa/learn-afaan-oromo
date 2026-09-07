/**
 * Reviewer corrections. A fluent speaker's word wins over anything the drafter
 * proposed, so `content/overrides.yaml` is the file that survives regeneration
 * while the generated unit YAML under `content/courses` is disposable. The
 * review tool writes here (locally) and `npm run draft:units` reads it back.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse, stringify } from "yaml";

export interface Override {
  oromo: string;
  alternates?: string[];
  reviewer?: string;
  note?: string;
}

/** unit id -> English prompt -> correction. */
export type Overrides = Record<string, Record<string, Override>>;

export const OVERRIDES_PATH = resolve(
  process.cwd(),
  "content",
  "overrides.yaml",
);

const HEADER = [
  "# Corrections from a fluent speaker. These win over anything the draft proposes",
  "# and mark the word verified, so regenerating content never loses a review.",
  "# Keyed by unit id, then by the English prompt.",
  "#",
  "# oromo:      the word to teach",
  "# alternates: also accepted when the learner types an answer",
  "# reviewer:   who signed it off",
  "",
].join("\n");

export async function loadOverrides(): Promise<Overrides> {
  try {
    return (
      (parse(await readFile(OVERRIDES_PATH, "utf8")) as Overrides | null) ?? {}
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export async function saveOverrides(overrides: Overrides): Promise<void> {
  const sorted = Object.fromEntries(
    Object.keys(overrides)
      .sort()
      .map((unitId) => [unitId, overrides[unitId]]),
  );
  await writeFile(OVERRIDES_PATH, `${HEADER}\n${stringify(sorted)}`, "utf8");
}
