# Future phases — kept, but not part of the app

Next.js ignores folders whose name starts with `_`, so nothing here is a route and nothing here
loads in the running app. The code is preserved so a later phase can move it back.

- `record/` and `api/recordings/` — in-browser pronunciation recording. Audio is a future phase:
  lessons ask and answer in text only.
- `dictionary/` — search over the whole open lexicon. A dictionary feature is a future phase and
  will be built on the reviewed lesson material rather than the raw lexicon.

Supporting code that is still imported by these pages (`lib/audio.ts`, `lib/dictionary.ts`,
`lib/recordings.ts`, `public/audio/`, `scripts/mirror-audio.ts`) is likewise kept unchanged.
