import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BVTransactionsReportProps {
  title?: string;
  description?: string;
}

export function BVTransactionsReport({ 
  title = "System-wide BV Transactions Report", 
  description = "Complete transaction history for all users in the system" 
}: BVTransactionsReportProps) {
  const { toast } = useToast();
  const [searchUserId, setSearchUserId] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    transactionType: 'all',
    startDate: '',
    endDate: '',
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (appliedFilters.userId) {
      params.append('userId', appliedFilters.userId);
    }
    if (appliedFilters.transactionType && appliedFilters.transactionType !== 'all') {
      params.append('transactionType', appliedFilters.transactionType);
    }
    if (appliedFilters.startDate) {
      params.append('startDate', appliedFilters.startDate);
    }
    if (appliedFilters.endDate) {
      params.append('endDate', appliedFilters.endDate);
    }
    
    return params.toString();
  };

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/bv-transactions-report', appliedFilters],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await fetch(`/api/admin/bv-transactions-report?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch BV transactions');
      }
      
      return response.json();
    }
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      userId: searchUserId,
      transactionType,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setSearchUserId('');
    setTransactionType('all');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      userId: '',
      transactionType: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatBV = (bv: string) => {
    return `${parseFloat(bv).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BV`;
  };

  const exportToCSV = () => {
    const csvData = transactions.map((tx: any) => ({
      'Date': new Date(tx.createdAt).toLocaleDateString('en-IN'),
      'User ID': tx.userId,
      'User Name': tx.userName || 'N/A',
      'Initiator': tx.initiatingUserId || 'N/A',
      'Type': tx.transactionType,
      'Left BV Change': `${tx.prevLeftBv} → ${tx.newLeftBv}`,
      'Right BV Change': `${tx.prevRightBv} → ${tx.newRightBv}`,
      'New Match': tx.newMatchAmount,
      'Direct Income': tx.directIncome,
      'Differential Income': tx.diffIncome,
      'Rank': tx.rank,
      'Month ID': tx.monthId,
    }));

    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map((row: any) => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bv-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${transactions.length} BV transactions to CSV`,
    });
  };

  const getTotalDirectIncome = () => {
    return transactions.reduce((sum: number, tx: any) => 
      sum + parseFloat(tx.directIncome || '0'), 0
    ).toFixed(2);
  };

  const getTotalDiffIncome = () => {
    return transactions.reduce((sum: number, tx: any) => 
      sum + parseFloat(tx.diffIncome || '0'), 0
    ).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-bv-report"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={transactions.length === 0}
              data-testid="button-export-bv-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search-user">Search User (ID/Name/Email)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-user"
                  placeholder="VV0001, John, email@..."
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-user"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger id="transaction-type" data-testid="select-transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bv_calculation">BV Calculation</SelectItem>
                  <SelectItem value="self_bv_update">Self BV Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} data-testid="button-apply-filters">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters} data-testid="button-clear-filters">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">Total Direct Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(getTotalDirectIncome())}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Total Differential Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(getTotalDiffIncome())}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading BV transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No BV transactions found</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Initiator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Left BV</TableHead>
                  <TableHead>Right BV</TableHead>
                  <TableHead>New Match</TableHead>
                  <TableHead>Direct Income</TableHead>
                  <TableHead>Diff Income</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`user-${tx.id}`}>{tx.userId}</Badge>
                    </TableCell>
                    <TableCell>{tx.userName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`initiator-${tx.id}`}>
                        {tx.initiatingUserId || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`type-${tx.id}`}>
                        {tx.transactionType.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatBV(tx.prevLeftBv)} → {formatBV(tx.newLeftBv)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatBV(tx.prevRightBv)} → {formatBV(tx.newRightBv)}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
