# Scale, Roles & Access Control — Architecture (Shipped)

> How the platform scales to 100+ employees across many teams with fine-grained access:
> RBAC, tiered knowledge, two-axis escalation, colleague-scoped support, and auto-detected
> manager roles. All implemented and live.

---

## 1. Identity model (two planes)

### HRMS plane (automatic — no assignment needed)
| Role | Detection | Access |
|------|-----------|--------|
| **Employee** | Has an `Employee` record linked to their login | Assistant, My Requests, chat history |
| **Manager** | `employee.reports.length > 0` (has direct reports) | Employee access + Approvals for their reports |
| **Executive** | Title contains CEO/CTO/CFO/VP/Director | Employee access + executive-tier knowledge |

### Staff plane (assigned by admin)
| Role | Capabilities |
|------|-------------|
| **Owner** | All 9 capabilities (auto-granted on signup) |
| **Admin** | All capabilities except org deletion |
| **Domain Admin** | agentManage, knowledgeManage, directoryView |
| **Support Agent** | inboxView, inboxReply (scoped to assigned colleague) |
| **Analyst** | analyticsView, auditView, directoryView |

---

## 2. Permission catalogue (16 capabilities)

```
inboxView · inboxReply · analyticsView · rolesManage
auditView · agentManage · knowledgeManage · directoryView · hrmsManage
```

**Resolution:** `can(user, capability, scopeId?)` checks `RoleBinding` table:
- Workspace scope: `scopeType = 'workspace'` → applies globally
- Colleague scope: `scopeType = 'colleague', scopeId = agentId` → applies only for that colleague

**`canForAnyScope(user, cap)`** — grants if the capability is held at workspace OR via any colleague-scoped binding. Used for list/detail endpoints that then filter results to the user's actual scope.

---

## 3. Colleague-scoped support (assignment groups)

Each AI Colleague can have a **support team** (like ServiceNow's assignment groups):

```
Admin assigns Hana → HR Colleague support team
  → RoleBinding: {userId: hana, role: support_agent, scopeType: colleague, scopeId: hrColleagueId}
  → Hana gets: inboxView(scoped) + inboxReply(scoped)
  → Dashboard shows: only HR Cases + HR Live Inbox
  → Cannot see: admin tools, other colleagues' queues
```

**API:** `POST /api/agents/[id]/team` (add) · `DELETE` (remove) · `GET` (list members + candidates)

---

## 4. Tiered knowledge access (Stage 1)

### Model
`KnowledgeFolder` carries:
- `allowedRoles: string[]` — which RBAC roles
- `allowedDepartments: string[]` — which departments
- `requireAll: boolean` — AND (must match both) vs OR (match either)

### Tier resolution
`accessTiersFor(employee)` computes:
- **employee** — always
- **manager** — if `isManager`
- **executive** — if title matches executive patterns
- **staff** — if has any staff role binding

### Enforcement
`searchKnowledge` SQL applies folder filters **before** vector search — chunks in a restricted folder are invisible to unauthorized users. The LLM never sees them.

### Verified
| Test | Result |
|------|--------|
| Engineering employee retrieves Engineering-scoped content | ✅ |
| Sales employee cannot retrieve Engineering-scoped content | ✅ |
| Manager-tier content invisible to non-managers | ✅ |
| Unrestricted folder visible to all | ✅ |

---

## 5. Two-axis escalation (Stage 2)

### Axis 1: Approval workflow → manager chain
```
Employee applies leave
  → getApprovalApprover(employee)
  → Direct manager (from reports_to)
  → Fallback: resolveDeptHead(employee.department)
  → ApprovalRequest created (pending → approved/rejected)
  → Manager sees it in Approvals page
```

### Axis 2: Support fulfillment → assignment group
```
Colleague can't resolve OR employee asks for human
  → create_case() OR live_handoff()
  → Case/conversation tagged with colleague domain
  → Appears in that colleague's support team queue
  → Support agent assigns, replies, resolves
```

**Cross-persona loop:**
Employee asks → Colleague answers (or escalates) → Manager approves (if needed) → Support agent resolves (if escalated)

---

## 6. Dashboard access gating

`hasDashboardAccess` in `(dashboard)/layout.tsx`:
```
analyticsView || directoryView || inboxView || rolesManage || auditView || agentManage || knowledgeManage || hrmsManage
```

If none are true → redirect to `/assistant` (employee-only view).

Support agents reach the dashboard via `inboxView: true` (from their colleague-scoped binding). They see **only** the nav items their capabilities allow (Cases, Live Inbox).

---

## 7. Scaling verified

| Dimension | Tested |
|-----------|--------|
| 100+ employees (seed-scale) | ✅ 113 employees / 9 departments |
| Multi-level hierarchy (CEO→Director→Manager→IC) | ✅ 4 levels |
| Concurrent multi-role access | ✅ 8 personas simultaneously |
| Cross-org isolation | ✅ 14/14 IDOR attacks blocked |
| Colleague-scoped support | ✅ Sneha/Hana see only HR queue |

---

## 8. How it compares

| Capability | Leena AI | ServiceNow | Ours |
|-----------|----------|------------|------|
| Identity from HRMS | ✅ IdP inheritance | ✅ LDAP/SCIM | ✅ Frappe sync → auto roles |
| Manager auto-detection | ✅ | ✅ | ✅ (reports_to chain) |
| Role-based knowledge | ✅ | ✅ | ✅ Tiered folders |
| Dept-scoped knowledge | ✅ | ✅ | ✅ allowedDepartments |
| Assignment groups (scoped support) | ✅ | ✅ | ✅ Colleague-scoped bindings |
| Approval routing | ✅ | ✅ | ✅ Manager chain + dept head |
| Audit trail | ✅ | ✅ | ✅ Every action logged |
| 200+ integrations | ✅ | ✅ | ❌ 1 live (Frappe) |
| Visual role editor | ✅ | ✅ | ⚠️ Basic UI |
| SCIM/SAML provisioning | ✅ | ✅ | ❌ Manual sync |

---

## 9. Known gaps → v2

- **SCIM/SAML** provisioning (auto user lifecycle)
- **Conditional access policies** (IP/device/time-based)
- **Role delegation** (out-of-office → proxy approver)
- **Attribute-based access** (ABAC beyond role+dept)
- **Org-unit hierarchy** (beyond flat departments)
