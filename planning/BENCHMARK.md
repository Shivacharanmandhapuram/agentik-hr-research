# Reference-First Principle & Benchmark

> **PRINCIPLE (the truth we hold):** Before designing *any* functionality — RBAC, org/teams,
> agents, knowledge, approvals, governance — we first check **how Workday, ServiceNow, and
> Leena.ai do it**, compare against our current system, and only then make our own
> ("Discord-like") decision. We borrow the proven pattern; we don't invent in a vacuum.

This doc is **living**: update the "How the references do it" and "Where we stand" rows whenever we research a new area.

---

## 1. How the three references actually do it

### Workday (system of record for HR/Finance)
- **Security groups** (role-based *and* user-based) are the unit of access.
- **Domain security policies** — control *data/field* access by functional area (e.g., "Compensation" domain → who can view/modify).
- **Business-process security policies** — control *who can initiate/approve* each step of a process (hire, time-off, etc.).
- Roles attach to positions in the **supervisory organization** and **inherit down** the org tree.
- Agentic (2026): agents answer "with all the right **policies and permissions already applied**"; **Agent Passport** tests/verifies/monitors every agent (prompt-injection, data-leak, jailbreak) with real-time allow/block and one-click **revocation**.

### ServiceNow (system of action for ITSM/HRSD)
- **RBAC roles** + **ACL rules**: zero-trust, **deny-by-default**, evaluated **per operation** (create/read/write/delete) at **table / record / field** granularity, combining *role + condition + script*.
- **Scoped applications** — each app is namespaced; cross-scope access is explicit.
- **Virtual Agent** + **Knowledge Bases** gated by **user criteria** (who can see which KB/article).

### Leena.ai (agentic layer on top)
- **Orchestrator** routes a request to the right **AI Colleague** (per *function*: HR/IT/Finance), can chain them (A2A).
- **Permissions are identity-bound and inherited from the IdP/source systems** — "No re-mapping." The colleague *acts as you*; it can't exceed what you can already do in Workday/ServiceNow.
- **No-code Studios** (AOP = process, Workflow = tools, Knowledge = truth); **Context Graph** memory; governance/audit on every action.

### The shared lesson
All three separate **two permission planes**:
1. **Staff/config access** — roles + permissions, admin-managed (ServiceNow ACLs, Workday security groups).
2. **End-user data access** — *identity-bound, inherited from the org/source system* (Workday domain+org policies, Leena IdP inheritance). **You do not hand-build the org chart as roles.**

---

## 2. Capability-by-capability benchmark

Legend: 🟢 strong / comparable · 🟡 partial / basic · 🔴 missing. "Ours" = this MVP today.

| Capability | Workday | ServiceNow | Leena.ai | **Ours (today)** | Verdict for us |
|---|---|---|---|---|---|
| **Staff RBAC** | 🟢 security groups, inherited | 🟢 roles + ACLs (field-level) | 🟡 staff roles, IdP-inherited | 🟡 capability map, server-enforced, audit-deny; **roles still hardcoded** | behind on *dynamic/field-level*; **at par on enforcement + audit** |
| **End-user (delegated) access** | 🟢 domain + org policies | 🟢 ACL per record | 🟢 IdP identity-bound | 🟢 `canAsUser` acts-as-user, manager→reports scoped | **at par conceptually** (smaller scope) |
| **Record/field-level security** | 🟢 domains | 🟢 ACLs (best-in-class) | 🟡 inherited | 🔴 row-level org scoping only, no field ACLs | **behind** |
| **Org / team model** | 🟢 supervisory orgs | 🟡 groups/depts | 🟡 reads IdP | 🟡 `managerId` edges only, **no teams/HRBP** | **behind** |
| **Approvals / business process** | 🟢 BP security policies | 🟢 flow + approvals | 🟢 AOP rails | 🟢 confirm → approve → audit → notify (manager-scoped, self-approval blocked) | **at par for the leave flow** |
| **AI assistant / agents** | 🟡 Sana/Gemini, new | 🟡 Virtual Agent | 🟢 per-function colleagues + orchestrator | 🟡 single builder, publish/deploy, **no orchestrator yet** | behind on multi-agent routing |
| **Knowledge access control** | 🟢 domain policies | 🟢 KB user criteria | 🟢 KM + identity | 🟢 `KnowledgeFolder.allowedRoles` filter-then-prompt | **at par (role-level); behind on dept-level** |
| **Action spine (confirm→execute)** | 🟡 BP-driven | 🟡 flow-driven | 🟢 AOP + tools, confirm-gated | 🟢 confirm + 10-min TTL + audit + notify | **at par / a strength** |
| **Audit / governance** | 🟢 mature | 🟢 mature | 🟢 decision traces | 🟢 every write + denial logged (ALLOW/DENY) | **at par in pattern; behind in depth** |
| **Agent safety (red-team/monitor)** | 🟢 Agent Passport | 🟡 guardrails | 🟢 governance layer | 🟡 guardrails + published-snapshot + no-fabrication | **behind** |
| **Integrations** | 🟢 native | 🟢 native + 100s | 🟢 200+ connectors | 🔴 mock HRMS + OrangeHRM adapter only | **far behind** |
| **Channels** | 🟡 in-app | 🟡 portal/VA | 🟢 8+ (Slack/Teams/voice/email) | 🟡 web + public embed; voice mock planned | **behind** |
| **Compliance / scale** | 🟢 SOC2/ISO, global | 🟢 SOC2/ISO | 🟢 SOC2/ISO/HIPAA, 14+ regions | 🔴 single Azure deploy, no certs | **far behind (expected for MVP)** |
| **Time-to-stand-up (SMB)** | 🔴 months | 🔴 months | 🟡 days | 🟢 minutes (signup → sync → chat) | **a genuine strength** |
| **Cost / footprint** | 🔴 enterprise $$$ | 🔴 enterprise $$$ | 🔴 enterprise | 🟢 lean | **a genuine strength** |

---

## 3. Where we are honestly better / at par / behind

**Genuinely better (for the SMB 50–800 segment):**
- **Speed & simplicity** — signup → HRMS sync → working assistant in minutes; no implementation project.
- **AI-native, governed-by-default** — confirm-gated writes, audit-on-every-write, published-snapshot, filter-then-prompt were built in from day one, not bolted on.
- **One unified assistant** instead of separate portals/modules.
- **Lean cost/footprint.**

**At par (in pattern, not depth):**
- Delegated identity-bound access (`canAsUser`) ≈ Leena IdP inheritance / Workday "policies already applied."
- Role→capability RBAC with server enforcement + audit-deny ≈ the spirit of ServiceNow roles.
- Confirm→approve→audit→notify ≈ Workday business-process security policies (for the one leave flow).
- Role-scoped knowledge retrieval ≈ ServiceNow KB user criteria (role-level).

**Behind (the real gaps):**
- **Dynamic roles** (admin-created) and **field/record-level ACLs** — ours are hardcoded + row-level.
- **Org modeling** — no teams/supervisory orgs/HRBP; only `managerId`.
- **Orchestrator + multi-function agents** — single agent, no routing.
- **Real integrations, channels, compliance, agent red-teaming, scale** — expected MVP gaps.

---

## 4. Applying the rule to the pending "Discord-style RBAC" decision

Benchmarked, the decision sharpens to:
- **Staff plane → adopt dynamic roles** (ServiceNow/Workday confirm this is right): admin-created `Role` + permission catalog. *But* note neither makes you hand-build the org chart as roles.
- **Employee plane → keep identity-bound/HRMS-inherited** (Leena + Workday domain/org policies): do **not** Discord-ify; derive manager/employee/dept from HRMS.
- **Org/teams → model on Workday supervisory orgs** (teams + HRBP), read from HRMS, don't re-key by hand.
- **Field-level access → borrow ServiceNow** later (per-field/record ACLs) if/when we expose sensitive fields (salary, PII).
- **Agent safety → borrow Workday Agent Passport** idea later (eval/guardrail registry) before going to real writes in production.

**Net:** our earlier "two-plane" plan is consistent with all three references. Dynamic roles = staff plane only; everything employee-facing stays inherited from HRMS.

---

## 5. Checklist to run before any new feature decision
1. How does **Workday** do it (system-of-record / policy lens)?
2. How does **ServiceNow** do it (RBAC/ACL / system-of-action lens)?
3. How does **Leena.ai** do it (agentic / orchestration lens)?
4. Where does **our current system** stand vs each?
5. Pick the proven pattern; document the deviation if we diverge — then build.
