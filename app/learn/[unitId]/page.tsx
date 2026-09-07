import { notFound } from "next/navigation";
import { loadLevels, loadUnits } from "@/lib/content";
import { Lesson } from "./lesson";

export async function generateStaticParams(): Promise<{ unitId: string }[]> {
  const units = await loadUnits();
  return units.map((unit) => ({ unitId: unit.id }));
}

export default async function LearnPage({ params }: { params: { unitId: string } }) {
  const levels = await loadLevels();
  const level = levels.find((candidate) =>
    candidate.units.some((unit) => unit.id === params.unitId),
  );
  const position = level?.units.findIndex((unit) => unit.id === params.unitId) ?? -1;
  const unit = level?.units[position];
  if (level === undefined || unit === undefined) notFound();
  return (
    <Lesson
      unitId={unit.id}
      title={unit.title}
      levelLabel={`Level ${level.order} · Unit ${position + 1}`}
      words={unit.words}
    />
  );
}
