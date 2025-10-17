import { Express } from 'express';
import { productionBVEngine } from './productionBVEngine';
import { db } from './db';
import { 
  lifetimeBvCalculations, 
  bvTransactions, 
  monthlyBv,
  users,
  rankConfigurations,
  purchases
} from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { impersonationTokens } from './impersonation';

// Helper function to get the actual user ID (supports both session and impersonation)
const getActualUserId = (req: any): string | null => {
  console.log('🔍 getActualUserId called');
  console.log('  - req.user:', req.user ? `id=${req.user.id}, role=${req.user.role}` : 'null');
  console.log('  - req.session.userId:', req.session?.userId);
  
  // Priority 1: Impersonation token (req.user is set by bearer token auth)
  if (req.user && req.user.id) {
    console.log('  ✅ Using req.user.id:', req.user.id);
    return req.user.id;
  }
  // Priority 2: Session-based auth
  if (req.session?.userId) {
    console.log('  ✅ Using req.session.userId:', req.session.userId);
    return req.session.userId;
  }
  
  console.log('  ❌ No valid user ID found');
  return null;
};

export function registerProductionBVRoutes(app: Express) {
  
  // Simple test endpoint to verify routes are registered
  app.get('/api/test/simple', (req, res) => {
    res.json({ message: 'BV routes are working!', timestamp: new Date().toISOString() });
  });
  
  // Import authentication middleware from routes
  const isAuthenticated = async (req: any, res: any, next: any) => {
    try {
      // 1) Bearer token-based impersonation (does not rely on cookie session)
      const authHeader = req.headers['authorization'] as string | undefined;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length).trim();
        const entry = impersonationTokens.get(token);
        
        if (entry && Date.now() < entry.expiresAt) {
          // Valid impersonation token - fetch user and set req.user
          const { storage } = await import('./storage');
          const user = await storage.getUser(entry.userId);
          if (!user) {
            return res.status(401).json({ message: 'User not found' });
          }
          req.user = user;
          return next();
        } else {
          // Invalid or expired token → clean up and fall through to session
          if (entry && Date.now() >= entry.expiresAt) {
            impersonationTokens.delete(token);
          }
        }
      }

      // 2) Session-based authentication
      if (req.session?.userId) {
        const { storage } = await import('./storage');
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        return next();
      }

      return res.status(401).json({ message: 'Unauthorized' });
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  };
  
  // Debug endpoint to check authentication
  app.get('/api/debug/auth', async (req, res) => {
    res.json({
      session: req.session,
      user: req.user,
      headers: req.headers,
      cookies: req.cookies
    });
  });

  // Test endpoint to get BV data for VV0001 without authentication (for testing only)
  app.get('/api/test/bv-calculations', async (req, res) => {
    try {
      // Hardcode VV0001 for testing
      const userId = 'VV0001';
      
      // Get BV data using the engine
      const bvData = await productionBVEngine.getUserBVData(userId);
      
      res.json(bvData);
    } catch (error) {
      console.error('Error getting test BV calculations:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Test endpoint to trigger BV calculations for a specific purchase (for testing only)
  app.post('/api/test/trigger-bv/:purchaseId', async (req, res) => {
    try {
      const { purchaseId } = req.params;
      console.log(`🔄 Manually triggering BV calculations for purchase: ${purchaseId}`);
      
      // Import storage to access processIncomeDistribution
      const { storage } = await import('./storage');
      
      // Trigger BV calculations
      await storage.processIncomeDistribution(purchaseId);
      
      res.json({ 
        success: true, 
        message: `BV calculations triggered for purchase ${purchaseId}` 
      });
    } catch (error) {
      console.error('Error triggering BV calculations:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Test endpoint to directly test BV engine (for debugging)
  app.post('/api/test/bv-engine', async (req, res) => {
    try {
      console.log(`🧪 Testing BV engine directly`);
      
      // Test BV engine directly
      await productionBVEngine.processPurchase({
        purchaseId: 'test-purchase-debug',
        userId: 'VV0001',
        bvAmount: '1000',
        monthId: 1
      });
      
      res.json({ 
        success: true, 
        message: 'BV engine test completed successfully' 
      });
    } catch (error) {
      console.error('BV engine test error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });
  
  // Get user's BV calculation data
  app.get('/api/user/bv-calculations', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get user's display ID
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user?.userId) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get BV data using the engine
      const bvData = await productionBVEngine.getUserBVData(user.userId);
      
      res.json(bvData);
    } catch (error) {
      console.error('Error getting BV calculations:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get user's BV transaction history
  app.get('/api/user/bv-transactions', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get user's display ID
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user?.userId) {
        return res.status(404).json({ message: 'User not found' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const transactions = await db.select()
        .from(bvTransactions)
        .where(eq(bvTransactions.userId, user.userId))
        .orderBy(desc(bvTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(bvTransactions)
        .where(eq(bvTransactions.userId, user.userId));

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total: parseInt(totalCount[0].count as string),
            totalPages: Math.ceil(parseInt(totalCount[0].count as string) / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting BV transactions:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get user's monthly BV data
  app.get('/api/user/monthly-bv', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get user's display ID
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user?.userId) {
        return res.status(404).json({ message: 'User not found' });
      }

      const monthlyData = await db.select()
        .from(monthlyBv)
        .where(eq(monthlyBv.userId, user.userId))
        .orderBy(desc(monthlyBv.monthId))
        .limit(12);

      res.json({
        success: true,
        data: monthlyData
      });
    } catch (error) {
      console.error('Error getting monthly BV:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get all rank configurations (for frontend display)
  app.get('/api/ranks', async (req, res) => {
    try {
      const ranks = await db.select()
        .from(rankConfigurations)
        .where(eq(rankConfigurations.isActive, true))
        .orderBy(rankConfigurations.rankName);

      res.json({
        success: true,
        data: ranks
      });
    } catch (error) {
      console.error('Error getting ranks:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Admin: Get all BV calculations (for admin dashboard)
  app.get('/api/admin/bv-calculations', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if user is admin
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const bvCalculations = await db.select()
        .from(lifetimeBvCalculations)
        .orderBy(desc(lifetimeBvCalculations.updatedAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(lifetimeBvCalculations);

      res.json({
        success: true,
        data: {
          calculations: bvCalculations,
          pagination: {
            page,
            limit,
            total: parseInt(totalCount[0].count as string),
            totalPages: Math.ceil(parseInt(totalCount[0].count as string) / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting admin BV calculations:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Admin: Get all BV transactions (for admin dashboard)
  app.get('/api/admin/bv-transactions', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if user is admin
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const transactions = await db.select()
        .from(bvTransactions)
        .orderBy(desc(bvTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db.select({ count: sql`count(*)` })
        .from(bvTransactions);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total: parseInt(totalCount[0].count as string),
            totalPages: Math.ceil(parseInt(totalCount[0].count as string) / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting admin BV transactions:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Admin: Get BV transactions report with filtering and joins
  app.get('/api/admin/bv-transactions-report', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if user is admin
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get filter parameters
      const userIdFilter = req.query.userId as string;
      const transactionType = req.query.transactionType as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Build where conditions
      let whereConditions: any[] = [];

      // User filter (search by display ID, name, or email)
      if (userIdFilter) {
        // Search in bv_transactions.userId or join with users table for name/email
        // Use CONCAT_WS with COALESCE for NULL-safe name concatenation
        whereConditions.push(
          sql`(
            ${bvTransactions.userId} ILIKE ${`%${userIdFilter}%`} OR
            CONCAT_WS(' ', COALESCE(${users.firstName}, ''), COALESCE(${users.lastName}, '')) ILIKE ${`%${userIdFilter}%`} OR
            ${users.email} ILIKE ${`%${userIdFilter}%`}
          )`
        );
      }

      // Transaction type filter
      if (transactionType) {
        whereConditions.push(eq(bvTransactions.transactionType, transactionType));
      }

      // Date range filter
      if (startDate) {
        whereConditions.push(sql`${bvTransactions.createdAt} >= ${new Date(startDate)}`);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereConditions.push(sql`${bvTransactions.createdAt} <= ${endDateTime}`);
      }

      // Create alias for initiating user
      const initiatingUser = sql.raw('initiating_user');

      // Build query with proper joins
      const transactionsQuery = db.select({
        id: bvTransactions.id,
        userId: bvTransactions.userId,
        userName: sql<string>`NULLIF(TRIM(CONCAT_WS(' ', COALESCE(${users.firstName}, ''), COALESCE(${users.lastName}, ''))), '')`,
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
        // Calculate Direct BV and Team BV from current snapshot
        directBv: sql<string>`CAST(COALESCE(${lifetimeBvCalculations.directsBv}, '0.00') AS DECIMAL(12,2))`,
        teamBv: sql<string>`CAST((${bvTransactions.newLeftBv} + ${bvTransactions.newRightBv}) AS DECIMAL(12,2))`,
        // Get initiating user ID from the purchase (NULL-safe)
        initiatingUserId: sql<string>`COALESCE(initiating_user.user_id, 'N/A')`,
        initiatingUserName: sql<string>`NULLIF(TRIM(CONCAT_WS(' ', COALESCE(initiating_user.first_name, ''), COALESCE(initiating_user.last_name, ''))), '')`,
      })
        .from(bvTransactions)
        .leftJoin(users, eq(bvTransactions.userId, users.userId))
        .leftJoin(purchases, eq(bvTransactions.purchaseId, purchases.id))
        .leftJoin(lifetimeBvCalculations, eq(bvTransactions.userId, lifetimeBvCalculations.userId))
        .leftJoin(
          sql`users AS initiating_user`, 
          sql`${purchases.userId} = initiating_user.user_id`
        );

      // Apply where conditions if any
      let finalQuery = transactionsQuery;
      if (whereConditions.length > 0) {
        finalQuery = transactionsQuery.where(and(...whereConditions)) as any;
      }

      // Execute query with ordering
      const transactions = await finalQuery
        .orderBy(desc(bvTransactions.createdAt))
        .limit(1000); // Limit to prevent huge responses

      res.json(transactions);
    } catch (error) {
      console.error('Error getting BV transactions report:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Admin: Get Monthly BV Report with filtering
  app.get('/api/admin/monthly-bv-report', isAuthenticated, async (req, res) => {
    try {
      const userId = getActualUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if user is admin
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get filter parameters
      const userIdFilter = req.query.userId as string;
      const monthId = req.query.monthId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Build where conditions
      let whereConditions: any[] = [];

      // User filter (search by display ID, name, or email)
      if (userIdFilter) {
        whereConditions.push(
          sql`(
            ${monthlyBv.userId} ILIKE ${`%${userIdFilter}%`} OR
            CONCAT_WS(' ', COALESCE(${users.firstName}, ''), COALESCE(${users.lastName}, '')) ILIKE ${`%${userIdFilter}%`} OR
            ${users.email} ILIKE ${`%${userIdFilter}%`}
          )`
        );
      }

      // Month ID filter
      if (monthId) {
        whereConditions.push(eq(monthlyBv.monthId, parseInt(monthId)));
      }

      // Date range filter
      if (startDate) {
        whereConditions.push(sql`${monthlyBv.monthStartdate} >= ${new Date(startDate)}`);
      }
      if (endDate) {
        whereConditions.push(sql`${monthlyBv.monthEnddate} <= ${new Date(endDate)}`);
      }

      // Build query with proper joins
      const monthlyBvQuery = db.select({
        id: monthlyBv.id,
        userId: monthlyBv.userId,
        userName: sql<string>`NULLIF(TRIM(CONCAT_WS(' ', COALESCE(${users.firstName}, ''), COALESCE(${users.lastName}, ''))), '')`,
        parentId: monthlyBv.parentId,
        monthId: monthlyBv.monthId,
        monthStartdate: monthlyBv.monthStartdate,
        monthEnddate: monthlyBv.monthEnddate,
        monthBvLeft: monthlyBv.monthBvLeft,
        monthBvRight: monthlyBv.monthBvRight,
        monthBvDirects: monthlyBv.monthBvDirects,
        // Calculate total monthly BV
        totalMonthBv: sql<string>`CAST((${monthlyBv.monthBvLeft} + ${monthlyBv.monthBvRight}) AS DECIMAL(12,2))`,
        createdAt: monthlyBv.createdAt,
        updatedAt: monthlyBv.updatedAt,
      })
        .from(monthlyBv)
        .leftJoin(users, eq(monthlyBv.userId, users.userId));

      // Apply where conditions if any
      let finalQuery = monthlyBvQuery;
      if (whereConditions.length > 0) {
        finalQuery = monthlyBvQuery.where(and(...whereConditions)) as any;
      }

      // Execute query with ordering (newest first)
      const monthlyBvData = await finalQuery
        .orderBy(desc(monthlyBv.monthId), desc(monthlyBv.createdAt))
        .limit(1000); // Limit to prevent huge responses

      res.json(monthlyBvData);
    } catch (error) {
      console.error('Error getting monthly BV report:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}


