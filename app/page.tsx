import { COURSES } from "@/lib/courses";
import { loadLevels } from "@/lib/content";
import { CourseGrid, type CourseSummary } from "./course-grid";

export default async function HomePage() {
  const courses: CourseSummary[] = await Promise.all(
    COURSES.map(async (course) => {
      // A course that is not available yet has no content directory to read.
      const levels = course.available ? await loadLevels(course) : [];
      const words = levels.flatMap((level) => level.units.flatMap((unit) => unit.words));
      return {
        id: course.id,
        name: course.name,
        nativeName: course.nativeName,
        from: course.from,
        badge: course.badge,
        available: course.available,
        levels: levels.length,
        units: levels.reduce((sum, level) => sum + level.units.length, 0),
        words: words.map((word) => word.oromo),
      };
    }),
  );

  return <CourseGrid courses={courses} />;
}
