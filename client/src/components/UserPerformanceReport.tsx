import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Search, Filter, CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const rankOptions = [
  'Executive', 'Bronze Star', 'Gold Star', 'Emerald Star', 'Ruby Star', 
  'Diamond', 'Wise President', 'President', 'Ambassador', 
  'Deputy Director', 'Director', 'Founder'
];

export function UserPerformanceReport() {
  const { toast } = useToast();
  const [userFilter, setUserFilter] = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    user: '',
    rank: '',
    startDate: '',
    endDate: '',
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (appliedFilters.user) params.append('userId', appliedFilters.user);
    if (appliedFilters.rank && appliedFilters.rank !== 'all') params.append('rank', appliedFilters.rank);
    if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
    if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);
    return params.toString();
  };

  const { data: performanceData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/user-performance-report', appliedFilters],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await fetch(`/api/admin/user-performance-report?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user performance data');
      const result = await response.json();
      return Array.isArray(result) ? result : result.data || [];
    }
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      user: userFilter,
      rank: rankFilter,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setUserFilter('');
    setRankFilter('');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      user: '',
      rank: '',
      startDate: '',
      endDate: '',
    });
  };

  const exportToCSV = () => {
    const headers = [
      'User ID', 'Name', 'Email', 'Rank', 'Status',
      'Direct Income', 'Differential Income', 'Total Income',
      'Monthly Direct BV', 'Monthly Left BV', 'Monthly Right BV', 'Monthly Team BV',
      'Lifetime Direct BV', 'Lifetime Left BV', 'Lifetime Right BV', 'Lifetime Team BV',
      'Lifetime Matching BV', 'Carry Forward Left', 'Carry Forward Right',
      'Current Balance', 'Total Earnings', 'Total Withdrawals',
      'Total Directs', 'Left Directs', 'Right Directs',
      'Required Team BV', 'Required Directs', 'Eligible for Rank'
    ];

    const csvData = performanceData.map((user: any) => [
      user.userId,
      user.fullName,
      user.email,
      user.currentRank,
      user.status,
      user.totalDirectIncome,
      user.totalDifferentialIncome,
      user.totalIncome,
      user.monthlyDirectBV,
      user.monthlyLeftBV,
      user.monthlyRightBV,
      user.monthlyTeamBV,
      user.lifetimeDirectBV,
      user.lifetimeLeftBV,
      user.lifetimeRightBV,
      user.lifetimeTeamBV,
      user.lifetimeMatchingBV,
      user.lifetimeCarryForwardLeft,
      user.lifetimeCarryForwardRight,
      user.currentBalance,
      user.totalEarnings,
      user.totalWithdrawals,
      user.totalDirects,
      user.leftDirects,
      user.rightDirects,
      user.requiredTeamBV,
      user.requiredDirects,
      user.isEligible ? 'Yes' : 'No'
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-performance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: `Exported ${performanceData.length} user records to CSV`,
    });
  };

  const formatCurrency = (value: string | number) => {
    return `$${parseFloat(value.toString()).toFixed(2)}`;
  };

  const getEligibilityBadge = (user: any) => {
    if (user.isEligible) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Eligible
        </Badge>
      );
    }
    if (!user.meetsTeamBV && !user.meetsDirects) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Not Eligible
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Partial
      </Badge>
    );
  };

  // Calculate summary statistics
  const totalUsers = performanceData.length;
  const totalDirectIncome = performanceData.reduce((sum: number, user: any) => 
    sum + parseFloat(user.totalDirectIncome || 0), 0);
  const totalDifferentialIncome = performanceData.reduce((sum: number, user: any) => 
    sum + parseFloat(user.totalDifferentialIncome || 0), 0);
  const totalIncome = performanceData.reduce((sum: number, user: any) => 
    sum + parseFloat(user.totalIncome || 0), 0);
  const eligibleUsers = performanceData.filter((user: any) => user.isEligible).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold mt-1">{totalUsers}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Direct Income</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(totalDirectIncome)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Differential Income</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">{formatCurrency(totalDifferentialIncome)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Income</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalIncome)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Eligible Users</div>
          <div className="text-2xl font-bold mt-1 text-green-500">{eligibleUsers}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">User Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="ID, Name, or Email"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="pl-10"
                data-testid="input-user-search"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Rank</label>
            <Select value={rankFilter} onValueChange={setRankFilter}>
              <SelectTrigger className="mt-1" data-testid="select-rank-filter">
                <SelectValue placeholder="All Ranks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranks</SelectItem>
                {rankOptions.map(rank => (
                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
              data-testid="input-start-date"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
              data-testid="input-end-date"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleApplyFilters} className="flex-1" data-testid="button-apply-filters">
              Apply
            </Button>
            <Button onClick={handleClearFilters} variant="outline" data-testid="button-clear-filters">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline" disabled={performanceData.length === 0} data-testid="button-export-csv">
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Performance Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading user performance data...</div>
          ) : performanceData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10">User</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Direct Income</TableHead>
                  <TableHead className="text-right">Diff. Income</TableHead>
                  <TableHead className="text-right">Total Income</TableHead>
                  <TableHead className="text-right">Monthly Team BV</TableHead>
                  <TableHead className="text-right">Lifetime Team BV</TableHead>
                  <TableHead className="text-right">Wallet Balance</TableHead>
                  <TableHead className="text-right">Total Earnings</TableHead>
                  <TableHead className="text-right">Withdrawals</TableHead>
                  <TableHead className="text-center">Directs</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>Eligibility</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-2">Promotion Eligibility Status</p>
                            <p className="text-sm mb-2">Shows if user meets requirements for next rank:</p>
                            <ul className="text-xs space-y-1">
                              <li>🟢 <strong>Eligible:</strong> Meets both Team BV and Direct recruits requirements</li>
                              <li>🟡 <strong>Partial:</strong> Meets one requirement, needs the other</li>
                              <li>🔴 <strong>Not Eligible:</strong> Needs to meet both requirements</li>
                            </ul>
                            <p className="text-xs mt-2 text-gray-400">✓ = Met | ✗ = Not Met</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((user: any) => (
                  <TableRow key={user.userId} data-testid={`row-user-${user.userId}`}>
                    <TableCell className="sticky left-0 bg-white z-10">
                      <div>
                        <div className="font-medium">{user.userId}</div>
                        <div className="text-sm text-gray-500">{user.fullName}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.currentRank}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(user.totalDirectIncome)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.totalDifferentialIncome)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(user.totalIncome)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.monthlyTeamBV)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.lifetimeTeamBV)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(user.currentBalance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.totalEarnings)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(user.totalWithdrawals)}</TableCell>
                    <TableCell className="text-center">
                      <div>{user.totalDirects}</div>
                      <div className="text-xs text-gray-500">L:{user.leftDirects} R:{user.rightDirects}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getEligibilityBadge(user)}
                      <div className="text-xs text-gray-500 mt-1">
                        {user.meetsTeamBV ? '✓' : '✗'} BV | {user.meetsDirects ? '✓' : '✗'} Directs
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
