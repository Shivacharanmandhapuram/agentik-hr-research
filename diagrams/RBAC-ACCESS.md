# RBAC Access Charts — the truth about who can do what

> Generated from the **actual code**: `src/lib/rbac/index.ts` (capability map) and the deployed route guards in `src/app/api/**`. This reflects what is *enforced on the server*, not just hidden in the UI.

---

## 1. The roles (two systems that combine)

| Role | System | How you get it |
|---|---|---|
| **Anonymous** | none | not logged in |
| **Employee** | HRMS-derived | a `User` linked to an `Employee` (JIT email match at login) |
| **Manager** | HRMS-derived | an `Employee` with `reports.length > 0` |
| **support_agent** | platform (`RoleBinding`) | granted by owner/admin |
| **analyst** | platform (`RoleBinding`) | granted by owner/admin |
| **domain_admin** | platform (`RoleBinding`) | granted by owner/admin (optionally scoped to one agent) |
| **admin** | platform (`RoleBinding`) | granted by owner |
| **owner** | platform (`RoleBinding`) | auto-granted to the workspace creator at signup |

A real person stacks both axes, e.g. *owner + manager + employee*, or *support_agent + employee*.

---

## 2. Capability → role matrix (the source of truth)

From `ROLE_CAPABILITIES` (platform) and `canAsUser` (delegated). ✅ = has capability. `owner` has `*` (everything).

| Capability | owner | admin | domain_admin | support_agent | analyst | manager | employee | anon |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| `agent.create` | ✅ | ✅ | — | — | — | — | — | — |
| `agent.configure` | ✅ | ✅ | ✅¹ | — | — | — | — | — |
| `agent.publish` | ✅ | ✅ | ✅¹ | — | — | — | — | — |
| `agent.deploy` | ✅ | ✅ | ✅¹ | — | — | — | — | — |
| `knowledge.manage` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `skills.manage` | ✅ | ✅ | ✅ | — | — | — | — | — |
| `inbox.view` | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| `inbox.reply` | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| `analytics.view` | ✅ | ✅ | ✅ | — | ✅ | — | — | — |
| `directory.view` | ✅ | ✅ | — | — | — | — | — | — |
| `hrms.sync` | ✅ | ✅ | — | — | — | — | — | — |
| `integrations.manage` | ✅ | ✅ | — | — | — | — | — | — |
| `users.manage` | ✅ | ✅ | — | — | — | — | — | — |
| `roles.assign` / `roles.revoke` | ✅ | ✅ | — | — | — | — | — | — |
| `audit.view` | ✅ | ✅ | — | — | — | — | — | — |
| `approvals.decide` | — | — | — | — | — | ✅ | — | — |
| `team.view` / `reports.view` | — | — | — | — | — | ✅ | — | — |
| `profile.view` / `leave.view` | ✅² | ✅² | ✅² | ✅² | ✅² | ✅ | ✅ | — |
| `leave.apply` / `leave.cancel` | ✅² | ✅² | ✅² | ✅² | ✅² | ✅ | ✅ | — |
| `case.create` / `chat` | ✅² | ✅² | ✅² | ✅² | ✅² | ✅ | ✅ | — |

¹ `domain_admin` can be **scoped to one agent** — the capability only passes for that agent ID.
² Employee capabilities require the user to be linked to an `Employee`. A platform-only account (e.g. owner who signed up with a non-employee email) is **not** an employee and cannot use the assistant.

---

## 3. Endpoint → required capability (what the server enforces)

> ✅ = enforced with `requireAuthWithRoles` + `can()` (returns **403** + audit-deny if missing).
> 👤 = authenticated + scoped to *self / own org* (employee surface).
> 🌐 = public, no auth.

| Endpoint | Method | Guard | Who passes |
|---|---|---|---|
| `/api/auth/signup` `/signin` | POST | 🌐 | anyone |
| `/api/chat/[agentId]` | GET/POST | 🌐 | anyone (published+deployed+public agent only) |
| `/api/auth/me` | GET | 👤 | any logged-in user |
| `/api/assistant/chat` | POST | 👤 employee | any **employee** (must be linked) |
| `/api/confirmations` | POST | 👤 employee | the confirmation's owner |
| `/api/cases` | GET/POST | 👤 employee | own cases |
| `/api/notifications` | GET/PATCH | 👤 | own notifications |
| `/api/approvals` | GET/POST | 👤 manager-scoped | only requests routed to **you** (approver); self-approval blocked |
| `/api/agents` | GET/POST | ✅ `agent.configure` / `agent.create` | owner, admin, domain_admin |
| `/api/agents/[id]` | GET/PATCH/DELETE | ✅ `agent.configure` | owner, admin, domain_admin(scoped) |
| `/api/agents/[id]/chat` (preview) | POST | ✅ `agent.configure` | owner, admin, domain_admin |
| `/api/agents/[id]/publish` | POST | ✅ `agent.publish` | owner, admin, domain_admin |
| `/api/agents/[id]/deploy` | POST/DELETE | ✅ `agent.deploy` | owner, admin, domain_admin |
| `/api/agents/[id]/knowledge` | POST/DELETE | ✅ `knowledge.manage` | owner, admin, domain_admin |
| `/api/agents/[id]/actions` | POST/DELETE | ✅ `skills.manage` | owner, admin, domain_admin |
| `/api/knowledge` (+ `[id]`, files, urls, train) | GET/POST/DELETE | ✅ `knowledge.manage` | owner, admin, domain_admin |
| `/api/actions` `/api/actions/categories` | GET | ✅ `skills.manage` | owner, admin, domain_admin |
| `/api/leads` | GET/POST | ✅ `inbox.view` | owner, admin, domain_admin, support_agent |
| `/api/conversations` (+ `[id]`, messages, suggest) | GET/POST | ✅ `inbox.view` / `inbox.reply` | owner, admin, domain_admin, support_agent |
| `/api/analytics` | GET | ✅ `analytics.view` | owner, admin, domain_admin, analyst |
| `/api/directory` | GET | ✅ `directory.view` | owner, admin |
| `/api/hrms/sync` | GET/POST | ✅ `hrms.sync` | owner, admin |
| `/api/roles` | GET/POST/DELETE | ✅ `roles.assign` / `roles.revoke` | owner, admin |
| `/api/audit` | GET | ✅ `audit.view` | owner, admin |
| `/api/dev/seed-users` `/reset-passwords` | POST | ✅ `users.manage` (test only) | owner, admin |

---

## 4. Per-role access cards (the practical view)

### Anonymous Visitor
- **CAN:** chat with a public (published+deployed, `accessMode=public`) agent; leave contact (lead); request human handover.
- **CANNOT:** anything internal — no profile, leave, directory, inbox, builder, analytics. All internal endpoints → 401.
- **Lands on:** `/chat/[agentId]` only.

### Employee (e.g. Carol)
- **CAN:** use `/assistant` (ask, cited answers, leave balance, profile); apply/cancel leave (confirm-gated); escalate to a case; see own notifications.
- **CANNOT:** builder (agents/knowledge/skills), inbox, analytics, directory, leads, roles, audit, HRMS sync, approvals. **All → 403.**
- **Lands on:** `/assistant` (redirected away from the dashboard).

### Manager (e.g. Eve)
- **CAN:** everything an Employee can **+** see & decide approvals **for their own direct reports** (`/approvals`). Sees the Approvals nav.
- **CANNOT:** approve non-reports (denied + logged); builder, inbox, analytics, directory, roles, audit, HRMS — unless *also* granted a platform role. **→ 403.**
- **Lands on:** dashboard (for `/approvals`) — only Approvals + Notifications visible.

### Support Agent
- **CAN:** Live Inbox — read **escalated** conversations, AI-suggested replies, reply as human; view Lead Capture.
- **CANNOT:** builder, analytics, directory, roles, audit, HRMS. **→ 403.** (Composable: usually stacked on admin/employee.)

### Analyst
- **CAN:** Analytics dashboard only (aggregate, preview chats excluded).
- **CANNOT:** everything else (read-only). **→ 403.**

### Domain Admin
- **CAN:** build/configure/publish/deploy agents, manage knowledge & skills, inbox, analytics — **scoped to assigned colleague(s)**.
- **CANNOT:** directory, HRMS sync, roles, audit, integrations, user management. **→ 403.**

### Admin
- **CAN:** all builder + governance surfaces: agents, knowledge, skills, inbox, analytics, directory, HRMS sync, roles, audit, integrations, users.
- **CANNOT:** (Owner-only) transfer/delete workspace, billing.

### Owner
- **CAN:** `*` — everything (capability check short-circuits on `*`). Plus owner-only destructive ops (planned).
- **Note:** owner is a *platform* role. If the account isn't linked to an `Employee`, it still **cannot** use `/assistant` (that needs employee identity).

---

## 5. The two guards that aren't simple capability checks

| Guard | Where | Rule |
|---|---|---|
| **Approver scope** | `/api/approvals` | you only see/decide requests where `approverEmployeeId == you`; self-approval is rejected |
| **Colleague scope** | `domain_admin` | `can(user, cap, agentId)` passes only when the binding's `scopeId == agentId`; an unscoped check is denied (no privilege escalation) |

---

## 6. Recently closed gaps (hardening audit trail)

| Gap (was) | Now |
|---|---|
| Inbox readable by any logged-in user | `inbox.view`; only escalated, non-preview conversations |
| Analytics readable by anyone | `analytics.view`; preview excluded |
| Agents / Knowledge / Leads / Directory open to employees | capability-gated (403) |
| `agent.delete` open to employees | `agent.configure` |
| `/api/hrms/sync` open to employees | `hrms.sync` (admin/owner) |
| Builder preview chat open to non-builders | `agent.configure` |
| Skills catalog open to all | `skills.manage` |
| Role assign `upsert` crashed on null scope | `findFirst`+`create` |
| `can()` colleague-scope privilege escalation | scoped check only |

**Invariant now:** every builder/governance endpoint enforces a capability **on the server** (not just hidden in the nav), returns **403 + audit-deny** on failure, and the employee surface is scoped to self.
