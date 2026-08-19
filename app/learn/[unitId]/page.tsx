import { notFound } from "next/navigation";
import { loadUnit, loadUnits } from "@/lib/content";
import { Lesson } from "./lesson";

export async function generateStaticParams(): Promise<{ unitId: string }[]> {
  const units = await loadUnits();
  return units.map((unit) => ({ unitId: unit.id }));
}

export default async function LearnPage({ params }: { params: { unitId: string } }) {
  const unit = await loadUnit(params.unitId);
  if (unit === null) notFound();
  return <Lesson unitId={unit.id} title={unit.title} words={unit.words} />;
}
