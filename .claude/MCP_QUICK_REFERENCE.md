# MCP Servers Quick Reference

## Installed MCP Servers

### 1. Sequential Thinking
- **Purpose:** Structured problem analysis & verification
- **When to use:** Complex problems, root cause analysis, implementation verification

### 2. Context7
- **Purpose:** High-quality code examples & best practices
- **When to use:** Need reference implementations, framework examples, industry standards

---

## Quick Commands

### Problem-Solving Workflow

**When you encounter an issue:**

```
Step 1: Ask Sequential Thinking to analyze
"Use Sequential Thinking to analyze this error: [error details]"

Step 2: Get relevant examples from Context7
"Use Context7 to find [framework/pattern] examples for [specific need]"

Step 3: Have QA-Tester implement fix
"QA agent please fix [problem] using the analysis and examples"

Step 4: Have Sequential Thinking verify
"Use Sequential Thinking to verify the implementation is complete and correct"
```

---

## Example Requests

### For Sequential Thinking
```
✅ "Use Sequential Thinking to analyze why the Balance Sheet is imbalanced"
✅ "Sequential Thinking: Break down this DecimalError step by step"
✅ "Use Sequential Thinking to verify the fix addresses all root causes"
✅ "Sequential Thinking: Review if the implementation follows best practices"
```

### For Context7
```
✅ "Use Context7 to find Next.js 15 App Router data fetching examples"
✅ "Context7: Show me Prisma transaction best practices"
✅ "Use Context7 to get React error boundary implementation patterns"
✅ "Context7: Find examples of Decimal.js usage in financial calculations"
```

### Combined Workflow
```
✅ "Use Sequential Thinking to analyze this error, then use Context7 to find
    best practice solutions, then ask QA agent to implement the fix"
```

---

## Configuration Files

### Project-Level: `.mcp.json`
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

### User-Level: `~/.claude/settings.json`
```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "sequential-thinking",
    "context7"
  ]
}
```

---

## Workflow Pattern

```
Problem → Sequential Thinking Analysis → Context7 Examples →
QA-Tester Implementation → Sequential Thinking Verification
```

---

**Status:** ✅ Both MCP servers installed and configured
**Last Updated:** 2025-11-20
