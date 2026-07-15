/**
 * Ten complete cybersecurity backlog stories for demos and API smoke tests.
 * Each payload is designed to pass readinessForStory / assessStoryReadiness.
 */
import type { DefinitionOfDoneItem } from "@/types";

export interface SeedStoryPayload {
  title: string;
  goal: string;
  recipientOrArea: string;
  description: string;
  implementationSteps: string[];
  definitionOfDone: string;
  definitionOfDoneChecklist: DefinitionOfDoneItem[];
  boardPosition: "ready";
}

const checklist = (id: string, label: string): DefinitionOfDoneItem => ({
  id,
  label,
  completed: false,
});

/** Stable UUIDs so re-runs of offline tests stay deterministic. */
export const SEED_COMPLETE_STORIES: readonly SeedStoryPayload[] = [
  {
    title: "Enforce MFA on corporate VPN gateways",
    goal: "Block remote access for accounts that do not complete MFA.",
    recipientOrArea: "Network security / remote access",
    description:
      "Inventory VPN user populations, require phishing-resistant MFA for privileged and standard remote roles, and document exceptions with expiry dates.",
    implementationSteps: [
      "Export current VPN users and MFA enrollment status from the IdP.",
      "Enable MFA challenge on the VPN gateway for production realms.",
      "Publish exception process and re-check unenrolled accounts after 7 days.",
    ],
    definitionOfDone:
      "Every active VPN account has MFA enrolled or a time-boxed exception ticket, and evidence is attached to the change record.",
    definitionOfDoneChecklist: [
      checklist("a1000001-0001-4000-8000-000000000001", "MFA enrollment report archived"),
      checklist("a1000001-0001-4000-8000-000000000002", "Exception tickets have owners and expiry"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Quarterly privileged AD group access review",
    goal: "Remove stale Domain Admin and tier-0 group memberships.",
    recipientOrArea: "Identity and access management",
    description:
      "Run a manager-attested review of high-privilege Active Directory groups, remove accounts that no longer need access, and record evidence for audit.",
    implementationSteps: [
      "Export membership of Domain Admins, Enterprise Admins, and named tier-0 groups.",
      "Send review packets to system owners with a 10-business-day SLA.",
      "Apply removals, re-export membership, and file the before/after diffs.",
    ],
    definitionOfDone:
      "All reviewed groups have an attested list, removals are applied, and diffs are stored in the access-review folder.",
    definitionOfDoneChecklist: [
      checklist("a1000002-0002-4000-8000-000000000001", "Owner attestations collected"),
      checklist("a1000002-0002-4000-8000-000000000002", "Before/after membership diffs filed"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Centralize auth and VPN logs in SIEM",
    goal: "Ensure failed VPN and IdP sign-in events are searchable within 15 minutes of occurrence.",
    recipientOrArea: "SOC / detection engineering",
    description:
      "Ship authentication and VPN gateway logs to the SIEM with consistent field mapping, validate parsers, and confirm retention meets the 90-day baseline.",
    implementationSteps: [
      "Enable syslog/API export from VPN and IdP to the log collector.",
      "Map critical fields (user, source IP, result, MFA method) in the SIEM parser.",
      "Run a controlled failed-login test and confirm the event is queryable.",
    ],
    definitionOfDone:
      "Test events appear in SIEM within 15 minutes, field mapping is documented, and retention is confirmed at ≥90 days.",
    definitionOfDoneChecklist: [
      checklist("a1000003-0003-4000-8000-000000000001", "Parser mapping documented"),
      checklist("a1000003-0003-4000-8000-000000000002", "Failed-login test event queryable"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Patch critical CVEs on internet-facing web tier",
    goal: "Eliminate known critical CVEs on public web and reverse-proxy hosts within the SLA.",
    recipientOrArea: "Vulnerability management / platform",
    description:
      "Prioritize critical and high findings on DMZ web servers, schedule maintenance windows, patch or mitigate, and re-scan to close the tickets.",
    implementationSteps: [
      "Pull open critical/high findings for the public web asset group from the scanner.",
      "Coordinate change window with application owners and apply vendor patches.",
      "Re-scan hosts and close findings only when the scanner confirms remediation.",
    ],
    definitionOfDone:
      "No open critical CVEs remain on the public web tier without an approved compensating control, and re-scan evidence is attached.",
    definitionOfDoneChecklist: [
      checklist("a1000004-0004-4000-8000-000000000001", "Change tickets completed"),
      checklist("a1000004-0004-4000-8000-000000000002", "Clean re-scan attached"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Phishing tabletop for finance payroll week",
    goal: "Validate that finance staff report suspicious payroll-themed mail and that SOC handles the path within target times.",
    recipientOrArea: "Security awareness / SOC",
    description:
      "Run a tabletop (not live phishing) around a fake payroll-change scenario before payroll week, capture gaps in reporting and escalation, and update the runbook.",
    implementationSteps: [
      "Draft scenario, inject points, and success metrics with finance and SOC leads.",
      "Facilitate the 90-minute tabletop and record decision timelines.",
      "Update the phishing runbook with any missing steps and socialize the changes.",
    ],
    definitionOfDone:
      "Tabletop report is signed off, runbook updates are published, and open actions have owners and due dates.",
    definitionOfDoneChecklist: [
      checklist("a1000005-0005-4000-8000-000000000001", "Tabletop report filed"),
      checklist("a1000005-0005-4000-8000-000000000002", "Runbook PR merged"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Rotate CI/CD secrets older than 90 days",
    goal: "Ensure no production pipeline secrets older than 90 days remain in the primary vault paths.",
    recipientOrArea: "DevSecOps / platform engineering",
    description:
      "Inventory secrets used by production deployment pipelines, rotate those older than 90 days, update consumers, and revoke the old versions.",
    implementationSteps: [
      "List vault paths and ages for production CI/CD secrets.",
      "Rotate each secret, update pipeline variables, and run a dry deployment.",
      "Revoke previous versions and document the rotation in the change log.",
    ],
    definitionOfDone:
      "All in-scope secrets show age <90 days, pipelines deploy successfully with new values, and old versions are revoked.",
    definitionOfDoneChecklist: [
      checklist("a1000006-0006-4000-8000-000000000001", "Rotation inventory spreadsheet complete"),
      checklist("a1000006-0006-4000-8000-000000000002", "Old secret versions revoked"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Annual backup restore drill for customer DB",
    goal: "Prove that the primary customer database can be restored within RTO and that restored data is usable.",
    recipientOrArea: "Resilience / data platform",
    description:
      "Restore the latest production backup of the customer database into an isolated environment, validate row counts and application smoke checks, and record RTO.",
    implementationSteps: [
      "Select the backup set and provision an isolated restore target.",
      "Perform restore, measure wall-clock time, and run integrity queries.",
      "Execute application smoke tests against the restored DB and capture results.",
    ],
    definitionOfDone:
      "Restore completes within published RTO, integrity checks pass, smoke tests pass, and the drill report is filed.",
    definitionOfDoneChecklist: [
      checklist("a1000007-0007-4000-8000-000000000001", "RTO measurement recorded"),
      checklist("a1000007-0007-4000-8000-000000000002", "Smoke-test evidence attached"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Tune SIEM brute-force alert to cut false positives",
    goal: "Reduce noisy failed-login alerts by at least 50% without missing confirmed brute-force patterns.",
    recipientOrArea: "Detection engineering / SOC",
    description:
      "Analyze 30 days of brute-force alert volume, refine thresholds and allow-lists for known scanners, and validate with purple-team test traffic.",
    implementationSteps: [
      "Baseline current alert volume and sample false-positive rates.",
      "Adjust correlation rules (window, threshold, source reputation) in the SIEM.",
      "Replay synthetic brute-force traffic and confirm true positives still fire.",
    ],
    definitionOfDone:
      "False-positive rate is measured down ≥50% vs baseline, true-positive test still alerts, and the rule change is peer-reviewed.",
    definitionOfDoneChecklist: [
      checklist("a1000008-0008-4000-8000-000000000001", "Before/after volume chart attached"),
      checklist("a1000008-0008-4000-8000-000000000002", "Purple-team test log attached"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Harden laptop fleet disk encryption baseline",
    goal: "Bring managed endpoints to 100% full-disk encryption with recovery keys escrowed.",
    recipientOrArea: "Endpoint security / IT operations",
    description:
      "Identify managed Windows and macOS devices missing FileVault/BitLocker, enforce the MDM policy, escrow recovery keys, and clear non-compliant devices with owners.",
    implementationSteps: [
      "Pull MDM compliance report for encryption and key escrow.",
      "Push remediation policy and notify owners of non-compliant devices.",
      "Re-poll compliance after 14 days and escalate remaining exceptions.",
    ],
    definitionOfDone:
      "Compliance report shows 100% encryption with escrowed keys for in-scope devices, or documented exceptions with risk acceptance.",
    definitionOfDoneChecklist: [
      checklist("a1000009-0009-4000-8000-000000000001", "MDM compliance export archived"),
      checklist("a1000009-0009-4000-8000-000000000002", "Exception register updated"),
    ],
    boardPosition: "ready",
  },
  {
    title: "Review third-party SaaS admin access for payroll vendor",
    goal: "Confirm only current staff hold admin roles in the payroll SaaS tenant.",
    recipientOrArea: "Third-party risk / HR systems",
    description:
      "Export admin and privileged roles from the payroll vendor console, reconcile against HR active employees, remove leavers, and enforce SSO-only admin login where available.",
    implementationSteps: [
      "Export role assignments from the payroll SaaS admin console.",
      "Diff against HR active employee list and remove terminated users the same day.",
      "Enable SSO enforcement for admin roles and store the final access matrix.",
    ],
    definitionOfDone:
      "No terminated employees retain admin access, SSO is enforced for admins, and the access matrix is stored for audit.",
    definitionOfDoneChecklist: [
      checklist("a1000010-0010-4000-8000-000000000001", "Access matrix signed by HR and security"),
      checklist("a1000010-0010-4000-8000-000000000002", "SSO enforcement screenshot attached"),
    ],
    boardPosition: "ready",
  },
] as const;

export function seedStoryTitles(): string[] {
  return SEED_COMPLETE_STORIES.map((story) => story.title);
}
