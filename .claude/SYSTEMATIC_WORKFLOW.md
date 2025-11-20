# Systematic Problem-Solving Workflow

This document defines the systematic workflow for identifying, analyzing, fixing, and verifying code issues in Project Zeta using MCP servers.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Problem Detection                                       │
│ User reports issue or error → Sequential Thinking Analysis      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Root Cause Analysis                                     │
│ Sequential Thinking MCP → Systematic breakdown of problem       │
│ Context7 MCP → Fetch relevant examples & best practices         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Solution Implementation                                 │
│ QA-Tester Agent → Fix implementation with tests                 │
│ Context7 MCP → Reference high-quality code patterns             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Fix Documentation                                       │
│ QA-Tester Agent → Generate comprehensive fix report             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Implementation Verification                             │
│ Sequential Thinking MCP → Review fix quality & completeness     │
│ Verify all success criteria met                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP Servers Installed

### 1. Sequential Thinking MCP
**Package:** `@modelcontextprotocol/server-sequential-thinking`
**Purpose:** Structured problem analysis and verification
**Usage:**
- Initial problem analysis and root cause identification
- Step-by-step reasoning for complex issues
- Final verification of implementation quality
- Review of fix completeness

### 2. Context7 MCP
**Package:** `@context7/mcp-server`
**Purpose:** High-quality code examples and best practices
**Usage:**
- Fetch relevant code patterns from documentation
- Get framework-specific examples (Next.js, React, Prisma, etc.)
- Reference industry best practices
- Ensure code quality standards

---

## Detailed Workflow Steps

### Step 1: Problem Detection & Reporting

**When a problem occurs:**
1. User reports error/issue with details:
   - Error message
   - Stack trace
   - Context (what they were doing)
   - Expected vs actual behavior

**Example:**
```
User: "Getting DecimalError: Invalid argument: undefined at PnLStatement.tsx:112"
```

---

### Step 2: Sequential Thinking Analysis

**Invoke Sequential Thinking MCP to:**
1. Break down the problem systematically
2. Identify root causes
3. Trace data flow
4. Analyze dependencies
5. Propose solution approach

**Output:** Structured analysis with:
- Problem statement
- Root cause identification
- Affected components
- Proposed solution strategy
- Files that need modification

**Example Usage:**
```javascript
// Sequential Thinking will analyze:
// 1. What is the error?
// 2. Where does it originate?
// 3. Why is the value undefined?
// 4. What are the dependencies?
// 5. What's the correct fix?
```

---

### Step 3: Context7 Research

**Use Context7 MCP to:**
1. Fetch relevant documentation examples
2. Get best practice implementations
3. Reference similar solved problems
4. Ensure industry-standard approaches

**Query Examples:**
- "React component error handling patterns"
- "Decimal.js safe number operations"
- "Next.js 15 data fetching best practices"
- "Prisma transaction patterns"

**Output:** High-quality reference code and patterns

---

### Step 4: QA-Tester Implementation

**Invoke QA-Tester Agent with:**
- Sequential Thinking analysis results
- Context7 best practices
- Specific fix requirements
- Success criteria

**Agent Tasks:**
1. Implement the fix based on analysis
2. Add defensive programming patterns
3. Write regression tests
4. Verify all edge cases
5. Generate comprehensive documentation

**Output Files:**
- Fixed source code
- New/updated tests
- Fix documentation (markdown)
- Verification scripts

---

### Step 5: Sequential Thinking Verification

**Final review by Sequential Thinking MCP:**
1. **Implementation Quality Check:**
   - Does the fix address root cause?
   - Are all edge cases handled?
   - Is error handling comprehensive?

2. **Code Quality Assessment:**
   - Follows project standards?
   - Uses best practices from Context7?
   - Maintains type safety?
   - Proper defensive programming?

3. **Testing Coverage:**
   - All scenarios tested?
   - Regression tests added?
   - Edge cases covered?

4. **Documentation Quality:**
   - Root cause explained?
   - Solution documented?
   - Prevention measures noted?

5. **Success Criteria Verification:**
   - All criteria met?
   - No side effects introduced?
   - Performance maintained?

**Output:** Verification report with:
- ✅ Quality checklist (all items checked)
- 🔍 Areas of concern (if any)
- 📋 Recommendations for improvement
- ✨ Production readiness status

---

## Example Workflow Execution

### Problem: Balance Sheet Imbalance

**Step 1: User Report**
```
User: "Balance sheet showing -50M imbalance for all projection years"
```

**Step 2: Sequential Thinking Analysis**
```markdown
## Root Cause Analysis
1. Missing balance_sheet_settings records
2. CircularSolver using wrong default (55M vs 9.8M)
3. Data integrity issue in historical_actuals

## Solution Strategy
1. Fix historical data equity values
2. Create missing balance_sheet_settings
3. Update service layer to prevent recurrence
4. Add comprehensive tests
```

**Step 3: Context7 Research**
```javascript
// Fetch examples:
- Prisma transaction patterns for data fixes
- Service layer auto-creation patterns
- Financial calculation best practices
- Balance sheet validation approaches
```

**Step 4: QA-Tester Implementation**
```typescript
// Creates:
- scripts/fix-balance-sheet-imbalances.ts
- scripts/verify-balance-sheet-fix.ts
- services/version/create.ts (updated)
- lib/calculations/financial/__tests__/balance-sheet-balancing.test.ts
- BALANCE_SHEET_FIX_FINAL_REPORT.md
```

**Step 5: Sequential Thinking Verification**
```markdown
✅ Root cause properly addressed
✅ All edge cases handled
✅ Comprehensive tests (11/11 passing)
✅ Service layer prevents recurrence
✅ Documentation complete
✅ Production ready

Status: APPROVED FOR DEPLOYMENT
```

---

## Quality Gates

Every fix must pass these gates:

### Gate 1: Analysis Completeness
- [ ] Root cause identified
- [ ] All affected components mapped
- [ ] Dependencies understood
- [ ] Solution strategy defined

### Gate 2: Implementation Quality
- [ ] Fix addresses root cause
- [ ] Uses best practices (Context7)
- [ ] Defensive programming applied
- [ ] Type safety maintained
- [ ] No code smells introduced

### Gate 3: Testing Coverage
- [ ] Regression tests added
- [ ] Edge cases covered
- [ ] All tests passing
- [ ] Performance verified

### Gate 4: Documentation
- [ ] Root cause documented
- [ ] Solution explained
- [ ] Prevention measures noted
- [ ] Migration guide provided (if needed)

### Gate 5: Verification
- [ ] Sequential Thinking review passed
- [ ] All success criteria met
- [ ] No side effects detected
- [ ] Production ready

---

## Commands Reference

### Installing MCP Servers
Already installed in this project:
```bash
# Configuration in .mcp.json
# Enabled in ~/.claude/settings.json
```

### Running Fixes
```bash
# Run fix scripts
npx tsx scripts/<fix-script>.ts

# Run verification
npx tsx scripts/verify-<fix>.ts

# Run tests
npm test -- <test-file>.test.ts --run
```

### Checking Status
```bash
# Type check
npm run type-check

# Run all tests
npm test

# Build check
npm run build
```

---

## Success Metrics

Track these metrics for each fix:

1. **Analysis Quality:** Root cause correctly identified
2. **Fix Effectiveness:** Problem fully resolved
3. **Test Coverage:** All scenarios covered
4. **Documentation Quality:** Complete and clear
5. **Time to Resolution:** From detection to deployment
6. **Recurrence Rate:** Has issue reappeared? (should be 0%)

---

## Best Practices

### For Sequential Thinking
- Provide complete error context
- Include stack traces and data samples
- Request step-by-step analysis
- Ask for verification checklist

### For Context7
- Be specific about technology stack
- Request framework-specific examples
- Ask for best practices, not just solutions
- Validate examples against project standards

### For QA-Tester
- Provide Sequential Thinking analysis
- Include Context7 best practices
- Specify success criteria clearly
- Request comprehensive documentation

---

## Continuous Improvement

After each fix cycle:
1. Review what worked well
2. Identify bottlenecks
3. Update workflow if needed
4. Add to knowledge base
5. Share learnings with team

---

**Last Updated:** 2025-11-20
**Maintained By:** Project Zeta Team
**MCP Servers:** Sequential Thinking + Context7
**Status:** Active Workflow
