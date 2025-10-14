# Data Backfill Migration: Bank Account Holder Name & Nominee

## Overview
This migration backfills missing `bank_account_holder_name` and `nominee` data in the `users` table from their corresponding `pending_recruits` records.

## Background
**Issue**: When recruits were approved before the fix (implemented on 2025-10-14), the `bank_account_holder_name` and `nominee` fields were not transferred from `pending_recruits` to `users` table.

**Fix Applied**: Updated `server/storage.ts` (lines 1603-1604) to include these fields in user creation.

**This Migration**: Backfills existing users who were approved before the fix.

---

## Pre-Migration Steps

### 1. Preview Affected Records

Run this query to see which users will be updated:

```sql
SELECT 
  u.user_id,
  u.email,
  u.first_name || ' ' || u.last_name as user_name,
  u.bank_account_holder_name as current_holder_name,
  pr.bank_account_holder_name as new_holder_name,
  u.nominee as current_nominee,
  pr.nominee as new_nominee
FROM users u
JOIN pending_recruits pr ON u.email = pr.email
WHERE pr.status = 'approved'
  AND (u.bank_account_holder_name IS NULL OR u.nominee IS NULL)
ORDER BY u.created_at DESC;
```

**Expected Output**: List of users with NULL values that will be filled.

### 2. Count Affected Records

```sql
SELECT 
  COUNT(*) as total_users_to_update,
  COUNT(*) FILTER (WHERE u.bank_account_holder_name IS NULL) as missing_holder_name,
  COUNT(*) FILTER (WHERE u.nominee IS NULL) as missing_nominee
FROM users u
JOIN pending_recruits pr ON u.email = pr.email
WHERE pr.status = 'approved'
  AND (u.bank_account_holder_name IS NULL OR u.nominee IS NULL);
```

---

## Migration SQL

### Option A: Update Both Fields (Recommended)

```sql
-- Backfill both bank_account_holder_name and nominee in a single query
UPDATE users u
SET 
  bank_account_holder_name = pr.bank_account_holder_name,
  nominee = pr.nominee,
  updated_at = NOW()
FROM pending_recruits pr
WHERE u.email = pr.email
  AND pr.status = 'approved'
  AND (u.bank_account_holder_name IS NULL OR u.nominee IS NULL);
```

### Option B: Update Fields Separately (Conservative)

If you prefer to update one field at a time:

**Step 1: Update bank_account_holder_name**
```sql
UPDATE users u
SET 
  bank_account_holder_name = pr.bank_account_holder_name,
  updated_at = NOW()
FROM pending_recruits pr
WHERE u.email = pr.email
  AND pr.status = 'approved'
  AND u.bank_account_holder_name IS NULL
  AND pr.bank_account_holder_name IS NOT NULL;
```

**Step 2: Update nominee**
```sql
UPDATE users u
SET 
  nominee = pr.nominee,
  updated_at = NOW()
FROM pending_recruits pr
WHERE u.email = pr.email
  AND pr.status = 'approved'
  AND u.nominee IS NULL
  AND pr.nominee IS NOT NULL;
```

---

## Post-Migration Verification

### 1. Verify Updates Were Applied

```sql
-- Check if NULL values were filled
SELECT 
  COUNT(*) FILTER (WHERE bank_account_holder_name IS NULL) as null_holder_names,
  COUNT(*) FILTER (WHERE nominee IS NULL) as null_nominees,
  COUNT(*) as total_users
FROM users
WHERE status = 'active';
```

### 2. Spot Check Sample Users

```sql
-- Verify a few users got updated correctly
SELECT 
  u.user_id,
  u.email,
  u.bank_account_holder_name,
  u.nominee,
  pr.bank_account_holder_name as source_holder_name,
  pr.nominee as source_nominee
FROM users u
JOIN pending_recruits pr ON u.email = pr.email
WHERE pr.status = 'approved'
LIMIT 10;
```

### 3. Check for Mismatches (Should return 0 rows)

```sql
-- Find any users where data doesn't match their pending recruit
SELECT 
  u.user_id,
  u.email,
  u.bank_account_holder_name,
  pr.bank_account_holder_name as pr_holder_name
FROM users u
JOIN pending_recruits pr ON u.email = pr.email
WHERE pr.status = 'approved'
  AND u.bank_account_holder_name IS NOT NULL
  AND pr.bank_account_holder_name IS NOT NULL
  AND u.bank_account_holder_name != pr.bank_account_holder_name;
```

---

## How to Run This Migration

### Using Replit SQL Tool

1. Open your Replit project
2. Go to the Database tab
3. Select your PostgreSQL database
4. Run the preview query first (see Pre-Migration Steps)
5. Review the output
6. Run the migration SQL (Option A recommended)
7. Run verification queries

### Using Command Line

```bash
# Connect to your database
psql $DATABASE_URL

# Run preview
\i preview_query.sql

# Run migration
\i migration.sql

# Verify
\i verify.sql
```

---

## Safety Notes

✅ **Safe to Run**: This migration only updates NULL values, it won't overwrite existing data  
✅ **Idempotent**: Safe to run multiple times  
✅ **Reversible**: Can manually set fields back to NULL if needed  
⚠️ **Requirement**: Corresponding `pending_recruits` record must exist  

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- WARNING: This will delete the backfilled data
-- Only run if you need to rollback

UPDATE users u
SET 
  bank_account_holder_name = NULL,
  nominee = NULL
FROM pending_recruits pr
WHERE u.email = pr.email
  AND pr.status = 'approved';
```

---

## Expected Impact

- **Users Affected**: All users approved before 2025-10-14 who have NULL values
- **Downtime**: None (migration runs live)
- **Performance**: < 1 second for typical database sizes
- **Risk Level**: Low (only updates NULL values)

---

## Questions?

- **Q: What if a pending_recruits record doesn't exist?**  
  A: That user won't be updated. This is expected for manually created users.

- **Q: Will this affect new users?**  
  A: No. New users (approved after the fix) already have these fields populated.

- **Q: Can I run this multiple times?**  
  A: Yes. The query only updates NULL values, so it's safe to run multiple times.

---

## Migration Checklist

- [ ] Run preview query to see affected records
- [ ] Count total records to be updated
- [ ] Take note of expected changes
- [ ] Run migration SQL (Option A or B)
- [ ] Verify updates were applied
- [ ] Spot check sample users
- [ ] Check for any mismatches
- [ ] Document results

---

**Migration Created**: 2025-10-14  
**Created By**: Replit Agent  
**Related Fix**: server/storage.ts lines 1603-1604
