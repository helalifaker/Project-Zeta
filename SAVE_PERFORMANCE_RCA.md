# Save Performance RCA & Best Practices

## Context

- Save actions in `VersionDetail` hit `PATCH /api/versions/[id]`, which chains multiple Prisma calls per request.
- Database is Supabase in `aws-1-ap-southeast-2`; local dev likely runs elsewhere, adding ~0.8–1.5s latency per query.
- Client always sends full `curriculumPlans` (FR + IB) with 30-year `studentsProjection`, so the backend takes the complex path.
- Opex/Capex saves use delete-and-recreate patterns, plus inline capex recalculation/fetch.
- MCP servers (Sequential Thinking, Context7) are not reachable from this CLI session, so best practices below are compiled from the codebase standards and general performance guidance.

## Findings (Save Flow)

1. **Over-broad payloads:** Client sends all plans with full projections; the backend never hits the “capacity-only” fast path and performs extra validation/queries.
2. **Many sequential DB round-trips:** Validation (`findMany`), version existence, duplicate checks, per-plan updates (including untouched plans), opex delete/recreate, capex rules delete/recreate + capex_items regen/fetch. With cross-region latency, this stacks to ~4–7s.
3. **Delete/recreate semantics:** Opex and capex rules/items are fully deleted and recreated, triggering recalculation and extra fetches.
4. **Serialization overhead:** Returning full version objects (curriculum plans with Decimal fields and 30-year projections) adds work on the response path, though secondary to DB latency.
5. **Region mismatch:** App server and Supabase are not co-located, inflating each Prisma call’s RTT.

## Best Practices & Recommendations

1. **Minimize payloads:**
   - Client should send only the edited plan(s) and omit `studentsProjection` when unchanged.
   - Use PATCH shape per-entity (e.g., `curriculumPlans: [{ id, capacity }]`) so backend can take the fast path.
2. **Reduce round-trips:**
   - In `PATCH /api/versions/[id]`, drop queries for untouched plans; wrap curriculum updates in a single `$transaction`.
   - Avoid duplicate lookups when name is unchanged; skip refetching version if no version-level fields changed (already partially done).
3. **Diff-based writes for opex/capex:**
   - Replace delete-all + recreate with upsert-by-id and delete-by-id for removed rows.
   - Move capex auto-generation off the request path (async job/worker) and respond immediately with inputs.
4. **Trim responses:**
   - For curriculum-only updates, return only updated plans (id, capacity, tuitionBase, cpiFrequency) and skip large projections unless changed.
   - Keep `serializeVersionForClient` on minimal objects to reduce serialization time.
5. **Co-locate services:**
   - Run Supabase locally for dev or move app server to the same region as the DB to cut RTT.
   - Keep Prisma warm (already in `lib/db/prisma.ts`); limit logging in production.
6. **Parallelize where safe:**
   - Run independent queries in `Promise.all` where isolation allows (e.g., validation + lightweight checks), but keep related mutations inside a transaction.
7. **Measure and guard:**
   - Add server-side timing logs per section (validation, updates, serialization) and alert when >500ms.
   - Add client-side timing around fetch to separate network vs server time.

## Prioritized Fix Plan

1. **Client payload slimming:** Ship a change so curriculum save sends only the edited plan; skip `studentsProjection` unless edited. Enables fast path.
2. **Backend fast path tightening:** Treat single-plan capacity/tuition updates as minimal updates in one transaction; don’t query or update the untouched plan.
3. **Opex/Capex diffs:** Implement upsert/delete-by-id; remove delete-all patterns; defer capex regeneration to background.
4. **Region alignment:** For dev, use local Supabase; for prod, deploy API in the same region as DB.
5. **Response minimization:** Return only changed entities in PATCH responses.

## Note on MCP

- Sequential Thinking and Context7 MCP servers are configured in `.mcp.json` but not accessible from this CLI session (servers not exposed to the MCP runtime here). Recommendations above are based on code inspection and established performance practices for Prisma + Supabase + Next.js.

## Risks & Potential Issues

- **Data integrity drift:** Switching to diff-based writes must preserve constraints (FR required, one IB max, opex validity, capex rule → item linkage). Missing validations could allow invalid states.
- **Concurrency conflicts:** Faster paths that skip refetching can surface stale writes if two users edit the same version; optimistic locking (expected `updatedAt`) must be honored.
- **Partial updates losing fields:** Minimal responses must match client merge logic; missing fields could overwrite client state with empties.
- **Capex/opex recalculation timing:** Moving capex regeneration async can create brief inconsistencies between inputs and derived items unless UI reflects pending state.
- **Region/latency surprises:** If services stay cross-region, perceived slowness persists despite code fixes; need deployment alignment.
- **Edge cases on projections:** Skipping `studentsProjection` when unchanged must still preserve canonical ramp-up rules and validation (FR required, IB optional).

## Test Plan (to confirm proper implementation)

- **Unit (backend):**
  - Curriculum update fast path: capacity-only update saves correctly without touching other fields; FR existence enforced; IB duplicate rejected.
  - Full update path: validation errors surfaced; duplicate name check works only when name changes.
  - Opex diff logic: upsert/delete-by-id preserves data; rejects invalid combos (isFixed vs percent).
  - Capex diff logic: rule changes do not delete unrelated items; manual items untouched when rules change.
  - Serialization: minimal response includes required fields; `serializeVersionForClient` handles partial objects.
  - Optimistic locking: PATCH with stale `expectedUpdatedAt` is rejected.
- **Integration (API):**
  - `PATCH /api/versions/:id` with single-plan capacity update returns in fast path (<1s locally) and only mutated plan in response.
  - `PATCH /api/versions/:id` with renamed version rejects duplicates; with unchanged name skips duplicate check.
  - Opex diff endpoint preserves pre-existing rows not included in payload, deletes only marked ones.
  - Capex rules change triggers (or schedules) regeneration; manual items remain.
  - AuthZ: non-owner PLANNER blocked; ADMIN allowed.
- **E2E (frontend):**
  - Save curriculum plan (capacity, tuition) updates UI state without losing other plan fields.
  - Save rent plan, opex line, capex rule, capex item: state persists after refresh.
  - Concurrent edit: two tabs; second save with stale timestamp is blocked with clear error.
  - Large projection load: no regression in rendering chart/table after save.
- **Performance checks:**
  - Measure server-side timings per section (validation/update/serialize) stay <500ms in-region; end-to-end save <1s locally / <2s cross-region.
  - Monitor query count per save (target: 1–3 queries for curriculum-only path).
- **Regression (business rules):**
  - FR required, max one IB retained after updates.
  - Rent/tuition independence unchanged; revenue = tuition × students maintained.
  - NPV window unchanged (2028–2052) in calculations after save.
