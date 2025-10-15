# Database Cleanup Script

This directory contains production-ready database cleanup scripts for the Voltverashop MLM application.

## cleanupDatabase.ts

A comprehensive script to safely remove all users and their related data except for specified preserved users.

### Features

- ✅ **Production-Safe**: Requires explicit confirmation before deletion
- ✅ **Preserves Critical Users**: Keeps admin accounts and other specified users intact
- ✅ **Correct Deletion Order**: Respects foreign key constraints to avoid errors
- ✅ **Dry Run Mode**: Test the script without actually deleting data
- ✅ **Detailed Logging**: Shows exactly what will be deleted
- ✅ **Comprehensive**: Cleans all 19+ related tables in the correct order

### Installation

Add this script to your `package.json`:

```json
{
  "scripts": {
    "cleanup-db": "tsx server/scripts/cleanupDatabase.ts"
  }
}
```

### Usage

#### Basic Usage (Development)

```bash
# Interactive cleanup - will ask for confirmation
npm run cleanup-db

# Dry run - see what would be deleted without actually deleting
npm run cleanup-db -- --dry-run
```

#### Production Usage

```bash
# Production cleanup with confirmation
NODE_ENV=production npm run cleanup-db

# Production dry run
NODE_ENV=production npm run cleanup-db -- --dry-run
```

#### Advanced Options

```bash
# Preserve multiple users
npm run cleanup-db -- --preserve admin-demo,VV0001,VV0002

# Quiet mode (less verbose output)
npm run cleanup-db -- --quiet

# Show help
npm run cleanup-db -- --help
```

### Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Run without actually deleting data |
| `--preserve <ids>` | `-p` | Comma-separated user IDs to preserve (default: admin-demo) |
| `--quiet` | `-q` | Reduce output verbosity |
| `--help` | `-h` | Show help message |

### What Gets Deleted

The script deletes data in the following order to respect foreign key constraints:

1. **Pending Recruits** - All pending recruitment requests
2. **Transactions** - User transaction history (except preserved users)
3. **Purchases** - Product purchases (except preserved users)
4. **BV Transactions** - Business Volume transaction records
5. **Lifetime BV Calculations** - Lifetime business volume data
6. **Monthly BV** - Monthly business volume records
7. **Email Tokens** - Password reset and verification tokens
8. **Notifications** - User notifications
9. **Wallet Balances** - User wallet data
10. **Support Tickets** - Customer support tickets
11. **Achievers** - Achievement records
12. **Rank Achievements** - Rank progression data
13. **KYC Documents** - Know Your Customer documentation
14. **Fund Requests** - Fund deposit requests
15. **Withdrawal Requests** - Withdrawal requests
16. **Recruitment Requests** - Recruitment submissions
17. **Referral Links** - Referral link data
18. **Franchise Requests** - Franchise applications
19. **Cheques** - Cheque payment records
20. **Tree Relationships Reset** - Resets preserved users' tree structure
21. **Users** - Finally deletes all users except preserved ones

### What Gets Preserved

By default, the following is preserved:

- **admin-demo** user account and all related data
- Any additional users specified with `--preserve` flag
- All products and product configurations
- Rank configurations
- News items
- Sessions (will expire naturally)

### Examples

#### Example 1: Fresh Start for Testing

```bash
# First, do a dry run to see what would be deleted
npm run cleanup-db -- --dry-run

# If everything looks good, run the actual cleanup
npm run cleanup-db
# Answer "yes" when prompted
```

#### Example 2: Preserve Multiple Admin Accounts

```bash
# Keep admin-demo and ADMIN accounts
npm run cleanup-db -- --preserve admin-demo,ADMIN
```

#### Example 3: Production Cleanup

```bash
# Production requires double confirmation for safety
NODE_ENV=production npm run cleanup-db -- --preserve admin-demo
# Answer "yes" twice when prompted
```

### Safety Features

1. **Confirmation Required**: Script always asks for confirmation before deleting (unless --dry-run)
2. **Production Double-Check**: Extra confirmation required in production environment
3. **Dry Run Mode**: Test the script without consequences
4. **Detailed Summary**: Shows exactly what will be deleted before executing
5. **Error Handling**: Stops on errors to prevent partial cleanup
6. **Logging**: Timestamped logs of all operations

### Output Example

```
=== DATABASE CLEANUP SCRIPT ===

Configuration:
  Environment: development
  Dry Run: NO
  Preserved Users: admin-demo

Current Database State:
  Total Users: 45
  Users to Delete: 44
  Users to Preserve: 1

Users that will be preserved:
  - admin-demo (admin@voltverashop.com) [admin]

Do you want to proceed with deletion? (yes/no): yes

Starting cleanup process...

✓ Deleted 1 pending recruits
✓ Deleted 35 transactions
✓ Deleted 19 purchases
✓ Deleted 10 BV transactions
...

=== CLEANUP SUMMARY ===

Successfully deleted:
  pendingRecruits: 1 record(s)
  transactions: 35 record(s)
  purchases: 19 record(s)
  ...

✓ Database cleanup completed successfully!

Final Database State:
  Total Users: 1
  Preserved Users: 1
```

### Troubleshooting

#### Error: "Cannot delete due to foreign key constraint"

This should not happen as the script deletes in the correct order. If it does:
1. Check if any new tables were added that reference users
2. Update the script to delete from those tables first

#### Error: "Module not found"

Make sure you're running from the project root directory:
```bash
cd /path/to/voltverashop
npm run cleanup-db
```

#### Script doesn't ask for confirmation

Check if you're running in CI/CD environment. The script detects this and may skip interactive prompts.

### Integration with CI/CD

For automated testing environments:

```bash
# Add to your CI/CD pipeline before tests
npm run cleanup-db -- --preserve admin-demo --quiet
# Provide "yes" via stdin if needed
echo "yes" | npm run cleanup-db
```

### Maintenance

When adding new database tables that reference users:

1. Add the table import at the top of the script
2. Add a deletion step in the appropriate order
3. Test with `--dry-run` first
4. Update this README with the new table

### Support

For issues or questions:
- Check the application logs
- Review the database schema in `shared/schema.ts`
- Contact the development team

---

**⚠️ Warning**: This script permanently deletes data. Always use `--dry-run` first to verify what will be deleted, especially in production environments.
