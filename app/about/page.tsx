export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold">Where the words come from</h1>
        <p className="text-slate-700">
          Words and glosses are derived from the{" "}
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
          Every question is multiple choice, English to Afaan Oromo or the other way round. There is
          nothing to type, and no listening questions — pronunciation audio is a later phase.
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
    </div>
  );
}
