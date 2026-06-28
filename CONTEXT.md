# Project Context — Agentic HR (AI Colleagues)

> **Read this first.** This file is the full context for anyone — a teammate or an AI assistant —
> working on this project. It explains what we're building, why, the current state, the roadmap,
> the market, the competitors, and the product principles that must never be broken.

---

## 1. What this is

An **agentic HR assistant** — but the idea is bigger than a chatbot. Instead of one HR bot, we give a
company a team of **AI colleagues**: an **HR colleague**, an **IT colleague**, and a **Finance
colleague**. An employee opens **one chat** and asks anything; the system works out which colleague
should answer, checks what that person is allowed to see, and replies — combining answers when a
question spans more than one area.

Crucially, it doesn't just answer — **it acts**: apply/cancel leave, submit an expense, raise a case,
escalate to a human. Every action goes through a **confirmation step**, an **access check**, and an
**audit trail**. That "it does things, safely" is what separates an agent from a chatbot.

## 2. Status — this is an MVP, NOT a prototype

Treat everything here as **production-grade MVP work**, not throwaway demo code.
- Real retrieval (RAG) over real documents, with citations.
- Real role-based access control enforced **in code, before the model sees any data**.
- Real write-backs to a live HR system (not faked in our own DB).
- A confirmation + audit lifecycle on every write; an "Agent Passport" safety check before a colleague
  can act.
- Deployed and running (Next.js 16, Postgres + pgvector, Azure OpenAI, Azure Container Apps).

The MVP is built to **grow into production**, not to be rebuilt. When you add anything, hold it to that
bar (no mock shortcuts unless explicitly scoped as such).

## 3. The HR system — Frappe HR now, more later

- **Now:** the single source of truth is **Frappe HR** (open-source HRMS). Every **read** pulls from
  Frappe; every **action writes back** to Frappe (confirm-gated + audited). That round-trip is the
  point — it's what makes this agentic rather than a Q&A bot.
- **Why Frappe:** open-source, self-hostable, and its data model maps almost 1:1 to commercial HRIS
  like **Zoho People** (Employee / reports_to / Department / Designation / Leave) with a uniform REST
  API — so swapping to a production HRIS is mostly field/endpoint remapping, not a rewrite.
- **Future HRIS support:** the provider interface is built so we can connect **any HRMS** — Zoho
  People, BambooHR, Workday, SAP SuccessFactors, etc. The goal is: a company enters its HR system's
  keys, syncs, and goes live.

## 4. Where it's going (roadmap, MVP → production)

- **Real connectors** to production HRIS (beyond the Frappe MVP instance) and **real SSO** (Okta /
  Azure AD) instead of mock auth.
- **Real payroll & payslips** (currently demonstrated on seeded/mock payroll via Frappe).
- **More colleagues & skills** — the same architecture extends to new domains; an action-skill library
  (e.g. "draft an email", "provision a license") that grows over time.
- **Multi-channel** — Teams / Slack / WhatsApp in addition to web chat.
- **More modules** — performance reviews, training, onboarding.
- **Proactive intelligence** — nudges (birthdays, anniversaries, holidays, pending requests).

## 5. Who we look at (inspiration & competitors)

We studied the leading enterprise HR/IT agents and deliberately chose what to copy and what to improve:
- **Leena AI** — the "AI colleagues" model and a skills/actions framework (an agent that *does*).
- **Moveworks** — deterministic policy checks **in code, not prompts**, and a native action
  orchestrator (retries, auth, rate-limiting) so writes are safe.
- **ServiceNow Now Assist** — guardrails as a native safety layer; knowledge access enforced at
  retrieval time.
- **Workday Illuminate / Glean / Microsoft Copilot** — two-plane permissions (staff roles vs end-user
  access). We use **just-in-time access at query time** — never a stale, mirrored permission index.

**What we do differently:** those platforms are excellent but built for large enterprises with long,
expensive rollouts. We take the patterns that matter and shape them for speed and self-serve.

## 6. Market frame — built for SMBs

The target is **small and mid-sized businesses (roughly 50–800 employees)** that can't afford the
9–24 month rollouts and heavy price tags of the enterprise platforms. Our wedge:
- **Minutes to value** — connect the HR system, sync, and a governed colleague is live; no services
  project.
- **Governed by default** — RBAC, confirmation, audit, guardrails out of the box.
- **No-code write-backs** — leave, expense, and more, behind confirmation.
- It should also work for **any company**, of any size, that wants a simple, governed HR agent.

## 7. Product principle — non-technical by design (do not break this)

The whole product must be usable by **non-technical people** — an HR manager or a business owner, not
an engineer.
- **Setup is self-serve and plain-language:** connect your HR system with keys, sync, and go — no code,
  no integration project. Configure a colleague (name, instructions, knowledge, actions, handover,
  guardrails) and **test it live** in a preview chat.
- **For employees it's one simple chat.** They never need to know which system or department handles
  what — they just ask.
- **Everything is explained in plain words.** Avoid jargon in the UI and in answers. When building any
  feature, ask: "could a non-technical SMB user understand and use this without help?" If not, simplify.

This applies to SMBs **and any other company** that uses the software. Keep it simple, always.

## 8. Architecture (summary — see `diagrams/` and `design/`)

```
Employee (one chat) / Admin (builder console)
        │
        ▼
ORCHESTRATOR:  Guardrail → Classify & Plan → Access check → Fan-out → Merge → Audit
        │
   ┌────┴───────────────┐
   ▼        ▼           ▼
HR colleague · IT colleague · Finance colleague
   (each = Skills/Tools · Knowledge via RAG · Confirmation)
        │
        ▼
Data:  Frappe HR · Vector knowledge (pgvector) · LLM · Secrets vault
        │
Wrapped by governance:  RBAC · Agent Passport · Audit · Guardrails
```

- **Orchestrator** — routes a request, decomposes multi-domain asks into sub-tasks, runs each as the
  user (RBAC enforced per sub-task), merges into one answer.
- **Colleagues** — one architecture, configured per domain; adding a colleague is configuration, not a
  rebuild.
- **Governance** — access checked before inference; writes run as a workflow (not the model) behind a
  confirmation; everything audited; a 15-point Agent Passport gates a colleague before it can act.
- **Stack** — Next.js 16, Prisma + Postgres + pgvector, Azure OpenAI, Azure Container Apps, Frappe HR
  connector.

## 9. Repo guide

- `diagrams/` — rendered system architecture, sequence flows, RBAC access charts, UML/data model, UX
  concept. (`.html` files render the diagrams.)
- `design/` — orchestrator design, scale & roles design, HRMS integration plan.
- `planning/` — user stories & test scenarios.

## 10. Working principles (for any contributor or AI assistant)

1. **MVP / production-grade** — no throwaway shortcuts unless explicitly scoped.
2. **Frappe HR is the source of truth** — read from it; write back to it; never fake data.
3. **Every action: confirm → execute (workflow) → audit.** Never let the model perform a raw write.
4. **RBAC before inference** — enforce access in code before any record reaches the model.
5. **Non-technical by design** — if a non-technical SMB user couldn't use it, simplify it.
6. **Provider-agnostic** — keep HRMS access behind the provider interface so new systems plug in.
