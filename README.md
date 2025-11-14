# Project Zeta - Financial Planning Application

**A world-class financial planning application for school relocation assessment**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 📋 Overview

Project Zeta is a sophisticated financial planning tool designed to evaluate school relocation scenarios from 2028 onwards. It provides 30-year financial projections (2023-2052) with a focus on rent model evaluation and long-term lease assessment.

### Key Features

- **🏗️ Version Management** - Create, compare, and lock financial scenarios
- **💰 Financial Calculations** - Real-time 30-year projections with <50ms performance
- **🏢 Rent Model Evaluation** - Compare FixedEscalation, RevenueShare, PartnerModel
- **🎓 Dual-Curriculum Support** - French (FR) and International Baccalaureate (IB)
- **📊 Advanced Analytics** - Interactive charts, NPV analysis, EBITDA trending
- **📑 Report Generation** - Export professional PDFs and Excel reports
- **🔍 Audit Logging** - Complete traceability of all financial decisions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20 LTS** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - Via [Supabase](https://supabase.com/) (recommended) or local install
- **npm 10+** - Comes with Node.js

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourcompany/project-zeta.git
cd project-zeta

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your database credentials

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed database (optional - creates sample data)
npx prisma db seed

# 6. Start development server
npm run dev
```

**Open** [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
/project-zeta
├── /src
│   ├── /app                    # Next.js App Router (pages)
│   ├── /components             # Reusable UI components
│   ├── /lib                    # Core utilities (calculations, db, validation)
│   ├── /services               # Business logic layer
│   ├── /workers                # Web Workers for heavy calculations
│   ├── /hooks                  # Custom React hooks
│   ├── /types                  # TypeScript type definitions
│   └── /config                 # Configuration files
├── /prisma
│   ├── schema.prisma           # Database schema
│   ├── /migrations             # Migration files
│   └── seed.ts                 # Seed data
├── /public                     # Static assets
├── .env.local                  # Local environment variables (DO NOT COMMIT)
├── .env.local.example          # Environment variable template
├── .cursorrules                # Development standards
├── PRD.md                      # Product Requirements Document
├── ARCHITECTURE.md             # System architecture
├── API.md                      # API documentation
├── SCHEMA.md                   # Database schema reference
├── DELIVERY_PLAN.md            # Implementation plan
├── DEPLOYMENT.md               # Deployment guide
└── README.md                   # This file
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Check TypeScript types
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Database
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create and apply migration
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Seed database with sample data
npx prisma db push       # Push schema changes (dev only)

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run end-to-end tests

# Code Quality
npm run prepare          # Set up Husky pre-commit hooks
```

### Development Workflow

1. **Read** [PRD.md](PRD.md) - Understand requirements
2. **Check** [.cursorrules](.cursorrules) - Follow development standards
3. **Review** [DELIVERY_PLAN.md](DELIVERY_PLAN.md) - Find next feature to implement
4. **Write tests first** (TDD approach)
5. **Implement feature** following `.cursorrules`
6. **Run checklist** (type-check, lint, test, build)
7. **Commit** with clear message (conventional commits)
8. **Update** DELIVERY_PLAN.md with completion date

---

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com/)
2. Create new project
3. Get connection strings from Settings → Database
4. Add to `.env.local`:

```bash
# pgBouncer connection (for application queries)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]/postgres?pgbouncer=true&sslmode=require"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]/postgres?sslmode=require"
```

5. Run migrations: `npx prisma migrate dev`

### Option 2: Local PostgreSQL

```bash
# 1. Install PostgreSQL 15+
brew install postgresql@15  # macOS
sudo apt install postgresql-15  # Ubuntu

# 2. Start PostgreSQL service
brew services start postgresql@15

# 3. Create database
createdb project_zeta

# 4. Update .env.local
DATABASE_URL="postgresql://localhost:5432/project_zeta?pgbouncer=false"
DIRECT_URL="postgresql://localhost:5432/project_zeta"

# 5. Run migrations
npx prisma migrate dev
```

---

## 🔐 Authentication

### Default Users (After Seeding)

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@company.com` | `admin123` | ADMIN | Full access (create, edit, delete, lock) |
| `planner@company.com` | `planner123` | PLANNER | Can create and edit versions |
| `viewer@company.com` | `viewer123` | VIEWER | Read-only access |

**⚠️ Change passwords immediately in production!**

### Roles & Permissions

- **ADMIN** - Full access (create, read, update, delete, lock versions)
- **PLANNER** - Create and edit versions (cannot delete or lock)
- **VIEWER** - Read-only access (can view and generate reports)

See [API.md](API.md) for detailed authorization matrix.

---

## 📊 Key Concepts

### Critical Business Rules

**MUST FOLLOW - See [.cursorrules](.cursorrules) for details:**

1. **Rent & Tuition Independence** - Tuition is set manually by user, NOT calculated from rent
2. **Revenue = Tuition × Students** - Automatic calculation with CPI-based tuition growth
3. **Curriculum-Specific Ramp-Up** - FR (established, starts 70-80%) vs IB (new, starts 0-20%)
4. **NPV Period: 2028-2052** - 25-year post-relocation focus (primary decision metric)
5. **Money = Decimal.js** - NEVER use floating point for financial calculations

### Financial Calculations

- **30-Year Timeline** - 2023-2052 (Historical: 2023-2024, Transition: 2025-2027, Ramp-Up: 2028-2032, Full Capacity: 2033-2052)
- **Rent Models** - FixedEscalation, RevenueShare, PartnerModel
- **Performance Target** - <50ms for full 30-year projection (using Web Workers)
- **Precision** - Decimal.js with 20-digit precision, ROUND_HALF_UP

---

## 🎨 Design System

### Colors (Dark Mode Primary)

```typescript
background: { primary: '#0A0E1A', secondary: '#141825', tertiary: '#1E2332' }
text: { primary: '#F8FAFC', secondary: '#94A3B8', tertiary: '#64748B' }
accent: { blue: '#3B82F6', green: '#10B981', red: '#EF4444', yellow: '#F59E0B' }
chart: { revenue: '#3B82F6', rent: '#8B5CF6', ebitda: '#10B981', cashflow: '#14B8A6' }
```

### Typography

- **Headings** - Inter (font-weight: 600-700)
- **Body** - Inter (font-weight: 400-500)
- **Monospace** - JetBrains Mono (for numbers, code)

### Accessibility

- **WCAG 2.1 AA+** compliance
- Color contrast: 4.5:1 for text
- Keyboard navigation supported
- Screen reader support
- Color + icon (not color alone)

See [ARCHITECTURE.md](ARCHITECTURE.md) Section 12 for complete design system.

---

## 🧪 Testing

### Test Coverage Targets

- **Overall:** >80%
- **Core Calculations:** 100% (rent, revenue, EBITDA, NPV)
- **Service Layer:** >90%
- **Utilities:** >80%

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests
npm run test:all
```

### Writing Tests

**TDD Approach (Test-Driven Development):**

1. Write test FIRST
2. Run test (should fail)
3. Implement feature
4. Run test (should pass)
5. Refactor if needed

**Example:**

```typescript
// /src/lib/calculations/rent/__tests__/fixed-escalation.test.ts
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateFixedEscalationRent } from '../fixed-escalation';

describe('calculateFixedEscalationRent', () => {
  it('should calculate rent with 4% annual escalation', () => {
    const result = calculateFixedEscalationRent({
      baseRent: new Decimal(1000000),
      escalationRate: new Decimal(0.04),
      startYear: 2028,
      endYear: 2030,
    });
    
    expect(result).toHaveLength(3);
    expect(result[0].toString()).toBe('1000000');
    expect(result[1].toString()).toBe('1040000');
    expect(result[2].toString()).toBe('1081600');
  });
});
```

---

## 📦 Building for Production

```bash
# 1. Type check
npm run type-check

# 2. Lint
npm run lint

# 3. Run tests
npm run test

# 4. Build
npm run build

# 5. Verify build size
du -sh .next/

# 6. Test production build locally
npm run start
```

**Target Metrics:**
- Bundle size: <500 KB (initial load)
- Lighthouse score: >90 (all categories)
- No TypeScript errors
- No ESLint warnings
- All tests passing

---

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

**Quick Deploy to Vercel:**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel dashboard
# 5. Run database migrations on production
npx prisma migrate deploy
```

**Production Checklist:**
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Seed admin user created
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic via Vercel)
- [ ] Monitoring tools active (Vercel Analytics, Sentry)

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [PRD.md](PRD.md) | Product Requirements Document (what we're building) |
| [.cursorrules](.cursorrules) | Development standards and code patterns (how to build) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and design decisions |
| [API.md](API.md) | API endpoints, request/response formats, authentication |
| [SCHEMA.md](SCHEMA.md) | Database schema, relationships, constraints |
| [DELIVERY_PLAN.md](DELIVERY_PLAN.md) | Phased implementation plan with acceptance criteria |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Step-by-step deployment process |
| [README.md](README.md) | Setup instructions and quick start (this file) |

---

## 🤝 Contributing

### Development Standards

All code must follow [.cursorrules](.cursorrules) standards:

1. **TypeScript Strict Mode** - No `any` types, explicit return types
2. **Financial Precision** - Use Decimal.js for all money calculations
3. **Error Handling** - Result<T> pattern for all operations
4. **Input Validation** - Zod schemas at boundaries
5. **Audit Logging** - All mutations logged
6. **Performance** - <50ms calculations, <2s page loads
7. **Accessibility** - WCAG 2.1 AA+ compliance

### Pre-Commit Checklist

Before committing:

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] `npm run test` passes (all tests)
- [ ] `npm run build` succeeds
- [ ] No console.logs in production code
- [ ] No hardcoded credentials
- [ ] All functions have JSDoc comments
- [ ] User-facing errors are friendly

### Commit Message Format

```bash
# Format: <type>(<scope>): <subject>
# Types: feat, fix, refactor, docs, test, perf, chore, style

git commit -m "feat(rent): add PartnerModel calculation with yield-based rent"
git commit -m "fix(tuition): prevent negative tuition values in input validation"
git commit -m "docs(api): add endpoints documentation for version comparison"
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** `npm install` fails with peer dependency errors

```bash
# Solution: Use --legacy-peer-deps flag
npm install --legacy-peer-deps
```

**Issue:** Prisma Client not found

```bash
# Solution: Generate Prisma Client
npx prisma generate
```

**Issue:** Database connection timeout

```bash
# Solution: Check connection strings in .env.local
# Verify DATABASE_URL and DIRECT_URL are correct
# Test connection: npx prisma studio
```

**Issue:** Web Worker not loading

```bash
# Solution: Restart dev server
# Web Workers may not hot-reload in development
npm run dev
```

**Issue:** Build fails with memory error

```bash
# Solution: Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/yourcompany/project-zeta/issues)
- **Questions:** Slack channel #project-zeta
- **Documentation:** See all .md files in root directory
- **API Reference:** [API.md](API.md)

---

## 📈 Performance

### Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Financial Calculation | <50ms | TBD |
| Page Load (FCP) | <2s | TBD |
| Report Generation | <5s | TBD |
| API Response (p95) | <200ms | TBD |
| Bundle Size (Initial) | <500KB | TBD |
| Lighthouse Score | >90 | TBD |

### Monitoring

- **Analytics:** Vercel Analytics (pageviews, performance)
- **Errors:** Sentry (error tracking, performance monitoring)
- **Logs:** Vercel Logs (application logs, function logs)

---

## 🔒 Security

### Security Measures

- **Authentication:** NextAuth.js with JWT sessions
- **Authorization:** Role-based access control (ADMIN, PLANNER, VIEWER)
- **Input Validation:** Zod schemas for all user inputs
- **SQL Injection Prevention:** Prisma ORM (parameterized queries)
- **XSS Prevention:** React escapes all user input by default
- **CSRF Protection:** NextAuth.js includes CSRF tokens
- **Environment Variables:** Never committed (use .env.local)
- **Audit Logging:** All mutations logged with user, timestamp, IP

### Reporting Security Issues

Email: security@yourcompany.com

---

## 📄 License

**Proprietary** - All rights reserved

Copyright © 2025 Your Company. This software is proprietary and confidential.

---

## 👥 Team

- **Project Owner:** Faker Helali
- **Lead Developer:** [TBD]
- **QA Lead:** [TBD]
- **Stakeholders:** CFO, Finance Manager, Board Members

---

## 🎯 Roadmap

### MVP (Phase 1) - Weeks 1-6
- ✅ Project setup and database
- ⏳ Core financial calculations
- ⏳ Version management
- ⏳ Dashboard with charts
- ⏳ Tuition simulator

### Phase 2 - Weeks 7-10
- ⏳ Full simulation sandbox
- ⏳ Report generation
- ⏳ Admin panel
- ⏳ Polish and optimization

### Phase 3 - Weeks 11-13
- ⏳ Comprehensive testing
- ⏳ User acceptance testing
- ⏳ Production deployment

### Future Enhancements
- Multi-tenancy (separate data per school)
- Advanced analytics (BI dashboards)
- Real-time collaboration
- Mobile apps (React Native)
- AI-powered recommendations

See [DELIVERY_PLAN.md](DELIVERY_PLAN.md) for complete implementation plan.

---

## 🙏 Acknowledgments

- **Next.js Team** - Excellent framework and documentation
- **Prisma Team** - Best-in-class TypeScript ORM
- **Vercel** - Seamless deployment experience
- **Supabase** - Managed PostgreSQL hosting
- **shadcn/ui** - Beautiful accessible UI components

---

**Version:** 1.0  
**Last Updated:** November 13, 2025  
**Status:** 🔴 Development (MVP in progress)

**Let's build a world-class financial planning application! 🚀**

