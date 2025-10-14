import { Express } from 'express';
import { bvTestEngine } from './bvTestSimulation';
import { setupCSVTestData } from './setupTestData';

export function registerBVTestRoutes(app: Express) {
  // Create test user
  app.post('/api/bv-test/create-user', async (req, res) => {
    try {
      const { userId, firstName, lastName, email, parentId, position, level, currentRank } = req.body;
      
      const user = await bvTestEngine.createTestUser({
        userId,
        firstName,
        lastName,
        email,
        parentId,
        position,
        level,
        currentRank
      });
      
      res.json({ success: true, user });
    } catch (error) {
      console.error('Error creating test user:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Create test product
  app.post('/api/bv-test/create-product', async (req, res) => {
    try {
      const { name, price, bv, category } = req.body;
      
      const product = await bvTestEngine.createTestProduct({
        name,
        price,
        bv,
        category
      });
      
      res.json({ success: true, product });
    } catch (error) {
      console.error('Error creating test product:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Process test purchase with request deduplication
  const activePurchases = new Set<string>();
  app.post('/api/bv-test/process-purchase', async (req, res) => {
    const { userId, customBV, monthId } = req.body;
    const purchaseKey = `${userId}-${customBV}-${monthId}`;
    
    if (activePurchases.has(purchaseKey)) {
      console.log('⚠️ Purchase already in progress, ignoring duplicate request');
      return res.status(429).json({ success: false, error: 'Purchase already in progress' });
    }

    try {
      activePurchases.add(purchaseKey);
      console.log(`🛒 Processing test purchase (deduplicated): ${userId} -> BV ${customBV}`);
      
      const purchase = await bvTestEngine.processTestPurchase({
        userId,
        customBV,
        monthId
      });
      
      res.json({ success: true, purchase });
    } catch (error) {
      console.error('Error processing test purchase:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      activePurchases.delete(purchaseKey);
    }
  });

  // Get all test data
  app.get('/api/bv-test/data', async (req, res) => {
    try {
      const data = await bvTestEngine.getAllTestData();
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error getting test data:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Clear all test data with request deduplication
  let isClearInProgress = false;
  app.post('/api/bv-test/clear', async (req, res) => {
    if (isClearInProgress) {
      console.log('⚠️ Clear already in progress, ignoring duplicate request');
      return res.status(429).json({ success: false, error: 'Clear already in progress' });
    }

    try {
      isClearInProgress = true;
      console.log('🧹 Starting test data clear (deduplicated)...');
      
      await bvTestEngine.clearAllTestData();
      
      res.json({ success: true, message: 'All test data cleared' });
    } catch (error) {
      console.error('Error clearing test data:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      isClearInProgress = false;
    }
  });

  // Clear only BV data (keep users, reset wallets)
  let isClearBVInProgress = false;
  app.post('/api/bv-test/clear-bv', async (req, res) => {
    if (isClearBVInProgress) {
      console.log('⚠️ Clear BV already in progress, ignoring duplicate request');
      return res.status(429).json({ success: false, error: 'Clear BV already in progress' });
    }

    try {
      isClearBVInProgress = true;
      console.log('🧹 Clearing BV data (keeping users)...');
      
      await bvTestEngine.clearBVData();
      
      res.json({ success: true, message: 'BV data cleared, users kept' });
    } catch (error) {
      console.error('Error clearing BV data:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      isClearBVInProgress = false;
    }
  });

  // Setup CSV test data with request deduplication
  let isSetupInProgress = false;
  app.post('/api/bv-test/setup-csv', async (req, res) => {
    if (isSetupInProgress) {
      console.log('⚠️ Setup already in progress, ignoring duplicate request');
      return res.status(429).json({ success: false, error: 'Setup already in progress' });
    }

    try {
      isSetupInProgress = true;
      console.log('🚀 Starting CSV test data setup (deduplicated)...');
      
      await setupCSVTestData();
      
      res.json({ success: true, message: 'CSV test data setup completed' });
    } catch (error) {
      console.error('Error setting up CSV test data:', error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      isSetupInProgress = false;
    }
  });
}
