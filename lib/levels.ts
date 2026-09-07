import type { Course } from "./courses";

/**
 * Units are grouped into levels of ten, in teaching order, so a course opens
 * on a short list of levels rather than one long list of units. The grouping
 * follows unit order, which is itself the teaching order authored in the
 * course's `curriculum.ts`, so a new unit joins the level its order falls in.
 */
export const UNITS_PER_LEVEL = 10;

export function levelOf(unitOrder: number): number {
  return Math.floor((unitOrder - 1) / UNITS_PER_LEVEL) + 1;
}

export function levelTitle(course: Course, level: number): string {
  return course.levelTitles[level - 1] ?? `More words ${level - course.levelTitles.length}`;
}
