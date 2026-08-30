/**
 * "This word looks wrong" reports. The app has no database on purpose, so a
 * report becomes a GitHub issue in this repo: the reviewer already gets email
 * from GitHub, corrections still land in content/overrides.yaml, and there is
 * nothing to host or back up.
 *
 * Needs REPORTS_GITHUB_TOKEN (a fine-grained token with issues:write on
 * REPORTS_REPO). Without it the route reports itself as unconfigured and the
 * UI hides the button, so a fork or a local checkout is unaffected.
 */
import { NextResponse } from "next/server";
import { isReportCategory, type ReportCategory } from "@/lib/reports";

interface Report {
  unitId: string;
  english: string;
  oromo: string;
  category: ReportCategory;
  note: string;
}

const NOTE_LIMIT = 500;

function parse(body: unknown): Report | null {
  if (typeof body !== "object" || body === null) return null;
  const { unitId, english, oromo, category, note } = body as Record<string, unknown>;
  if (typeof unitId !== "string" || unitId === "") return null;
  if (typeof english !== "string" || english === "") return null;
  if (typeof oromo !== "string" || oromo === "") return null;
  if (!isReportCategory(category)) return null;
  if (note !== undefined && typeof note !== "string") return null;
  return {
    unitId,
    english,
    oromo,
    category,
    note: (note ?? "").slice(0, NOTE_LIMIT),
  };
}

function issueBody(report: Report): string {
  return [
    `Reported from the app.`,
    "",
    `- **Unit:** \`${report.unitId}\``,
    `- **English prompt:** ${report.english}`,
    `- **Currently taught:** \`${report.oromo}\``,
    `- **Problem:** ${report.category}`,
    "",
    report.note === "" ? "_No note left._" : `> ${report.note.replace(/\n/g, "\n> ")}`,
    "",
    `Fix by adding the correction to \`content/overrides.yaml\` under \`${report.unitId}\` → \`${report.english}\`.`,
  ].join("\n");
}

export function GET(): NextResponse {
  return NextResponse.json({ configured: process.env.REPORTS_GITHUB_TOKEN !== undefined });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = process.env.REPORTS_GITHUB_TOKEN;
  const repo = process.env.REPORTS_REPO ?? "Bosonaa/learn-afaan-oromo";
  if (token === undefined) {
    return NextResponse.json({ error: "reporting is not configured" }, { status: 501 });
  }

  const report = parse(await request.json().catch(() => null));
  if (report === null) {
    return NextResponse.json({ error: "unusable report" }, { status: 400 });
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({
      title: `Word report: ${report.english} → ${report.oromo} (${report.category})`,
      body: issueBody(report),
      labels: ["word-report"],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "could not file the report" }, { status: 502 });
  }

  const issue = (await response.json()) as { html_url?: string };
  return NextResponse.json({ url: issue.html_url ?? null }, { status: 201 });
}
