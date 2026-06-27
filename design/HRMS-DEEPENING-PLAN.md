# HRMS Deepening Plan — Agentic Frappe Integration (MVP)

> **Principle (non-negotiable):** Frappe HR is the **single source of truth**. Every **read** pulls from
> Frappe; every **action writes back to Frappe** (confirm-gated + audited). That round-trip is what makes
> this *agentic* — not a chatbot. This is **MVP / production-grade, not a demo** — so every write-back is
> verified end-to-end against the live Frappe instance.
>
> **For modules Frappe supports but has no data yet** (payroll, performance, training, onboarding): we
> **seed realistic MVP data into Frappe via its API** (so it lives in the source of truth), then build the
> read/write features on top — never fake data in our own DB.

---

## Where we are today (audit)

| Capability | Read | Write-back to Frappe | Status |
|---|---|---|---|
| Employee profile / hierarchy | ✅ live | n/a | Done |
| Leave balance | ✅ live (`get_leave_details`) | n/a | Done |
| Apply leave | — | ⚠️ creates Leave Application **status=Open, NOT submitted** (balance not deducted) | Partial |
| **Approve/reject leave** | — | ❌ **updates our DB only — never writes to Frappe** | **Gap** |
| Cancel leave | — | ❌ not wired to Frappe | Gap |
| Expense | DB-only mock | ❌ not a real Frappe Expense Claim | Gap |
| Attendance, payroll, performance, training, onboarding | ❌ | ❌ | Not built |

Frappe data confirmed present (no setup needed): `date_of_birth`, `date_of_joining`, `Holiday List` (1), `Leave Type` (5), `Leave Application` (4), `Expense Claim Type` (5), `Salary Component` (7), `Company` (hrms-test), `Department` (16).
Frappe modules present but **empty** (need seeding): Salary Structure/Slip, Attendance, Appraisal/Goal, Training, Onboarding, Shift.

---

## Phase 1 — Compulsory BRD *Musts* + write-back integrity

**Goal:** close the two Must gaps the client flagged (FR-04, FR-03) and fix the leave write-back round-trip so approvals are truly agentic.

### 1a. FR-04 — Company policy vs. general guidance (Must)
- Tag every answer's knowledge with its **source type**. When grounded in an attached company doc → label **"📄 Company policy"** + citation. When NOT grounded → explicitly say **"No company policy found — here's general HR guidance:"** and never present it as official.
- Implementation: extend `searchKnowledge` results with source label; enforce in the system prompt; add a citation/footer line to grounded answers.

### 1b. FR-03 — "What-if" HR questions (Must per client)
- Policy-grounded scenario answers that **state assumptions**, **cite the policy rule**, and **ask non-sensitive follow-ups** when inputs are missing (e.g. "resignation notice impact", "leave eligibility if I joined in March").
- Implementation: a dedicated prompt path for conditional/scenario intents + ground in leave policy / notice-period knowledge; label assumptions.

### 1c. Write-back integrity — leave round-trip (the agentic core)
- **Apply leave:** after creating the Leave Application, **submit it** (`frappe.client.submit`, docstatus=1) so it's pending-approved in Frappe and balance reflects (handle Holiday List requirement gracefully).
- **Approve:** on manager approval → set Frappe Leave Application `status=Approved` + submit; balance deducts in Frappe.
- **Reject:** set `status=Rejected`. **Cancel:** cancel the Frappe doc (docstatus=2).
- Store the Frappe `name` as `externalRef` on our `ApprovalRequest` so decisions map to the real doc.

### 1d. Write-back verification harness
- A live test that performs each write (apply → approve → cancel) and **asserts the record + status in Frappe** via the API. Run before every deploy. *("We are not a demo piece" — every write-back proven.)*

**Effort:** ~2–3 days.

---

## Phase 2 — Tier 1 reads (data already there) + Proactive + FR-20

**Goal:** high value, zero Frappe setup — and deliver the BRD's **Phase 5 (proactive intelligence)** early.

- **Sync** `date_of_birth` + `date_of_joining` into our `Employee` model (2 fields).
- **New read skills** (all live from Frappe):
  - `get_upcoming_birthdays`, `get_work_anniversaries`
  - `get_holidays` (Holiday List) — "When's the next holiday?"
  - `get_leave_types` (Leave Type + Policy) — "What leave can I take / how many days?"
  - **`get_team_on_leave` → FR-20 Team leave calendar (Must)**, manager-scoped from Leave Application.
- **Proactive nudges (BRD Phase 5):** a "Celebrations & upcoming" widget (🎂 birthdays, 🎉 anniversaries, 📅 next holiday) on the dashboard + a proactive line in the assistant. Opt-in per BRD.
- **Richer profile/directory:** gender, phone (`cell_number`), tenure (from DOJ).

**Effort:** ~2–3 days.

---

## Phase 3 — Tier 2 write-backs (agentic actions on the source of truth)

**Goal:** make IT/Finance/attendance genuinely transactional against Frappe.

- **Real Expense Claim** → write to Frappe `Expense Claim` (types already exist: Food/Medical/Calls/Travel). Replace the DB-mock `submit_expense`; confirm-gated → returns the real Frappe claim ID; status readable via `get_reimbursement_status`.
- **Attendance check-in/out** → write `Employee Checkin` (IN/OUT); read "did I check in today?" / attendance summary.
- **Document request / leave cancel** → wired to Frappe where applicable.
- All actions: confirm-gated → passport-gated → audited → emit analytics events.
- Extend the **write-back verification harness** to cover expense + attendance.

**Effort:** ~3–4 days.

---

## Phase 4 — Tier 3: seed Frappe MVP data, then build payroll/performance/training

**Goal:** light up the modules Frappe supports but has no data for. **Step A seeds realistic MVP data into Frappe; Step B builds features on it.**

### 4a. Seed realistic MVP data into Frappe (via API)
- **Payroll:** create a `Salary Structure` (using existing components: Basic 50%, HRA 20%, etc.), assign to the 13 employees, run a `Payroll Entry` → generate **Salary Slips** for the last 1–2 months. (Fallback: insert Salary Slip docs directly with earnings/deductions if a full payroll run is heavy.) Data realistic + presentable, not random.
- **Attendance:** ~1 month of Present/Absent/On-Leave records.
- **Performance:** an `Appraisal Cycle` + `Goals`/`Appraisals` for a few employees.
- **Training:** a `Training Program` + `Training Event` + results.
- **Onboarding:** an `Employee Onboarding` template + one in-progress.

### 4b. Build features on the seeded data
- **Payslips (FR-12 / FR-13):** read own Salary Slips, explain components in plain language ("why did net pay change"), **field-masking** so only the authenticated user sees their slip — **NFR-02 / NFR-05 / BRULE-05**. Read-only, audited.
- **Performance (FR-21 partial):** goals + appraisal status.
- **Training/compliance (FR-21):** completion status, pending trainings.
- **Onboarding/offboarding (FR-31):** pending steps checklist.
- **Shift/roster (optional):** "what's my shift today?"

**Effort:** ~4–6 days (seeding ~1–1.5d, features ~3–4d).

---

## Cross-cutting (applies across phases)
- **Field-level masking (NFR-02/05, BRULE-05):** mandatory once payroll/PII lands — salary, bank, gov-ID masked unless role permits; no inference leakage (BRULE-06).
- **Confirm → passport → audit → analytics** on every write.
- **Agent Passport eval** updated to cover the new write skills.
- **HRMS source-of-truth rule:** no feature reads/writes employee data anywhere but Frappe (via the `HrmsProvider` interface, so the Zoho swap stays clean).

---

## Recommended sequencing & estimate

| Phase | Theme | BRD coverage | Est. |
|---|---|---|---|
| **1** | FR-04 + FR-03 Musts + leave write-back integrity | FR-03, FR-04, FR-41/42 hardening | 2–3 d |
| **2** | Tier-1 reads + proactive + team calendar | FR-20 (Must), BRD Phase 5 | 2–3 d |
| **3** | Tier-2 write-backs (expense, attendance, cancel) | FR-40/41, agentic core | 3–4 d |
| **4** | Tier-3 seed + payroll/perf/training | FR-12/13/21/31 | 4–6 d |

**Total ~11–16 days.** Phases 1–2 first (compulsory Musts + quick wins + proactive), then 3 (write-backs), then 4 (seed + payroll).

---

## What I need from you to start
Sign-off on this plan + sequencing. On approval I'll execute **Phase 1 first** (FR-04, FR-03, leave write-back round-trip + verification harness), deploy, verify against live Frappe, then proceed phase-by-phase exactly like the UI revamp.
