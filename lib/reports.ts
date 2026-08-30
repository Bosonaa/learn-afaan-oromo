/** Shared by the report form and the API route so the two cannot drift. */
export const REPORT_CATEGORIES = [
  "wrong translation",
  "wrong spelling",
  "wrong audio",
  "grammar",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const isReportCategory = (value: unknown): value is ReportCategory =>
  typeof value === "string" && REPORT_CATEGORIES.includes(value as ReportCategory);
