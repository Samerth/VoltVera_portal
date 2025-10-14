import { bvTestEngine } from './bvTestSimulation';

export async function setupCSVTestData() {
  const timestamp = new Date().toISOString();
  console.log(`🚀 [${timestamp}] Setting up CSV test data...`);
  
  try {
    // Clear existing TEST data only (preserves production data)
    console.log(`🧹 [${timestamp}] Clearing existing test data...`);
    await bvTestEngine.clearAllTestData();
    console.log(`✅ [${timestamp}] Test data cleared`);
    
    // Create Admin (Root)
    await bvTestEngine.createTestUser({
      userId: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      parentId: '',
      position: null,
      level: '0',
      currentRank: 'Founder'
    });
    
    // Create User A (Diamond Star - 18%) - Child of Admin, Level 0 (stops calculations here)
    await bvTestEngine.createTestUser({
      userId: 'VV0001',
      firstName: 'A',
      lastName: 'User',
      email: 'a@test.com',
      parentId: 'ADMIN',
      position: 'left',
      level: '0', // Level 0 - calculations stop here
      currentRank: 'Diamond'
    });
    
    // Create User B (Left leg of A, order 0)
    await bvTestEngine.createTestUser({
      userId: 'VV0002',
      firstName: 'B',
      lastName: 'User',
      email: 'b@test.com',
      parentId: 'VV0001',
      position: 'left',
      level: '1',
      currentRank: 'Executive',
      order: 0
    });
    
    // Create User C (Right leg of A, order 0)
    await bvTestEngine.createTestUser({
      userId: 'VV0003',
      firstName: 'C',
      lastName: 'User',
      email: 'c@test.com',
      parentId: 'VV0001',
      position: 'right',
      level: '1',
      currentRank: 'Executive',
      order: 0
    });
    
    // Create User P (Right leg of A, order 1 - second child on right)
    await bvTestEngine.createTestUser({
      userId: 'VV0004',
      firstName: 'P',
      lastName: 'User',
      email: 'p@test.com',
      parentId: 'VV0001',
      position: 'right',
      level: '1',
      currentRank: 'Executive',
      order: 1
    });
    
    // Create User D (Left leg of B, order 0, level 2)
    await bvTestEngine.createTestUser({
      userId: 'VV0005',
      firstName: 'D',
      lastName: 'User',
      email: 'd@test.com',
      parentId: 'VV0002',
      position: 'left',
      level: '2',
      currentRank: 'Executive',
      order: 0
    });
    
    // Create User Q (Right leg of A, order 2 - third child on right)
    await bvTestEngine.createTestUser({
      userId: 'VV0006',
      firstName: 'Q',
      lastName: 'User',
      email: 'q@test.com',
      parentId: 'VV0001',
      position: 'right',
      level: '1',
      currentRank: 'Executive',
      order: 2
    });
    
    // Create User F (Left leg of C, order 0, level 2)
    await bvTestEngine.createTestUser({
      userId: 'VV0007',
      firstName: 'F',
      lastName: 'User',
      email: 'f@test.com',
      parentId: 'VV0003',
      position: 'left',
      level: '2',
      currentRank: 'Executive',
      order: 0
    });
    
    // Create User E (Right leg of B, order 0, level 2)
    await bvTestEngine.createTestUser({
      userId: 'VV0008',
      firstName: 'E',
      lastName: 'User',
      email: 'e@test.com',
      parentId: 'VV0002',
      position: 'right',
      level: '2',
      currentRank: 'Executive',
      order: 0
    });
    
    // Create User G (Right leg of C, order 0, level 2)
    await bvTestEngine.createTestUser({
      userId: 'VV0009',
      firstName: 'G',
      lastName: 'User',
      email: 'g@test.com',
      parentId: 'VV0003',
      position: 'right',
      level: '2',
      currentRank: 'Executive',
      order: 0
    });
    
    
    // No automatic products - user will specify custom BV during purchase
    
    console.log(`✅ [${timestamp}] CSV test data setup completed!`);
    console.log(`📋 [${timestamp}] Test Users Created (in sequence):`);
    console.log('   - ADMIN (Founder, Level 0)');
    console.log('   - VV0001 A (Diamond, Level 0) - Child of Admin, calculations stop here');
    console.log('   - VV0002 B (Executive, Left of A, order 0)');
    console.log('   - VV0003 C (Executive, Right of A, order 0)');
    console.log('   - VV0004 P (Executive, Right of A, order 1)');
    console.log('   - VV0005 D (Executive, Left of B, level 2)');
    console.log('   - VV0006 Q (Executive, Right of A, order 2)');
    console.log('   - VV0007 F (Executive, Left of C, level 2)');
    console.log('   - VV0008 E (Executive, Right of B, level 2)');
    console.log('   - VV0009 G (Executive, Right of C, level 2)');
    console.log('');
    console.log(`🎯 [${timestamp}] Ready to test CSV scenario!`);
    console.log('   - No products created - specify custom BV during purchase');
    console.log('   - Visit /bv-test to start testing');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}
