# Product Strategy — Time-to-Value as the Moat

> Companion to `BENCHMARK.md`. Where BENCHMARK answers "how do they do it," this answers
> **"what do we take, what do we skip, where do we beat them — to stay time-to-value heavy."**
>
> **Thesis:** Workday/ServiceNow are *implementation projects* (months, consultants, admins).
> Leena is *days*. **We win at *minutes*.** Every feature must pass the **TTV test**:
> *does it keep first-value under ~15 minutes with zero consultants, auto-configured from the HRMS?*
> If not → auto-configure it from HRMS, template it, or cut it.

---

## 1. The one-screen verdict

| Area | Workday | ServiceNow | Leena | TAKE / SKIP / BEAT for us |
|---|---|---|---|---|
| Setup / onboarding | months, SI-led | months, SI-led | days, pre-built | **BEAT** → minutes, HRMS-auto-provision |
| Identity / RBAC | security groups | roles + ACLs | IdP-inherited | **TAKE** dynamic *staff* roles; **BEAT** by auto-deriving employee/mgr from HRMS |
| Org / teams | supervisory orgs | groups | reads IdP | **TAKE** teams+HRBP, but *read from HRMS* (no manual keying) |
| The assistant | new (Sana) | Virtual Agent | per-function colleagues + orchestrator | **TAKE** pre-built colleague templates + lite router; **BEAT** on simplicity |
| Knowledge | domain policies | KB + user criteria | Knowledge Studio | **TAKE** dept-scoped folders; **BEAT** by auto-ingesting on setup |
| Skills / workflows | BP framework | Flow Designer | AOP + Workflow Studio | **SKIP** heavy graph designers → templates + LLM + confirm-gate |
| Approvals / process | BP security policies | flow approvals | AOP rails | **at par** — keep our confirm→approve→audit→notify |
| Memory | — | — | Context Graph | **SKIP** for now → simple thread memory; revisit |
| Channels | in-app | portal | 8+ (Slack/Teams/voice) | **TAKE** Slack/Teams later; voice = mock; **don't** chase all 8 |
| Integrations | native | native | 200+ connectors | **SKIP** the catalog → 3-5 high-value + provider interface |
| Analytics | mature | mature | dashboards | **TAKE** the 5 metrics that matter; skip the rest |
| Governance / safety | Agent Passport | guardrails | governance layer | **TAKE** the *idea* (eval/guardrail registry) before prod writes |
| Multi-model / own LLM | — | — | WorkLM + routing | **SKIP** → one good model |
| Compliance / multi-region | SOC2/ISO | SOC2/ISO | SOC2/ISO/HIPAA, 14 regions | **SKIP** until enterprise pull |
| Proactivity | — | — | nudges, always-on | **TAKE** cheaply (we have notifications) |

---

## 2. What to TAKE (high value, cheap, preserves TTV)

1. **Pre-built "AI Colleague" templates (from Leena).** Ship HR / IT / Finance colleagues that work on **day one** — seeded instructions, starter knowledge, and skills. This is the single biggest TTV lever: the admin gets a working HR colleague the moment HRMS syncs, not a blank builder. *(We have the Agent model + templates field — wire real seed content.)*
2. **Auto-provision everything from the HRMS sync (our BEAT, inspired by Workday "policies already applied").** On sync: create employees, derive manager edges + teams + HRBP, assign the default **Employee** role, and deploy the HR colleague. Zero manual mapping.
3. **Dynamic *staff* roles (from ServiceNow/Workday).** Admin-creatable roles + permission catalog — but *only* for staff/config access. Employee access stays inherited.
4. **Dept-scoped knowledge (from ServiceNow KB user criteria).** Extend `allowedRoles` → `allowedDepartments`. One HR colleague, per-team policy via folder scope — not N agents.
5. **Lite orchestrator/router (from Leena, simplified).** A thin classifier that picks HR vs IT vs Finance colleague from the message. Not a multi-model planner — just routing.
6. **Proactivity (from Leena, cheap for us).** We already have notifications — add a few proactive nudges (e.g., "your leave was approved," "doc you own is stale"). High perceived value, low cost.
7. **An eval/guardrail registry (the *idea* behind Workday Agent Passport).** Before any colleague does real production writes, it passes a small test suite (prompt-injection, data-leak, no-fabrication). Lightweight version of Agent Passport.

## 3. What to SKIP (enterprise weight that kills TTV for SMB)

- **Drag-and-drop workflow/graph designers** (ServiceNow Flow Designer, Workday BP framework, Leena Workflow Studio). For SMB, templates + LLM + our confirm-gated skill spine cover 90%. Building a visual designer is months of work that *adds* setup time.
- **The 200+ connector catalog.** Maintaining hundreds of integrations is the opposite of lean. Ship **3–5 high-value** (one HRMS = OrangeHRM, Slack, Google/M365 SSO) behind the provider interface; everything else on request.
- **Context Graph / long-term memory infra.** Heavy. Start with simple per-thread memory; revisit only if retention clearly improves outcomes.
- **Multi-model orchestration / proprietary LLM (WorkLM).** One good model. Model-swapping is a config detail, not a feature.
- **Multi-region / VPC / heavy compliance certs.** Real, but enterprise-stage. Don't pay that tax pre-PMF.
- **Field-level ACL engine everywhere (ServiceNow-grade).** Only add field-level rules for genuinely sensitive fields (salary, PII) — not as a platform-wide framework.
- **Deep admin "security administrator" tooling** (Workday has a whole job role for it). If our RBAC needs a dedicated admin, we've failed the TTV test.

## 4. Where we BEAT them (lean in hard)

1. **Minutes, not months.** The headline. Signup → HRMS sync → provisioned org + deployed HR colleague → first answer. Make this a *measured, demoed* number on the landing page.
2. **Zero-config governance.** Audit-on-every-write, confirm-gated actions, published-snapshot, filter-then-prompt — all **on by default**, no setup. Enterprises *bolt these on*; we ship them.
3. **Org & permissions auto-derived from HRMS.** No security-group modeling, no ACL scripting. Sync = done.
4. **One unified assistant** across HR/IT/Finance via the lite router — not separate portals/modules.
5. **Lean cost.** Priceable for 50–800-person companies that can't afford Workday/ServiceNow seats.

## 5. The "Time-to-Value heavy" product spec (make it the moat)

Treat TTV as a **first-class, instrumented feature**:
- **Golden path:** signup → "Connect HRMS" (or "Use sample data") → auto-sync → **"Your HR Colleague is live"** with a working chat, in one screen.
- **Instrument it:** log timestamps for signup → sync → first successful assistant answer; show "time to first value" in analytics. Optimize it like a funnel.
- **Templates over builders:** the default experience is a *working* colleague you tweak, never a blank canvas.
- **Sensible defaults everywhere:** default Employee role, default guardrails, default greeting, auto-attached starter KB.
- **Progressive disclosure:** the builder/governance depth exists, but is hidden until an admin wants it. An employee/manager never sees setup.

**Rule of thumb:** if a feature adds a setup step, it must either be (a) auto-done from HRMS, (b) a one-click template, or (c) cut.

## 6. Reprioritized roadmap (TTV-weighted)

| Priority | Item | Why (TTV lever) | Source |
|---|---|---|---|
| **P0** | Pre-built HR colleague seeded + auto-deployed on HRMS sync | turns setup into "it's already working" | Leena templates |
| **P0** | "Time to first value" instrumentation + golden-path setup screen | makes the moat measurable | our BEAT |
| **P1** | Teams + HRBP derived from HRMS + `get_hr_contact` | fixes "who is my HR"; no manual keying | Workday orgs |
| **P1** | Dynamic staff roles (Phase 1 RBAC) | admin control without code deploys | ServiceNow/Workday |
| **P1** | Dept-scoped knowledge folders | per-team policy w/o N agents | ServiceNow KB criteria |
| **P2** | Lite orchestrator (HR/IT/Finance routing) + IT/Finance templates | multi-domain from one chat | Leena orchestrator |
| **P2** | Proactive nudges | perceived "always-on" value, cheap | Leena proactivity |
| **P3** | Eval/guardrail registry before prod writes | safety before real actions | Workday Agent Passport |
| **Later** | Slack/Teams, voice, more connectors, field-ACLs, compliance | enterprise pull only | all three |

---

## 7. The decision filter (pin this)
For every proposed feature, answer in order:
1. **Does it speed up or slow down time-to-first-value?** (slows → auto-config from HRMS, template it, or cut)
2. **Do Workday/ServiceNow/Leena do it — and is their version an *implementation project*?** (if yes, take the *outcome*, skip the *machinery*)
3. **Can it be a sensible default instead of a setting?** (prefer default)
4. **Does an *employee* ever need to see it?** (if no, hide it behind admin)

> **North star:** the most governed AI Colleague an SMB can stand up in minutes — by taking the *outcomes* Workday/ServiceNow/Leena prove are valuable, while refusing the *setup weight* that makes them slow.
