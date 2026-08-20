import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(scriptDir, "..");
export const DATA_DIR = resolve(REPO_ROOT, "data");
export const CONTENT_DIR = resolve(REPO_ROOT, "content");
export const REVIEW_DIR = resolve(REPO_ROOT, "review");
export const OVERRIDES_PATH = resolve(CONTENT_DIR, "overrides.yaml");

export const PUBLIC_DIR = resolve(REPO_ROOT, "public");
export const AUDIO_DIR = resolve(PUBLIC_DIR, "audio");
export const AUDIO_CREDITS_PATH = resolve(AUDIO_DIR, "credits.json");

export const RAW_LEXICON_PATH = resolve(DATA_DIR, "kaikki-oromo.jsonl");
export const LEXICON_PATH = resolve(DATA_DIR, "lexicon.json");

export const LEXICON_SOURCE_URL =
  "https://kaikki.org/dictionary/Oromo/kaikki.org-dictionary-Oromo.jsonl";

export const LEXICON_ATTRIBUTION = {
  name: "kaikki.org machine-readable Oromo dictionary (wiktextract of English Wiktionary)",
  url: "https://kaikki.org/dictionary/Oromo/",
  license: "CC BY-SA 4.0",
  note: "Audio files are individually licensed on Wikimedia Commons; per-file licence must be checked before redistribution.",
} as const;
