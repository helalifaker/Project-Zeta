# Verify Connection Strings

## Current Issue

The DIRECT_URL connection is being refused. We need the correct direct connection string from Supabase.

## How to Get Correct Connection Strings

1. **Go to Supabase Dashboard:**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select project: `alcpcjfcbrkdmccpjgit`

2. **Go to Settings → Database**

3. **Scroll to "Connection string" section**

4. **Copy the "Direct connection" string:**
   - It should look like one of these formats:
     ```
     postgresql://postgres:[PASSWORD]@db.alcpcjfcbrkdmccpjgit.supabase.co:5432/postgres
     ```
     OR
     ```
     postgresql://postgres:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
     ```

5. **Update `.env.local` with the EXACT string** (replace [PASSWORD] with your actual password)

## Test After Update

```bash
npm run test:db
```

If connection works, you should see:
```
✅ Connection successful!
✅ Public schema exists
```

Then run migrations:
```bash
npx prisma migrate dev --name init
```

