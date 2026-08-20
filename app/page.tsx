import { loadUnits } from "@/lib/content";
import { UnitList } from "./unit-list";

export default async function HomePage() {
  const units = await loadUnits();
  return (
    <UnitList
      units={units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        order: unit.order,
        reviewed: unit.reviewed,
        words: unit.words.map((word) => word.oromo),
        withAudio: unit.words.filter((word) => word.audio !== null).length,
        verified: unit.words.filter((word) => word.verified).length,
      }))}
    />
  );
}
