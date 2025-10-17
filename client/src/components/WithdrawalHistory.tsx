import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Calendar,
  ExternalLink,
  FileText,
  CreditCard,
  Smartphone,
  Building2,
  Receipt,
  IndianRupee,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: string;
  withdrawalType: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  bankDetails?: {
    bankName: string;
    bankAccountNumber: string;
    bankIFSC: string;
    bankAccountHolderName: string;
  };
  usdtWalletAddress?: string;
  networkType?: string;
}

export default function WithdrawalHistory() {
  const queryClient = useQueryClient();
  
  // Fetch user's withdrawal requests
  const { data: withdrawalRequests = [], isLoading, error, refetch } = useQuery<WithdrawalRequest[]>({
    queryKey: ['/api/user/withdrawal-requests'],
    queryFn: async () => {
      console.log('🔍 Fetching withdrawal requests...');
      console.log('🔍 Impersonation token:', typeof window !== 'undefined' ? sessionStorage.getItem('impersonationToken') : 'N/A');
      const response = await apiRequest('GET', '/api/user/withdrawal-requests');
      console.log('🔍 Response status:', response.status);
      const data = await response.json();
      console.log('🔍 Response data:', data);
      console.log('🔍 Number of withdrawal requests:', data.length);
      return data;
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user/withdrawal-requests'] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = (withdrawalType: string) => {
    // Only INR is supported
    return Building2;
  };

  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your withdrawal requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load withdrawal requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
              <Receipt className="mr-2 h-5 w-5 text-blue-600" />
              Withdrawal History
            </CardTitle>
            <p className="text-sm text-gray-600">
              {withdrawalRequests.length === 0 
                ? 'No withdrawal requests found' 
                : `${withdrawalRequests.length} withdrawal request${withdrawalRequests.length === 1 ? '' : 's'} found`
              }
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {withdrawalRequests.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No withdrawal requests submitted yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Submit your first withdrawal request using the "Withdrawal Request" tab
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawalRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              const TypeIcon = getTypeIcon(request.withdrawalType);
              
              return (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {formatAmount(request.amount)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.adminNotes || 'No additional details'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {request.withdrawalType}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    
                    {request.processedAt && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          Processed: {formatDate(request.processedAt)}
                        </span>
                      </div>
                    )}
                    
                    {request.processedBy && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">
                          Processed by: {request.processedBy}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {request.bankDetails && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Bank Details:</strong>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Bank: {request.bankDetails.bankName}</div>
                        <div>Account: ****{request.bankDetails.bankAccountNumber.slice(-4)}</div>
                        <div>IFSC: {request.bankDetails.bankIFSC}</div>
                        <div>Holder: {request.bankDetails.bankAccountHolderName}</div>
                      </div>
                    </div>
                  )}
                  
                  {request.usdtWalletAddress && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>USDT Wallet Details:</strong>
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                        <div>Address: {request.usdtWalletAddress}</div>
                        {request.networkType && <div>Network: {request.networkType}</div>}
                      </div>
                    </div>
                  )}
                  
                  {request.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Admin Notes:</strong> {request.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
