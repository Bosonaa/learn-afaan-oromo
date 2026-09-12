import { notFound } from "next/navigation";
import { loadLevels, MIN_TEACHABLE } from "@/lib/content";
import { availableCourses, courseById } from "@/lib/courses";
import { LevelList } from "./level-list";

export async function generateStaticParams(): Promise<{ course: string }[]> {
  return availableCourses().map((course) => ({ course: course.id }));
}

export default async function CoursePage({ params }: { params: { course: string } }) {
  const course = courseById(params.course);
  if (course === null || !course.available) notFound();

  const levels = await loadLevels(course);
  return (
    <LevelList
      courseId={course.id}
      courseName={course.name}
      levels={levels.map((level) => ({
        kind: level.kind,
        order: level.order,
        title: level.title,
        units: level.units.map((unit, index) => ({
          id: unit.id,
          title: unit.title,
          position: index + 1,
          reviewed: unit.reviewed,
          words: unit.words.map((word) => word.oromo),
          verified: unit.words.filter((word) => word.verified).length,
          unanswered: unit.unanswered,
          // Too few answers to build a four-choice question, so nothing to teach yet.
          locked: unit.words.length < MIN_TEACHABLE,
        })),
      }))}
    />
  );
}
