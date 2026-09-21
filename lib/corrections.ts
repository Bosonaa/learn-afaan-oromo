/**
 * Applying a fluent speaker's correction, from either end: the local review
 * API applies one as it is typed, and `npm run apply:corrections` applies a
 * batch that a reviewer collected on a phone and sent back as a file.
 *
 * A correction lands in two places: `content/overrides.yaml`, which survives
 * regeneration, and the generated unit YAML, so the lesson teaches it now.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse, stringify } from "yaml";
import { loadOverrides, saveOverrides, type Override } from "@/lib/overrides";

export interface Correction {
  courseId: string;
  unitId: string;
  english: string;
  oromo: string;
  alternates: string[];
  reviewer: string;
  note: string;
}

const LIMIT = 200;

export function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, LIMIT) : "";
}

export function parseCorrection(body: unknown): Correction | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = body as Record<string, unknown>;
  const correction: Correction = {
    courseId: clean(raw.courseId),
    unitId: clean(raw.unitId),
    english: clean(raw.english),
    oromo: clean(raw.oromo),
    alternates: Array.isArray(raw.alternates)
      ? raw.alternates.map(clean).filter((value) => value !== "")
      : [],
    reviewer: clean(raw.reviewer),
    note: clean(raw.note),
  };
  const required = [
    correction.courseId,
    correction.unitId,
    correction.english,
    correction.oromo,
  ];
  return required.some((value) => value === "") ? null : correction;
}

interface RawWord {
  english: string;
  oromo: string | null;
  alternates: string[];
  confidence: string;
  verified?: boolean;
}

interface RawUnit {
  status: string;
  words: RawWord[];
}

const contentPath = (courseId: string, dir: string, unitId: string): string =>
  resolve(process.cwd(), "content", "courses", courseId, dir, `${unitId}.yaml`);

/** Word units and phrase sets live in sibling directories, same YAML shape. */
async function readUnit(
  correction: Correction,
): Promise<{ path: string; text: string }> {
  const paths = ["units", "phrases"].map((dir) =>
    contentPath(correction.courseId, dir, correction.unitId),
  );
  for (const path of paths) {
    const text = await readFile(path, "utf8").catch(() => null);
    if (text !== null) return { path, text };
  }
  throw new Error("no such unit");
}

/** Teaches the correction now, instead of waiting for the next draft run. */
export async function applyToUnit(correction: Correction): Promise<boolean> {
  const { path, text } = await readUnit(correction);
  const unit = parse(text) as RawUnit;
  const word = unit.words.find(
    (candidate) => candidate.english === correction.english,
  );
  if (word === undefined) return false;

  word.oromo = correction.oromo;
  word.alternates = correction.alternates;
  word.confidence = "high";
  word.verified = true;
  if (unit.words.every((candidate) => candidate.verified === true))
    unit.status = "reviewed";

  await writeFile(path, stringify(unit), "utf8");
  return true;
}

export async function recordOverride(correction: Correction): Promise<void> {
  const override: Override = { oromo: correction.oromo };
  if (correction.alternates.length > 0)
    override.alternates = correction.alternates;
  if (correction.reviewer !== "") override.reviewer = correction.reviewer;
  if (correction.note !== "") override.note = correction.note;

  const overrides = await loadOverrides();
  overrides[correction.unitId] = {
    ...overrides[correction.unitId],
    [correction.english]: override,
  };
  await saveOverrides(overrides);
}
