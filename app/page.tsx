import { loadLevels } from "@/lib/content";
import { LevelList } from "./level-list";

export default async function HomePage() {
  const levels = await loadLevels();
  return (
    <LevelList
      levels={levels.map((level) => ({
        order: level.order,
        title: level.title,
        units: level.units.map((unit, index) => ({
          id: unit.id,
          title: unit.title,
          position: index + 1,
          reviewed: unit.reviewed,
          words: unit.words.map((word) => word.oromo),
          verified: unit.words.filter((word) => word.verified).length,
        })),
      }))}
    />
  );
}
