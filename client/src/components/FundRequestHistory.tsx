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
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FundRequest {
  id: string;
  amount: string;
  receiptUrl?: string;
  receiptData?: string;
  receiptContentType?: string;
  receiptFilename?: string;
  receiptSize?: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod?: string;
  transactionId?: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FundRequestHistory() {
  const queryClient = useQueryClient();
  
  // Fetch user's fund requests
  const { data: fundRequests = [], isLoading, error } = useQuery<FundRequest[]>({
    queryKey: ['/api/user/fund-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user/fund-requests');
      return response.json();
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user/fund-requests'] });
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

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'UPI': return Smartphone;
      case 'Bank transfer': return Building2;
      case 'Cash': return DollarSign;
      case 'Cheque': return FileText;
      default: return CreditCard;
    }
  };

  const formatAmount = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
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

  const getReceiptDataUrl = (request: FundRequest): string | null => {
    if (request.receiptData && request.receiptContentType) {
      return `data:${request.receiptContentType};base64,${request.receiptData}`;
    }
    return request.receiptUrl || null;
  };

  const handleViewReceipt = async (request: FundRequest) => {
    const dataUrl = getReceiptDataUrl(request);
    if (!dataUrl) return;

    console.log('🔍 Viewing receipt:', {
      hasReceiptData: !!request.receiptData,
      contentType: request.receiptContentType,
      filename: request.receiptFilename,
      dataUrlLength: dataUrl.length
    });

    try {
      // For PDFs, convert to blob for better browser compatibility
      if (request.receiptContentType === 'application/pdf' || dataUrl.includes('.pdf')) {
        console.log('📄 Opening PDF receipt');
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
          alert('Please allow popups to view documents.');
        } else {
          console.log('✅ PDF opened successfully');
        }
      } else {
        // For images, create a preview window
        console.log('🖼️ Opening image receipt');
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Receipt - ${request.receiptFilename || 'Receipt'}</title>
                <style>
                  body {
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f3f4f6;
                  }
                  img {
                    max-width: 90%;
                    max-height: 90vh;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  }
                </style>
              </head>
              <body>
                <img src="${dataUrl}" alt="Receipt" />
              </body>
            </html>
          `);
        }
      }
    } catch (error) {
      console.error('❌ Error viewing receipt:', error);
      alert('Failed to open receipt. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your fund requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Failed to load fund requests</p>
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
              Fund Request History
            </CardTitle>
            <p className="text-sm text-gray-600">
              {fundRequests.length === 0 
                ? 'No fund requests found' 
                : `${fundRequests.length} fund request${fundRequests.length === 1 ? '' : 's'} found`
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
        {fundRequests.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No fund requests submitted yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Submit your first fund request using the "Request Funds" tab
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fundRequests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              const PaymentMethodIcon = getPaymentMethodIcon(request.paymentMethod);
              
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
                          {request.transactionId && `Transaction: ${request.transactionId}`}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <PaymentMethodIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {request.paymentMethod || 'Not specified'}
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
                  
                  {request.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Admin Notes:</strong> {request.adminNotes}
                      </p>
                    </div>
                  )}
                  
                  {(request.receiptData || request.receiptUrl) && (
                    <div className="mt-3 flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReceipt(request)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                      {request.receiptFilename && (
                        <span className="text-xs text-gray-600">
                          {request.receiptFilename}
                          {request.receiptSize && ` (${(request.receiptSize / 1024).toFixed(2)} KB)`}
                        </span>
                      )}
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
