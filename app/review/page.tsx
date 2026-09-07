import type { Metadata } from "next";
import { loadUnits } from "@/lib/content";
import { availableCourses } from "@/lib/courses";
import { ReviewTool, type ReviewCourse } from "./review-tool";

export const metadata: Metadata = { title: "Review words · Barsiisaa" };

/** The reviewer edits files in the checkout, so this page is never prerendered. */
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const courses: ReviewCourse[] = await Promise.all(
    availableCourses().map(async (course) => ({
      id: course.id,
      name: course.name,
      units: (await loadUnits(course.id)).map((unit) => ({
        id: unit.id,
        order: unit.order,
        title: unit.title,
        words: unit.words.map((word) => ({
          english: word.english,
          pos: word.pos,
          oromo: word.oromo,
          alternates: word.alternates,
          confidence: word.confidence,
          verified: word.verified,
        })),
      })),
    })),
  );

  return <ReviewTool courses={courses} />;
}
