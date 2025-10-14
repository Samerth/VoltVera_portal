# BV Test Simulation System

## Overview
This system provides a comprehensive testing environment for Business Volume (BV) calculations in the MLM system. It simulates the exact logic described in your CSV file to verify BV matching calculations.

## Access
Navigate to `/bv-test` in your application to access the test simulation page.

## Features

### 1. **Three-Section Layout**
- **Top Left**: Create test users with parent-child relationships
- **Top Right**: Create products and process purchases
- **Bottom**: View all data in tabbed tables

### 2. **CSV Test Data Setup**
Click "Setup CSV Data" to automatically create:
- **Admin** (Root user, Level 0, Founder rank)
- **User A** (Diamond rank, 18% commission, Level 1)
- **Users B-Z** (Executive rank, 6% commission, Level 2, positioned under A)

### 3. **BV Calculation Logic**
The system implements the exact logic from your CSV:

#### **Purchase Flow**
1. **Direct Income**: 10% of BV goes to parent (sponsor)
2. **BV Propagation**: BV flows up the tree to all uplines
3. **Matching Calculation**: `Matched BV = min(Left BV, Right BV)`
4. **New Match**: `New Match = Current Matched BV - Previous Matched BV`
5. **Differential Income**: `New Match × Rank Percentage`

#### **Rank Percentages**
- Executive: 6%
- Bronze Star: 8%
- Gold Star: 10%
- Emerald Star: 12%
- Ruby Star: 15%
- **Diamond: 18%** (as in your CSV example)
- Wise President: 20%
- President: 22%
- Ambassador: 25%
- Deputy Director: 28%
- Director: 30%
- Founder: 35%

## Testing the CSV Scenario

### **Step 1: Setup**
1. Click "Setup CSV Data" to create all test users and products
2. Verify users are created with correct hierarchy

### **Step 2: Test Purchases**
Follow the CSV sequence:

1. **B purchases 6,250 BV**
   - Select User: VV0002 (B)
   - Select Product: Product 6250 BV
   - Process Purchase
   - **Expected**: A's Left BV = 6,250, Right BV = 0, Matched BV = 0, Income = ₹0

2. **C purchases 1,900 BV**
   - Select User: VV0003 (C)
   - Select Product: Product 1900 BV
   - Process Purchase
   - **Expected**: A's Left BV = 6,250, Right BV = 1,900, Matched BV = 1,900, New Match = 1,900, Income = ₹342 (1,900 × 18%)

3. **Continue with remaining purchases...**

### **Step 3: Verify Results**
Check the **Users** tab to see:
- Left BV and Right BV values
- Total BV calculations
- Rank-based income calculations

Check the **Wallets** tab to see:
- Total earnings from BV matching
- Balance updates

Check the **Transactions** tab to see:
- All income transactions
- BV matching income entries

## Data Tables

### **Users Table**
- User hierarchy and positions
- Current BV values (Left, Right, Total)
- Rank and commission percentages

### **Products Table**
- Available test products
- BV amounts for testing

### **Purchases Table**
- All purchase transactions
- BV amounts generated

### **Wallets Table**
- User balances
- Total earnings from BV matching
- Withdrawal history

### **Transactions Table**
- Complete transaction history
- Income types (sponsor_income, sales_bonus)
- Balance changes

## Key Features

### **Real-time Updates**
- All tables update automatically after each purchase
- BV calculations happen immediately
- Income is credited to wallets instantly

### **Complete Audit Trail**
- Every BV change is tracked
- All income transactions are recorded
- Full transaction history maintained

### **CSV Accuracy**
- Implements exact matching logic from your CSV
- Uses correct rank percentages
- Follows proper BV propagation rules

## Troubleshooting

### **Common Issues**
1. **No income generated**: Check user's rank and BV matching
2. **Wrong BV values**: Verify user positions (left/right)
3. **Missing transactions**: Check if purchase was completed

### **Debug Tips**
1. Check console logs for detailed BV calculations
2. Verify user hierarchy in Users table
3. Check transaction types in Transactions table

## Next Steps

After verifying the test simulation works correctly:

1. **Create Database Tables**: Implement the three new tables (lifetime_bv_calculations, monthly_bv, bv_transactions)
2. **Update Production Code**: Integrate BV calculation engine into main purchase flow
3. **Add Monthly Settlement**: Implement monthly BV settlement process
4. **Create Admin Dashboard**: Build admin interface for BV management

## Files Created

- `server/bvTestSimulation.ts` - BV calculation engine
- `server/bvTestRoutes.ts` - API routes for testing
- `server/setupTestData.ts` - CSV test data setup
- `client/src/pages/BVTestSimulation.tsx` - Test simulation UI

The system is ready for testing your CSV scenario!
