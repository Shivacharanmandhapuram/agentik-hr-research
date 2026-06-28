# AI Orchestrator — Architecture (Shipped)

> The orchestrator brain that turns one employee chat into a multi-colleague experience.
> It understands the request, routes to the right colleague(s), shows its thinking, and answers
> the right thing to the right person with the right access. **All stages shipped and live.**

---

## Architecture overview

```
Employee message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR                                                │
│                                                              │
│  1. screenInput()        → guardrail (block / pass)         │
│  2. planRequest()        → LLM classifier → domain(s)      │
│     └─ pickModel()       → gpt-4o-planner (decomposition)  │
│     └─ sub-tasks[1..3]   → per-domain, per-colleague       │
│  3. fan-out              → dispatch each sub-task (RBAC)    │
│     ├─ HR Colleague      → leave / profile / knowledge     │
│     ├─ IT Colleague      → password / access               │
│     └─ Finance Colleague → expense / reimbursement         │
│  4. merge                → combine answers into one reply   │
│  5. persist              → conversationId + audit           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Employee sees: thinking trace + merged answer
```

---

## O1. LLM domain classifier

**File:** `src/lib/orchestrator/classify.ts`

`classifyDomain(message)` makes one LLM call returning `{domain, confidence}`.
Domains: `hr | it | finance | general`. Replaces the old regex/keyword heuristic.

**Why LLM over heuristic:** "Can you reset my VPN and also check my leave balance?" routes to **both** IT and HR. Keywords fail here; the LLM decomposes intent.

**Tested:** 31/31 live regression includes cross-domain routing.

---

## O2. Thinking trace

**Files:** `src/app/api/assistant/plan/route.ts`, `src/app/(employee)/assistant/page.tsx`

`POST /api/assistant/plan` runs the real guardrail + classifier and returns a structured plan. The UI renders it as a real-time thinking panel:

```
🔍 Understanding your request...
🧠 Routing to: HR Colleague, IT Colleague
📋 Breaking into 2 tasks...
⚡ Combining answers...
```

This is the ChatGPT/Claude "reasoning" pattern adapted for enterprise multi-agent routing.

---

## O3. Multi-colleague fan-out + merge

**File:** `src/lib/orchestrator/plan.ts`

`planRequest(message, colleagues, hints?)` → LLM decomposes into 1–3 sub-tasks:
```json
{
  "tasks": [
    {"domain": "hr", "question": "What is the user's leave balance?"},
    {"domain": "it", "question": "Reset the user's VPN password"}
  ]
}
```

Each sub-task is dispatched to the matched colleague. **RBAC is enforced per sub-task** (a colleague can only use skills its domain allows). Answers are collected and merged into one coherent reply.

**Cap:** max 3 sub-tasks per request (complexity guard).

---

## O4. Model routing

**File:** `src/lib/openai.ts` → `pickModel(task)`

| Task type | Model deployment | Rationale |
|-----------|-----------------|-----------|
| Planning / decomposition | `gpt-4o-planner` | Stronger reasoning for multi-step |
| Standard answers | `gpt-4o` | Fast, cost-effective |
| Embeddings | `text-embedding-ada-002` | RAG |

Extensible: can add cost-tier routing (cheap model for FAQ, expensive for complex).

---

## O5. Finance depth + per-domain routing hints

**Skills added:**
- `submit_expense` — validates amount/category/description → confirmation → `EXP-xxxxx` + audit
- `get_reimbursement_status` — looks up employee's submitted expenses

**Per-domain routing hints:** each colleague's `purpose` field is passed to `planRequest()` so the orchestrator knows what each colleague can actually do. This makes routing **company-configurable** — an admin changes the colleague's purpose, and the orchestrator adapts without code changes.

---

## Data flow (end-to-end)

1. **Employee sends message** → `POST /api/assistant/chat`
2. **Guardrail screen** → block injections, log DENY if hit
3. **Plan** → `planRequest()` decomposes, picks model
4. **Fan-out** → each sub-task dispatched to its colleague (HR/IT/Finance)
5. **Per-colleague processing** → skill resolution (read/write) + knowledge RAG + confirmation cards
6. **Merge** → sub-answers combined into one reply
7. **Persist** → message pair stored in conversation + audit log
8. **Return** → reply + thinking trace + conversationId

---

## Configuration (no code changes needed)

| What | How to change | Effect on orchestrator |
|------|---------------|----------------------|
| Add a colleague | Admin UI → Add from template | planRequest discovers it via catalogue |
| Change colleague's scope | Edit purpose field | Routing hints update automatically |
| Attach knowledge | Knowledge Source → attach | Colleague's RAG scope changes |
| Add skills | Code (registry) | New actions available to that domain |
| Support team | Assign users to colleague | Handoff target for that domain |

---

## Known limitations (honest)

- **Max 3 sub-tasks** — complex requests spanning 4+ domains get capped
- **No A2A protocol** — internal dispatch, not standards-based agent-to-agent
- **No visual workflow editor** — skills are code
- **Single LLM provider** — Azure OpenAI only
- **No scheduled/proactive triggers** — reactive only

---

## Future (v2 roadmap)

- A2A protocol for external agent interop
- Visual workflow/skill builder (no-code)
- Proactive agent triggers (scheduled, event-driven)
- Multi-model support (add Anthropic, local models)
- Streaming thinking trace (SSE)
- Cost tracking per sub-task
