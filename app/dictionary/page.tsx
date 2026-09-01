import type { Metadata } from "next";
import { dictionaryMeta, searchDictionary } from "@/lib/dictionary";
import { PlayClip } from "./play-clip";

export const metadata: Metadata = {
  title: "Dictionary — Barsiisaa",
  description: "Look up any word in the open Afaan Oromo lexicon.",
};

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() ?? "";
  const [{ source, stats }, results] = await Promise.all([
    dictionaryMeta(),
    searchDictionary(query),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Dictionary</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search all {stats.entries.toLocaleString()} words of the open lexicon —{" "}
          {stats.withAudio.toLocaleString()} of them have a native recording. Type English or Afaan
          Oromo.
        </p>
      </div>

      <form action="/dictionary" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="water, mother, bishaan…"
          autoComplete="off"
          aria-label="Search the dictionary"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
        >
          Search
        </button>
      </form>

      <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        This is <strong>reference material, not a lesson</strong>. Nothing here has been checked by a
        fluent speaker, and a word can mean something different in context — the lessons are the
        part that gets reviewed.
      </p>

      {query === "" ? null : results.entries.length === 0 ? (
        <p className="text-sm text-slate-500">
          {query.length < 2
            ? "Type at least two letters."
            : `No word matches “${query}”. Try a simpler word, or the Oromo spelling.`}
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {results.matches.toLocaleString()} match{results.matches === 1 ? "" : "es"}
            {results.matches > results.entries.length
              ? ` · showing the closest ${results.entries.length}`
              : ""}
          </p>
          <ul className="space-y-3">
            {results.entries.map((entry) => (
              <li key={`${entry.oromo}:${entry.pos}`} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold">{entry.oromo}</h2>
                  {entry.audio === null ? null : <PlayClip src={entry.audio} label={entry.oromo} />}
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {entry.pos}
                  {entry.ipa === null ? "" : ` · ${entry.ipa}`}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {entry.glosses.map((gloss) => (
                    <li key={gloss}>{gloss}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-xs text-slate-400">
        Words from{" "}
        <a href={source.url} className="underline">
          {source.name}
        </a>{" "}
        ({source.license}); recordings are individually licensed on Wikimedia Commons.
      </p>
    </div>
  );
}
