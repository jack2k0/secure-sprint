import { describe, expect, it } from "vitest";
import { backlogToCsv } from "./csv";
import type { BacklogStory } from "@/types";

const story: BacklogStory = {
  id: "story-1",
  title: 'Review "break glass" access',
  goal: "Reduce privileged access risk",
  recipientOrArea: "IAM",
  description: "Remove stale accounts",
  implementationSteps: ["Export memberships", "Remove stale access"],
  definitionOfDone: "Evidence attached",
  definitionOfDoneChecklist: [{ id: "item-1", label: "Manager approved", completed: false }],
  assignedTo: "member-1",
  boardPosition: "ready",
  sortOrder: 0,
  createdBy: "member-1",
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
  archivedAt: null,
};

describe("backlogToCsv", () => {
  it("creates an import-friendly CSV with escaped text and member names", () => {
    const csv = backlogToCsv([story], [{ id: "member-1", displayName: "Ada Analyst" }]);

    expect(csv).toContain('"Review ""break glass"" access"');
    expect(csv).toContain('"Ada Analyst"');
    expect(csv).toContain('"Yes"');
    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("neutralizes formula-like values before exporting to a spreadsheet", () => {
    const csv = backlogToCsv([{ ...story, title: '=IMPORTXML("https://example.test")' }], []);

    expect(csv).toContain(`"'=IMPORTXML(""https://example.test"")"`);
  });
});
