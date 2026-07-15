import type { BacklogStory, TeamMember } from "@/types";

function escapeCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function backlogToCsv(stories: BacklogStory[], members: TeamMember[]) {
  const memberNames = new Map(members.map((member) => [member.id, member.displayName]));
  const header = [
    "Summary",
    "Description",
    "Goal",
    "Recipient or area",
    "Implementation steps",
    "Definition of Done",
    "DoD checklist",
    "Assignee",
    "Board position",
    "Ready for Jira",
  ];

  const rows = stories.map((story) => [
    story.title,
    story.description ?? "",
    story.goal ?? "",
    story.recipientOrArea ?? "",
    story.implementationSteps.join("\n"),
    story.definitionOfDone ?? "",
    story.definitionOfDoneChecklist.map((item) => item.label).join("\n"),
    story.assignedTo ? (memberNames.get(story.assignedTo) ?? "") : "",
    story.boardPosition,
    story.boardPosition === "ready" ? "Yes" : "No",
  ]);

  return [header, ...rows].map((row) => row.map((value) => escapeCell(value)).join(",")).join("\r\n");
}
