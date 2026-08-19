# learn-afaan-oromo

A Duolingo-style app for teaching Afaan Oromo to English-fluent kids (15 and under).

This repository currently contains **content infrastructure only** — no app code yet. The
goal of this phase is a reviewed, correctly-licensed word list to build lessons on.

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

## Setup

```bash
npm install
npm run fetch:lexicon   # ~92 MB download, gitignored
npm run build:lexicon   # -> data/lexicon.json
npm run draft:units     # -> content/units/*.yaml + review/*.csv
npm run typecheck
```

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
