import type { Metadata } from "next";
import { loadPhraseSets, loadUnits, type Unit } from "@/lib/content";
import { availableCourses } from "@/lib/courses";
import { ReviewTool, type ReviewCourse, type ReviewUnit } from "./review-tool";

export const metadata: Metadata = { title: "Review words · Barsiisaa" };

/** The reviewer edits files in the checkout, so this page is never prerendered. */
export const dynamic = "force-dynamic";

const summarize = (unit: Unit): ReviewUnit => ({
  id: unit.id,
  order: unit.order,
  title: unit.title,
  kind: unit.kind,
  words: unit.words.map((word) => ({
    english: word.english,
    pos: word.pos,
    oromo: word.oromo,
    alternates: word.alternates,
    note: word.note,
    confidence: word.confidence,
    verified: word.verified,
  })),
});

export default async function ReviewPage() {
  const courses: ReviewCourse[] = await Promise.all(
    availableCourses().map(async (course) => ({
      id: course.id,
      name: course.name,
      units: [
        ...(await loadUnits(course.id)).map(summarize),
        // Phrases with no answer yet are the whole point of this page.
        ...(await loadPhraseSets(course.id, { includeUnanswered: true })).map(summarize),
      ],
    })),
  );

  return <ReviewTool courses={courses} />;
}
