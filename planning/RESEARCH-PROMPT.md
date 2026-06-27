# Deep-Research Prompt — Benchmark before we build

> Paste the prompt below into **Google / Gemini Deep Research** (or Perplexity/ChatGPT Deep Research).
> Goal: get *grounded context* on how Workday, ServiceNow, and Leena.ai actually work — feature by
> feature — so our SCRUM process (`PLANNING.md`) makes informed decisions, not blind ones.
> Output of the research feeds Step-1 (Problem/である) → Step-2 (Use cases) → backlog refinement.

---

## The prompt (copy from here)

```
You are a principal product architect doing competitive due-diligence for an early-stage
"AI Colleagues" platform aimed at SMBs (50–800 employees) in HR/IT/Finance. Our differentiator
is TIME-TO-VALUE: a governed AI assistant an admin can stand up in minutes by syncing their HRMS,
with zero implementation project or consultants.

Research, in depth and with citations, HOW THE FOLLOWING SYSTEMS ACTUALLY WORK (mechanism, not
marketing) and WHAT THEY DO, feature by feature:
  PRIMARY:  Workday, ServiceNow (incl. HRSD + Virtual Agent), Leena.ai
  SECONDARY (for contrast): Moveworks, Glean, Microsoft Copilot Studio

For EACH system, cover these dimensions. For each, explain the underlying model/mechanism, the
admin effort to set it up, and how long it takes to get first value:

  1.  Onboarding / setup / time-to-value — implementation effort, who configures it (admin vs
      consultant/SI), and realistic time from purchase to first working use.
  2.  Identity & RBAC — staff/config roles vs end-user data access. Are end-user permissions
      hand-built or inherited from the IdP/HRIS? Granularity (role / record / field). How are
      custom roles created and assigned?
  3.  Org & team modeling — supervisory orgs, departments, teams, manager edges, HR business
      partner per team. Modeled in-product or read from the HRIS?
  4.  The AI assistant / agents — single bot vs multiple per-function "colleagues"; is there an
      orchestrator/router; how is routing + multi-agent (A2A) done; grounding/guardrails.
  5.  Knowledge management — ingestion, RAG, freshness, and ACCESS CONTROL on knowledge
      (who can see which article/folder; role/dept/audience criteria).
  6.  Skills / actions / workflows — how automations are built (visual graph designer vs
      templates vs LLM), and how write-actions are gated (confirmation/approval).
  7.  Approvals & business process — how multi-step approvals and process-level security work.
  8.  Memory / context — short-term vs long-term memory; "context graph"-style precedent capture.
  9.  Channels — web, Slack/Teams, email, voice; effort to add each.
  10. Integrations — connector strategy (native vs catalog of 100s vs MCP/API); maintenance cost.
  11. Governance & agent safety — audit trails, decision traces, and AI-agent red-teaming /
      monitoring / revocation (e.g., Workday "Agent Passport").
  12. Analytics — which metrics they expose (deflection, resolution, SLA, etc.).
  13. Pricing & target segment — and what makes them too heavy/expensive for SMBs.

DELIVERABLES:
  A. A capability-by-capability COMPARISON MATRIX (rows = the 13 dimensions, columns = the
     systems) with a one-line "how it works" per cell.
  B. For each dimension, a short "MECHANISM" writeup distinguishing real architecture from
     marketing claims, with sources.
  C. A "TIME-TO-VALUE TEARDOWN": for each system, the concrete steps + estimated time from
     signup to first real value, and the biggest setup bottlenecks.
  D. A "WHAT A LEAN SMB-FIRST COMPETITOR SHOULD TAKE / SKIP / BEAT" section: which outcomes are
     worth copying, which machinery to avoid because it destroys time-to-value, and where a
     fast, governed-by-default product can genuinely win.
  E. Open questions / unknowns where public info is thin.

CONSTRAINTS:
  - Prefer official docs, engineering blogs, analyst notes (Gartner/Forrester), and credible
    practitioner write-ups over vendor landing pages. Cite every non-obvious claim.
  - Clearly separate "what the vendor claims" from "how it actually works / what practitioners say."
  - Favor recent sources (last ~18 months); note version/date where relevant.
  - Call out where a capability requires a dedicated admin/specialist or a multi-week project.
```

---

## If Deep Research asks clarifying questions, pre-answer with:
- **Segment:** SMB 50–800 employees; HR first, then IT/Finance.
- **Our edge:** time-to-value (minutes), governed-by-default, HRMS-auto-provisioned, no consultants.
- **Decision we're informing:** what to build vs skip in our next 2–3 sprints (RBAC model, org/teams, pre-built colleagues, knowledge access, orchestrator).
- **Depth:** mechanism-level (how it works), not feature checklists.

## After the research comes back (our SCRUM gate)
1. Drop the findings into `docs/planning/` and reconcile with `BENCHMARK.md` + `STRATEGY.md`.
2. Run the **standard step-gated process** in `PLANNING.md`: refine problem → use cases → user stories → backlog, with a sign-off GATE at each step.
3. Only then pull the top TTV-weighted items into a sprint and build.
