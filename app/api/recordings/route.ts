/**
 * Saves a family recording into the repo so it can be committed alongside the
 * word it teaches. Writing to the filesystem only makes sense while running
 * locally — on a hosted deployment the checkout is read-only and a recording
 * would vanish on redeploy — so the route refuses outside development.
 */
import { execFile } from "node:child_process";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { loadRecordings, RECORDED_DIR, RECORDINGS_PATH, type Recording } from "@/lib/recordings";

const run = promisify(execFile);

const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

function slugify(oromo: string): string {
  return oromo
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** mp3 plays everywhere; the browser's own container does not (iOS Safari + webm). */
async function toMp3(source: string, target: string): Promise<boolean> {
  try {
    await run("ffmpeg", ["-y", "-i", source, "-ac", "1", "-b:a", "96k", target]);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "recording is only available locally" }, { status: 403 });
  }

  const form = await request.formData();
  const oromo = form.get("oromo");
  const speaker = form.get("speaker");
  const clip = form.get("clip");
  if (typeof oromo !== "string" || typeof speaker !== "string" || !(clip instanceof Blob)) {
    return NextResponse.json({ error: "oromo, speaker and clip are required" }, { status: 400 });
  }

  const slug = slugify(oromo);
  if (slug === "") return NextResponse.json({ error: "unusable word" }, { status: 400 });

  await mkdir(RECORDED_DIR, { recursive: true });
  const extension = EXTENSIONS[clip.type.split(";")[0] ?? ""] ?? "webm";
  const raw = resolve(RECORDED_DIR, `${slug}.${extension}`);
  await writeFile(raw, Buffer.from(await clip.arrayBuffer()));

  let file = `${slug}.${extension}`;
  if (extension !== "mp3") {
    const converted = resolve(RECORDED_DIR, `${slug}.mp3`);
    if (await toMp3(raw, converted)) {
      await unlink(raw);
      file = `${slug}.mp3`;
    }
  }

  const recording: Recording = {
    oromo,
    file,
    speaker,
    recordedAt: new Date().toISOString(),
  };
  const recordings = (await loadRecordings()).filter((existing) => existing.oromo !== oromo);
  recordings.push(recording);
  recordings.sort((a, b) => a.oromo.localeCompare(b.oromo));
  await writeFile(RECORDINGS_PATH, `${JSON.stringify(recordings, null, 2)}\n`, "utf8");

  return NextResponse.json({ recording });
}
