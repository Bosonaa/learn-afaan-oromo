"use client";

import { useEffect, useState } from "react";
import { REPORT_CATEGORIES } from "@/lib/reports";

type State = "hidden" | "closed" | "open" | "sending" | "sent" | "failed";

const REPORTED_KEY = "learn-afaan-oromo:reported:v1";

/** Words already reported on this device, so a second tap does not file a duplicate. */
function reported(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REPORTED_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Lets whoever is using the app flag a word as wrong, right where the doubt
 * happens. Rendered only when the deployment has reporting configured.
 */
export function ReportWord({
  unitId,
  english,
  oromo,
}: {
  unitId: string;
  english: string;
  oromo: string;
}) {
  const [state, setState] = useState<State>("hidden");
  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/reports")
      .then((response) => (response.ok ? response.json() : { configured: false }))
      .then((body: { configured?: boolean }) => {
        if (!cancelled && body.configured === true) setState("closed");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setNote("");
    setCategory(REPORT_CATEGORIES[0]);
    setState((current) => (current === "hidden" ? current : "closed"));
  }, [english, oromo]);

  if (state === "hidden") return null;

  if (reported().includes(`${unitId}:${english}`) || state === "sent") {
    return <p className="mt-3 text-xs text-slate-500">Thanks — reported for review.</p>;
  }

  if (state === "closed" || state === "failed") {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setState("open")}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          ⚑ This looks wrong
        </button>
        {state === "failed" ? (
          <p className="mt-1 text-xs text-rose-700">
            Could not send the report — try again when you are back online.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="mt-3 space-y-2 rounded-lg bg-white/70 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setState("sending");
        void fetch("/api/reports", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ unitId, english, oromo, category, note }),
        })
          .then((response) => {
            if (!response.ok) throw new Error("report rejected");
            window.localStorage.setItem(
              REPORTED_KEY,
              JSON.stringify([...reported(), `${unitId}:${english}`]),
            );
            setState("sent");
          })
          .catch(() => setState("failed"));
      }}
    >
      <p className="text-xs text-slate-600">
        What is wrong with <strong>{english} → {oromo}</strong>?
      </p>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="What is wrong"
        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
      >
        {REPORT_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        placeholder="What should it be? (optional)"
        aria-label="Note"
        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {state === "sending" ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setState("closed")}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
