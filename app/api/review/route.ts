/**
 * Saves a reviewer's correction: the drafted answer is often close but not
 * right (a spelling, or a sense the lexicon picked), and the alternates it
 * offers sometimes do not contain the correct word at all — so the reviewer
 * types the word rather than choosing from a list.
 *
 * Writing goes to files in the checkout, so it only works while running
 * locally; on a hosted deployment the checkout is read-only and the edit would
 * vanish on redeploy, so the route refuses there and the review page keeps the
 * corrections on the reviewer's device instead, to be exported as a file.
 */
import { NextResponse } from "next/server";
import {
  applyToUnit,
  parseCorrection,
  recordOverride,
} from "@/lib/corrections";

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

  const correction = parseCorrection(await request.json().catch(() => null));
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

  await recordOverride(correction);
  return NextResponse.json({ saved: correction.oromo }, { status: 201 });
}
