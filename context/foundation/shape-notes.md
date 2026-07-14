---
project: SecureSprint
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-08-10
  after_hours_only: true
created: 2026-07-14
updated: 2026-07-14
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: context type
      decision: greenfield confirmed by user
    - topic: primary persona
      decision: cybersecurity team manager is primary; cybersecurity specialists are supporting users
    - topic: product boundary
      decision: the product supports collaborative backlog planning before work is transferred to Jira for daily execution
    - topic: authentication
      decision: simple email-and-password login is required for compliance; no password reset or email verification in the MVP
    - topic: authorization
      decision: one shared Cybersecurity workspace with flat permissions; no roles, administration, invitations, or multiple teams
    - topic: MVP refinement
      decision: a deterministic question wizard and readiness assessment are in the MVP; Claude integration is deferred
    - topic: timeline
      decision: three weeks of after-hours work, targeting 2026-08-10
    - topic: account provisioning
      decision: demo accounts are sufficient for the MVP; self-service registration is out of scope
    - topic: board interaction
      decision: users move stories by dragging cards between board positions
    - topic: export
      decision: export the backlog as CSV for later Jira import
  frs_drafted: 10
  quality_check_status: accepted
---

## Seed idea

> Chcialbym zrobic prosta aplikacje do zarzadzania backlogiem zespolu Cybersecurity pracujacego w Scrumie.

## Vision & Problem Statement

A Cybersecurity team manager has limited time to prepare backlog items in enough detail. Items are often described only at a high level, without implementation steps or a Definition of Done, so specialists do not know exactly what to do and wait for clarification.

The planning workspace should make backlog items sufficiently explicit before work begins. The team uses it collaboratively to prepare the scope, steps, and completion criteria, then transfers the result to Jira for day-to-day execution. This reduces blocked work and repeated clarification by the manager.

## User & Persona

The primary persona is the manager of a Cybersecurity team. The manager initiates backlog items and uses the product during planning to turn high-level work into actionable tasks despite limited preparation time.

### Secondary persona

Cybersecurity specialists collaborate with the manager to refine scope, implementation steps, and the Definition of Done before an item is transferred to Jira.

## Access Control

Users authenticate with an email address and password before accessing the product. The MVP does not include email verification or password recovery.

All authenticated users belong to one shared Cybersecurity workspace and can create, view, update, and delete its backlog items. A backlog item can be assigned to a specific specialist, and authenticated users can identify items assigned to them. Unauthenticated visitors cannot access backlog content and are directed to the login screen.

The MVP has a flat permission model. It does not include separate manager and specialist roles, an administration panel, invitations, or multiple teams.

## Success Criteria

### Primary

- An authenticated team member can turn a high-level task into a backlog card with clarified intent, audience, implementation steps, and a Definition of Done, then see whether the card is ready to transfer to Jira.
- An authenticated team member can move a prepared card across the backlog board.

### Secondary

- The product can later offer AI-assisted backlog analysis, informed by the user-provided reference project, without being required for the MVP's core flow.

### Guardrails

- The workflow must remain simple; creating and refining a card must not depend on an AI or another third-party service.
- Backlog data must be exportable in a format that Jira can import.

## User Stories

### US-01: Manager verifies that a backlog story is ready for Jira

- **Given** an authenticated manager creating a backlog story
- **When** the manager completes its description, Definition of Done, and refinement answers
- **Then** the system identifies missing information or marks the story as ready for Jira

#### Acceptance Criteria

- A story missing required refinement information identifies what is missing.
- A story with all required refinement information can be marked as ready for Jira.

## Functional Requirements

### Access

- FR-001: User can log in with demo account credentials. Priority: must-have
  > Socrates: Counter-argument considered: a single shared demo account could be simpler. Resolution: rejected; individual demo accounts preserve the required user-linked access.

### Backlog stories

- FR-002: Authenticated user can create a backlog story as a draft and complete it later. Priority: must-have
  > Socrates: Counter-argument considered: require a complete form before creating a story. Resolution: rejected; users need to capture a sketch and refine it later.
- FR-003: Authenticated user can view backlog stories and their details in the shared workspace. Priority: must-have
  > Socrates: Counter-argument considered: a list without a detail view may be enough. Resolution: rejected; a story needs a dedicated view for its planning detail.
- FR-004: Authenticated user can edit a backlog story without a history of changes. Priority: must-have
  > Socrates: Counter-argument considered: shared planning should preserve an edit history. Resolution: rejected for the MVP; change history is out of scope.
- FR-005: Authenticated user can delete a backlog story by archiving it and removing it from the active backlog. Priority: must-have
  > Socrates: Counter-argument considered: permanently delete stories. Resolution: archive them instead, so they no longer appear in the active backlog.
- FR-006: Authenticated user can add and edit a Jira-like description for a backlog story. Priority: must-have
  > Socrates: Counter-argument considered: title and implementation steps may be enough. Resolution: rejected; a separate description is required.
- FR-007: Authenticated user can add and edit a Definition of Done as free text and a checklist. Priority: must-have
  > Socrates: Counter-argument considered: choose either free text or a checklist. Resolution: keep both, so users can describe criteria and track them.

### Refinement and planning

- FR-008: Authenticated user can answer the fixed refinement questions for a backlog story and see its readiness assessment. Priority: must-have
  > Socrates: Counter-argument considered: fixed questions may be too rigid for different Cybersecurity work. Resolution: unresolved; define the smallest flexible question model with the readiness rule.
- FR-009: Authenticated user can drag a backlog story between board positions. Priority: must-have
  > Socrates: Counter-argument considered: selecting a status from a list is simpler. Resolution: rejected; dragging cards is required.
- FR-010: Authenticated user can export backlog data as CSV for later Jira import. Priority: must-have
  > Socrates: Counter-argument considered: defer export because Jira is the next stage. Resolution: rejected; CSV export is required in the MVP.

## Non-Functional Requirements

- The product remains usable in the latest version of Google Chrome.
- A user can create and refine a story without an AI service or another third-party service being available.
- Exported backlog data is available as CSV for later import into Jira.

## Business Logic

A backlog story is ready for Jira only when it contains a goal, recipient or area, scope description, implementation steps, a Definition of Done, and at least one Definition of Done checklist item; otherwise the product identifies the missing information.

The fixed refinement questions capture the required planning information. The readiness assessment evaluates the completed story against this rule and shows either the missing pieces or the ready-for-Jira status.

## Non-Goals

- Direct integration with Jira, Jira MCP, or Rovo is out of scope; the MVP provides CSV export only.
- Claude or another LLM integration is out of scope; the core refinement flow uses fixed questions and must work without AI.
- Multiple workspaces, role management, invitations, and an administration panel are out of scope; the MVP supports one small team with flat permissions.
- Self-service registration, password reset, and email verification are out of scope; demo accounts provide the required login path.
- Change history is out of scope; the MVP supports editing without an audit trail.
- Support for browsers other than the latest Google Chrome is out of scope.

## Open Questions

1. **What are the exact refinement questions and their order?** — Owner: user. Block: no; resolve during implementation planning.
2. **Which CSV columns should map to the target Jira import configuration?** — Owner: user. Block: no; resolve before implementing export.

## Forward: technical-roadmap

Future work may integrate Claude Code to help create and improve backlog stories, then transfer or edit stories through Jira, Jira MCP, or Rovo.

## Quality cross-check

- Access Control: present.
- Business Logic: present as a one-sentence readiness rule.
- Project artifacts: present with a valid checkpoint.
- Timeline-cost acknowledgement: present; three-week MVP.
- Non-Goals: present.
