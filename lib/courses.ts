/**
 * Barsiisaa teaches a course, not a language: Afaan Oromo is simply the first
 * one. A course owns its own units (`content/courses/<id>/units`), its own
 * level titles and its own progress, so adding a language is a registry entry
 * plus content — no change to lessons, levels or profiles.
 */
export interface Course {
  /** URL segment and content directory name. */
  id: string;
  /** English name, as a child reading English would look for it. */
  name: string;
  /** The language's own name for itself, when it differs. */
  nativeName: string | null;
  /** The language questions are asked in. */
  from: string;
  /** Two letters shown on the course tile. */
  badge: string;
  /** Titles for levels of ten units, in teaching order. */
  levelTitles: string[];
  /** Only an available course has content and can be opened. */
  available: boolean;
}

/**
 * The first course keeps the storage keys the app used before courses existed,
 * so a device that has been practising Afaan Oromo keeps its XP and streak.
 */
export const FIRST_COURSE_ID = "oromo";

export const COURSES: Course[] = [
  {
    id: FIRST_COURSE_ID,
    name: "Afaan Oromo",
    nativeName: "Afaan Oromoo",
    from: "English",
    badge: "OM",
    levelTitles: [
      "Everyday words",
      "The world around you",
      "Out and about",
      "Doing, describing, thinking",
    ],
    available: true,
  },
];

export const availableCourses = (): Course[] => COURSES.filter((course) => course.available);

export function courseById(id: string): Course | null {
  return COURSES.find((course) => course.id === id) ?? null;
}
