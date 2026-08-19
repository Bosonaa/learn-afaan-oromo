# learn-afaan-oromo

A Duolingo-style app for teaching Afaan Oromo to English-fluent kids (15 and under).

Two parts: a content pipeline that turns open dictionary data into reviewable unit word
lists, and a Next.js PWA that drills those words. The word lists are still an unreviewed
draft — the app says so on every screen until a fluent speaker signs them off.

## How the content is produced

```
kaikki.org Oromo JSONL   content/curriculum.ts
   (open lexicon)         (authored teaching order)
          \                     /
           npm run draft:units
                    |
        content/units/*.yaml        review/units-01-03-review.csv
        (draft, unreviewed)         (for a fluent speaker to correct)
```

The lexicon supplies Oromo↔English glosses, IPA and native-speaker audio; the curriculum
supplies which English concepts are taught, in which unit, in which order. A dictionary is
not a curriculum, so the two are kept separate on purpose.

## Running the app

```bash
npm install
npm run dev        # http://localhost:3000
```

Unit YAML and mirrored audio are committed, so the app runs without regenerating content.
Progress (XP, streak, spaced-repetition schedule) is stored in `localStorage` only: no
accounts, no server, no analytics, nothing about a child leaves the device.

Lessons are 10 prompts drawn from four exercise kinds — English→Oromo choice, Oromo→English
choice, listen-and-choose (only for words with a mirrored recording), and type-the-word.
Words due for review lead the lesson; a miss resets its interval so it returns the same day.

## Regenerating content

```bash
npm run fetch:lexicon   # ~92 MB download, gitignored
npm run build:lexicon   # -> data/lexicon.json
npm run draft:units     # -> content/units/*.yaml + review/*.csv
npm run mirror:audio    # -> public/audio/*.mp3 + credits.json
npm run typecheck && npm run lint
```

`mirror:audio` only mirrors a clip once it has resolved that file's own Commons licence and
author; anything unresolved is skipped and reported rather than shipped uncredited.

## Reviewing the draft

`review/units-01-03-review.csv` proposes an Oromo word per English concept, with alternates,
IPA, audio availability and a confidence flag. Automatic gloss inversion produces plausible
errors (e.g. English "head" can map to `abbaa manaa`, head of a household), so every row
needs a human verdict in the `verdict_ok_or_fix` column before it is used in a lesson.
Sort by `confidence` — `low` rows first, then `medium`.

Nothing in `content/units/` is teaching-ready while it is marked `status: draft-unreviewed`.

## Sourcing rules

See [ATTRIBUTION.md](./ATTRIBUTION.md). In short: app data comes from openly-licensed
sources plus family verification, so it can be published. Commercial dictionaries may be
consulted by a human while curating, but are never bulk-imported.
