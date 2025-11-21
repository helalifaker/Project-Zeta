# Admin UI Quick Start Guide

**Created:** November 20, 2025
**Purpose:** Guide for using the new Historical Data Upload interface

---

## What Was Created

✅ **Admin Historical Data Page**

- File: `app/admin/historical-data/page.tsx`
- Route: `http://localhost:3000/admin/historical-data`

**Features:**

- Upload historical data for 2023 and 2024
- Select version from dropdown
- Select year (2023 or 2024)
- Enter 5 financial metrics (Revenue, Staff Cost, Rent, Opex, Capex)
- View existing historical data
- Edit existing data (auto-fills form when year is selected)
- Delete historical data
- Form validation
- Success/error messages

---

## Step-by-Step Setup

### Step 1: Apply Database Migration 🔴 REQUIRED

Before using the UI, you MUST apply the database migration:

```bash
cd /Users/fakerhelali/Desktop/Project\ Zeta
npx prisma db push
```

Expected output:

```
✔ Generated Prisma Client
✔ The database is now in sync with your Prisma schema
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Access the Admin Page

Open your browser and navigate to:

```
http://localhost:3000/admin/historical-data
```

---

## How to Use the Interface

### Upload Historical Data

1. **Select a Version**
   - Choose the version you want to upload data for
   - The dropdown shows all available versions

2. **Select a Year**
   - Choose either 2023 or 2024
   - If data exists for that year, it will auto-fill the form

3. **Enter Financial Data**
   - Revenue (SAR)
   - Staff Cost (SAR)
   - Rent (SAR)
   - Opex (SAR)
   - Capex (SAR)

4. **Click "Save Historical Data"**
   - The system will validate your input
   - Success message will appear
   - Data will be refreshed automatically

### View Existing Data

On the right side panel, you'll see:

- All historical data for the selected version
- Cards showing each year (2023, 2024)
- All financial metrics formatted as currency
- Last updated timestamp

### Edit Existing Data

1. Select the version
2. Select the year you want to edit
3. The form will auto-fill with existing data
4. Modify the values
5. Click "Save Historical Data"
6. The system will update (upsert) the record

### Delete Historical Data

1. Find the year card in the right panel
2. Click the trash icon
3. Confirm deletion
4. Data will be deleted and form will clear

---

## Validation Rules

The form enforces the following validation:

✅ **Required Fields:**

- Version must be selected
- Year must be 2023 or 2024
- All 5 financial fields are required

✅ **Value Validation:**

- All amounts must be non-negative (≥ 0)
- Must be valid numbers

❌ **Errors Shown:**

- "Please select a version"
- "All financial fields are required"
- "[field] cannot be negative"
- "Failed to save historical data" (server errors)

---

## What Happens After Upload

Once you upload historical data:

### 1. Historical Period (2023-2024)

- Calculations will automatically use your uploaded actual data
- This data is read-only in financial projections
- Replaces any calculated values

### 2. Transition Period (2025-2027)

- Still needs manual rent to be configured in rent_plans
- Will use 1850 student capacity cap
- Staff costs calculated like dynamic period

### 3. Dynamic Period (2028-2052)

- Continues to work as before
- No changes to existing functionality

---

## Setting Transition Rent (2025-2027)

The UI doesn't yet support setting transition rent. You need to do this manually:

### Option A: Prisma Studio

```bash
npx prisma studio
```

1. Open `rent_plans` table
2. Find your version's rent plan
3. Edit `parameters` JSON
4. Add: `"transitionRent": 11000000`
5. Save

### Option B: Database Query

```sql
UPDATE rent_plans
SET parameters = jsonb_set(parameters, '{transitionRent}', '11000000')
WHERE "versionId" = 'your-version-id';
```

---

## Example: Complete Data Entry

Here's an example of uploading complete historical data:

### 2023 Data Entry:

```
Version: My School Planning v1
Year: 2023
Revenue: 50,000,000 SAR
Staff Cost: 20,000,000 SAR
Rent: 10,000,000 SAR
Opex: 5,000,000 SAR
Capex: 2,000,000 SAR
```

### 2024 Data Entry:

```
Version: My School Planning v1
Year: 2024
Revenue: 52,000,000 SAR
Staff Cost: 21,000,000 SAR
Rent: 10,500,000 SAR
Opex: 5,200,000 SAR
Capex: 1,800,000 SAR
```

---

## Troubleshooting

### Issue: "Failed to fetch versions"

**Cause:** API endpoint `/api/versions` not responding

**Solution:**

1. Check if dev server is running
2. Check browser console for errors
3. Verify `/api/versions` endpoint exists

### Issue: "Failed to save historical data"

**Possible causes:**

1. Database migration not applied
2. Version doesn't exist
3. Invalid data format

**Solution:**

1. Run `npx prisma db push`
2. Verify version ID exists in database
3. Check browser console for detailed error

### Issue: Page not found (404)

**Cause:** File not in correct location

**Solution:**
Verify file exists at: `app/admin/historical-data/page.tsx`

### Issue: Components not found

**Cause:** Missing UI components

**Solution:**
Make sure these exist:

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `components/ui/label.tsx`
- `components/ui/card.tsx`
- `components/ui/alert.tsx`

---

## API Endpoints Used

The UI interacts with these endpoints:

### GET /api/versions

- Fetches all versions for dropdown
- Response: `{ versions: [...] }`

### GET /api/admin/historical-data?versionId=xxx

- Fetches historical data for a version
- Response: `{ success: true, data: [...] }`

### POST /api/admin/historical-data

- Creates or updates historical data
- Body: `{ versionId, year, revenue, staffCost, rent, opex, capex }`
- Response: `{ success: true, data: {...} }`

### DELETE /api/admin/historical-data?id=xxx

- Deletes a historical record
- Response: `{ success: true, message: "..." }`

---

## Security Notes

⚠️ **Important:**

The API endpoints do NOT currently have authentication checks (marked as TODO).

This is acceptable for development but MUST be fixed before production:

```typescript
// TODO: Add authentication check
// const session = await getServerSession();
// if (!session || session.user.role !== 'ADMIN') {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
// }
```

**Recommendation:** Add authentication middleware before deploying to production.

---

## Next Steps

### Immediate (Development):

1. ✅ UI is ready to use
2. 🔴 Apply database migration
3. ✅ Start uploading historical data

### Before Production:

1. 🔴 Add authentication to API endpoints
2. 🟡 Create UI for setting transition rent
3. 🟡 Add admin navigation menu
4. 🟡 Add data export functionality
5. 🟡 Add bulk upload (Excel import)

---

## Features Not Yet Implemented

These features are planned but not yet built:

- 🟡 **Transition Rent UI** - Currently requires manual database update
- 🟡 **Excel Import** - Bulk upload historical data via Excel file
- 🟡 **Audit Trail** - Track who uploaded/modified data
- 🟡 **Data Validation** - Cross-check revenue = tuition × students
- 🟡 **Approval Workflow** - Review/approve historical data before use
- 🟡 **Data Export** - Download historical data as Excel/CSV

---

## Testing Checklist

Before considering the UI complete, test these scenarios:

- [ ] Upload 2023 data successfully
- [ ] Upload 2024 data successfully
- [ ] Edit existing 2023 data
- [ ] Edit existing 2024 data
- [ ] Delete 2023 data
- [ ] Delete 2024 data
- [ ] Switch between versions
- [ ] Verify validation messages
- [ ] Verify currency formatting
- [ ] Verify data persists after page refresh
- [ ] Test with version that has no historical data
- [ ] Test with version that has partial data (only 2023 or 2024)

---

## UI Screenshots (Description)

### Main Layout:

```
┌─────────────────────────────────────────────────────────────┐
│  Historical Data Upload                                      │
│  Upload actual financial data for historical periods         │
├─────────────────────────┬───────────────────────────────────┤
│ Upload Historical Data  │  Existing Historical Data         │
│                         │                                   │
│ Version: [Select   ▼]  │  [No data message]                │
│ Year: [2023      ▼]     │   OR                              │
│                         │  ┌─────────────────────────────┐  │
│ Revenue (SAR): [input]  │  │ Year 2023            [🗑️]  │  │
│ Staff Cost (SAR): [...] │  │ Revenue: SAR 50,000,000    │  │
│ Rent (SAR): [input]     │  │ Staff Cost: SAR 20,000,000 │  │
│ Opex (SAR): [input]     │  │ ...                        │  │
│ Capex (SAR): [input]    │  └─────────────────────────────┘  │
│                         │                                   │
│ [Save Historical Data]  │  ┌─────────────────────────────┐  │
└─────────────────────────┴──│ Year 2024            [🗑️]  │  │
                              │ Revenue: SAR 52,000,000    │  │
                              │ Staff Cost: SAR 21,000,000 │  │
                              │ ...                        │  │
                              └─────────────────────────────┘  │
                              └───────────────────────────────┘
```

---

## Summary

✅ **What's Complete:**

- Full-featured Admin UI
- Form validation
- CRUD operations (Create, Read, Update, Delete)
- Auto-fill for editing
- Currency formatting
- Error handling
- Success messages
- Responsive layout

🟡 **What's Pending:**

- Database migration (1 command)
- Authentication (security)
- Transition rent UI
- Advanced features (Excel import, audit trail)

---

**Ready to Use:** YES (after applying migration)

**Production Ready:** NO (needs authentication)

**Documentation:** Complete

**Next Action:** Run `npx prisma db push` to create the database table

---

**Created By:** Claude Code
**Date:** November 20, 2025
**Status:** ✅ Ready for Development Use
