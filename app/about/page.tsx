import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadRecordings } from "@/lib/recordings";

interface Credit {
  file: string;
  commonsFile: string;
  descriptionUrl: string;
  license: string;
  author: string;
}

async function loadCredits(): Promise<Credit[]> {
  try {
    const raw = await readFile(resolve(process.cwd(), "public", "audio", "credits.json"), "utf8");
    return JSON.parse(raw) as Credit[];
  } catch {
    return [];
  }
}

export default async function AboutPage() {
  const credits = await loadCredits();
  const recordings = await loadRecordings();
  const speakers = [...new Set(recordings.map((recording) => recording.speaker))].sort();
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold">Where the words come from</h1>
        <p className="text-slate-700">
          Words, pronunciations and glosses are derived from the{" "}
          <a className="underline" href="https://kaikki.org/dictionary/Oromo/">
            kaikki.org machine-readable Oromo dictionary
          </a>
          , an extraction of the English Wiktionary, used under CC BY-SA 4.0.
        </p>
        <p className="text-slate-700">
          The current word list is an <strong>unreviewed draft</strong>: it was proposed by
          inverting English glosses, and a fluent speaker has not yet confirmed each answer.
          Treat a surprising answer as a bug in the data, not as Afaan Oromo.
        </p>
        <p className="text-slate-700">
          The Dictionary tab searches the whole lexicon rather than the lessons, so it is even
          rougher: it shows every sense Wiktionary records, including regional and rare ones. Use it
          to look something up, not to decide what a word means.
        </p>
        <p className="text-slate-700">
          Nothing you do here is uploaded. Progress is stored only in this browser and there is
          no account and no analytics. Profiles are names on this device, kept apart so children
          sharing it do not share a streak.
        </p>
        <p className="text-slate-700">
          The one exception is the &ldquo;this looks wrong&rdquo; button after an answer: it sends
          the word, the problem you picked and your note so a reviewer can fix the lesson. Nothing
          about who you are or how you are doing goes with it.
        </p>
      </section>

      {speakers.length === 0 ? null : (
        <section className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Voices</h2>
          <p className="text-sm text-slate-600">
            {recordings.length} words are spoken by {speakers.join(", ")}, recorded for this app.
          </p>
        </section>
      )}

      <section className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Wikimedia recording credits</h2>
        {credits.length === 0 ? (
          <p className="text-slate-500">No recordings mirrored yet.</p>
        ) : (
          <ul className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            {credits.map((credit) => (
              <li key={credit.file}>
                <a className="underline" href={credit.descriptionUrl}>
                  {credit.commonsFile}
                </a>{" "}
                — {credit.author}, {credit.license}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
