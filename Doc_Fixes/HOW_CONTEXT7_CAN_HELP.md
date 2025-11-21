# How Context7 Can Help with Project Zeta

**Context7** is an MCP tool that provides **up-to-date documentation** for libraries and frameworks. It's like having the latest docs for all your dependencies at your fingertips, directly accessible through Cursor.

---

## 🎯 What Context7 Does

Context7 gives you:

- ✅ **Latest documentation** for any library
- ✅ **Code examples** and best practices
- ✅ **API references** with real examples
- ✅ **Migration guides** and breaking changes
- ✅ **Troubleshooting** solutions

---

## 📚 Libraries You Can Query

Based on your `package.json`, here are the key libraries Context7 can help with:

### Core Framework

- **Next.js 15** (`/vercel/next.js`) - App Router, Server Components, API Routes
- **React 18** - Hooks, Server Components, Concurrent features
- **TypeScript 5.3+** - Type safety, advanced types

### Database & ORM

- **Prisma 5.x** (`/prisma/docs`) - Client, Migrations, Connection Pooling
- **PostgreSQL** - Database best practices

### Financial Calculations

- **Decimal.js** (`/mikemcl/decimal.js`) - Precision, rounding, financial calculations

### UI & Styling

- **Tailwind CSS** - Utility classes, configuration
- **shadcn/ui** - Component patterns
- **Recharts** - Chart configuration
- **Framer Motion** - Animations

### State & Data

- **Zustand** - State management patterns
- **Zod** - Schema validation
- **TanStack Table** - Table virtualization

### Testing

- **Vitest** - Test configuration, mocking
- **Playwright** - E2E testing

---

## 💡 Real-World Use Cases for Your Project

### 1. **Next.js App Router Best Practices**

**Example Question:** "How do I optimize API routes in Next.js 15?"

Context7 can show you:

- Server Components vs Client Components
- API route patterns
- Streaming with Suspense
- Dynamic routes with async params

**Example from your code:**

```typescript
// Your projection.ts uses Prisma directly in Server Component
// Context7 can show you best practices for:
// - Data fetching patterns
// - Error handling in Server Components
// - Caching strategies
```

### 2. **Prisma Connection Pooling with Supabase**

**Example Question:** "How do I configure Prisma with pgBouncer and directUrl?"

Context7 provides:

- Exact schema configuration
- Connection pooling setup
- Migration best practices
- Transaction timeout configuration

**Relevant to your code:**

```prisma
// Your schema.prisma needs both DATABASE_URL and DIRECT_URL
// Context7 shows you the exact configuration:
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // pgBouncer
  directUrl = env("DIRECT_URL")   // Direct for migrations
}
```

### 3. **Decimal.js Financial Precision**

**Example Question:** "How do I configure Decimal.js for financial calculations?"

Context7 shows:

- Precision configuration
- Rounding modes
- Best practices for money calculations
- Performance optimization

**Relevant to your code:**

```typescript
// Your circular-solver.ts uses Decimal.js
// Context7 can help with:
// - Setting precision (you use 20)
// - Rounding modes (ROUND_HALF_UP)
// - Performance tips for large calculations
```

### 4. **API Route Patterns**

**Example Question:** "How do I handle errors in Next.js API routes?"

Context7 provides:

- Error handling patterns
- Response helpers
- Type safety with TypeScript
- Authentication patterns

---

## 🔍 How to Use Context7 in Cursor

### Method 1: Ask Me Directly

Just ask me questions like:

- "How do I use Prisma transactions with connection pooling?"
- "What's the best way to handle errors in Next.js API routes?"
- "How do I configure Decimal.js precision for financial calculations?"

I'll use Context7 to fetch the latest documentation and show you examples.

### Method 2: Specific Library Queries

I can query specific topics:

- Next.js App Router patterns
- Prisma Client best practices
- Decimal.js configuration
- React Server Components
- Zod validation patterns

---

## 📖 Example Queries for Your Project

### For Next.js 15

**Query:** "Next.js App Router server components API routes"

- Shows Server Component patterns
- API route examples
- Dynamic routes with async params
- Streaming with Suspense

**Use Case:** Optimizing your `projection.ts` data fetching

### For Prisma 5.x

**Query:** "Prisma Client transactions migrations connection pooling"

- Connection pooling configuration
- Transaction patterns
- Migration best practices
- Supabase integration

**Use Case:** Your database setup with pgBouncer

### For Decimal.js

**Query:** "precision rounding financial calculations"

- Precision configuration
- Rounding modes
- Financial calculation patterns
- Performance tips

**Use Case:** Your financial calculation engine

---

## 🎯 Specific Help for Your Codebase

### Issue: Console.log Statements (From Analysis)

**Context7 Query:** "Next.js production logging best practices"

- Shows structured logging patterns
- Environment-based logging
- Error tracking integration

### Issue: API Route Error Handling

**Context7 Query:** "Next.js API routes error handling patterns"

- Result<T> pattern examples
- Error response helpers
- Type-safe error handling

### Issue: Prisma Performance

**Context7 Query:** "Prisma connection pooling performance optimization"

- Connection pool sizing
- Query optimization
- Transaction patterns

### Issue: Decimal.js Configuration

**Context7 Query:** "Decimal.js precision configuration financial calculations"

- Precision settings
- Rounding modes
- Performance optimization

---

## 🚀 Quick Start Examples

### Example 1: Optimize Your API Routes

**Ask me:**

> "Show me Next.js 15 API route best practices for error handling"

**I'll use Context7 to show:**

- Proper error response patterns
- Type-safe error handling
- Authentication patterns
- Response helpers

### Example 2: Improve Prisma Queries

**Ask me:**

> "How do I optimize Prisma queries with connection pooling?"

**I'll use Context7 to show:**

- Connection pool configuration
- Query optimization techniques
- Transaction best practices
- Supabase-specific patterns

### Example 3: Decimal.js Configuration

**Ask me:**

> "What's the best Decimal.js configuration for financial calculations?"

**I'll use Context7 to show:**

- Precision settings
- Rounding modes
- Performance tips
- Common pitfalls

---

## 📝 Integration with Your Workflow

### When to Use Context7

1. **Learning New Features**
   - "What's new in Next.js 15?"
   - "How do I use Prisma 5.x transactions?"

2. **Troubleshooting**
   - "Why is my Prisma connection timing out?"
   - "How do I fix Decimal.js precision issues?"

3. **Best Practices**
   - "What's the best way to structure Next.js API routes?"
   - "How do I optimize Prisma queries?"

4. **Migration Help**
   - "How do I migrate from Next.js 14 to 15?"
   - "What changed in Prisma 5.x?"

### When NOT to Use Context7

- Project-specific business logic questions
- Custom implementation details
- Architecture decisions (use your ARCHITECTURE.md)

---

## 🎓 Learning Resources

Context7 provides:

- **Official documentation** - Always up-to-date
- **Code examples** - Real-world patterns
- **Migration guides** - Step-by-step upgrades
- **Best practices** - Industry standards

---

## 💬 Example Conversation

**You:** "How do I handle Prisma connection pooling with Supabase?"

**Me (using Context7):**

> Based on the latest Prisma docs, here's how to configure connection pooling with Supabase:
>
> ```prisma
> datasource db {
>   provider  = "postgresql"
>   url       = env("DATABASE_URL") // pgBouncer connection
>   directUrl = env("DIRECT_URL")   // Direct connection for migrations
> }
> ```
>
> Your `.env.local` should have:
>
> ```env
> DATABASE_URL="postgresql://...?pgbouncer=true"
> DIRECT_URL="postgresql://..." # Direct connection
> ```

---

## 🔗 Next Steps

1. **Try it now:** Ask me a question about any library you use
2. **Explore:** I can query Context7 for specific topics
3. **Learn:** Get up-to-date documentation for your stack

**Example queries to try:**

- "Show me Next.js 15 Server Component patterns"
- "How do I optimize Prisma queries?"
- "What's the best Decimal.js configuration for money?"

---

**Context7 is your always-up-to-date library documentation assistant!** 🚀
