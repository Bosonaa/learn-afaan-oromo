/**
 * Mirrors the pronunciation clips referenced by the draft units into
 * public/audio, recording each file's own Commons licence and author.
 *
 * Wikimedia audio is licensed per file, not under the lexicon's licence, so a
 * clip is only mirrored once its licence is known; anything unresolved is left
 * out and reported rather than shipped without credit.
 */
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import { AUDIO_DIR, AUDIO_CREDITS_PATH, CONTENT_DIR } from "./config.js";

interface UnitFile {
  words: { oromo: string | null; audioUrl: string | null }[];
}

interface Credit {
  file: string;
  commonsFile: string;
  descriptionUrl: string;
  license: string;
  author: string;
}

const ALLOWED_LICENCES = /^(cc|public domain|pd|fal)/i;
const USER_AGENT = "learn-afaan-oromo/0.1 (https://github.com/Bosonaa/learn-afaan-oromo)";

const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

/** upload.wikimedia.org rate-limits bursts with 429; back off rather than give up. */
async function politeFetch(url: string | URL, attempt = 0): Promise<Response> {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (response.status !== 429 || attempt >= 5) return response;
  await sleep(2000 * 2 ** attempt);
  return politeFetch(url, attempt + 1);
}

/** "…/Om-aayyee.ogg/Om-aayyee.ogg.mp3" -> "Om-aayyee.ogg" */
function commonsFileName(audioUrl: string): string | null {
  const match = /\/([^/]+\.(?:ogg|wav|flac|mp3))(?:\/[^/]+)?$/.exec(
    decodeURIComponent(audioUrl),
  );
  return match?.[1] ?? null;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface CommonsMetadata {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: {
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }[];
      }
    >;
  };
}

async function fetchLicence(
  commonsFile: string,
): Promise<{ license: string; author: string; descriptionUrl: string } | null> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "extmetadata|url");
  url.searchParams.set("titles", `File:${commonsFile}`);

  const response = await politeFetch(url);
  if (!response.ok) return null;

  const body = (await response.json()) as CommonsMetadata;
  const page = Object.values(body.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  const meta = info?.extmetadata;
  const license = meta?.["LicenseShortName"]?.value;
  if (info?.descriptionurl === undefined || license === undefined) return null;

  return {
    license: stripHtml(license),
    author: stripHtml(meta?.["Artist"]?.value ?? "unknown"),
    descriptionUrl: info.descriptionurl,
  };
}

async function download(url: string, target: string): Promise<void> {
  const response = await politeFetch(url);
  if (!response.ok || response.body === null) {
    throw new Error(`download failed for ${url}: HTTP ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
}

async function collectClips(): Promise<Map<string, string>> {
  const unitsDir = resolve(CONTENT_DIR, "units");
  const files = (await readdir(unitsDir)).filter((name) => name.endsWith(".yaml")).sort();
  const clips = new Map<string, string>();

  for (const name of files) {
    const unit = parse(await readFile(resolve(unitsDir, name), "utf8")) as UnitFile;
    for (const word of unit.words) {
      if (word.audioUrl === null || word.oromo === null) continue;
      clips.set(word.oromo, word.audioUrl);
    }
  }
  return clips;
}

/** Filenames are keyed by Oromo word so the app can resolve audio without a lookup table. */
function slugify(oromo: string): string {
  return oromo
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main(): Promise<void> {
  await mkdir(AUDIO_DIR, { recursive: true });
  const clips = await collectClips();
  const credits: Credit[] = [];
  const skipped: string[] = [];

  for (const [oromo, audioUrl] of [...clips].sort(([a], [b]) => a.localeCompare(b))) {
    const commonsFile = commonsFileName(audioUrl);
    if (commonsFile === null) {
      skipped.push(`${oromo}: unrecognised URL ${audioUrl}`);
      continue;
    }

    const licence = await fetchLicence(commonsFile);
    if (licence === null) {
      skipped.push(`${oromo}: licence not resolvable for ${commonsFile}`);
      continue;
    }
    if (!ALLOWED_LICENCES.test(licence.license)) {
      skipped.push(`${oromo}: licence "${licence.license}" needs manual review`);
      continue;
    }

    const file = `${slugify(oromo)}.mp3`;
    await download(audioUrl, resolve(AUDIO_DIR, file));
    credits.push({ file, commonsFile, ...licence });
    console.log(`${file}  ${licence.license}  ${licence.author}`);
    await sleep(400);
  }

  await writeFile(AUDIO_CREDITS_PATH, `${JSON.stringify(credits, null, 2)}\n`, "utf8");
  console.log(`\nmirrored ${credits.length} clips -> ${AUDIO_DIR}`);
  if (skipped.length > 0) {
    console.log(`skipped ${skipped.length}:`);
    for (const reason of skipped) console.log(`  ${reason}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
