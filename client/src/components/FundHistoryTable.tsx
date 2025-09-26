import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, User, Calendar, FileText } from "lucide-react";
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
  const { data: transactions = [], isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/fund-history"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/fund-history');
      return response.json();
    },
  });

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
    const isNegative = numAmount < 0;
    const displayAmount = Math.abs(numAmount);
    
    return (
      <span className={`font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
        {isNegative ? '-' : '+'}₹{displayAmount.toLocaleString()}
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
          Fund History
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${transactions.length} transactions`}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading fund history...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no fund transactions at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-700">User</th>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700">Description</th>
                  <th className="text-left p-3 font-medium text-gray-700">Balance</th>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
