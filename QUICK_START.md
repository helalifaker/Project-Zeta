# Quick Start Guide
## Get Project Zeta Running in 5 Minutes

---

## ✅ Step 1: Environment Setup (DONE!)

The `.env.local` file has been created with:
- ✅ Auto-generated `NEXTAUTH_SECRET`
- ✅ Placeholder values for database connection

**File location:** `.env.local` (in project root)

---

## 📝 Step 2: Set Up Supabase Database

### Option A: Supabase (Recommended - 2 minutes)

1. **Create Supabase Project:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Click **"New Project"**
   - Fill in:
     - Name: `Project Zeta Development`
     - Password: Create a strong password (save it!)
     - Region: Choose closest to you
   - Click **"Create new project"**
   - Wait 2-3 minutes

2. **Get Connection Strings:**
   - Go to **Settings → Database**
   - Scroll to **"Connection string"**
   - Copy **Session mode (pgBouncer):**
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
     ```
   - Copy **Direct connection:**
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```

3. **Update `.env.local`:**
   - Open `.env.local` in your editor
   - Replace `[YOUR-PROJECT-REF]` with your project reference (e.g., `abcdefghijklmnop`)
   - Replace `[YOUR-PASSWORD]` with your database password
   - Replace `[YOUR-REGION]` with your region (e.g., `us-east-1`)

   **Example:**
   ```bash
   DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
   DIRECT_URL="postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

### Option B: Local PostgreSQL (5 minutes)

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for local setup instructions.

---

## 🗄️ Step 3: Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create all database tables
npx prisma migrate dev --name init

# Seed database (creates admin users and settings)
npx prisma db seed
```

**Expected output:**
```
✅ Admin user created: admin@company.com
✅ Planner user created: planner@company.com
✅ Viewer user created: viewer@company.com
✅ Setting created: cpiRate = 0.03
...
🎉 Database seed completed successfully!
```

---

## ✅ Step 4: Verify Setup

```bash
# Start development server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "status": "connected"
    }
  }
}
```

---

## 🎉 Step 5: You're Ready!

1. **Open browser:** [http://localhost:3000](http://localhost:3000)
2. **View database:** `npx prisma studio` (opens at http://localhost:5555)
3. **Test login:** (after Phase 0.3 - Authentication Setup)

---

## 🔐 Default Users (After Seeding)

| Email | Password | Role |
|-------|----------|------|
| `admin@company.com` | `admin123` | ADMIN |
| `planner@company.com` | `planner123` | PLANNER |
| `viewer@company.com` | `viewer123` | VIEWER |

**⚠️ IMPORTANT:** Change these passwords immediately in production!

---

## 🐛 Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
- Verify `.env.local` has correct connection strings
- Check Supabase project is active (not paused)
- Ensure password is correct (no special characters need encoding)

### Issue: "Migration failed"

**Solution:**
- Ensure `DIRECT_URL` is set (not `DATABASE_URL` for migrations)
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

---

## 📚 Next Steps

After database is set up:

1. ✅ **Phase 0.2 Complete** - Database ready
2. ⏳ **Phase 0.3** - Authentication Setup (NextAuth.js)
3. ⏳ **Phase 0.4** - Design System & UI Components
4. ⏳ **Phase 0.5** - Core Utilities & Helpers

---

## 📖 Additional Resources

- **Detailed Setup:** [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **API Documentation:** [API.md](API.md)
- **Database Schema:** [SCHEMA.md](SCHEMA.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Need Help?** Check the documentation files or see [README.md](README.md) for more information.

