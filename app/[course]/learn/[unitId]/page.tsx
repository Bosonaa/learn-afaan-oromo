import { notFound } from "next/navigation";
import { loadLevels } from "@/lib/content";
import { availableCourses, courseById } from "@/lib/courses";
import { Lesson } from "./lesson";

export async function generateStaticParams(): Promise<{ course: string; unitId: string }[]> {
  const params = await Promise.all(
    availableCourses().map(async (course) => {
      const levels = await loadLevels(course);
      return levels.flatMap((level) =>
        level.units.map((unit) => ({ course: course.id, unitId: unit.id })),
      );
    }),
  );
  return params.flat();
}

export default async function LearnPage({
  params,
}: {
  params: { course: string; unitId: string };
}) {
  const course = courseById(params.course);
  if (course === null || !course.available) notFound();

  const levels = await loadLevels(course);
  const level = levels.find((candidate) =>
    candidate.units.some((unit) => unit.id === params.unitId),
  );
  const position = level?.units.findIndex((unit) => unit.id === params.unitId) ?? -1;
  const unit = level?.units[position];
  if (level === undefined || unit === undefined) notFound();
  return (
    <Lesson
      courseId={course.id}
      unitId={unit.id}
      title={unit.title}
      levelLabel={`Level ${level.order} · Unit ${position + 1}`}
      words={unit.words}
    />
  );
}
