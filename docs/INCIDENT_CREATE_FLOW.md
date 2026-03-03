# New Incident Create Flow

## Overview

This document describes the end-to-end flow for creating a new incident in the Risk Register.

---

## 1. Who Can Create Incidents

- **Manager** and **User** roles can create incidents.
- Admin and Unit Head see incidents but the "Add Incident" button is only shown for manager and user.

---

## 2. How to Start Creating an Incident

**Option A – From Incidents tab**

1. Go to **Risk Register** (main view).
2. Click the **Incidents** tab.
3. Click **Add Incident** (top right).
4. The incident form appears (risk can be chosen from dropdown).

**Option B – From a risk row**

1. Go to **Risks** or **New Risks** tab.
2. **Click a risk row** (or use row action if available).
3. App switches to **Incidents** tab and opens the form with that risk pre-selected.

---

## 3. Form Fields (IncidentForm)

| Field | Required | Description |
|-------|----------|-------------|
| Risk Number | Yes | Select risk (or read-only if opened from a risk row). |
| Incident Summary | Yes | Short summary. |
| Incident Reported Date | Yes | Month picker (defaults to current month). |
| Incident Description | Yes | Full description. |
| Mitigation Steps | No | Text. |
| Current Status | No | Free text. |
| Closed Date | No | Date picker. |

User clicks **Save Incident** to submit.

---

## 4. Frontend Flow (App.tsx + RiskDashboard)

1. **IncidentForm** calls `onSave(payload)` with:
   - `riskId`, `summary`, `occurredAt`, `description`, `mitigationSteps`, `currentStatusText`, `closedDate` (and `id` when editing).

2. **RiskDashboard** passes this to **App**’s `onAddIncident` (for new) or `onUpdateIncident` (for edit).

3. **handleAddIncident** in App:
   - Resolves department from current user or selected risk.
   - Calls `POST /api/incidents` with the incident payload (camelCase).
   - On success, **refetches** the incidents list (with role-based filters) and updates `incidents` state.
   - Form is closed and the new incident appears in the list.

---

## 5. API Flow (POST /api/incidents)

**Request (camelCase):**

- `riskId` (required) – Risk GUID.
- `departmentId` (optional) – Department GUID; if omitted, backend derives it from the risk.
- `summary`, `description` – required.
- `occurredAtUtc`, `mitigationSteps`, `currentStatusText`, `closedDateUtc`, `createdByUserId` – optional.

**Backend:**

1. Accepts JSON body (camelCase).
2. If `departmentId` is missing, looks up **DepartmentId** from **dbo.Risks** for the given **RiskId**.
3. Inserts into **dbo.incidents_t** (IncidentId, RiskId, DepartmentId, Summary, OccurredAtUtc, Description, MitigationSteps, CurrentStatusText, ClosedDateUtc, CreatedByUserId).
4. Logs an audit event (INSERT) for the new incident.
5. Returns `201` with `{ ok: true }`.

---

## 6. After Create

- Incident list is refreshed (GET /api/incidents with role filters).
- New incident appears in the Incidents tab.
- User can edit it later (same form in edit mode) or view incident history if implemented.

---

## 7. Role-Based Incident Visibility

- **User**: incidents they created (`createdBy=userId`) or tied to their risks.
- **Manager**: incidents for their department(s).
- **Admin**: all incidents (optional department filter).

The same filters are used when **refreshing** the list after create.
