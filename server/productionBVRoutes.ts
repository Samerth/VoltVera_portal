import { Express } from 'express';
import { productionBVEngine } from './productionBVEngine';
import { db } from './db';
import { 
  lifetimeBvCalculations, 
  bvTransactions, 
  monthlyBv,
  users,
  rankConfigurations 
} from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export function registerProductionBVRoutes(app: Express) {
  
  // Get user's BV calculation data
  app.get('/api/user/bv-calculations', async (req, res) => {
    try {
      const userId = req.session?.userId;
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
      
      res.json({
        success: true,
        data: bvData
      });
    } catch (error) {
      console.error('Error getting BV calculations:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get user's BV transaction history
  app.get('/api/user/bv-transactions', async (req, res) => {
    try {
      const userId = req.session?.userId;
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
  app.get('/api/user/monthly-bv', async (req, res) => {
    try {
      const userId = req.session?.userId;
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
  app.get('/api/admin/bv-calculations', async (req, res) => {
    try {
      const userId = req.session?.userId;
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
  app.get('/api/admin/bv-transactions', async (req, res) => {
    try {
      const userId = req.session?.userId;
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
}


