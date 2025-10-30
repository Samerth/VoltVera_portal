import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Separator } from '../components/ui/separator';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface BVData {
  lifetime: {
    leftBv: string;
    rightBv: string;
    matchingBv: string;
    carryForwardLeft: string;
    carryForwardRight: string;
    diffIncome: string;
    selfBv: string;
    directsBv: string;
    teamBv: string;
    rank: string;
  } | null;
  transactions: Array<{
    id: string;
    transactionType: string;
    prevLeftBv: string;
    newLeftBv: string;
    prevRightBv: string;
    newRightBv: string;
    newMatchAmount: string;
    diffIncome: string;
    directIncome: string;
    rank: string;
    rankPercentage: string;
    initiatingUserId: string | null;
    createdAt: string;
  }>;
  monthly: Array<{
    monthId: number;
    monthBvLeft: string;
    monthBvRight: string;
    monthBvDirects: string;
    monthStartdate: string;
    monthEnddate: string;
  }>;
  directIncome: {
    total: string;
    description: string;
  };
}

export default function BVCalculations() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: bvData, isLoading, error } = useQuery<BVData>({
    queryKey: ['/api/user/bv-calculations'],
  });

  // Debug logging
  console.log('BV Calculations Debug:', { bvData, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BV calculations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">Error loading BV data</p>
        </div>
      </div>
    );
  }

  const lifetime = bvData?.lifetime;
  const transactions = bvData?.transactions || [];
  const monthly = bvData?.monthly || [];

  const calculateMatchedBV = (left: string, right: string) => {
    return Math.min(parseFloat(left || '0'), parseFloat(right || '0'));
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatBV = (bv: string) => {
    return `${parseFloat(bv || '0').toLocaleString('en-IN', { minimumFractionDigits: 0 })} BV`;
  };

  const formatMonthName = (monthId: number) => {
    const year = Math.floor(monthId / 12);
    const month = monthId % 12;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1] || 'Unknown'} ${year}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">BV Calculations</h1>
          <p className="text-gray-600 mt-1">Track your Business Volume and matching income</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {lifetime?.rank || 'Executive'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* BV Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Left BV</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatBV(lifetime?.leftBv || '0')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Left leg business volume
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Right BV</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatBV(lifetime?.rightBv || '0')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Right leg business volume
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matched BV</CardTitle>
                <Target className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatBV(lifetime?.matchingBv || '0')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Min of {formatBV(lifetime?.leftBv || '0')} & {formatBV(lifetime?.rightBv || '0')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Differential Income</CardTitle>
                <DollarSign className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(lifetime?.diffIncome || '0')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total matching income earned
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed BV Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team BVM Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Your Own Purchases</span>
                  <span className="font-medium text-gray-500">{formatBV(lifetime?.selfBv || '0')}</span>
                </div>
                <div className="text-xs text-gray-400 -mt-2 mb-2">
                  (Not used for rank qualification or income)
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Direct Recruits' Purchases</span>
                  <span className="font-medium text-purple-600">{formatBV(lifetime?.directsBv || '0')}</span>
                </div>
                <div className="text-xs text-purple-400 -mt-2 mb-2">
                  (Used for fund eligibility)
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Team BV</span>
                  <span className="font-medium text-blue-600">{formatBV(lifetime?.teamBv || '0')}</span>
                </div>
                <div className="text-xs text-blue-400 -mt-2 mb-2">
                  (Left + Right legs combined - reference metric only)
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Matched BV (for Rank & Income)</span>
                  <span className="font-medium text-green-600">{formatBV(lifetime?.matchingBv || '0')}</span>
                </div>
                <div className="text-xs text-green-400 -mt-2 mb-2">
                  (Min of left & right legs - used for rank qualification and differential income)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Direct Income (Sponsor Income)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-emerald-600" data-testid="text-direct-income-total">
                  {formatCurrency(bvData?.directIncome?.total || '0')}
                </div>
                <Separator />
                <div className="text-sm text-gray-600">
                  {bvData?.directIncome?.description || 'Total earnings from direct recruits purchases (10% commission)'}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Directs BV (Lifetime)</span>
                  <span className="font-medium text-purple-600">
                    {formatBV(lifetime?.directsBv || '0')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>BV Transaction History</CardTitle>
              <p className="text-sm text-gray-600">
                Detailed history of all BV calculations and income distributions
              </p>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No BV transactions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Initiator</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Left BV</TableHead>
                      <TableHead>Right BV</TableHead>
                      <TableHead>New Match</TableHead>
                      <TableHead>Direct Income</TableHead>
                      <TableHead>Differential Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" data-testid={`initiator-${tx.id}`}>
                            {tx.initiatingUserId || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`type-${tx.id}`}>
                            {tx.transactionType.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-gray-500">
                              {formatBV(tx.prevLeftBv)} → {formatBV(tx.newLeftBv)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-gray-500">
                              {formatBV(tx.prevRightBv)} → {formatBV(tx.newRightBv)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatBV(tx.newMatchAmount)}
                        </TableCell>
                        <TableCell className="text-emerald-600 font-bold" data-testid={`direct-income-${tx.id}`}>
                          {formatCurrency(tx.directIncome)}
                        </TableCell>
                        <TableCell className="text-blue-600 font-bold" data-testid={`diff-income-${tx.id}`}>
                          {formatCurrency(tx.diffIncome)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly BV Tracking
              </CardTitle>
              <p className="text-sm text-gray-600">
                Monthly breakdown of your Business Volume
              </p>
            </CardHeader>
            <CardContent>
              {monthly.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No monthly BV data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Left BV</TableHead>
                      <TableHead>Right BV</TableHead>
                      <TableHead>Directs BV</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthly.map((month) => (
                      <TableRow key={month.monthId}>
                        <TableCell className="font-medium">
                          {formatMonthName(month.monthId)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatBV(month.monthBvLeft)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatBV(month.monthBvRight)}
                        </TableCell>
                        <TableCell className="text-purple-600">
                          {formatBV(month.monthBvDirects)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(month.monthStartdate).toLocaleDateString('en-IN')} - {' '}
                          {new Date(month.monthEnddate).toLocaleDateString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
