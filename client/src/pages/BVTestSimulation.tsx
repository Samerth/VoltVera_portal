import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Trash2, Plus, ShoppingCart, Users, Package, Wallet, CreditCard } from 'lucide-react';

interface TestUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  parentId: string | null;
  position: string | null;
  level: string;
  order: number;
  currentRank: string;
  leftBV: string;
  rightBV: string;
  totalBV: string;
}

interface TestProduct {
  id: string;
  name: string;
  price: string;
  bv: string;
  category: string;
}

interface TestPurchase {
  id: string;
  userId: string;
  productId: string;
  totalAmount: string;
  totalBV: string;
  paymentStatus: string;
  createdAt: string;
}

interface TestWallet {
  userId: string;
  balance: string;
  totalEarnings: string;
  totalWithdrawals: string;
}

interface TestTransaction {
  id: string;
  userId: string;
  type: string;
  amount: string;
  description: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
}

export default function BVTestSimulation() {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [products, setProducts] = useState<TestProduct[]>([]);
  const [purchases, setPurchases] = useState<TestPurchase[]>([]);
  const [wallets, setWallets] = useState<TestWallet[]>([]);
  const [transactions, setTransactions] = useState<TestTransaction[]>([]);
  const [lifetimeBvCalculations, setLifetimeBvCalculations] = useState<any[]>([]);
  const [monthlyBv, setMonthlyBv] = useState<any[]>([]);
  const [bvTransactions, setBvTransactions] = useState<any[]>([]);
  const [rankConfigs, setRankConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    parentId: 'none',
    position: 'left' as 'left' | 'right',
    level: '0',
    currentRank: 'Executive'
  });


  const [purchaseData, setPurchaseData] = useState({
    userId: 'none',
    customBV: '',
    monthId: 1
  });

  useEffect(() => {
    fetchTestData();
  }, []);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bv-test/data?t=${Date.now()}`);
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data.users);
        setProducts(result.data.products);
        setPurchases(result.data.purchases);
        setWallets(result.data.wallets);
        setTransactions(result.data.transactions);
        setLifetimeBvCalculations(result.data.lifetimeBvCalculations || []);
        setMonthlyBv(result.data.monthlyBv || []);
        setBvTransactions(result.data.bvTransactions || []);
        setRankConfigs(result.data.rankConfigs || []);
        
        // Debug logging
        console.log('Full API Response:', result);
        console.log('BV Data received:', {
          lifetimeBvCalculations: result.data.lifetimeBvCalculations,
          monthlyBv: result.data.monthlyBv,
          bvTransactions: result.data.bvTransactions
        });
        console.log('Lifetime BV Calculations Array:', result.data.lifetimeBvCalculations);
      }
    } catch (error) {
      console.error('Error fetching test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const userData = {
        ...newUser,
        parentId: newUser.parentId === 'none' ? '' : newUser.parentId
      };
      
      const response = await fetch('/api/bv-test/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      if (result.success) {
        setNewUser({
          userId: '',
          firstName: '',
          lastName: '',
          email: '',
          parentId: 'none',
          position: 'left',
          level: '0',
          currentRank: 'Executive'
        });
        fetchTestData();
      } else {
        alert('Error creating user: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    }
  };


  const processPurchase = async () => {
    try {
      const purchaseRequest = {
        userId: purchaseData.userId === 'none' ? '' : purchaseData.userId,
        customBV: purchaseData.customBV,
        monthId: purchaseData.monthId
      };
      
      const response = await fetch('/api/bv-test/process-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseRequest)
      });
      
      const result = await response.json();
      if (result.success) {
        setPurchaseData({ userId: 'none', customBV: '', monthId: 1 });
        fetchTestData();
      } else {
        alert('Error processing purchase: ' + result.error);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      alert('Error processing purchase');
    }
  };

  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all test data from _bvTest tables? (Production data is completely safe)')) {
      try {
        const response = await fetch('/api/bv-test/clear', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
          fetchTestData();
        }
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    }
  };

  const clearBVData = async () => {
    if (confirm('Clear all BV data (purchases, transactions, BV calculations) but keep users? Wallets will be reset to 0.')) {
      try {
        const response = await fetch('/api/bv-test/clear-bv', { method: 'POST' });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          alert('Server error: ' + response.status + ' - ' + errorText);
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          fetchTestData();
        } else {
          alert('Error clearing BV data: ' + result.error);
        }
      } catch (error) {
        console.error('Error clearing BV data:', error);
        alert('Error clearing BV data: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const [isSettingUp, setIsSettingUp] = useState(false);

  const setupCSVData = async () => {
    if (isSettingUp) {
      alert('Setup is already in progress. Please wait...');
      return;
    }

    if (confirm('This will clear existing test data from _bvTest tables and setup CSV test scenario. Production data is completely safe. Continue?')) {
      try {
        setIsSettingUp(true);
        console.log('🚀 Starting CSV data setup...');
        
        const response = await fetch('/api/bv-test/setup-csv', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ CSV data setup completed');
          await fetchTestData();
          alert('CSV test data setup completed! You can now test the BV calculations.');
        } else {
          console.error('❌ CSV data setup failed:', result.error);
          alert('Error setting up CSV data: ' + result.error);
        }
      } catch (error) {
        console.error('Error setting up CSV data:', error);
        alert('Error setting up CSV data');
      } finally {
        setIsSettingUp(false);
      }
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user ? `${user.firstName} ${user.lastName}` : userId;
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : productId;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">BV Test Simulation</h1>
          <p className="text-sm text-green-600 font-medium">🛡️ Using _bvTest tables - Production data is completely safe!</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={setupCSVData} variant="default" disabled={isSettingUp}>
            <Users className="h-4 w-4 mr-2" />
            {isSettingUp ? 'Setting up...' : 'Setup CSV Data'}
          </Button>
          <Button onClick={clearBVData} variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear BV Data
          </Button>
          <Button onClick={clearAllData} variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Top Section - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Create Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create Test Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={newUser.userId}
                  onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                  placeholder="VV0001"
                />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  value={newUser.level}
                  onChange={(e) => setNewUser({ ...newUser, level: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentId">Parent ID</Label>
                <Select value={newUser.parentId || "none"} onValueChange={(value) => setNewUser({ ...newUser, parentId: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.userId} - {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Select value={newUser.position} onValueChange={(value: 'left' | 'right') => setNewUser({ ...newUser, position: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="currentRank">Current Rank</Label>
              <Select value={newUser.currentRank} onValueChange={(value) => setNewUser({ ...newUser, currentRank: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Executive">Executive (6%)</SelectItem>
                  <SelectItem value="Bronze Star">Bronze Star (8%)</SelectItem>
                  <SelectItem value="Gold Star">Gold Star (10%)</SelectItem>
                  <SelectItem value="Emerald Star">Emerald Star (12%)</SelectItem>
                  <SelectItem value="Ruby Star">Ruby Star (15%)</SelectItem>
                  <SelectItem value="Diamond">Diamond (18%)</SelectItem>
                  <SelectItem value="Vice President">Vice President (20%)</SelectItem>
                  <SelectItem value="President">President (22%)</SelectItem>
                  <SelectItem value="Ambassador">Ambassador (25%)</SelectItem>
                  <SelectItem value="Deputy Director">Deputy Director (28%)</SelectItem>
                  <SelectItem value="Director">Director (30%)</SelectItem>
                  <SelectItem value="Founder">Founder (35%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={createUser} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Process Purchases */}
        <div className="space-y-6">
          {/* Process Purchases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Process Test Purchase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purchaseUserId">Select User</Label>
                <Select value={purchaseData.userId || "none"} onValueChange={(value) => setPurchaseData({ ...purchaseData, userId: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user to make purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select User</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.userId} - {user.firstName} {user.lastName} ({user.currentRank}) - Level {user.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customBV">Custom BV Amount</Label>
                <Input
                  id="customBV"
                  type="number"
                  value={purchaseData.customBV}
                  onChange={(e) => setPurchaseData({ ...purchaseData, customBV: e.target.value })}
                  placeholder="6250"
                />
              </div>

              <div>
                <Label htmlFor="monthId">Month ID</Label>
                <Select value={purchaseData.monthId.toString()} onValueChange={(value) => setPurchaseData({ ...purchaseData, monthId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        Month {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={processPurchase} className="w-full" disabled={purchaseData.userId === 'none' || !purchaseData.customBV}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Process Purchase
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Data Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="wallets">Wallets</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="lifetime-bv">Lifetime BV</TabsTrigger>
              <TabsTrigger value="monthly-bv">Monthly BV</TabsTrigger>
              <TabsTrigger value="bv-transactions">BV Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">User ID</th>
                      <th className="border border-gray-300 p-2">Name</th>
                      <th className="border border-gray-300 p-2">Email</th>
                      <th className="border border-gray-300 p-2">Parent</th>
                      <th className="border border-gray-300 p-2">Position</th>
                      <th className="border border-gray-300 p-2">Level</th>
                      <th className="border border-gray-300 p-2">Order</th>
                      <th className="border border-gray-300 p-2">Rank</th>
                      <th className="border border-gray-300 p-2">Left BV</th>
                      <th className="border border-gray-300 p-2">Right BV</th>
                      <th className="border border-gray-300 p-2">Total BV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="border border-gray-300 p-2 font-mono">{user.userId}</td>
                        <td className="border border-gray-300 p-2">{user.firstName} {user.lastName}</td>
                        <td className="border border-gray-300 p-2">{user.email}</td>
                        <td className="border border-gray-300 p-2">{user.parentId || '-'}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant={user.position === 'left' ? 'default' : 'secondary'}>
                            {user.position || '-'}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 p-2">{user.level}</td>
                        <td className="border border-gray-300 p-2">{user.order || 0}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant="outline">{user.currentRank}</Badge>
                        </td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(user.leftBV || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(user.rightBV || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(user.totalBV || '0').toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>


            <TabsContent value="purchases" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">ID</th>
                      <th className="border border-gray-300 p-2">User</th>
                      <th className="border border-gray-300 p-2">Product</th>
                      <th className="border border-gray-300 p-2">Amount (₹)</th>
                      <th className="border border-gray-300 p-2">BV</th>
                      <th className="border border-gray-300 p-2">Status</th>
                      <th className="border border-gray-300 p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(purchase => (
                      <tr key={purchase.id}>
                        <td className="border border-gray-300 p-2 font-mono">{purchase.id.slice(0, 8)}...</td>
                        <td className="border border-gray-300 p-2">{getUserName(purchase.userId)}</td>
                        <td className="border border-gray-300 p-2">{getProductName(purchase.productId)}</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(purchase.totalAmount).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(purchase.totalBV).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant={purchase.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                            {purchase.paymentStatus}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 p-2">{new Date(purchase.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="wallets" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">User ID</th>
                      <th className="border border-gray-300 p-2">Name</th>
                      <th className="border border-gray-300 p-2">Balance (₹)</th>
                      <th className="border border-gray-300 p-2">Total Earnings (₹)</th>
                      <th className="border border-gray-300 p-2">Total Withdrawals (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map(wallet => (
                      <tr key={wallet.userId}>
                        <td className="border border-gray-300 p-2 font-mono">{wallet.userId}</td>
                        <td className="border border-gray-300 p-2">{getUserName(wallet.userId)}</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(wallet.balance).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(wallet.totalEarnings).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(wallet.totalWithdrawals).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">ID</th>
                      <th className="border border-gray-300 p-2">User</th>
                      <th className="border border-gray-300 p-2">Type</th>
                      <th className="border border-gray-300 p-2">Amount (₹)</th>
                      <th className="border border-gray-300 p-2">Description</th>
                      <th className="border border-gray-300 p-2">Balance Before (₹)</th>
                      <th className="border border-gray-300 p-2">Balance After (₹)</th>
                      <th className="border border-gray-300 p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td className="border border-gray-300 p-2 font-mono">{transaction.id.slice(0, 8)}...</td>
                        <td className="border border-gray-300 p-2">{getUserName(transaction.userId)}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant="outline">{transaction.type}</Badge>
                        </td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(transaction.amount).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{transaction.description}</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(transaction.balanceBefore).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(transaction.balanceAfter).toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{new Date(transaction.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="lifetime-bv" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">User ID</th>
                      <th className="border border-gray-300 p-2">Name</th>
                      <th className="border border-gray-300 p-2">Parent ID</th>
                      <th className="border border-gray-300 p-2">Level</th>
                      <th className="border border-gray-300 p-2">Self BV</th>
                      <th className="border border-gray-300 p-2">Left BV</th>
                      <th className="border border-gray-300 p-2">Right BV</th>
                      <th className="border border-gray-300 p-2">Matching BV</th>
                      <th className="border border-gray-300 p-2">New Match</th>
                      <th className="border border-gray-300 p-2">Carry Forward L</th>
                      <th className="border border-gray-300 p-2">Carry Forward R</th>
                      <th className="border border-gray-300 p-2">Rank</th>
                      <th className="border border-gray-300 p-2">Diff Income</th>
                      <th className="border border-gray-300 p-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifetimeBvCalculations.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="border border-gray-300 p-2 text-center text-gray-500">
                          No lifetime BV calculations found. Data length: {lifetimeBvCalculations.length}
                        </td>
                      </tr>
                    ) : (
                      lifetimeBvCalculations.map((calc, index) => {
                        console.log(`Rendering calc ${index}:`, calc);
                        const user = users.find(u => u.userId === calc.userId);
                        const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
                        return (
                      <tr key={calc.id}>
                        <td className="border border-gray-300 p-2 font-mono">{calc.userId}</td>
                        <td className="border border-gray-300 p-2">{userName}</td>
                        <td className="border border-gray-300 p-2">{calc.parentId || '-'}</td>
                        <td className="border border-gray-300 p-2">{calc.userLevel}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.selfBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.leftBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.rightBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.matchingBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.newMatch || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.carryForwardLeft || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(calc.carryForwardRight || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant="outline">{calc.rank}</Badge>
                        </td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(calc.diffIncome || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{new Date(calc.updatedAt).toLocaleString()}</td>
                      </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="monthly-bv" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">User ID</th>
                      <th className="border border-gray-300 p-2">Month ID</th>
                      <th className="border border-gray-300 p-2">Start Date</th>
                      <th className="border border-gray-300 p-2">End Date</th>
                      <th className="border border-gray-300 p-2">Month Left BV</th>
                      <th className="border border-gray-300 p-2">Month Right BV</th>
                      <th className="border border-gray-300 p-2">Month Directs BV</th>
                      <th className="border border-gray-300 p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBv.map(monthly => (
                      <tr key={monthly.id}>
                        <td className="border border-gray-300 p-2 font-mono">{monthly.user_id}</td>
                        <td className="border border-gray-300 p-2">{monthly.month_id}</td>
                        <td className="border border-gray-300 p-2">{monthly.month_startdate}</td>
                        <td className="border border-gray-300 p-2">{monthly.month_enddate}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(monthly.month_bv_left || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(monthly.month_bv_right || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(monthly.month_bv_directs || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{new Date(monthly.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="bv-transactions" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">User ID</th>
                      <th className="border border-gray-300 p-2">Name</th>
                      <th className="border border-gray-300 p-2">Type</th>
                      <th className="border border-gray-300 p-2">Month ID</th>
                      <th className="border border-gray-300 p-2">Prev Left BV</th>
                      <th className="border border-gray-300 p-2">New Left BV</th>
                      <th className="border border-gray-300 p-2">Prev Right BV</th>
                      <th className="border border-gray-300 p-2">New Right BV</th>
                      <th className="border border-gray-300 p-2">New Match</th>
                      <th className="border border-gray-300 p-2">Rank</th>
                      <th className="border border-gray-300 p-2">Rank %</th>
                      <th className="border border-gray-300 p-2">Diff Income</th>
                      <th className="border border-gray-300 p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bvTransactions.map(transaction => {
                      const user = users.find(u => u.userId === transaction.userId);
                      const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
                      return (
                      <tr key={transaction.id}>
                        <td className="border border-gray-300 p-2 font-mono">{transaction.userId}</td>
                        <td className="border border-gray-300 p-2">{userName}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant="outline">{transaction.transactionType}</Badge>
                        </td>
                        <td className="border border-gray-300 p-2">{transaction.monthId || '-'}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(transaction.prevLeftBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(transaction.newLeftBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(transaction.prevRightBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(transaction.newRightBv || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2 font-mono">{parseFloat(transaction.newMatchAmount || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">
                          <Badge variant="outline">{transaction.rank}</Badge>
                        </td>
                        <td className="border border-gray-300 p-2 font-mono">{(parseFloat(transaction.rankPercentage || '0') * 100).toFixed(1)}%</td>
                        <td className="border border-gray-300 p-2 font-mono">₹{parseFloat(transaction.diffIncome || '0').toFixed(2)}</td>
                        <td className="border border-gray-300 p-2">{new Date(transaction.createdAt).toLocaleString()}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
