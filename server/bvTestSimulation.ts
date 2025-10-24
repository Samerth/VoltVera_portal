import { db } from './db';
import { usersBvTest, walletBalancesBvTest, transactionsBvTest, productsBvTest, purchasesBvTest, lifetimeBvCalculations, monthlyBv, bvTransactions, rankConfigurations } from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// Test BV Calculation Engine
export class BVTestEngine {
  // Rank-based percentage mapping (Differential Income %)
  private readonly RANK_PERCENTAGES = {
    'Executive': 0.06,      // 6% (0 - 1.25 lakh)
    'Bronze Star': 0.10,    // 10% (1.25 - 2.5 lakh)
    'Gold Star': 0.12,      // 12% (2.5 - 9 lakh)
    'Emerald Star': 0.14,   // 14% (9 - 18 lakh)
    'Ruby Star': 0.16,      // 16% (18 - 45 lakh)
    'Diamond': 0.18,        // 18% (45 - 90 lakh)
    'Vice President': 0.20, // 20% (90 lakh - 2.7 crore)
    'President': 0.22,      // 22% (2.7 - 8.1 crore)
    'Ambassador': 0.24,     // 24% (8.1 - 24.3 crore)
    'Deputy Director': 0.26,// 26% (24.3 - 90 crore)
    'Director': 0.28,       // 28% (90 - 270 crore)
    'Founder': 0.30         // 30% (270 crore+)
  };

  // Create test user
  async createTestUser(data: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    parentId?: string;
    position?: 'left' | 'right';
    level?: string;
    currentRank?: string;
    order?: number;
  }) {
    try {
      console.log(`👤 Creating test user: ${data.userId} - ${data.firstName} ${data.lastName}`);
      
      // Check if user already exists
      const existingUser = await this.getUser(data.userId);
      if (existingUser) {
        console.log(`⚠️ User ${data.userId} already exists, skipping creation`);
        return existingUser;
      }
      
      // Calculate order automatically if not provided
      let order = data.order;
      if (order === undefined && data.parentId && data.position) {
        // Find existing children of the same parent on the same side
        const existingChildren = await db.select()
          .from(usersBvTest)
          .where(and(
            eq(usersBvTest.parentId, data.parentId),
            eq(usersBvTest.position, data.position)
          ))
          .orderBy(usersBvTest.order);
        
        // Set order to the next available number
        order = existingChildren.length;
        console.log(`📊 Auto-calculated order for ${data.userId}: ${order} (${existingChildren.length} existing children on ${data.position} side)`);
      }
      
      // Create user
      const [newUser] = await db.insert(usersBvTest).values({
        userId: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: 'test123',
        parentId: data.parentId || null,
        position: data.position || null,
        level: data.level || '0',
        order: order || 0,
        currentRank: (data.currentRank || 'Executive') as any,
        status: 'active',
        role: 'user',
        registrationDate: new Date(),
        activationDate: new Date(),
        idStatus: 'Active'
      }).returning();

      // Create wallet balance
      await db.insert(walletBalancesBvTest).values({
        userId: data.userId,
        balance: '0.00',
        totalEarnings: '0.00',
        totalWithdrawals: '0.00'
      });

      console.log(`✅ Created test user: ${data.userId} - ${data.firstName} ${data.lastName}`);
      return newUser;
    } catch (error) {
      console.error('Error creating test user:', error);
      throw error;
    }
  }

  // Create test product
  async createTestProduct(data: {
    name: string;
    price: string;
    bv: string;
    category: string;
  }) {
    try {
      console.log(`🛍️ Creating test product: ${data.name} - BV: ${data.bv}`);
      
      // Check if product already exists
      const existingProducts = await db.select().from(productsBvTest).where(eq(productsBvTest.name, data.name));
      if (existingProducts.length > 0) {
        console.log(`⚠️ Product ${data.name} already exists, skipping creation`);
        return existingProducts[0];
      }
      
      const [product] = await db.insert(productsBvTest).values({
        name: data.name,
        description: `Test product: ${data.name}`,
        price: data.price,
        bv: data.bv,
        gst: '18.00',
        category: data.category,
        purchaseType: 'first_purchase',
        isActive: true
      }).returning();

      console.log(`✅ Created test product: ${data.name} - BV: ${data.bv}`);
      return product;
    } catch (error) {
      console.error('Error creating test product:', error);
      throw error;
    }
  }

  // Process purchase and BV calculations
  async processTestPurchase(data: {
    userId: string;
    customBV: string;
    monthId: number;
  }) {
    try {
      const user = await this.getUser(data.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const bvAmount = parseFloat(data.customBV);
      if (isNaN(bvAmount) || bvAmount <= 0) {
        throw new Error('Invalid BV amount');
      }

      // Create purchase record (without product)
      const [purchase] = await db.insert(purchasesBvTest).values({
        userId: data.userId,
        productId: 'custom_bv', // Placeholder
        quantity: 1,
        totalAmount: bvAmount.toString(),
        totalBV: bvAmount.toString(),
        paymentMethod: 'test',
        paymentStatus: 'completed',
        deliveryAddress: 'Test Address',
        deliveryStatus: 'delivered'
      }).returning();

      console.log(`🛒 Purchase created: ${user.firstName} made purchase for BV ${bvAmount}`);

      // Step 1: Update buyer's self_bv (their own purchase BV)
      await this.updateSelfBV(data.userId, bvAmount.toString(), purchase.id, data.monthId);
      console.log(`📊 Updated self_bv for ${data.userId}: +${bvAmount}`);

      // Step 2: Direct income to SPONSOR (10% of BV) - FIXED: was going to parent instead of sponsor
      if (user.sponsorId) {
        const directIncome = bvAmount * 0.1;
        await this.updateWalletBalance(user.sponsorId, directIncome, 'sponsor_income', purchase.id);
        console.log(`💰 Direct income: ${directIncome} to sponsor ${user.sponsorId}`);
      }

      // Step 3: Process BV calculations for all uplines (BV flows UP the tree)
      let currentUserId = user.parentId;
      let childUserId = data.userId; // Start with the buyer
      
      while (currentUserId) {
        const currentUser = await this.getUser(currentUserId);
        if (!currentUser) break;
        
        // Stop if we reach admin user BEFORE processing
        if (currentUser.userId === 'ADMIN') {
          console.log(`🛑 Stopping BV calculations at ${currentUser.userId} (admin user) - NOT processing`);
          break;
        }
        
        // Get the immediate child's position relative to this upline
        const childUser = await this.getUser(childUserId);
        const childPosition = childUser?.position as 'left' | 'right';
        console.log(`📍 Child ${childUserId} position relative to ${currentUserId}: ${childPosition}`);
        
        // Process BV calculations for this upline, passing buyer ID for direct recruit tracking
        await this.processBVCalculations(currentUserId, bvAmount.toString(), purchase.id, data.monthId, childPosition, data.userId);
        
        // Move up the tree: current user becomes the child for the next iteration
        childUserId = currentUserId;
        currentUserId = currentUser.parentId;
      }

      return purchase;
    } catch (error) {
      console.error('Error processing test purchase:', error);
      throw error;
    }
  }

  // Get child's position relative to a target user (traces the path up the tree)
  async getChildPositionRelativeToUser(childUserId: string, targetUserId: string): Promise<'left' | 'right'> {
    let currentUserId = childUserId;
    let position: 'left' | 'right' = 'left'; // Default fallback
    
    // Trace the path from child to target user
    while (currentUserId && currentUserId !== targetUserId) {
      const currentUser = await this.getUser(currentUserId);
      if (!currentUser || !currentUser.parentId) break;
      
      // If we reach the target user, return the position
      if (currentUser.parentId === targetUserId) {
        position = currentUser.position as 'left' | 'right';
        break;
      }
      
      currentUserId = currentUser.parentId;
    }
    
    return position;
  }

  // Update buyer's self_bv (their own purchase BV)
  async updateSelfBV(userId: string, bvAmount: string, purchaseId: string, monthId: number) {
    const user = await this.getUser(userId);
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
        // CRITICAL FIX: teamBv should ONLY include downline (left + right), NOT user's own purchases (selfBv)
        // User's own purchases should NEVER be used in any calculation
        teamBv: (parseFloat(currentRecord.leftBv || '0') + parseFloat(currentRecord.rightBv || '0')).toString(),
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
  async processBVCalculations(userId: string, bvAmount: string, purchaseId: string, monthId: number, childPosition?: 'left' | 'right', buyerUserId?: string) {
    const user = await this.getUser(userId);
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
    const prevDirectsBV = parseFloat(currentRecord.directsBv || '0');

    // Calculate new BV state
    let newLeftBV = prevLeftBV;
    let newRightBV = prevRightBV;
    let newDirectsBV = prevDirectsBV;
    const bvAmountNum = parseFloat(bvAmount);

    // Add BV to appropriate leg based on child's position
    if (childPosition === 'left') {
      newLeftBV += bvAmountNum;
    } else if (childPosition === 'right') {
      newRightBV += bvAmountNum;
    }

    // Check if buyer is a direct recruit (sponsored by this upline) - NEW TRACKING
    if (buyerUserId) {
      const buyer = await this.getUser(buyerUserId);
      if (buyer && buyer.sponsorId === userId) {
        // Buyer is a direct recruit - update directs BV
        newDirectsBV += bvAmountNum;
        console.log(`👥 Direct recruit BV: ${bvAmountNum} added to ${userId}'s directs (Lifetime: ${prevDirectsBV} → ${newDirectsBV})`);
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
        directsBv: newDirectsBV.toString(),  // Track lifetime Direct BV
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
    await db.update(usersBvTest)
      .set({
        leftBV: newLeftBV.toString(),
        rightBV: newRightBV.toString(),
        totalBV: (newLeftBV + newRightBV).toString(),
        packageAmount: newMatchingBV.toString(),  // Track matched BV as package amount
        updatedAt: new Date()
      })
      .where(eq(usersBvTest.id, user.id));

    // Credit differential income if any
    if (diffIncome > 0) {
      await this.updateWalletBalance(userId, diffIncome, 'sales_bonus', purchaseId);
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
  async getUser(userId: string) {
    const [user] = await db.select().from(usersBvTest).where(eq(usersBvTest.userId, userId));
    return user;
  }

  async getProduct(productId: string) {
    const [product] = await db.select().from(productsBvTest).where(eq(productsBvTest.id, productId));
    return product;
  }

  async updateWalletBalance(userId: string, amount: number, type: string, referenceId?: string) {
    // Get current wallet balance
    const [wallet] = await db.select().from(walletBalancesBvTest).where(eq(walletBalancesBvTest.userId, userId));
    
    if (!wallet) {
      // Create wallet if doesn't exist
      await db.insert(walletBalancesBvTest).values({
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
    await db.update(walletBalancesBvTest)
      .set({
        balance: newBalance.toString(),
        totalEarnings: newEarnings.toString(),
        updatedAt: new Date()
      })
      .where(eq(walletBalancesBvTest.userId, userId));

    // Create transaction record
    await db.insert(transactionsBvTest).values({
      userId: userId,
      type: type as any,
      amount: amount.toString(),
      description: `${type} - Test simulation`,
      referenceId: referenceId,
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString()
    });
  }

  // Get all test data
  async getAllTestData() {
    const allUsers = await db.select().from(usersBvTest).orderBy(usersBvTest.userId);
    const allProducts = await db.select().from(productsBvTest).orderBy(productsBvTest.name);
    const allPurchases = await db.select().from(purchasesBvTest).orderBy(desc(purchasesBvTest.createdAt));
    const allWallets = await db.select().from(walletBalancesBvTest).orderBy(walletBalancesBvTest.userId);
    const allTransactions = await db.select().from(transactionsBvTest).orderBy(desc(transactionsBvTest.createdAt));
    
    // Get BV calculation data with error handling
    let allLifetimeBvCalculations = [];
    let allMonthlyBv = [];
    let allBvTransactions = [];
    let allRankConfigs = [];
    
    try {
      allLifetimeBvCalculations = await db.select().from(lifetimeBvCalculations).orderBy(lifetimeBvCalculations.userId);
      console.log('✅ Lifetime BV calculations fetched:', allLifetimeBvCalculations.length);
    } catch (error) {
      console.error('❌ Error fetching lifetime BV calculations:', error);
    }
    
    try {
      allMonthlyBv = await db.select().from(monthlyBv).orderBy(monthlyBv.userId, monthlyBv.monthId);
      console.log('✅ Monthly BV fetched:', allMonthlyBv.length);
    } catch (error) {
      console.error('❌ Error fetching monthly BV:', error);
    }
    
    try {
      allBvTransactions = await db.select().from(bvTransactions).orderBy(desc(bvTransactions.createdAt));
      console.log('✅ BV transactions fetched:', allBvTransactions.length);
    } catch (error) {
      console.error('❌ Error fetching BV transactions:', error);
    }
    
    try {
      allRankConfigs = await db.select().from(rankConfigurations).orderBy(rankConfigurations.rankName);
      console.log('✅ Rank configs fetched:', allRankConfigs.length);
    } catch (error) {
      console.error('❌ Error fetching rank configs:', error);
    }

    // Debug logging
    console.log('📊 BV Data being returned:', {
      lifetimeBvCalculations: allLifetimeBvCalculations.length,
      monthlyBv: allMonthlyBv.length,
      bvTransactions: allBvTransactions.length,
      rankConfigs: allRankConfigs.length
    });

    return {
      users: allUsers,
      products: allProducts,
      purchases: allPurchases,
      wallets: allWallets,
      transactions: allTransactions,
      lifetimeBvCalculations: allLifetimeBvCalculations,
      monthlyBv: allMonthlyBv,
      bvTransactions: allBvTransactions,
      rankConfigs: allRankConfigs
    };
  }

  // Clear all test data (ONLY test data, not production data)
  async clearAllTestData() {
    try {
      // Delete all test data from test tables (safe - these are separate tables)
      await db.delete(bvTransactions);
      await db.delete(monthlyBv);
      await db.delete(lifetimeBvCalculations);
      await db.delete(transactionsBvTest);
      await db.delete(purchasesBvTest);
      await db.delete(productsBvTest);
      await db.delete(usersBvTest);
      await db.delete(walletBalancesBvTest);
      
      console.log('🧹 Test data cleared from _bvTest tables (production data completely safe)');
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
  }

  // Clear only BV-related data (keep users, reset wallets to 0)
  async clearBVData() {
    try {
      console.log('🧹 Starting BV data clear...');
      
      // Delete BV calculation data
      console.log('🗑️ Deleting BV transactions...');
      await db.delete(bvTransactions);
      
      console.log('🗑️ Deleting monthly BV...');
      await db.delete(monthlyBv);
      
      console.log('🗑️ Deleting lifetime BV calculations...');
      await db.delete(lifetimeBvCalculations);
      
      // Delete purchase and transaction data
      console.log('🗑️ Deleting transactions...');
      await db.delete(transactionsBvTest);
      
      console.log('🗑️ Deleting purchases...');
      await db.delete(purchasesBvTest);
      
      // Reset all wallet balances to 0 (keep users)
      console.log('💰 Resetting wallet balances...');
      await db.update(walletBalancesBvTest)
        .set({
          balance: '0.00',
          totalEarnings: '0.00',
          updatedAt: new Date()
        });
      
      // Reset user BV fields to 0
      console.log('📊 Resetting user BV fields...');
      await db.update(usersBvTest)
        .set({
          leftBV: '0.00',
          rightBV: '0.00',
          totalBV: '0.00',
          updatedAt: new Date()
        });
      
      console.log('✅ BV data cleared - users kept, wallets reset to 0');
    } catch (error) {
      console.error('❌ Error clearing BV data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }
}

export const bvTestEngine = new BVTestEngine();
