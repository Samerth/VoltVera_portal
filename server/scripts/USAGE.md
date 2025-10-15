# Quick Start Guide - Database Cleanup Script

## Running the Script

### Method 1: Direct Execution (Recommended)

```bash
# Test first with dry-run
npx tsx server/scripts/cleanupDatabase.ts --dry-run

# Run the actual cleanup
npx tsx server/scripts/cleanupDatabase.ts
```

### Method 2: Using npm script (after adding to package.json)

Add to your `package.json` scripts section:
```json
"cleanup-db": "tsx server/scripts/cleanupDatabase.ts"
```

Then run:
```bash
npm run cleanup-db -- --dry-run
npm run cleanup-db
```

## Common Use Cases

### 1. Reset Database for Testing

```bash
# Preview what will be deleted
npx tsx server/scripts/cleanupDatabase.ts --dry-run

# Proceed with cleanup (will ask for confirmation)
npx tsx server/scripts/cleanupDatabase.ts
```

### 2. Production Cleanup

```bash
# Always test with dry-run first
NODE_ENV=production npx tsx server/scripts/cleanupDatabase.ts --dry-run

# Run actual cleanup (requires double confirmation)
NODE_ENV=production npx tsx server/scripts/cleanupDatabase.ts
```

### 3. Preserve Multiple Users

```bash
# Keep admin-demo and another user
npx tsx server/scripts/cleanupDatabase.ts --preserve admin-demo,VV0001
```

### 4. Automated/Silent Mode (CI/CD)

```bash
# Provide confirmation via stdin
echo "yes" | npx tsx server/scripts/cleanupDatabase.ts
```

## What Happens During Cleanup

1. **Shows Summary** - Displays how many users/records will be deleted
2. **Asks Confirmation** - Requires you to type "yes" to proceed
3. **Deletes in Order**:
   - All user-related data (transactions, purchases, BV records, etc.)
   - All users except preserved ones
   - Resets preserved users' tree relationships
4. **Shows Results** - Displays deletion summary

## Safety Features

✅ Requires confirmation before deletion  
✅ Shows preview of what will be deleted  
✅ Dry-run mode for testing  
✅ Production double-check  
✅ Preserves admin accounts  
✅ Correct deletion order (respects foreign keys)  

## Troubleshooting

### "No users to delete"
Database is already clean. Only preserved users exist.

### "Module not found"
Run from project root directory where package.json exists.

### Script hangs on confirmation
You need to type "yes" (not just "y") and press Enter.

## Next Steps After Cleanup

After running the cleanup:

1. **Verify Database State**
   ```sql
   SELECT COUNT(*) FROM users;  -- Should show only preserved users
   ```

2. **Test Application**
   - Log in as admin
   - Create test users
   - Verify functionality

3. **Create Fresh Test Data**
   - Use the pending recruits workflow
   - Add test users through the admin panel

---

**Need Help?** See the full documentation in [README.md](./README.md)
