# Database Setup Guide
## Quick Start for Supabase + Prisma

This guide will help you set up the database for Project Zeta.

---

## Option 1: Supabase (Recommended)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in details:
   - **Name:** Project Zeta Development
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you
   - **Plan:** Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for project creation

### Step 2: Get Connection Strings

1. Go to **Settings → Database**
2. Scroll to **"Connection string"**
3. Copy **Session mode (pgBouncer):**
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```
4. Copy **Direct connection:**
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```

### Step 3: Set Environment Variables

Create `.env.local` file in project root:

```bash
# Database URLs (from Step 2)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# NextAuth.js (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Step 4: Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed database (creates admin users)
npx prisma db seed
```

### Step 5: Verify Setup

```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```

You should see:
- ✅ All 9 tables created
- ✅ 3 users (admin, planner, viewer)
- ✅ 7 admin settings

---

## Option 2: Local PostgreSQL

### Step 1: Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-15
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Create database
createdb project_zeta

# Or using psql
psql postgres
CREATE DATABASE project_zeta;
\q
```

### Step 3: Set Environment Variables

Create `.env.local`:

```bash
DATABASE_URL="postgresql://localhost:5432/project_zeta?pgbouncer=false"
DIRECT_URL="postgresql://localhost:5432/project_zeta"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### Step 4: Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

---

## Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
- Check connection string is correct
- Verify database is running (local) or project is active (Supabase)
- Check firewall/network settings

### Issue: "Migration failed"

**Solution:**
- Ensure DIRECT_URL is set (not DATABASE_URL for migrations)
- Check database has proper permissions
- Try: `npx prisma migrate reset` (⚠️ deletes all data)

### Issue: "Prisma Client not found"

**Solution:**
```bash
npx prisma generate
```

### Issue: "Seed script fails"

**Solution:**
- Ensure migrations ran successfully first
- Check bcryptjs is installed: `npm install bcryptjs @types/bcryptjs`
- Verify users table exists: `npx prisma studio`

---

## Next Steps

After database setup is complete:

1. ✅ Verify tables exist (use Prisma Studio)
2. ✅ Test connection in code:
   ```typescript
   import { prisma } from '@/lib/db/prisma';
   const users = await prisma.user.findMany();
   console.log(users);
   ```
3. ✅ Proceed to Phase 0.3: Authentication Setup

---

**Need Help?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.

