# learn-afaan-oromo

A Duolingo-style app for teaching Afaan Oromo to English-fluent kids (15 and under).

Two parts: a content pipeline that turns open dictionary data into reviewable unit word
lists, and a Next.js PWA that drills those words. The word lists are still an unreviewed
draft — the app says so on every screen until a fluent speaker signs them off.

## How the content is produced

```
kaikki.org Oromo JSONL   content/courses/oromo/curriculum.ts
   (open lexicon)         (authored teaching order)
          \                     /
           npm run draft:units
                    |
 content/courses/oromo/units/*.yaml   review/<unit-id>.csv
        (draft, unreviewed)           (for a fluent speaker to correct)
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
[DEPLOY.md](DEPLOY.md) walks through building it, putting it on a phone and deploying.
Progress (points, streak, spaced-repetition schedule) is stored in `localStorage` only: no
accounts, no server, no analytics, nothing about a child leaves the device.

## Courses, levels, units

The app teaches **courses**, of which Afaan Oromo is the first: `/` is the language grid,
`/<course>` its levels, `/<course>/learn/<unit>` a lesson. A course is a registry entry in
`lib/courses.ts` (name, level titles) plus content in `content/courses/<id>/`, and it owns its
own progress — a child's streak in one language is not spent practising another. The first
course deliberately keeps the storage keys that predate courses, so devices already learning
Afaan Oromo keep their points and streaks.

Within a course, units are grouped ten at a time into **levels** (`lib/levels.ts`), so a course
opens on a short list of levels rather than one long list of units. Grouping follows unit order,
which is the teaching order authored in the course's `curriculum.ts`, so a new unit joins the
level its order falls in and a level needs only a title.

Lessons are 10 prompts, all multiple choice, in one of two directions — English→Oromo or
Oromo→English. Nothing is typed and nothing is played: there are no free-form answers and no
audio questions. Words due for review lead the lesson; a miss resets its interval so it
returns the same day.

## Later phases (built, but not part of the app)

`app/_future/` holds finished work that the current phase deliberately excludes: the
in-browser pronunciation recorder and the lexicon-wide dictionary search. Next.js does not
route folders starting with `_`, so none of it loads. See `app/_future/README.md`.

## Regenerating content

```bash
npm run fetch:lexicon   # ~92 MB download, gitignored
npm run build:lexicon   # -> data/lexicon.json
npm run draft:units     # -> content/courses/oromo/units/*.yaml + review/*.csv
npm run mirror:audio    # -> public/audio/*.mp3 + credits.json
npm run typecheck && npm run lint
```

`mirror:audio` only mirrors a clip once it has resolved that file's own Commons licence and
author; anything unresolved is skipped and reported rather than shipped uncredited.

## Reviewer corrections

`content/overrides.yaml` holds fluent-speaker verdicts keyed by unit and English
prompt. `npm run draft:units` applies them over whatever the lexicon proposes and
marks those words `verified: true`, so regenerating content never discards a
review.

## Reviewing the draft

Easiest way is the built-in review tool at `/review` while running locally (`npm run dev`):
pick a unit, then edit the Afaan Oromo answer as free text — the drafted word is often only
misspelled, and the alternates the lexicon offers often do not include the right word at all.
Saving writes both `content/overrides.yaml` and the unit's YAML, so the lesson teaches the
correction immediately; commit those files to keep it. The tool refuses to save on a hosted
deployment, where the checkout is read-only.

The CSV sheets are the alternative for reviewing away from a computer:

`review/<unit-id>.csv` (plus a combined `review/all-units-review.csv`) proposes an Oromo word per English concept, with alternates,
IPA, audio availability and a confidence flag. Automatic gloss inversion produces plausible
errors (e.g. English "head" can map to `abbaa manaa`, head of a household), so every row
needs a human verdict in the `verdict_ok_or_fix` column before it is used in a lesson.
Sort by `confidence` — `low` rows first, then `medium`.

Nothing in `content/courses/*/units/` is teaching-ready while marked `status: draft-unreviewed`.

## Sourcing rules

See [ATTRIBUTION.md](./ATTRIBUTION.md). In short: app data comes from openly-licensed
sources plus family verification, so it can be published. Commercial dictionaries may be
consulted by a human while curating, but are never bulk-imported.
