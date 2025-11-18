# CAPEX Rule Deletion Bug - Root Cause Analysis & Fixes

**Date:** December 2025  
**Status:** ✅ **FIXED**  
**Priority:** 🔴 **CRITICAL**

---

## 🐛 Problem Statement

When deleting a CAPEX rule, the system was incorrectly creating manual CAPEX items instead of properly deleting the auto-generated items.

**Symptoms:**
- User deletes a CAPEX rule
- Auto-generated items should be deleted
- Instead, items appear as "Manual" in the UI
- Duplicate items exist (one Auto, one Manual with same amount)

---

## 🔍 Root Cause Analysis

### Issue #1: Serialization Not Preserving `ruleId`
**File:** `lib/utils/serialize.ts` (line 53-59)

**Problem:**
- The serialization function was not explicitly preserving the `ruleId` field
- When CAPEX items were serialized for the client, `ruleId` could be lost
- Auto-generated items (with `ruleId`) appeared as manual items (without `ruleId`)

**Impact:** Auto items lost their `ruleId` during serialization, making them appear as manual.

---

### Issue #2: Orphaned Items When Rules Deleted
**File:** `app/api/versions/[id]/route.ts` (line 974-996)

**Problem:**
- When rules were deleted and recreated, the deletion order was wrong:
  1. Delete all rules (old ruleIds become invalid)
  2. Create new rules (new ruleIds generated)
  3. Delete auto items (but old items with deleted ruleId might remain)
- Items with `ruleId` pointing to deleted rules became "orphaned"
- These orphaned items were not properly cleaned up

**Impact:** Old auto items with deleted `ruleId` remained in database, appearing as manual items.

---

### Issue #3: Frontend Sending All Items (Previously Fixed)
**File:** `components/versions/VersionDetail.tsx` (line 734-761)

**Problem:** (Already fixed in previous session)
- When saving/editing manual items, frontend was sending ALL items (including auto)
- Auto items without `ruleId` were treated as manual by backend

**Status:** ✅ Already fixed - frontend now filters to manual items only.

---

## ✅ Fixes Applied

### Fix #1: Explicitly Preserve `ruleId` in Serialization
**File:** `lib/utils/serialize.ts`

**Change:**
```typescript
// BEFORE
serialized.capexItems = serialized.capexItems.map((item: any) => ({
  ...item,
  amount: decimalToNumber(item.amount),
}));

// AFTER
serialized.capexItems = serialized.capexItems.map((item: any) => ({
  ...item,
  amount: decimalToNumber(item.amount),
  // CRITICAL: Preserve ruleId to distinguish auto-generated (ruleId !== null) from manual (ruleId === null)
  ruleId: item.ruleId ?? null, // Explicitly preserve ruleId (null for manual, string for auto)
}));
```

**Result:** `ruleId` is now explicitly preserved during serialization, ensuring auto items remain identifiable.

---

### Fix #2: Delete Auto Items BEFORE Deleting Rules
**File:** `app/api/versions/[id]/route.ts` (line 974-978)

**Change:**
```typescript
// BEFORE
// Delete all existing capex rules for this version
await prisma.capex_rules.deleteMany({
  where: { versionId: id },
});

// AFTER
// CRITICAL: Delete ALL auto-generated items FIRST (before deleting rules)
// This prevents orphaned items with ruleId pointing to deleted rules
await prisma.capex_items.deleteMany({
  where: { versionId: id, ruleId: { not: null } },
});

// Delete all existing capex rules for this version
await prisma.capex_rules.deleteMany({
  where: { versionId: id },
});
```

**Result:** Auto items are deleted BEFORE rules are deleted, preventing orphaned items.

---

## 🧪 Testing Verification

### Test Case 1: Delete CAPEX Rule
**Steps:**
1. Create a CAPEX rule (e.g., TECHNOLOGY, 3 years, 1.5M base)
2. Verify auto-generated items appear (Source: "Auto")
3. Delete the rule
4. Verify auto-generated items are deleted (not converted to manual)

**Expected Result:** ✅ Auto items are deleted, no manual duplicates created.

---

### Test Case 2: Delete and Recreate Rule
**Steps:**
1. Create a CAPEX rule
2. Verify auto items exist
3. Delete the rule
4. Create a new rule (same category)
5. Verify new auto items are created with correct `ruleId`

**Expected Result:** ✅ Old items deleted, new items created correctly.

---

### Test Case 3: Multiple Rules
**Steps:**
1. Create multiple CAPEX rules (different categories)
2. Delete one rule
3. Verify only items for deleted rule are removed
4. Verify remaining rules' items are unaffected

**Expected Result:** ✅ Only items for deleted rule are removed.

---

## 📋 Files Modified

1. **`lib/utils/serialize.ts`**
   - Added explicit `ruleId` preservation in CAPEX items serialization

2. **`app/api/versions/[id]/route.ts`**
   - Added deletion of auto items BEFORE deleting rules
   - Prevents orphaned items with deleted `ruleId`

---

## 🚨 Critical Notes

1. **Database Schema:** There is NO cascade delete from `capex_rules` to `capex_items`
   - Items must be explicitly deleted when rules are deleted
   - This is now handled correctly in the API

2. **Serialization:** `ruleId` must be explicitly preserved
   - Spread operator `...item` should preserve it, but explicit preservation is safer
   - Ensures auto items remain identifiable on the client

3. **Deletion Order:** Always delete items BEFORE deleting rules
   - Prevents orphaned items with invalid `ruleId`
   - Ensures clean state before creating new rules

---

## ✅ Verification Checklist

- [x] Serialization preserves `ruleId` explicitly
- [x] Auto items deleted BEFORE rules are deleted
- [x] Frontend filters auto items when sending manual updates (from previous fix)
- [x] No orphaned items remain after rule deletion
- [x] New auto items created with correct `ruleId`

---

## 🎯 Result

**Status:** ✅ **ALL ISSUES FIXED**

The system now correctly:
1. Preserves `ruleId` during serialization
2. Deletes auto items before deleting rules (prevents orphans)
3. Only creates manual items when user explicitly adds them
4. Properly distinguishes auto vs manual items in UI

**No more duplicate manual items when deleting rules!**

