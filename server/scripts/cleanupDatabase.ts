import { db } from '../db';
import { 
  users, 
  pendingRecruits, 
  transactions, 
  purchases, 
  bvTransactions, 
  lifetimeBvCalculations,
  monthlyBv,
  emailTokens,
  notifications,
  walletBalances,
  supportTickets,
  achievers,
  rankAchievements,
  kycDocuments,
  fundRequests,
  withdrawalRequests,
  recruitmentRequests,
  referralLinks,
  franchiseRequests,
  cheques
} from '../../shared/schema';
import { eq, and, not } from 'drizzle-orm';
import * as readline from 'readline';

/**
 * Database Cleanup Script
 * 
 * This script safely removes all users and their related data except for specified preserved users.
 * Deletion is performed in the correct order to respect foreign key constraints.
 * 
 * USAGE:
 * - Development: npm run cleanup-db
 * - Production: NODE_ENV=production npm run cleanup-db
 * 
 * SAFETY FEATURES:
 * - Requires explicit confirmation before deletion
 * - Preserves specified users (default: admin-demo)
 * - Logs all operations
 * - Deletes data in correct order to avoid constraint violations
 */

interface CleanupOptions {
  preserveUserIds: string[];
  dryRun: boolean;
  verbose: boolean;
}

const DEFAULT_OPTIONS: CleanupOptions = {
  preserveUserIds: ['admin-demo'],
  dryRun: false,
  verbose: true
};

function log(message: string, verbose: boolean = true) {
  if (verbose || !DEFAULT_OPTIONS.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

function logSuccess(message: string) {
  console.log(`\x1b[32m✓\x1b[0m ${message}`);
}

function logWarning(message: string) {
  console.log(`\x1b[33m⚠\x1b[0m ${message}`);
}

function logError(message: string) {
  console.error(`\x1b[31m✗\x1b[0m ${message}`);
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function getUserStats(preserveUserIds: string[]) {
  const allUsers = await db.select().from(users);
  const usersToDelete = allUsers.filter(u => u.userId && !preserveUserIds.includes(u.userId));
  const usersToPreserve = allUsers.filter(u => u.userId && preserveUserIds.includes(u.userId));

  return {
    total: allUsers.length,
    toDelete: usersToDelete.length,
    toPreserve: usersToPreserve.length,
    preservedUsers: usersToPreserve.map(u => ({ userId: u.userId || '', email: u.email, role: u.role }))
  };
}

async function cleanupDatabase(options: CleanupOptions = DEFAULT_OPTIONS) {
  const { preserveUserIds, dryRun, verbose } = options;

  console.log('\n=== DATABASE CLEANUP SCRIPT ===\n');
  
  // Display configuration
  console.log('Configuration:');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`  Preserved Users: ${preserveUserIds.join(', ')}`);
  console.log('');

  // Get user statistics
  log('Fetching user statistics...', verbose);
  const stats = await getUserStats(preserveUserIds);
  
  console.log('Current Database State:');
  console.log(`  Total Users: ${stats.total}`);
  console.log(`  Users to Delete: ${stats.toDelete}`);
  console.log(`  Users to Preserve: ${stats.toPreserve}`);
  console.log('');
  
  if (stats.preservedUsers.length > 0) {
    console.log('Users that will be preserved:');
    stats.preservedUsers.forEach(u => {
      console.log(`  - ${u.userId} (${u.email}) [${u.role}]`);
    });
    console.log('');
  }

  // Safety check
  if (stats.toDelete === 0) {
    logWarning('No users to delete. Exiting.');
    return;
  }

  if (!dryRun) {
    // Require confirmation in production
    if (process.env.NODE_ENV === 'production') {
      logWarning('WARNING: You are about to delete data in PRODUCTION environment!');
      const confirmed = await askConfirmation('Are you absolutely sure you want to proceed?');
      if (!confirmed) {
        console.log('Operation cancelled.');
        return;
      }
    } else {
      const confirmed = await askConfirmation('Do you want to proceed with deletion?');
      if (!confirmed) {
        console.log('Operation cancelled.');
        return;
      }
    }
  }

  console.log('\nStarting cleanup process...\n');

  try {
    // Track deletion counts
    const deletionStats: Record<string, number> = {};

    // Step 1: Delete pending recruits
    log('Step 1: Deleting pending recruits...', verbose);
    if (!dryRun) {
      const result = await db.delete(pendingRecruits).returning();
      deletionStats.pendingRecruits = result.length;
      logSuccess(`Deleted ${result.length} pending recruits`);
    } else {
      logSuccess('DRY RUN: Would delete all pending recruits');
    }

    // Step 2: Delete transactions (except preserved users)
    log('Step 2: Deleting transactions...', verbose);
    if (!dryRun) {
      const result = await db.delete(transactions)
        .where(not(eq(transactions.userId, preserveUserIds[0])))
        .returning();
      deletionStats.transactions = result.length;
      logSuccess(`Deleted ${result.length} transactions`);
    } else {
      logSuccess('DRY RUN: Would delete transactions');
    }

    // Step 3: Delete purchases (except preserved users)
    log('Step 3: Deleting purchases...', verbose);
    if (!dryRun) {
      const result = await db.delete(purchases)
        .where(not(eq(purchases.userId, preserveUserIds[0])))
        .returning();
      deletionStats.purchases = result.length;
      logSuccess(`Deleted ${result.length} purchases`);
    } else {
      logSuccess('DRY RUN: Would delete purchases');
    }

    // Step 4: Delete BV transactions (except preserved users)
    log('Step 4: Deleting BV transactions...', verbose);
    if (!dryRun) {
      const result = await db.delete(bvTransactions)
        .where(not(eq(bvTransactions.userId, preserveUserIds[0])))
        .returning();
      deletionStats.bvTransactions = result.length;
      logSuccess(`Deleted ${result.length} BV transactions`);
    } else {
      logSuccess('DRY RUN: Would delete BV transactions');
    }

    // Step 5: Delete lifetime BV calculations (except preserved users)
    log('Step 5: Deleting lifetime BV calculations...', verbose);
    if (!dryRun) {
      const result = await db.delete(lifetimeBvCalculations)
        .where(not(eq(lifetimeBvCalculations.userId, preserveUserIds[0])))
        .returning();
      deletionStats.lifetimeBvCalculations = result.length;
      logSuccess(`Deleted ${result.length} lifetime BV calculations`);
    } else {
      logSuccess('DRY RUN: Would delete lifetime BV calculations');
    }

    // Step 6: Delete monthly BV (except preserved users)
    log('Step 6: Deleting monthly BV...', verbose);
    if (!dryRun) {
      const result = await db.delete(monthlyBv)
        .where(not(eq(monthlyBv.userId, preserveUserIds[0])))
        .returning();
      deletionStats.monthlyBv = result.length;
      logSuccess(`Deleted ${result.length} monthly BV records`);
    } else {
      logSuccess('DRY RUN: Would delete monthly BV');
    }

    // Step 7: Delete email tokens
    log('Step 7: Deleting email tokens...', verbose);
    if (!dryRun) {
      const result = await db.delete(emailTokens).returning();
      deletionStats.emailTokens = result.length;
      logSuccess(`Deleted ${result.length} email tokens`);
    } else {
      logSuccess('DRY RUN: Would delete all email tokens');
    }

    // Step 8: Delete notifications (except preserved users)
    log('Step 8: Deleting notifications...', verbose);
    if (!dryRun) {
      const result = await db.delete(notifications)
        .where(not(eq(notifications.userId, preserveUserIds[0])))
        .returning();
      deletionStats.notifications = result.length;
      logSuccess(`Deleted ${result.length} notifications`);
    } else {
      logSuccess('DRY RUN: Would delete notifications');
    }

    // Step 9: Delete wallet balances (except preserved users)
    log('Step 9: Deleting wallet balances...', verbose);
    if (!dryRun) {
      const result = await db.delete(walletBalances)
        .where(not(eq(walletBalances.userId, preserveUserIds[0])))
        .returning();
      deletionStats.walletBalances = result.length;
      logSuccess(`Deleted ${result.length} wallet balances`);
    } else {
      logSuccess('DRY RUN: Would delete wallet balances');
    }

    // Step 10: Delete support tickets (except preserved users)
    log('Step 10: Deleting support tickets...', verbose);
    if (!dryRun) {
      const result = await db.delete(supportTickets)
        .where(not(eq(supportTickets.userId, preserveUserIds[0])))
        .returning();
      deletionStats.supportTickets = result.length;
      logSuccess(`Deleted ${result.length} support tickets`);
    } else {
      logSuccess('DRY RUN: Would delete support tickets');
    }

    // Step 11: Delete achievers (except preserved users)
    log('Step 11: Deleting achievers...', verbose);
    if (!dryRun) {
      const result = await db.delete(achievers)
        .where(not(eq(achievers.userId, preserveUserIds[0])))
        .returning();
      deletionStats.achievers = result.length;
      logSuccess(`Deleted ${result.length} achievers`);
    } else {
      logSuccess('DRY RUN: Would delete achievers');
    }

    // Step 12: Delete rank achievements (except preserved users)
    log('Step 12: Deleting rank achievements...', verbose);
    if (!dryRun) {
      const result = await db.delete(rankAchievements)
        .where(not(eq(rankAchievements.userId, preserveUserIds[0])))
        .returning();
      deletionStats.rankAchievements = result.length;
      logSuccess(`Deleted ${result.length} rank achievements`);
    } else {
      logSuccess('DRY RUN: Would delete rank achievements');
    }

    // Step 13: Delete KYC documents (except preserved users)
    log('Step 13: Deleting KYC documents...', verbose);
    if (!dryRun) {
      const result = await db.delete(kycDocuments)
        .where(not(eq(kycDocuments.userId, preserveUserIds[0])))
        .returning();
      deletionStats.kycDocuments = result.length;
      logSuccess(`Deleted ${result.length} KYC documents`);
    } else {
      logSuccess('DRY RUN: Would delete KYC documents');
    }

    // Step 14: Delete fund requests (except preserved users)
    log('Step 14: Deleting fund requests...', verbose);
    if (!dryRun) {
      const result = await db.delete(fundRequests)
        .where(not(eq(fundRequests.userId, preserveUserIds[0])))
        .returning();
      deletionStats.fundRequests = result.length;
      logSuccess(`Deleted ${result.length} fund requests`);
    } else {
      logSuccess('DRY RUN: Would delete fund requests');
    }

    // Step 15: Delete withdrawal requests (except preserved users)
    log('Step 15: Deleting withdrawal requests...', verbose);
    if (!dryRun) {
      const result = await db.delete(withdrawalRequests)
        .where(not(eq(withdrawalRequests.userId, preserveUserIds[0])))
        .returning();
      deletionStats.withdrawalRequests = result.length;
      logSuccess(`Deleted ${result.length} withdrawal requests`);
    } else {
      logSuccess('DRY RUN: Would delete withdrawal requests');
    }

    // Step 16: Delete recruitment requests
    log('Step 16: Deleting recruitment requests...', verbose);
    if (!dryRun) {
      const result = await db.delete(recruitmentRequests).returning();
      deletionStats.recruitmentRequests = result.length;
      logSuccess(`Deleted ${result.length} recruitment requests`);
    } else {
      logSuccess('DRY RUN: Would delete all recruitment requests');
    }

    // Step 17: Delete referral links (except preserved users)
    log('Step 17: Deleting referral links...', verbose);
    if (!dryRun) {
      const result = await db.delete(referralLinks)
        .where(not(eq(referralLinks.generatedBy, preserveUserIds[0])))
        .returning();
      deletionStats.referralLinks = result.length;
      logSuccess(`Deleted ${result.length} referral links`);
    } else {
      logSuccess('DRY RUN: Would delete referral links');
    }

    // Step 18: Delete franchise requests
    log('Step 18: Deleting franchise requests...', verbose);
    if (!dryRun) {
      const result = await db.delete(franchiseRequests).returning();
      deletionStats.franchiseRequests = result.length;
      logSuccess(`Deleted ${result.length} franchise requests`);
    } else {
      logSuccess('DRY RUN: Would delete all franchise requests');
    }

    // Step 19: Delete cheques (except preserved users)
    log('Step 19: Deleting cheques...', verbose);
    if (!dryRun) {
      const result = await db.delete(cheques)
        .where(not(eq(cheques.userId, preserveUserIds[0])))
        .returning();
      deletionStats.cheques = result.length;
      logSuccess(`Deleted ${result.length} cheques`);
    } else {
      logSuccess('DRY RUN: Would delete cheques');
    }

    // Step 20: Reset preserved users' tree relationships
    log('Step 20: Resetting tree relationships for preserved users...', verbose);
    if (!dryRun) {
      for (const userId of preserveUserIds) {
        await db.update(users)
          .set({
            leftChildId: null,
            rightChildId: null,
            parentId: null,
            sponsorId: null,
            leftDirects: 0,
            rightDirects: 0,
            totalDirects: 0,
            leftBV: '0.00',
            rightBV: '0.00',
            totalBV: '0.00'
          })
          .where(eq(users.userId, userId));
      }
      logSuccess(`Reset tree relationships for ${preserveUserIds.length} preserved user(s)`);
    } else {
      logSuccess('DRY RUN: Would reset tree relationships');
    }

    // Step 21: Delete all users except preserved ones
    log('Step 21: Deleting users...', verbose);
    if (!dryRun) {
      const result = await db.delete(users)
        .where(not(eq(users.userId, preserveUserIds[0])))
        .returning();
      deletionStats.users = result.length;
      logSuccess(`Deleted ${result.length} users`);
    } else {
      logSuccess(`DRY RUN: Would delete ${stats.toDelete} users`);
    }

    // Summary
    console.log('\n=== CLEANUP SUMMARY ===\n');
    if (!dryRun) {
      console.log('Successfully deleted:');
      Object.entries(deletionStats).forEach(([table, count]) => {
        console.log(`  ${table}: ${count} record(s)`);
      });
      console.log('');
      logSuccess('Database cleanup completed successfully!');
    } else {
      logSuccess('DRY RUN completed. No data was actually deleted.');
      console.log('\nTo execute the cleanup, run without --dry-run flag.');
    }

    // Verify final state
    const finalStats = await getUserStats(preserveUserIds);
    console.log('\nFinal Database State:');
    console.log(`  Total Users: ${finalStats.total}`);
    console.log(`  Preserved Users: ${finalStats.toPreserve}`);
    console.log('');

  } catch (error) {
    logError('Error during cleanup:');
    console.error(error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CleanupOptions = { ...DEFAULT_OPTIONS };

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--dry-run' || arg === '-d') {
    options.dryRun = true;
  } else if (arg === '--preserve' || arg === '-p') {
    const userIds = args[i + 1]?.split(',') || [];
    if (userIds.length > 0) {
      options.preserveUserIds = userIds;
      i++; // Skip next arg
    }
  } else if (arg === '--quiet' || arg === '-q') {
    options.verbose = false;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Database Cleanup Script

Usage: npm run cleanup-db [options]

Options:
  --dry-run, -d           Run without actually deleting data
  --preserve, -p <ids>    Comma-separated user IDs to preserve (default: admin-demo)
  --quiet, -q             Reduce output verbosity
  --help, -h              Show this help message

Examples:
  npm run cleanup-db --dry-run
  npm run cleanup-db --preserve admin-demo,VV0001
  NODE_ENV=production npm run cleanup-db
    `);
    process.exit(0);
  }
}

// Run cleanup
cleanupDatabase(options)
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    logError('Script failed with error:');
    console.error(error);
    process.exit(1);
  });
