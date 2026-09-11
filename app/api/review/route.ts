/**
 * Saves a reviewer's correction: the drafted answer is often close but not
 * right (a spelling, or a sense the lexicon picked), and the alternates it
 * offers sometimes do not contain the correct word at all — so the reviewer
 * types the word rather than choosing from a list.
 *
 * The correction goes to `content/overrides.yaml`, which regeneration honours,
 * and is applied to the unit YAML too so the lesson teaches it immediately.
 * Both are files in the checkout, so this only works while running locally;
 * on a hosted deployment the checkout is read-only and the edit would vanish
 * on redeploy, so the route refuses there.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { parse, stringify } from "yaml";
import { loadOverrides, saveOverrides, type Override } from "@/lib/overrides";

interface Correction {
  courseId: string;
  unitId: string;
  english: string;
  oromo: string;
  alternates: string[];
  reviewer: string;
  note: string;
}

const LIMIT = 200;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, LIMIT) : "";
}

function parseBody(body: unknown): Correction | null {
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
async function readUnit(correction: Correction): Promise<{ path: string; text: string }> {
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
async function applyToUnit(correction: Correction): Promise<boolean> {
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

export function GET(): NextResponse {
  return NextResponse.json({ editable: process.env.NODE_ENV !== "production" });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "review is only available locally" },
      { status: 403 },
    );
  }

  const correction = parseBody(await request.json().catch(() => null));
  if (correction === null) {
    return NextResponse.json({ error: "unusable correction" }, { status: 400 });
  }

  let applied: boolean;
  try {
    applied = await applyToUnit(correction);
  } catch {
    return NextResponse.json(
      { error: "could not read that unit or phrase set" },
      { status: 404 },
    );
  }
  if (!applied) {
    return NextResponse.json(
      { error: "no such prompt in that unit" },
      { status: 404 },
    );
  }

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

  return NextResponse.json({ saved: override }, { status: 201 });
}
