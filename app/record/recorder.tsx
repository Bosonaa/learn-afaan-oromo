"use client";

import { useEffect, useRef, useState } from "react";

export interface RecordableWord {
  unit: string;
  english: string;
  oromo: string;
  ipa: string | null;
  audio: string | null;
  replaceable: boolean;
  recorded: boolean;
}

const SPEAKER_KEY = "learn-afaan-oromo:speaker";

export function Recorder({ words, local }: { words: RecordableWord[]; local: boolean }) {
  const missing = words.filter((word) => word.replaceable);
  const [speaker, setSpeaker] = useState("");
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    setSpeaker(window.localStorage.getItem(SPEAKER_KEY) ?? "");
  }, []);

  const word = missing[index];

  async function start(): Promise<void> {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void save(new Blob(chunks, { type: media.mimeType }));
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      setError("Could not use the microphone — check the browser's permission prompt.");
    }
  }

  function stop(): void {
    recorder.current?.stop();
    recorder.current = null;
    setRecording(false);
  }

  async function save(clip: Blob): Promise<void> {
    if (word === undefined) return;
    window.localStorage.setItem(SPEAKER_KEY, speaker);

    const body = new FormData();
    body.set("oromo", word.oromo);
    body.set("speaker", speaker.trim() === "" ? "family" : speaker.trim());
    body.set("clip", clip);

    const response = await fetch("/api/recordings", { method: "POST", body });
    if (!response.ok) {
      setError(`Saving failed (${String(response.status)}).`);
      return;
    }
    const saved = (await response.json()) as { recording: { file: string } };
    // Cache-bust so re-recording a word plays the new take, not the old one.
    setDone((current) => ({
      ...current,
      [word.oromo]: `/audio/recorded/${saved.recording.file}?t=${String(Date.now())}`,
    }));
  }

  if (!local) {
    return (
      <Shell>
        <p className="text-slate-600">
          Recording writes files into the repository, so it only runs on a computer with the project
          checked out: <code>npm run dev</code>, then open this page.
        </p>
      </Shell>
    );
  }

  if (word === undefined) {
    return (
      <Shell>
        <p className="text-slate-600">Every word has a recording. Nothing left to do here.</p>
      </Shell>
    );
  }

  const clip = done[word.oromo] ?? word.audio;

  return (
    <Shell>
      <label className="block text-sm">
        <span className="text-slate-600">Who is speaking?</span>
        <input
          value={speaker}
          onChange={(event) => setSpeaker(event.target.value)}
          placeholder="e.g. Kitesso"
          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
        />
      </label>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {word.unit} · {index + 1} of {missing.length}
        </p>
        <p className="mt-2 text-3xl font-bold text-teal-800">{word.oromo}</p>
        <p className="text-slate-600">
          {word.english}
          {word.ipa === null ? "" : ` · ${word.ipa}`}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {recording ? (
            <button
              onClick={stop}
              className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white"
            >
              Stop and save
            </button>
          ) : (
            <button
              onClick={() => void start()}
              className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white"
            >
              {clip === null ? "Record" : "Record again"}
            </button>
          )}
          {clip === null ? null : <audio controls src={clip} className="h-9" />}
        </div>

        {error === null ? null : <p className="mt-3 text-sm text-rose-700">{error}</p>}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          disabled={index === 0}
          className="rounded-lg px-3 py-2 text-slate-600 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => setIndex((current) => Math.min(missing.length - 1, current + 1))}
          disabled={index === missing.length - 1}
          className="rounded-lg px-3 py-2 text-slate-600 disabled:opacity-40"
        >
          Next word
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Record the words</h1>
      <p className="text-sm text-slate-600">
        Words without a native Wikimedia clip are listed here. A recording is saved straight into
        <code> public/audio/recorded</code> and used by the listening exercises.
      </p>
      {children}
    </div>
  );
}
