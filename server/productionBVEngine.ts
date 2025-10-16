import { db } from './db';
import { 
  users, // MAIN PRODUCTION TABLE
  purchases, // MAIN PRODUCTION TABLE
  walletBalances, // MAIN PRODUCTION TABLE
  transactions, // MAIN PRODUCTION TABLE
  lifetimeBvCalculations, // PRODUCTION BV TABLE
  monthlyBv, // PRODUCTION BV TABLE
  bvTransactions, // PRODUCTION BV TABLE
  rankConfigurations // MAIN PRODUCTION TABLE
} from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Production BV Calculation Engine
export class ProductionBVEngine {
  
  // Process a real product purchase with BV calculations
  async processPurchase(data: {
    purchaseId: string;
    userId: string; // Display ID (VV0001)
    bvAmount: string;
    monthId: number;
  }) {
    try {
      const user = await this.getUserByDisplayId(data.userId);
      if (!user) {
        throw new Error(`User not found: ${data.userId}`);
      }

      const bvAmount = parseFloat(data.bvAmount);
      if (isNaN(bvAmount) || bvAmount <= 0) {
        throw new Error('Invalid BV amount');
      }

      console.log(`🛒 Processing REAL purchase: ${data.userId} -> BV ${bvAmount}`);

      // Step 1: Update buyer's self_bv (their own purchase BV)
      await this.updateSelfBV(data.userId, bvAmount.toString(), data.purchaseId, data.monthId);
      console.log(`📊 Updated self_bv for ${data.userId}: +${bvAmount}`);

      // Step 2: Direct income to SPONSOR (10% of BV)
      if (user.sponsorId) {
        const sponsorDisplayId = await this.normalizeToDisplayId(user.sponsorId);
        if (sponsorDisplayId) {
          const directIncome = bvAmount * 0.1;
          await this.creditWallet(sponsorDisplayId, directIncome, 'sponsor_income', data.purchaseId);
          console.log(`💰 Direct income: ${directIncome} to sponsor ${sponsorDisplayId}`);
        }
      }

      // Step 3: Process BV matching for all uplines (BV flows UP the tree)
      let currentUserId = await this.normalizeToDisplayId(user.parentId);
      let childUserId = data.userId; // Start with the buyer
      const buyerUserId = data.userId; // Keep track of original buyer for direct recruit detection
      
      while (currentUserId) {
        const currentUser = await this.getUserByDisplayId(currentUserId);
        if (!currentUser) {
          console.log(`⚠️ User not found for ID: ${currentUserId} - stopping BV propagation`);
          break;
        }
        
        // Stop if we reach admin user BEFORE processing
        if (currentUser.userId === 'ADMIN' || currentUser.userId === 'admin-demo') {
          console.log(`🛑 Stopping BV calculations at ${currentUser.userId} (admin user) - NOT processing`);
          break;
        }
        
        // Get the immediate child's position relative to this upline
        const childUser = await this.getUserByDisplayId(childUserId);
        const childPosition = childUser?.position as 'left' | 'right';
        console.log(`📍 Child ${childUserId} position relative to ${currentUserId}: ${childPosition}`);
        
        // Process BV calculations for this upline, passing buyer ID for direct recruit tracking
        await this.processBVMatching(currentUserId, bvAmount.toString(), data.purchaseId, data.monthId, childPosition, buyerUserId);
        
        // Move up the tree: current user becomes the child for the next iteration
        childUserId = currentUserId;
        currentUserId = await this.normalizeToDisplayId(currentUser.parentId);
      }

      console.log(`✅ BV calculations completed for purchase ${data.purchaseId}`);
    } catch (error) {
      console.error('Error processing purchase BV calculations:', error);
      throw error;
    }
  }

  // Update buyer's self_bv (their own purchase BV)
  async updateSelfBV(userId: string, bvAmount: string, purchaseId: string, monthId: number) {
    const user = await this.getUserByDisplayId(userId);
    if (!user) return;

    console.log(`📊 Updating self_bv for user: ${userId}`);

    // Get or create lifetime BV calculation record
    let lifetimeRecord = await db.select()
      .from(lifetimeBvCalculations)
      .where(eq(lifetimeBvCalculations.userId, userId))
      .limit(1);

    if (lifetimeRecord.length === 0) {
      // Create new lifetime record
      const [newRecord] = await db.insert(lifetimeBvCalculations).values({
        userId: userId,
        parentId: user.parentId,
        userLevel: parseInt(user.level || '0'),
        rank: user.currentRank || 'Executive'
      }).returning();
      lifetimeRecord = [newRecord];
    }

    const currentRecord = lifetimeRecord[0];
    const prevSelfBV = parseFloat(currentRecord.selfBv || '0');
    const newSelfBV = prevSelfBV + parseFloat(bvAmount);

    // Update lifetime BV calculation record
    const now = new Date();
    await db.update(lifetimeBvCalculations)
      .set({
        selfBv: newSelfBV.toString(),
        teamBv: (parseFloat(currentRecord.leftBv || '0') + parseFloat(currentRecord.rightBv || '0') + newSelfBV).toString(),
        updatedAt: now
      })
      .where(eq(lifetimeBvCalculations.userId, userId));

    // Create BV transaction record for audit trail
    await db.insert(bvTransactions).values({
      userId: userId,
      parentId: user.parentId,
      purchaseId: purchaseId,
      transactionType: 'self_bv_update',
      prevLeftBv: currentRecord.leftBv || '0',
      newLeftBv: currentRecord.leftBv || '0',
      prevRightBv: currentRecord.rightBv || '0',
      newRightBv: currentRecord.rightBv || '0',
      prevMatchingBv: currentRecord.matchingBv || '0',
      newMatchingBv: currentRecord.matchingBv || '0',
      newMatchAmount: '0',
      carryForwardLeft: currentRecord.carryForwardLeft || '0',
      carryForwardRight: currentRecord.carryForwardRight || '0',
      rank: user.currentRank || 'Executive',
      rankPercentage: '0',
      diffIncome: '0',
      monthId: monthId,
      createdAt: now
    });

    console.log(`📊 Self BV Update for ${userId}: ${prevSelfBV} → ${newSelfBV}`);
  }

  // Process BV calculations for a user
  async processBVMatching(userId: string, bvAmount: string, purchaseId: string, monthId: number, childPosition?: 'left' | 'right', buyerUserId?: string) {
    const user = await this.getUserByDisplayId(userId);
    if (!user) return;

    console.log(`📊 Processing BV calculations for user: ${userId}`);

    // Get or create lifetime BV calculation record
    let lifetimeRecord = await db.select()
      .from(lifetimeBvCalculations)
      .where(eq(lifetimeBvCalculations.userId, userId))
      .limit(1);

    if (lifetimeRecord.length === 0) {
      // Create new lifetime record
      const [newRecord] = await db.insert(lifetimeBvCalculations).values({
        userId: userId,
        parentId: user.parentId,
        userLevel: parseInt(user.level || '0'),
        rank: user.currentRank || 'Executive'
      }).returning();
      lifetimeRecord = [newRecord];
    }

    const currentRecord = lifetimeRecord[0];
    const prevLeftBV = parseFloat(currentRecord.leftBv || '0');
    const prevRightBV = parseFloat(currentRecord.rightBv || '0');
    const prevMatchingBV = parseFloat(currentRecord.matchingBv || '0');

    // Calculate new BV state
    let newLeftBV = prevLeftBV;
    let newRightBV = prevRightBV;
    const bvAmountNum = parseFloat(bvAmount);

    // Add BV to appropriate leg based on child's position
    if (childPosition === 'left') {
      newLeftBV += bvAmountNum;
      // Update monthly BV for left leg
      await this.updateMonthlyBV(userId, { leftBvIncrement: bvAmountNum });
    } else if (childPosition === 'right') {
      newRightBV += bvAmountNum;
      // Update monthly BV for right leg
      await this.updateMonthlyBV(userId, { rightBvIncrement: bvAmountNum });
    }

    // Check if buyer is a direct recruit (sponsored by this upline)
    if (buyerUserId) {
      const buyer = await this.getUserByDisplayId(buyerUserId);
      const buyerSponsorId = await this.normalizeToDisplayId(buyer?.sponsorId);
      
      if (buyerSponsorId === userId) {
        // Buyer is a direct recruit - update directs BV
        await this.updateMonthlyBV(userId, { directsBvIncrement: bvAmountNum });
        console.log(`👥 Direct recruit BV: ${bvAmountNum} added to ${userId}'s directs`);
      }
    }

    // Calculate matching BV
    const newMatchingBV = Math.min(newLeftBV, newRightBV);
    const newMatch = Math.max(0, newMatchingBV - prevMatchingBV);

    // Get rank percentage from rank_configurations table
    const rankConfig = await db.select()
      .from(rankConfigurations)
      .where(eq(rankConfigurations.rankName, user.currentRank || 'Executive'))
      .limit(1);

    const rankPercentage = rankConfig.length > 0 ? parseFloat(rankConfig[0].percentage) : 0.05;
    const diffIncome = newMatch * rankPercentage;

    // Calculate carry forward
    const carryForwardLeft = Math.max(0, newLeftBV - newMatchingBV);
    const carryForwardRight = Math.max(0, newRightBV - newMatchingBV);

    // Update lifetime BV calculation record
    const now = new Date();
    await db.update(lifetimeBvCalculations)
      .set({
        leftBv: newLeftBV.toString(),
        rightBv: newRightBV.toString(),
        matchingBv: newMatchingBV.toString(),
        newMatch: newMatch.toString(),
        carryForwardLeft: carryForwardLeft.toString(),
        carryForwardRight: carryForwardRight.toString(),
        diffIncome: diffIncome.toString(),
        teamBv: (newLeftBV + newRightBV).toString(),
        updatedAt: now
      })
      .where(eq(lifetimeBvCalculations.userId, userId));

    // Create BV transaction record for audit trail
    await db.insert(bvTransactions).values({
      userId: userId,
      parentId: user.parentId,
      purchaseId: purchaseId,
      transactionType: 'bv_calculation',
      prevLeftBv: prevLeftBV.toString(),
      newLeftBv: newLeftBV.toString(),
      prevRightBv: prevRightBV.toString(),
      newRightBv: newRightBV.toString(),
      prevMatchingBv: prevMatchingBV.toString(),
      newMatchingBv: newMatchingBV.toString(),
      newMatchAmount: newMatch.toString(),
      carryForwardLeft: carryForwardLeft.toString(),
      carryForwardRight: carryForwardRight.toString(),
      rank: user.currentRank || 'Executive',
      rankPercentage: rankPercentage.toString(),
      diffIncome: diffIncome.toString(),
      monthId: monthId,
      createdAt: now
    });

    // Update user's BV fields for display
    await db.update(users)
      .set({
        leftBV: newLeftBV.toString(),
        rightBV: newRightBV.toString(),
        totalBV: (newLeftBV + newRightBV).toString(),
        updatedAt: new Date()
      })
      .where(eq(users.userId, userId));

    // Credit differential income if any
    if (diffIncome > 0) {
      await this.creditWallet(userId, diffIncome, 'sales_bonus', purchaseId);
      console.log(`💎 Differential income: ${diffIncome} to ${userId} (${user.currentRank} - ${rankPercentage * 100}%)`);
    }

    console.log(`📈 BV Update for ${userId}:`);
    console.log(`   Left BV: ${prevLeftBV} → ${newLeftBV}`);
    console.log(`   Right BV: ${prevRightBV} → ${newRightBV}`);
    console.log(`   Matched BV: ${prevMatchingBV} → ${newMatchingBV}`);
    console.log(`   New Match: ${newMatch}`);
    console.log(`   Carry Forward: L=${carryForwardLeft}, R=${carryForwardRight}`);
    console.log(`   Diff Income: ${diffIncome}`);
  }

  // Helper methods
  async getUserByDisplayId(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    return user;
  }

  /**
   * Normalize any user identifier to Display ID (VVxxxx format)
   * Handles both UUID and Display ID inputs
   * @param userId - Can be UUID (from id column) or Display ID (from userId column)
   * @returns Display ID (VVxxxx) or original value if not found
   */
  async normalizeToDisplayId(userId: string | null | undefined): Promise<string | null> {
    if (!userId) return null;
    
    // Already a display ID (VVxxxx format) or admin-demo
    if (userId.startsWith('VV') || userId === 'admin-demo' || userId === 'ADMIN') {
      return userId;
    }
    
    // Check if it's a UUID format (8-4-4-4-12 pattern)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(userId)) {
      // Look up display ID from UUID
      const [user] = await db.select({ userId: users.userId })
        .from(users)
        .where(eq(users.id, userId));
      
      if (user?.userId) {
        console.log(`🔄 Normalized UUID ${userId.substring(0, 8)}... → ${user.userId}`);
        return user.userId;
      }
    }
    
    // Return as-is if not found (might already be display ID)
    return userId;
  }

  async creditWallet(userId: string, amount: number, type: string, referenceId?: string) {
    // Get current wallet balance
    const [wallet] = await db.select().from(walletBalances).where(eq(walletBalances.userId, userId));
    
    if (!wallet) {
      // Create wallet if doesn't exist
      await db.insert(walletBalances).values({
        userId: userId,
        balance: '0.00',
        totalEarnings: '0.00',
        totalWithdrawals: '0.00'
      });
    }

    const currentBalance = parseFloat(wallet?.balance || '0');
    const currentEarnings = parseFloat(wallet?.totalEarnings || '0');
    const newBalance = currentBalance + amount;
    const newEarnings = currentEarnings + amount;

    // Update wallet balance
    await db.update(walletBalances)
      .set({
        balance: newBalance.toString(),
        totalEarnings: newEarnings.toString(),
        updatedAt: new Date()
      })
      .where(eq(walletBalances.userId, userId));

    // Create transaction record
    await db.insert(transactions).values({
      userId: userId,
      type: type as any,
      amount: amount.toString(),
      description: `${type} - BV calculation`,
      referenceId: referenceId,
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString()
    });
  }

  // Get user's BV calculation data
  async getUserBVData(userId: string) {
    const lifetimeData = await db.select()
      .from(lifetimeBvCalculations)
      .where(eq(lifetimeBvCalculations.userId, userId))
      .limit(1);

    const bvTransactionsData = await db.select({
      id: bvTransactions.id,
      userId: bvTransactions.userId,
      parentId: bvTransactions.parentId,
      purchaseId: bvTransactions.purchaseId,
      transactionType: bvTransactions.transactionType,
      prevLeftBv: bvTransactions.prevLeftBv,
      newLeftBv: bvTransactions.newLeftBv,
      prevRightBv: bvTransactions.prevRightBv,
      newRightBv: bvTransactions.newRightBv,
      prevMatchingBv: bvTransactions.prevMatchingBv,
      newMatchingBv: bvTransactions.newMatchingBv,
      newMatchAmount: bvTransactions.newMatchAmount,
      carryForwardLeft: bvTransactions.carryForwardLeft,
      carryForwardRight: bvTransactions.carryForwardRight,
      rank: bvTransactions.rank,
      rankPercentage: bvTransactions.rankPercentage,
      diffIncome: bvTransactions.diffIncome,
      directIncome: bvTransactions.directIncome,
      monthId: bvTransactions.monthId,
      createdAt: bvTransactions.createdAt,
      initiatingUserId: users.userId,
    })
      .from(bvTransactions)
      .leftJoin(purchases, eq(bvTransactions.purchaseId, purchases.id))
      .leftJoin(users, eq(purchases.userId, users.id))
      .where(eq(bvTransactions.userId, userId))
      .orderBy(desc(bvTransactions.createdAt))
      .limit(50);

    const monthlyData = await db.select()
      .from(monthlyBv)
      .where(eq(monthlyBv.userId, userId))
      .orderBy(desc(monthlyBv.monthId))
      .limit(12);

    // Calculate total direct income (sponsor income) from transactions
    const directIncomeResult = await db.select({
      totalDirectIncome: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`
    })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'sponsor_income')
        )
      );

    const totalDirectIncome = directIncomeResult[0]?.totalDirectIncome || '0';

    return {
      lifetime: lifetimeData[0] || null,
      transactions: bvTransactionsData,
      monthly: monthlyData,
      directIncome: {
        total: totalDirectIncome,
        description: 'Total earnings from direct recruits purchases (10% commission)'
      }
    };
  }

  // Get current month ID (helper function)
  getCurrentMonthId(): number {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth() + 1;
  }

  // Get month start and end dates for calendar month
  getMonthBoundaries(date: Date = new Date()): { start: Date; end: Date; monthId: number } {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const monthId = year * 12 + month + 1;
    
    return { start, end, monthId };
  }

  // Get or create monthly BV record for a user
  async getOrCreateMonthlyBV(userId: string, purchaseDate: Date = new Date()) {
    const user = await this.getUserByDisplayId(userId);
    if (!user) return null;

    const { start, end, monthId } = this.getMonthBoundaries(purchaseDate);

    // Try to find existing record for this month
    const [existing] = await db.select()
      .from(monthlyBv)
      .where(
        and(
          eq(monthlyBv.userId, userId),
          eq(monthlyBv.monthId, monthId)
        )
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    // Create new monthly BV record
    const [newRecord] = await db.insert(monthlyBv).values({
      userId: userId,
      parentId: user.parentId,
      monthId: monthId,
      monthStartdate: start.toISOString().split('T')[0],
      monthEnddate: end.toISOString().split('T')[0],
      monthBvLeft: '0.00',
      monthBvRight: '0.00',
      monthBvDirects: '0.00'
    }).returning();

    return newRecord;
  }

  // Update monthly BV for a user
  async updateMonthlyBV(
    userId: string, 
    updates: { 
      leftBvIncrement?: number; 
      rightBvIncrement?: number; 
      directsBvIncrement?: number; 
    },
    purchaseDate: Date = new Date()
  ) {
    const monthlyRecord = await this.getOrCreateMonthlyBV(userId, purchaseDate);
    if (!monthlyRecord) return;

    const currentLeftBv = parseFloat(monthlyRecord.monthBvLeft || '0');
    const currentRightBv = parseFloat(monthlyRecord.monthBvRight || '0');
    const currentDirectsBv = parseFloat(monthlyRecord.monthBvDirects || '0');

    const newLeftBv = currentLeftBv + (updates.leftBvIncrement || 0);
    const newRightBv = currentRightBv + (updates.rightBvIncrement || 0);
    const newDirectsBv = currentDirectsBv + (updates.directsBvIncrement || 0);

    await db.update(monthlyBv)
      .set({
        monthBvLeft: newLeftBv.toString(),
        monthBvRight: newRightBv.toString(),
        monthBvDirects: newDirectsBv.toString(),
        updatedAt: new Date()
      })
      .where(eq(monthlyBv.id, monthlyRecord.id));

    console.log(`📅 Monthly BV updated for ${userId} (Month ${monthlyRecord.monthId}): L=${newLeftBv}, R=${newRightBv}, D=${newDirectsBv}`);
  }
}

export const productionBVEngine = new ProductionBVEngine();


