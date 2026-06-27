# Key Flows — Sequence Diagrams

Sequence diagrams for the platform's core flows. Rendered with Mermaid.

---

## 1. HRMS Sync (Frappe HR → platform)

```mermaid
sequenceDiagram
    actor Admin
    participant UI as /connections
    participant API as /api/hrms/sync
    participant KV as Key Vault
    participant P as FrappeHrmsProvider
    participant F as Frappe HR (REST)
    participant DB as Postgres

    Admin->>UI: Save connection (provider, baseUrl, apiKey, apiSecret)
    UI->>API: POST /api/hrms/connection
    API->>KV: storeConnectionSecrets(apiSecret)
    KV-->>API: kv:hrms-apiSecret-<org>
    API->>DB: HrmsConnection { config: { apiSecret: "kv:..." } }
    Admin->>API: POST /api/hrms/sync
    API->>DB: load HrmsConnection
    API->>KV: resolveConnectionConfig(config)
    KV-->>API: apiSecret (live)
    API->>P: listEmployees()
    P->>F: GET /api/resource/Employee (token auth)
    F-->>P: employees (name, reports_to, department, ...)
    P-->>API: HrmsEmployee[] (mapped, dept suffix stripped)
    API->>DB: upsert Employees + link manager edges + JIT-link users
    API->>API: provisionColleague("hr") + stamp firstValueAt
    API-->>Admin: { created, colleague, firstValueAt }
```

---

## 2. Action with confirmation + Passport gate (apply leave)

```mermaid
sequenceDiagram
    actor Emp as Employee
    participant Chat as /api/assistant/chat
    participant G as Guardrail screen
    participant LLM as Azure OpenAI
    participant PP as Passport gate
    participant Conf as Confirmation
    participant Frappe as Frappe HR

    Emp->>Chat: "apply sick leave 2026-10-05..06"
    Chat->>G: screenInput(message)
    G-->>Chat: allowed
    Chat->>LLM: chat + tools (auto)
    alt model narrates instead of calling tool
        Chat->>LLM: retry toolChoice:"required"
    end
    LLM-->>Chat: tool_call apply_leave(args)
    Chat->>Chat: validateWriteSkill(apply_leave)
    Chat->>PP: ensurePassportForWrite(agent)
    PP-->>Chat: ok (grade ≥ 85)
    Chat->>Conf: createConfirmation(apply_leave)
    Chat-->>Emp: confirmation card
    Emp->>Conf: confirm
    Conf->>Frappe: createLeaveApplication() → HR-LAP-xxxx
    Conf->>Conf: submitForApproval(manager)
    Conf-->>Emp: "Filed as HR-LAP-xxxx, sent to <manager>"
```

---

## 3. Runtime guardrail screen

```mermaid
sequenceDiagram
    actor User
    participant Chat as /api/assistant/chat
    participant G as screenInput()
    participant Audit
    participant LLM

    User->>Chat: message
    Chat->>G: screenInput(message)
    alt injection / extraction detected
        G-->>Chat: { allowed:false, category }
        Chat->>Audit: DENY guardrail.block
        Chat-->>User: safe refusal (no LLM call)
    else benign
        G-->>Chat: { allowed:true }
        Chat->>LLM: proceed
        LLM-->>User: answer
    end
```

---

## 4. Leave write-back round-trip

```mermaid
sequenceDiagram
    actor Emp as Employee
    participant App as applyLeave()
    participant DB as Postgres
    participant F as Frappe HR
    actor Mgr as Manager

    Emp->>App: confirm leave
    App->>DB: load requester + manager
    App->>F: POST Leave Application (Open)
    F-->>App: HR-LAP-xxxx
    App->>DB: ApprovalRequest { externalRef: HR-LAP-xxxx }
    App->>Mgr: notification (approval needed)
    Mgr->>DB: approve → leave.approved
    Note over Emp,F: Employee sees status in /my-requests;<br/>leave visible in Frappe HR
```

---

## 5. Class / data model (core entities)

```mermaid
classDiagram
    Organization "1" --> "many" Employee
    Organization "1" --> "many" User
    Organization "1" --> "1" HrmsConnection
    Organization "1" --> "many" Agent
    Employee "1" --> "0..1" User : login link
    Employee "1" --> "0..1" Employee : manager
    Agent "1" --> "many" AgentPassport
    KnowledgeSource "1" --> "many" KnowledgeFolder
    KnowledgeSource "1" --> "many" KnowledgeChunk
    KnowledgeFolder "1" --> "many" KnowledgeChunk
    Employee "1" --> "many" ApprovalRequest : requester
    Case "1" --> "many" CaseMessage

    class HrmsConnection {
      provider
      config (kv: refs)
    }
    class AgentPassport {
      score
      grade
      checks
    }
    class KnowledgeFolder {
      allowedRoles[]
      allowedDepartments[]
    }
```
