/**
 * Units are grouped into levels of ten, in teaching order, so the home screen
 * is a short list of levels rather than one long list of units. The grouping
 * follows unit order, which is itself the teaching order authored in
 * `curriculum.ts`, so a new unit joins the level its order falls in.
 */
export const UNITS_PER_LEVEL = 10;

const LEVEL_TITLES = [
  "Everyday words",
  "The world around you",
  "Out and about",
  "Doing, describing, thinking",
];

export function levelOf(unitOrder: number): number {
  return Math.floor((unitOrder - 1) / UNITS_PER_LEVEL) + 1;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[level - 1] ?? `More words ${level - LEVEL_TITLES.length}`;
}
