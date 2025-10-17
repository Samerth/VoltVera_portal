import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, RefreshCw, Filter, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawalTransaction {
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
  userName?: string;
  userEmail?: string;
  userDisplayId?: string;
}

export default function WithdrawalHistoryTable() {
  const [searchUserId, setSearchUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    userId: '',
    startDate: '',
    endDate: ''
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    // Always filter for withdrawal type
    params.append('type', 'withdrawal');
    
    if (appliedFilters.userId) {
      params.append('userId', appliedFilters.userId);
    }
    if (appliedFilters.startDate) {
      params.append('startDate', appliedFilters.startDate);
    }
    if (appliedFilters.endDate) {
      params.append('endDate', appliedFilters.endDate);
    }
    
    return params.toString();
  };

  const { data: transactions = [], isLoading, refetch } = useQuery<WithdrawalTransaction[]>({
    queryKey: ["/api/admin/fund-history", appliedFilters, "withdrawal"],
    queryFn: async () => {
      const params = buildQueryParams();
      const url = `/api/admin/fund-history?${params}`;
      const response = await apiRequest('GET', url);
      return response.json();
    },
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      userId: searchUserId,
      startDate,
      endDate
    });
  };

  const handleClearFilters = () => {
    setSearchUserId('');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      userId: '',
      startDate: '',
      endDate: ''
    });
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

  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    const displayAmount = Math.abs(numAmount);
    
    return (
      <span className="font-medium text-orange-600">
        -₹{displayAmount.toLocaleString()}
      </span>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
          <TrendingDown className="mr-2 h-5 w-5 text-orange-600" />
          Withdrawal History
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${transactions.length} withdrawal transactions`}
          </p>
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            disabled={isLoading}
            data-testid="button-refresh-withdrawals"
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="searchUserId">User ID / Email</Label>
              <Input
                id="searchUserId"
                placeholder="Search by User ID or Email"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                data-testid="input-search-user-withdrawal"
              />
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date-withdrawal"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date-withdrawal"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              size="sm"
              className="volt-gradient text-white"
              data-testid="button-apply-filters-withdrawal"
            >
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              onClick={handleClearFilters}
              size="sm"
              variant="outline"
              data-testid="button-clear-filters-withdrawal"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-2 text-gray-600">Loading withdrawal history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No withdrawals found</h3>
            <p className="mt-1 text-sm text-gray-500">No withdrawal transactions match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-700">User</th>
                  <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                  <th className="text-left p-3 font-medium text-gray-700">Balance After</th>
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{transaction.userName || 'Unknown User'}</p>
                        <p className="text-sm text-gray-500">{transaction.userEmail || 'No email'}</p>
                        <p className="text-xs text-gray-400">ID: {transaction.userDisplayId || transaction.userId}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {transaction.description || 'No description'}
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-gray-900">
                        ₹{parseFloat(transaction.balanceAfter).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
