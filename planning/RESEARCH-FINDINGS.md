# Research Findings (independent) — to cross-check vs Google Deep Research

> My own web research, mechanism-level, done in parallel to the Google/Gemini Deep Research run.
> Compare the two; where they agree we treat as solid, where they differ we dig. Sources are
> noted by domain inline (official docs/eng blogs/practitioner posts preferred).

---

## 1. Per-system mechanism summary

### Workday (system of record)
- **Security:** role-based **+ user-based security groups**; **domain security policies** (data/field access by functional area) and **business-process security policies** (who can initiate/approve each step). Roles attach to **supervisory-org positions and inherit down** the tree. (workday.com, virginia.gov job spec, csoonline)
- **Time-to-value:** *months*. Phased plan→design→config→test→deploy→**stabilization (6–12 months)**; needs a dedicated **Workday security administrator**. "Workday GO" trims to weeks for smaller scopes. (suretysystems, dispatchintegration, theplanetgroup)
- **Agentic (2026):** **Agent System of Record** + **Agent Passport** — tests/verifies/monitors every agent (prompt-injection, jailbreak, data-leak), real-time **allow/block/route**, one-click **revocation**; Sana self-service agent answers "with all the right policies and permissions already applied." (investor.workday.com, prnewswire)

### ServiceNow (system of action)
- **Security:** roles **+ ACL rules** — zero-trust **deny-by-default**, per operation (create/read/write/delete), at **table/record/field**, combining role + condition + script. (servicenow docs/community)
- **Knowledge:** **User Criteria** records (conditions on user attributes) gate KB/articles — "update one User Criteria record rather than N items." Reusable, consistent. (servicenow community)
- **HRSD:** a **scoped application** (private vs global scope). Virtual Agent needs an **implementation checklist** (ready KB + Service Catalog + change management). → real setup project.

### Leena.ai (agentic layer; **enterprise**, not SMB)
- Orchestrator → per-function **AI Colleagues**; **identity-bound permissions inherited from IdP** ("no re-mapping"); AOPs + Skills + Knowledge Studio; Context Graph memory; governance/audit.
- **Segment/TTV:** enterprise (500+ customers — Nestlé, Coca-Cola, Mercedes); 1000+ integrations; **45-day go-live**; custom enterprise pricing. (aws marketplace, leena.ai)

### Moveworks (reasoning-engine agent)
- **Agentic Reasoning Engine:** plan multiple steps → select & execute next action → **observe & adapt** (ReAct loop); uses **multiple LLMs**; context window assembled fresh per turn. (docs.moveworks)
- **Agentic Automation Engine:** enforces business rules **deterministically in code — explicitly NOT via NL instructions the LLM might ignore.** (help.moveworks)
- **Slots:** structured slot-filling resolves ambiguous input ("travel expenses" → category ID) before acting. (moveworks blog)

### Glean (permission-aware enterprise search/agents)
- **Permission-aware index** (since 2018): indexes the whole stack and **enforces existing source-system permissions at retrieval time, document-level, in real time**; knowledge graph joins data; **100+ connectors**. (glean.com)
- **MCP Gateway:** permission-enforced connectors, **IdP-backed authorization**, granular access, AI security checks (prompt injection, malicious code, toxic content). (docs.glean)

### Microsoft Copilot Studio (low-code agent builder)
- Every custom agent = **four components: Knowledge, Tools, Topics, Instructions**; coordinates LLM + context + triggers. **No-code/no data scientists**; Power Platform connectors for actions; **Topics** = scripted conversation paths (verbatim responses for sensitive topics, adaptive cards, fallback). (learn.microsoft, microsoft.github.io)

---

## 2. The cross-cutting patterns (the real signal)

**P1 — Everyone *inherits* end-user data permissions; nobody hand-builds them.**
Workday ("policies already applied"), Leena (IdP-inherited), **Glean (permission-aware index, document-level, real-time)** all enforce *who-can-see-what* from the source system / identity. ServiceNow uses reusable **User Criteria** (attribute-based), not per-item config. → **Strong validation of our two-plane model.** The gold-standard pattern to copy is **Glean's permission-aware retrieval** + ServiceNow's **reusable criteria**.

**P2 — LLM reasons; deterministic rules live in *code*, not prompts.**
Moveworks says it outright ("not through NL instructions the LLM might ignore, but code that runs every time"). Workday/ServiceNow gate via BP/ACL. → Validates our **`can()` + confirm-gated skills in code**. Keep guardrails deterministic when we add an orchestrator.

**P3 — The builder converges on 4 primitives.**
Copilot Studio (Knowledge/Tools/Topics/Instructions) ≈ Leena (Knowledge/Skills/AOP) ≈ ours (knowledge/actions/instructions + guardrails). The one primitive we lack is **Topics** = deterministic scripted answers for sensitive paths.

**P4 — Agent safety is becoming a first-class layer.**
Workday **Agent Passport** (test/verify/monitor/revoke) + Glean **AI security checks** (prompt-injection/toxic). → Our eval/guardrail-registry idea is now an industry pattern, not optional.

**P5 — Time-to-value is universally bad → our wedge is open.**
Workday months (+6–12mo stabilization, dedicated admin); ServiceNow implementation checklist + change mgmt; Leena 45 days enterprise. **No one targets minutes-for-SMB.** Confirmed.

---

## 3. What this research adds/changes vs STRATEGY.md

**New TAKE candidates (validated, cheap, TTV-safe):**
- **Permission-aware retrieval (Glean):** make knowledge access **inherited from HRMS identity at query time** (dept/role), not hand-tagged per folder. Extend `KnowledgeFolder.allowedRoles` → identity/dept-derived. *(strong)*
- **Reusable access criteria (ServiceNow User Criteria):** define an access rule once, reuse across folders/skills — avoids per-item config.
- **Topics for sensitive/verbatim answers (Copilot Studio):** deterministic scripted responses for sensitive HR topics (harassment reporting, grievances) instead of LLM freeform. Cheap, high-safety.
- **Slots (Moveworks):** structured slot-filling for write-skills (resolve "next week" / "my dept's leave types" to concrete values) — adopt when we add more actions.

**Confirmed SKIP:** 100s/1000s connector catalogs, multi-LLM routing, visual workflow designers, scoped-app frameworks, long stabilization, dedicated security-admin tooling.

**Confirmed BEAT:** minutes-not-months; governed-by-default; HRMS-auto-provisioned org+roles+knowledge-access.

---

## 4. Time-to-value teardown (signup → first real value)

| System | Path | Realistic time | Bottleneck |
|---|---|---|---|
| Workday | SI project: design→config→test→deploy→stabilize | **months** (+6–12mo stabilize) | security-group + BP design; dedicated admin |
| ServiceNow | implementation checklist, KB+catalog ready, change mgmt | **weeks–months** | ACL/scoped-app config; KB prep |
| Leena | pre-built colleagues, connect sources | **~45 days** | enterprise integration + governance setup |
| Moveworks / Glean | connect systems, index, tune | **weeks** | connector + permission indexing |
| Copilot Studio | low-code build per agent | **days** (per agent) | you still *build* each agent |
| **Ours (target)** | signup → HRMS sync → deployed HR colleague | **minutes** | none if seeded + auto-provisioned |

---

## 5. Open questions to verify against the Deep Research output
- Exact **Workday domain vs BP security** split — does our two-plane map cleanly onto it?
- ServiceNow **User Criteria** expressiveness — worth copying the data model?
- Glean **permission-aware index** internals — feasible at our scale, or just enforce at query time from HRMS?
- Real **SMB** time-to-value numbers for Leena/Moveworks/Glean (public data is enterprise-skewed).
- Pricing models (per-seat vs per-resolution/"compute per thought" — Leena hints at token-based).

> When the Google Deep Research returns, drop it next to this file; I'll diff the two, mark
> agreements as decided, escalate disagreements, then run the SCRUM Step-1 gate in `PLANNING.md`.
