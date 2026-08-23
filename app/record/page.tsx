import { loadUnits } from "@/lib/content";
import { loadRecordings } from "@/lib/recordings";
import { Recorder, type RecordableWord } from "./recorder";

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const units = await loadUnits();
  const recorded = new Set((await loadRecordings()).map((rec) => rec.oromo));

  const words: RecordableWord[] = units.flatMap((unit) =>
    unit.words.map((word) => ({
      unit: unit.title,
      english: word.english,
      oromo: word.oromo,
      ipa: word.ipa,
      audio: word.audio,
      // Only a family clip can be replaced here; Commons clips are already native.
      replaceable: word.audioSource !== "commons",
      recorded: recorded.has(word.oromo),
    })),
  );

  return <Recorder words={words} local={process.env.NODE_ENV !== "production"} />;
}
