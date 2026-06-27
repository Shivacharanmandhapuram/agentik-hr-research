# Research Synthesis — Google Deep Research × Independent Findings

> Diff of the **Google/Gemini Deep Research** report against `RESEARCH-FINDINGS.md` (my parallel web
> research). Where both agree → **DECIDED** (high confidence). Where Google adds depth → **ADOPT**.
> Where they differ or a claim is shaky → **VERIFY**. This feeds SCRUM Step-1 in `PLANNING.md`.

---

## 1. Where the two agree → DECIDED (lock these in)

| Decision | Both sources say | Status |
|---|---|---|
| **Two-plane permissions** — staff RBAC (admin-managed) vs end-user access (inherited) | Workday native, Moveworks IdP@API, Glean ACL-mirror, Copilot Entra; all *inherit* end-user access | ✅ DECIDED |
| **Deterministic rules in code, not prompts** | Moveworks Policy Validators / Slot Resolvers run in code | ✅ DECIDED (we already do via `can()` + confirm-gate) |
| **Builder primitives = Knowledge + Tools/Skills + Instructions (+Topics)** | Copilot's 4 primitives; Leena AOP/Skills | ✅ DECIDED |
| **Guardrails as a native safety layer** | ServiceNow Now Assist Guardian (SLM); Workday governance | ✅ DECIDED |
| **Knowledge access enforced at retrieval** | ServiceNow User Criteria; Glean permission-aware index | ✅ DECIDED |
| **TTV is universally bad → minutes-for-SMB wedge is open** | Workday 9–18mo, ServiceNow 10–24mo, Leena 2–6mo, Glean 4–8wk, Copilot 2–6wk | ✅ DECIDED — our BEAT (<15 min) is unoccupied |
| **No-code write actions beat passive search** | Glean is read-mostly/declarative writes | ✅ DECIDED — our wedge |

## 2. Sharper insights the Deep Research adds → ADOPT

1. **JIT identity, NOT a mirrored permission index.** Google's key architectural call: Glean's continuous ACL "permission crawls" cause **stale access** (a terminated employee can still query a cached doc). For SMB, do **just-in-time API calls to the source HRMS using the user's active token at query runtime**. → *This refines our "Glean permission-aware retrieval" TAKE: copy the **outcome** (permission-aware), reject the **mechanism** (crawl/mirror). We already do this conceptually (`canAsUser` at request time). **Rule: never build a permission-mirror index.***
2. **Consumption / per-automation pricing, NOT PEPM/seat.** Seat pricing **penalizes deflection** — if you deflect 80% you still pay for 80% passive users, destroying ROI. → Price on **successful automations / agent execution**, not seats. *(New business-model decision; wasn't in our strategy.)*
3. **Native execution orchestrator (Moveworks Action Orchestrator).** Don't make SMBs buy Zapier/Workato — build JSON parsing, **rate-limiting, retry/back-off, multithreading, auth** *natively* in the action layer. → *We build the action spine ourselves (we already have the skeleton).* 
4. **Slot Resolvers for write-actions.** Disambiguate NL → definitive record (e.g., 12 "Jamie"s → one UUID) **before** firing the HTTP write. → *Adopt for every write skill; prevents catastrophic mis-writes.*
5. **Generative orchestration over decision trees.** Route by **semantic match against tool/agent descriptions**, not keyword triggers. → *We already tool-call; formalize the router this way when we add HR/IT/Finance colleagues.*

## 3. Differences / claims to VERIFY (don't treat as fact yet)

| Claim (Google) | My note | Action |
|---|---|---|
| Workday AI = **800B-param** LLM trained *exclusively* on HR/finance | Very large, likely inflated/marketing | treat as directional only |
| Leena WorkLM = **7B on Qwen** | Plausible, more specific than mine | fine to cite as "reported" |
| ServiceNow impl **10–24 months** | More pessimistic than my "weeks–months"; both agree it's a project | use the wider range |
| Exact pricing ($100–500/emp Workday; $150k Moveworks min; Glean $60k min; Copilot ~$30/user/mo) | Directionally credible, not independently verified | label "approx, verify before any comparison slide" |

## 4. New operational risks the Deep Research flagged (own these for a JIT-API design)

Because we chose **JIT API reads** over a mirrored index, these become *our* problems to design for:
- **Rate-limit elasticity** — BambooHR/Rippling/Gusto enforce aggressive limits; our orchestrator needs **queuing + exponential back-off** or chats stall at peak.
- **Token cost of generative orchestration** — background "which tool?" reasoning burns tokens before any action; matters for a low-cost SMB tier.
- **Schema drift** — if an admin renames an HRMS field, slot resolvers/payloads can **fail silently**; we need **connector health monitoring + proactive drift alerts**.
- **Data residency / Works Council (GDPR)** — JIT reads help (no local copy), but EU deployments still need care.

## 5. Consolidated TAKE / SKIP / BEAT (final, post-synthesis)

**TAKE:** Slot resolvers (write disambiguation) · generative/semantic tool routing · guardrail SLM screen (injection/toxicity) · permission-aware retrieval **via JIT identity** · reusable access criteria (ServiceNow idea, lightweight) · Topics (deterministic scripted answers for sensitive HR paths).

**SKIP:** continuous permission-crawl index (Glean) · iPaaS/middleware dependency · complex User-Criteria matrices · connector *catalogs* of 100s/1000s · visual workflow designers · multi-LLM routing · heavy compliance/multi-region until enterprise pull.

**BEAT:** **<15-min TTV** (OAuth into HRMS → governed agent live, zero services) · **consumption/automation pricing** (not PEPM) · **no-code secure write-back template library** (PTO, license provisioning, direct-deposit) · **governed-by-default** (audit, confirm-gate, JIT permissions).

## 6. How this maps to what we already have
- ✅ Already aligned: `canAsUser` (JIT-ish identity), confirm-gated skills + `can()` in code, audit-on-write, published-snapshot, filter-then-prompt, role-scoped knowledge.
- 🔜 To build (TTV-weighted): seed + auto-deploy HR colleague on sync (P0) · TTV instrumentation (P0) · teams+HRBP from HRMS (P1) · dynamic staff roles (P1) · slot resolvers + write-back template library (P1–P2) · lite generative router + IT/Finance colleagues (P2) · guardrail SLM + eval registry (P2–P3) · connector health/drift monitoring (with first real integration).

---

## 7. → SCRUM Step-1 (problem framing) — ready to run
The research gate is satisfied (two independent sources, reconciled). Next per `PLANNING.md`:
1. **Refine the problem statement** around the validated wedge: *governed AI HR colleague, live in <15 min for SMBs, JIT-identity, consumption-priced, no-code write-backs.*
2. Re-derive **use cases** emphasizing the write-back library + TTV golden path.
3. Refresh the **backlog** with the TTV-weighted order above.
4. Sign-off GATE → then sprint.
