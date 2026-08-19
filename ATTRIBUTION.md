# Sources and attribution

## Lexicon

Oromo headwords, parts of speech, English glosses, IPA and audio references are derived from
the [kaikki.org machine-readable Oromo dictionary](https://kaikki.org/dictionary/Oromo/), a
wiktextract extraction of the English Wiktionary.

- Licence: **CC BY-SA 4.0**
- Any published derivative (app, website, exported word list) must credit Wiktionary /
  kaikki.org and remain under a compatible licence.
- The attribution block is carried inside `data/lexicon.json` and each
  `content/units/*.yaml` so it cannot be separated from the data.

## Audio

Pronunciation files referenced by `audioUrl` are hosted on Wikimedia Commons and are
**licensed individually**. Before mirroring or shipping any file, check that specific file's
licence and record its author and licence alongside the mirrored copy. Do not assume the
lexicon's licence applies to the recordings.

## Not used as data sources

- **Hippocrene, _Oromo-English / English-Oromo Dictionary & Phrasebook_ (2017)** — an
  in-print, all-rights-reserved commercial book. It may be consulted by a human while
  deciding which word or spelling to teach. It is not OCR'd, imported, or reproduced here.
- **Third-party document re-uploads** (e.g. Scribd copies of the above) — same restriction,
  and provenance is unverified.
- **HornMT** — CC BY 4.0 English↔Oromo sentences, but the corpus is adult news material and
  unsuitable for children's lessons.

## Lesson sentences

No openly-licensed corpus of kid-level Oromo sentences exists. Example sentences must be
authored and verified by a fluent speaker. Machine-translated or LLM-generated Oromo may be
used as a draft for a reviewer, never as shipped content.
