import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, User, Calendar, FileText, Filter, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: string;
  description: string;
  referenceId?: string;
  balanceBefore: string;
  balanceAfter: string;
  metadata?: any;
  createdAt: string;
  // User details (joined from users table)
  userName?: string;
  userEmail?: string;
  userDisplayId?: string;
}

export default function FundHistoryTable() {
  const [searchUserId, setSearchUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    type: 'all'
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (appliedFilters.userId) {
      params.append('userId', appliedFilters.userId);
    }
    if (appliedFilters.startDate) {
      params.append('startDate', appliedFilters.startDate);
    }
    if (appliedFilters.endDate) {
      params.append('endDate', appliedFilters.endDate);
    }
    if (appliedFilters.type !== 'all') {
      params.append('type', appliedFilters.type);
    }
    
    return params.toString();
  };

  const { data: transactions = [], isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/fund-history", appliedFilters],
    queryFn: async () => {
      const params = buildQueryParams();
      const url = params ? `/api/admin/fund-history?${params}` : '/api/admin/fund-history';
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      userId: searchUserId,
      startDate,
      endDate,
      type: transactionType
    });
  };

  const handleClearFilters = () => {
    setSearchUserId('');
    setStartDate('');
    setEndDate('');
    setTransactionType('all');
    setAppliedFilters({
      userId: '',
      startDate: '',
      endDate: '',
      type: 'all'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'admin_credit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'admin_debit':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'sponsor_income':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'admin_credit':
        return 'bg-green-100 text-green-700';
      case 'admin_debit':
        return 'bg-red-100 text-red-700';
      case 'sponsor_income':
        return 'bg-blue-100 text-blue-700';
      case 'withdrawal':
        return 'bg-orange-100 text-orange-700';
      case 'purchase':
        return 'bg-purple-100 text-purple-700';
      case 'rank_bonus':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAmount = (amount: string, type: string) => {
    const numAmount = parseFloat(amount);
    const displayAmount = Math.abs(numAmount);
    
    // Determine if it's a debit (negative) or credit (positive) based on transaction type
    const isDebit = type === 'purchase' || type === 'withdrawal' || type === 'admin_debit';
    
    return (
      <span className={`font-medium ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
        {isDebit ? '-' : '+'}₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionCategory = (type: string) => {
    // Categorize E-wallet usage types
    if (type === 'purchase') {
      return { label: 'Purchase', color: 'bg-purple-100 text-purple-700' };
    } else if (type === 'withdrawal') {
      return { label: 'Withdrawal', color: 'bg-orange-100 text-orange-700' };
    } else if (type === 'admin_debit') {
      return { label: 'Admin Debit', color: 'bg-red-100 text-red-700' };
    } else if (type === 'admin_credit') {
      return { label: 'Admin Credit', color: 'bg-blue-100 text-blue-700' };
    } else {
      return { label: 'Other', color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
          Fund History
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${transactions.length} E-wallet usage transactions`}
          </p>
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-gray-700">Filters</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="searchUserId">User ID / Email</Label>
              <Input
                id="searchUserId"
                placeholder="Search by User ID or Email"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                data-testid="input-search-user-fund"
              />
            </div>
            
            <div>
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger id="transactionType" data-testid="select-transaction-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="admin_credit">Admin Credit</SelectItem>
                  <SelectItem value="admin_debit">Admin Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date-fund"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date-fund"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="volt-gradient text-white"
              data-testid="button-apply-filters-fund"
            >
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              onClick={handleClearFilters}
              size="sm"
              variant="outline"
              data-testid="button-clear-filters-fund"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading fund history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No E-wallet usage found</h3>
            <p className="mt-1 text-sm text-gray-500">No purchases, withdrawals, or admin operations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-700">User</th>
                  <th className="text-left p-3 font-medium text-gray-700">Category</th>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                  <th className="text-left p-3 font-medium text-gray-700">Balance</th>
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const category = getTransactionCategory(transaction.type);
                  return (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{transaction.userName || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{transaction.userEmail || 'No email'}</p>
                        <p className="text-xs text-gray-400">ID: {transaction.userDisplayId || transaction.userId}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${category.color}`}>
                        {category.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          {formatTransactionType(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {formatAmount(transaction.amount, transaction.type)}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="text-gray-900">{transaction.description}</p>
                        {transaction.referenceId && (
                          <p className="text-xs text-gray-500">Ref: {transaction.referenceId}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="text-gray-600">Before: ₹{parseFloat(transaction.balanceBefore).toLocaleString()}</p>
                        <p className="text-gray-900 font-medium">After: ₹{parseFloat(transaction.balanceAfter).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(transaction.createdAt)}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
