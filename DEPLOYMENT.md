# Project Zeta - Deployment Guide
## Production Deployment to Vercel + Supabase

**Version:** 1.0  
**Last Updated:** November 13, 2025  
**Deployment Stack:** Vercel (App Hosting) + Supabase (Database)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Application Deployment (Vercel)](#application-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring Setup](#monitoring-setup)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Before deploying to production, ensure you have:

- ✅ GitHub account (for code hosting)
- ✅ Vercel account (free or paid) - [Sign up](https://vercel.com/signup)
- ✅ Supabase account (free or paid) - [Sign up](https://supabase.com/)
- ✅ Custom domain (optional but recommended)
- ✅ All tests passing locally (`npm run test`)
- ✅ All lints passing (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ Environment variables documented

---

## 2. Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All ESLint warnings resolved (`npm run lint`)
- [ ] All unit tests passing (`npm run test`)
- [ ] All integration tests passing (`npm run test:integration`)
- [ ] Test coverage >80% overall, 100% for core calculations
- [ ] Build succeeds with no warnings (`npm run build`)
- [ ] Bundle size <500 KB (initial load)
- [ ] Lighthouse score >90 (all categories)

### Security

- [ ] No hardcoded credentials in code
- [ ] All API keys in environment variables
- [ ] `.env.local` NOT committed (check `.gitignore`)
- [ ] `NEXTAUTH_SECRET` generated with `openssl rand -base64 32`
- [ ] Default passwords changed (admin, planner, viewer)
- [ ] Rate limiting enabled on API routes
- [ ] CORS configured correctly
- [ ] CSP headers configured

### Database

- [ ] All migrations tested locally
- [ ] Seed script creates production admin user
- [ ] Backup strategy defined
- [ ] Connection pooling configured (pgBouncer)
- [ ] Database indexes created
- [ ] Foreign key constraints validated

### Documentation

- [ ] README.md updated with production URLs
- [ ] API.md reflects current endpoints
- [ ] SCHEMA.md matches current database schema
- [ ] Runbook created (RUNBOOK.md)
- [ ] Known issues documented

---

## 3. Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in details:
   - **Name:** Project Zeta Production
   - **Database Password:** Use strong password (save to password manager)
   - **Region:** Choose closest to users (e.g., US East, EU West)
   - **Plan:** Free or Pro (recommended for production)
4. Wait 2-3 minutes for project creation

### Step 2: Get Connection Strings

1. Go to **Settings → Database**
2. Scroll to "Connection string"
3. Copy **Session mode (pgBouncer):**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&sslmode=require
   ```
4. Copy **Direct connection:**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```
5. Save both connection strings (you'll need them for Vercel)

### Step 3: Configure Database

1. **Enable Connection Pooling:**
   - Go to **Settings → Database → Connection pooling**
   - Ensure "Session mode" is enabled

2. **Set Database Timezone:**
   ```sql
   ALTER DATABASE postgres SET timezone TO 'UTC';
   ```

3. **Enable Extensions (if needed):**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search
   ```

### Step 4: Create Backup Policy

1. Go to **Settings → Backups**
2. Verify automatic daily backups enabled (free plan: last 7 days)
3. Consider upgrading to Pro for:
   - Point-in-time recovery
   - More backup retention
   - Manual backup triggers

---

## 4. Application Deployment (Vercel)

### Step 1: Connect GitHub Repository

1. Push code to GitHub:
   ```bash
   git remote add origin https://github.com/yourcompany/project-zeta.git
   git branch -M main
   git push -u origin main
   ```

2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Click "Import Git Repository"
4. Select your GitHub organization and repository
5. Click "Import"

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify settings:

- **Framework Preset:** Next.js
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)
- **Node.js Version:** 20.x

### Step 3: Set Environment Variables

**In Vercel dashboard:**

1. Go to **Settings → Environment Variables**
2. Add the following variables:

**Required Variables:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | [pgBouncer connection string from Step 3.2] | Production, Preview |
| `DIRECT_URL` | [Direct connection string from Step 3.2] | Production, Preview |
| `NEXTAUTH_SECRET` | [Generate: `openssl rand -base64 32`] | Production, Preview |
| `NEXTAUTH_URL` | `https://projectzeta.yourcompany.com` | Production |
| `NEXTAUTH_URL` | `https://[preview-url].vercel.app` | Preview |

**Optional Variables:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project-ref].supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [From Supabase Settings → API] | All |
| `SUPABASE_SERVICE_ROLE_KEY` | [From Supabase Settings → API] | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | [From Sentry project] | Production |
| `BLOB_READ_WRITE_TOKEN` | [From Vercel Blob Storage] | Production |

3. Click "Save" after adding each variable

### Step 4: Deploy

1. Click "Deploy" button
2. Wait 3-5 minutes for build and deployment
3. Vercel will provide a URL: `https://project-zeta-[hash].vercel.app`

---

## 5. Environment Variables

### Complete List

```bash
# ============================================================================
# DATABASE (Required)
# ============================================================================
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# ============================================================================
# AUTHENTICATION (Required)
# ============================================================================
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"
NEXTAUTH_URL="https://projectzeta.yourcompany.com"

# ============================================================================
# SUPABASE (Optional)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# ============================================================================
# MONITORING (Optional but Recommended)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN="https://[sentry-dsn]@sentry.io/[project-id]"
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="[analytics-id]"

# ============================================================================
# FILE STORAGE (Optional)
# ============================================================================
BLOB_READ_WRITE_TOKEN="[vercel-blob-token]"
```

### How to Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Example output: `jT7kL9mN3pQ5rS8tU1vW2xY4zA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8z`

Use this output as your `NEXTAUTH_SECRET` value.

---

## 6. Database Migrations

### Step 1: Run Migrations on Production

**From your local machine:**

```bash
# 1. Set production DATABASE_URL temporarily
export DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"

# 2. Run migrations (use DIRECT_URL, not pgBouncer)
npx prisma migrate deploy

# 3. Verify migrations applied
npx prisma migrate status

# 4. Generate Prisma Client
npx prisma generate
```

**Expected Output:**
```
✔ Database migrations applied:
  20251113_init
  20251114_add_audit_logs
  ... (all migrations)

✔ Prisma Client generated successfully
```

### Step 2: Seed Production Database

**⚠️ Warning:** Only run seed on first deployment. It will create admin user.

```bash
# Set production DATABASE_URL
export DIRECT_URL="postgresql://..."

# Run seed script
npx prisma db seed
```

**Seed script creates:**
- Admin user: `admin@company.com` / `admin123` (⚠️ change password immediately!)
- Sample admin settings (CPI rate, discount rate, etc.)

**⚠️ IMPORTANT:** After seeding, immediately change admin password:
1. Sign in as admin
2. Go to Settings → Profile
3. Change password to strong password

### Step 3: Verify Database

```bash
# Open Prisma Studio connected to production
export DIRECT_URL="postgresql://..."
npx prisma studio
```

Verify:
- Tables created correctly
- Admin user exists
- Admin settings populated

---

## 7. Post-Deployment Verification

### Smoke Tests (Manual)

**Test Authentication:**
```bash
# 1. Go to production URL
open https://projectzeta.yourcompany.com

# 2. Sign in as admin
Email: admin@company.com
Password: [admin-password]

# 3. Verify dashboard loads
# 4. Sign out
# 5. Sign in as planner (if seeded)
# 6. Verify read/write access
```

**Test Core Features:**
- [ ] Create new version
- [ ] View version details
- [ ] Edit version (DRAFT status)
- [ ] Duplicate version
- [ ] Compare 2 versions
- [ ] Generate report (PDF)
- [ ] View audit logs (ADMIN only)

**Test API Endpoints:**
```bash
# Health check (should return 200 OK)
curl https://projectzeta.yourcompany.com/api/health

# List versions (requires authentication cookie)
curl https://projectzeta.yourcompany.com/api/versions \
  -H "Cookie: next-auth.session-token=..."
```

### Automated Tests (CI/CD)

Add to your GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 8. Monitoring Setup

### Vercel Analytics

1. Go to Vercel dashboard → **Analytics**
2. Enable analytics (included in free plan)
3. View real-time metrics:
   - Pageviews
   - Unique visitors
   - Top pages
   - Performance (Web Vitals)

### Sentry (Error Tracking)

1. Sign up at [https://sentry.io](https://sentry.io)
2. Create new project (select Next.js)
3. Get DSN: `https://[hash]@sentry.io/[project-id]`
4. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://[hash]@sentry.io/[project-id]
   ```
5. Install Sentry SDK:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```
6. Deploy and verify errors are captured

### Vercel Logs

1. Go to Vercel dashboard → **Logs**
2. Filter by:
   - Deployment (production, preview)
   - Source (build, runtime, static)
   - Status (error, warning, info)
3. Set up log drains (optional):
   - Datadog
   - Logtail
   - Custom webhook

### Uptime Monitoring

Use external service for uptime monitoring:

**Options:**
- [UptimeRobot](https://uptimerobot.com/) (free for 50 monitors)
- [Pingdom](https://www.pingdom.com/)
- [Better Uptime](https://betteruptime.com/)

**Monitor these endpoints:**
- `https://projectzeta.yourcompany.com` (homepage)
- `https://projectzeta.yourcompany.com/api/health` (health check)

**Alert channels:**
- Email
- Slack
- SMS (for critical alerts)

---

## 9. CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm run test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Build
        run: npm run build
      
      - name: Check bundle size
        run: |
          SIZE=$(du -sh .next/ | cut -f1)
          echo "Bundle size: $SIZE"
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Required Secrets

Add to GitHub repository → **Settings → Secrets and variables → Actions**:

| Secret | How to Get |
|--------|------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create Token |
| `ORG_ID` | Vercel → Settings → General → Organization ID |
| `PROJECT_ID` | Vercel → Project → Settings → General → Project ID |
| `SLACK_WEBHOOK` | Slack → Apps → Incoming Webhooks → Add to Workspace |

---

## 10. Rollback Procedures

### Scenario 1: Bad Deployment (Code Issue)

**Option A: Revert to Previous Deployment (Fastest)**

1. Go to Vercel dashboard → **Deployments**
2. Find last working deployment
3. Click **⋯** → **Promote to Production**
4. Confirm promotion (takes ~1 minute)

**Option B: Rollback Git Commit**

```bash
# 1. Identify bad commit
git log --oneline

# 2. Revert commit (creates new commit)
git revert [bad-commit-hash]

# 3. Push to trigger new deployment
git push origin main
```

### Scenario 2: Database Migration Issue

**Option A: Rollback Migration**

```bash
# 1. Check migration history
npx prisma migrate status

# 2. Rollback last migration (manual process)
# Connect to production database via Supabase SQL Editor
# Run migration down script (if you created one)

# 3. If no down script, restore from backup
# Supabase → Settings → Backups → Restore
```

**Option B: Restore Database Backup**

1. Go to Supabase → **Settings → Backups**
2. Find last working backup (before bad migration)
3. Click **Restore** → Confirm (⚠️ WARNING: Destroys current data)
4. Wait 5-10 minutes for restore
5. Verify database state

**⚠️ IMPORTANT:** Restoring backup will lose all data changes since backup time. Use with caution.

### Scenario 3: Environment Variable Issue

1. Go to Vercel → **Settings → Environment Variables**
2. Find incorrect variable
3. Update value
4. Redeploy (Vercel auto-redeploys on env var change)

---

## 11. Troubleshooting

### Issue: Build fails on Vercel

**Symptoms:** Deployment fails during build step

**Diagnosis:**
```bash
# Check Vercel build logs
vercel logs [deployment-url]

# Common errors:
# - TypeScript errors
# - Missing dependencies
# - Environment variable not set
```

**Solutions:**
1. **TypeScript errors:**
   ```bash
   npm run type-check  # Fix errors locally first
   ```

2. **Missing dependencies:**
   ```bash
   # Add to package.json and push
   npm install [missing-package]
   ```

3. **Environment variables:**
   - Verify all required variables set in Vercel dashboard
   - Check variable names match code (case-sensitive)

---

### Issue: Database connection fails

**Symptoms:** API routes return 500 error, logs show "Connection timeout"

**Diagnosis:**
```bash
# Test connection locally
export DATABASE_URL="[production-url]"
npx prisma studio
```

**Solutions:**
1. **Wrong connection string:**
   - Verify `DATABASE_URL` in Vercel env vars
   - Ensure using pgBouncer URL (`?pgbouncer=true`)
   - Check password is correct

2. **Connection pool exhausted:**
   - Increase pgBouncer pool size in Supabase
   - Optimize database queries (add indexes)
   - Implement connection pooling in code

3. **Database down:**
   - Check Supabase status: [https://status.supabase.com](https://status.supabase.com)
   - Contact Supabase support if prolonged outage

---

### Issue: Slow page loads

**Symptoms:** Pages take >5 seconds to load

**Diagnosis:**
```bash
# Run Lighthouse audit
npx lighthouse https://projectzeta.yourcompany.com --view

# Check Vercel Analytics
# Look for slow API routes
```

**Solutions:**
1. **Large bundle size:**
   ```bash
   # Analyze bundle
   npm run build
   npx @next/bundle-analyzer
   
   # Add dynamic imports for heavy components
   const ReportViewer = dynamic(() => import('@/components/ReportViewer'));
   ```

2. **Slow database queries:**
   - Add indexes on frequently queried columns
   - Optimize N+1 queries
   - Implement caching (React Query, SWR)

3. **Large images:**
   - Use Next.js Image component (automatic optimization)
   - Compress images before upload
   - Use WebP format

---

### Issue: Authentication not working

**Symptoms:** Users cannot sign in, redirected to error page

**Diagnosis:**
```bash
# Check NextAuth.js logs in Vercel
vercel logs --filter "auth"

# Common errors:
# - Invalid NEXTAUTH_SECRET
# - Wrong NEXTAUTH_URL
# - Database connection issues
```

**Solutions:**
1. **Invalid NEXTAUTH_SECRET:**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   
   # Update in Vercel env vars
   # Redeploy
   ```

2. **Wrong NEXTAUTH_URL:**
   - Verify matches production URL exactly
   - Include protocol (https://)
   - No trailing slash

3. **Database issues:**
   - Verify `users` table exists
   - Check database migrations applied
   - Ensure user record exists (or create via seed)

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Smoke tests pass (authentication, core features)
- [ ] API health check returns 200 OK
- [ ] Database migrations applied successfully
- [ ] Admin user can sign in
- [ ] Monitoring tools active (Vercel Analytics, Sentry)
- [ ] Uptime monitoring configured
- [ ] SSL certificate active (HTTPS working)
- [ ] Custom domain configured (if applicable)
- [ ] DNS records updated (A/CNAME)
- [ ] Team notified of deployment
- [ ] Rollback plan documented and tested
- [ ] Backup verified (can restore if needed)
- [ ] Default passwords changed
- [ ] Production credentials secured

---

## Maintenance Schedule

### Daily
- Monitor error rates (Sentry)
- Check uptime status
- Review critical logs

### Weekly
- Review Vercel Analytics (traffic, performance)
- Check database size and growth
- Review and close resolved issues
- Update dependencies (security patches)

### Monthly
- Test backup restore procedure
- Review and optimize slow queries
- Rotate API keys and secrets (if compromised)
- Review and update documentation

### Quarterly
- Performance audit (Lighthouse)
- Security audit (dependency vulnerabilities)
- Cost optimization review
- User feedback review and prioritization

---

## Support & Emergency Contacts

### Vercel Support
- **Website:** [vercel.com/support](https://vercel.com/support)
- **Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Status:** [vercel-status.com](https://vercel-status.com)

### Supabase Support
- **Website:** [supabase.com/support](https://supabase.com/support)
- **Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Status:** [status.supabase.com](https://status.supabase.com)

### Emergency Escalation
- **On-call Dev:** [TBD]
- **Project Owner:** Faker Helali
- **Slack Channel:** #project-zeta-alerts

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Next Review:** After first production deployment  
**Maintained By:** Dev Team

---

**🚀 Ready to deploy? Follow this guide step-by-step and verify each section before moving to the next!**

