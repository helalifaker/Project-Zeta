# 360° Implementation Plan Review Report

## Financial Statements – Architecture Impact Analysis

- **Date:** November 18, 2025
- **Reviewer:** Cursor AI
- **Status:** ⚠️ Approved with conditions
- **Document Reviewed:** `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md`

---

## Executive Summary

The implementation plan is thorough but carries four critical risks. Chief among them is the `taxRate → zakatRate` migration, which will break either the deployed code or the database unless a staged compatibility plan is defined. The proposed Prisma schema deviates from existing conventions (snake_case models plus preview-only `@@check` constraints) without documenting how the client will remain consistent. The new circular solver lacks a concrete algorithm/UX spec, so fallback “zero-interest” results might silently reach the UI. Finally, performance targets conflict (<50 ms vs <100 ms), so stakeholders and engineers are not aligned.

Overall findings: **4 critical**, **10 major**, **12 minor** issues. Do not start implementation until the four critical items below are resolved.

---

## Dimension-by-Dimension Assessment

### 1. Database Schema & Prisma Models – ⚠️ Issues Found

- Models are defined in `snake_case` (e.g., `model other_revenue_items`) without `@@map`, conflicting with the project’s PascalCase practice.
- `@@check` constraints require Prisma preview features; no enablement plan is described.
- Admin-settings migration rewrites keys in place, creating an unavoidable downtime window if deployments are staggered.
- Missing mention of indexes for new admin keys and composite lookups beyond basic FK indexes.

### 2. API Architecture & Endpoints – ⚠️ Issues Found

- Path structure is consistent, but request validation requires all 30 years per update (`items.length(30)`), blocking partial edits or optimistic UI saves.
- Result envelopes, status codes, and error codes are not specified; neither is audit metadata for responses.
- Authorization only distinguishes owner vs ADMIN; collaborator/viewer flows are ignored.

### 3. Calculation Engine Architecture – 🔴 Critical

- Circular solver is unspecified: no initial guess, convergence proof, or plan for surfacing fallback usage to the UI.
- Balance sheet treats CapEx as instant fixed assets but never mentions depreciation policy.
- Performance expectations conflict (<50 ms vs <100 ms).
- Working-capital + interest loops lack division-by-zero safeguards when revenue is zero.

### 4. Service Layer & Business Logic – ⚠️ Issues Found

- Bulk operations (30 upserts) are described without transaction guidance.
- Audit logging is “mandatory” but not defined (actions, metadata) for each mutation.
- Result<T> examples exist for other domains but not for these new services.

### 5. UI Components & UX – ⚠️ Issues Found

- Virtualization for only 30 rows adds complexity without benefit; accessibility, keyboard support, and fallback UIs are not specified.
- Excel/PDF exports lack security/data-source requirements.
- No plan for indicating convergence/fallback warnings to the user.

### 6. Testing Strategy & Coverage – ⚠️ Issues Found

- 50+ stress tests are promised without prioritization or resourcing.
- Test data/fixtures for admin settings and solver inputs are unspecified.
- No coverage metrics for the new API/UI layers beyond “>80%”.

### 7. Migration & Deployment – 🔴 Critical

- Migration 3 renames `taxRate` to `zakatRate` in place, guaranteeing either the running code or DB will fail depending on deploy order.
- Rollback plan only renames the key back, ignoring code already expecting the new name.
- No sequencing guidance (code-first vs DB-first) or verification checklist.

### 8. Performance & Scalability – ⚠️ Concerns

- Conflicting SLAs (<50 ms vs <100 ms).
- No profiling plan for the iterative solver/web worker path.
- Database query impact is estimated but lacks monitoring strategy.

### 9. Security & Authorization – ⚠️ Concerns

- Role matrix (ADMIN/PLANNER/VIEWER) is not restated; only owner vs ADMIN is mentioned.
- Viewing highly sensitive statements is not audited.
- No mention of rate limiting or CSRF considerations for new endpoints.

### 10. Documentation & Maintainability – ⚠️ Gaps Found

- Updates to `API.md`, `SCHEMA.md`, `README.md`, etc., have no owners or acceptance criteria.
- Debug logger/fallback modules lack developer onboarding docs.
- Proof-of-concept success criteria aren’t linked to documentation deliverables.

---

## Critical Issues (Must Fix Before Implementation)

1. **Unsafe `taxRate → zakatRate` Migration**
   - _Impact:_ Either production code or DB will crash, depending on deploy order.
   - _Resolution:_ Ship a compatibility release that reads both keys, run migration afterward, then clean up.
   - _Effort:_ 1–2 days.

2. **Prisma Model Naming & Preview Checks**
   - _Impact:_ Prisma client generation will fail / diverge from DB.
   - _Resolution:_ Use PascalCase models with `@@map`, and either enable the preview feature or replace `@@check` with app-level validation.
   - _Effort:_ <1 day.

3. **Undefined Circular Solver Behavior**
   - _Impact:_ Calculations may diverge or silently fall back to inaccurate zero-interest results.
   - _Resolution:_ Document solver algorithm, initialization, convergence tolerance, fallback UX, and logging before coding.
   - _Effort:_ ~1 day of design/POC work.

4. **Conflicting Performance Targets**
   - _Impact:_ Stakeholders expect <50 ms while the plan allows <100 ms; success criteria are unclear.
   - _Resolution:_ Align on a single SLA and update the plan + non-functional requirements accordingly.
   - _Effort:_ ~0.5 day for alignment/document updates.

---

## Major Issues (Should Fix Pre-Implementation)

1. Rigid Other-Revenue API (requires all 30 rows per save).
2. Missing transaction guidance for multi-upsert services.
3. Balance sheet ignores depreciation roadmap.
4. Export features lack security/data-source requirements.
5. Testing scope is unbounded; need prioritization.
6. Documentation updates unassigned.
7. Role-based access missing for collaborators.
8. Fallback calculation warnings not surfaced in UI.
9. Performance profiling not scheduled.
10. Migration ordering unspecified (Phase 0 vs Phase 1).

---

## Minor Issues (Can Address During Build)

- Virtualization overhead for small tables.
- Export formatting/i18n guidance needed.
- Stress-test categories lack acceptance targets.
- Audit log payloads missing before/after values.
- Verify `Decimal(15,2)` precision for 30-year totals.
- Define default creation of “zero” other-revenue rows.
- Balance-sheet settings endpoint lacks concurrency strategy.
- React Query caching assumptions unstated.
- Debug logger storage/retention unspecified.
- Web-worker bundling plan absent.
- README screenshots/process undefined.
- POC success metrics need instrumentation plan.

---

## Recommendations

1. **Stage the Zakat Migration** (Database/Deployment) – Add compatibility code, then migrate, then clean up.
2. **Publish Solver Design Doc** (Calculation) – Capture algorithm, convergence guarantees, fallback UX.
3. **Normalize Prisma Schema** (Database) – PascalCase + `@@map`, preview feature plan.
4. **Define API Contracts/Partial Updates** (API) – Document envelopes, allow per-year updates, enumerate errors.
5. **Align Performance SLA & Instrumentation** (Performance) – Agree on <X ms target, schedule profiling checkpoints before Phase 2.

---

## Implementation Readiness Checklist

- [ ] Database schema validated (naming conventions, preview features).
- [ ] API request/response contracts finalized (partial updates supported).
- [ ] Solver design & fallback UX approved.
- [ ] Service-layer transaction + audit patterns specified.
- [ ] Testing scope prioritized and resourced.
- [ ] Migration/deployment plan staged and rollback-safe.
- [ ] Performance SLA aligned and instrumentation scheduled.
- [ ] Security/role matrix updated (owner, planner, viewer).
- [ ] Documentation deliverables assigned.
- [ ] Zakat migration compatibility release planned.

**Readiness:** 6/10 dimensions green (≈60%).

---

## Next Steps

1. Draft compatibility design for zakat migration (owner: backend lead).
2. Produce circular-solver design/POC spec (owner: calculations architect).
3. Update Prisma schema proposal with PascalCase + preview plan (owner: database engineer).

**Estimated time to unblock implementation:** ~3–4 days.

---

## Appendix

- **Files Reviewed:** `FINANCIAL_STATEMENTS_IMPLEMENTATION_PLAN.md`
- **Assumptions:** `.cursorrules` standards remain authoritative; production DB currently stores `taxRate`; collaborator roles exist beyond owner/ADMIN.
- **Questions for Architecture Team:**
  1. Can the zakat migration be staged, or is simultaneous deploy unavoidable?
  2. What depreciation approach (if any) is planned for v1?
  3. Are planners/collaborators allowed to edit Other Revenue, or strictly owners/ADMIN?
