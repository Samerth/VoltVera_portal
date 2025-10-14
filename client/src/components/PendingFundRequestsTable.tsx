import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye, 
  FileText, 
  Calendar, 
  User, 
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2
} from "lucide-react";

interface FundRequest {
  id: string;
  userId: string;
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
  // User details (joined from users table)
  userName?: string;
  userLastName?: string;
  userEmail?: string;
  userDisplayId?: string;
}

interface FundRequestsTableProps {
  statusFilter: 'pending' | 'approved' | 'rejected';
  title: string;
  description?: string;
}

export default function FundRequestsTable({ 
  statusFilter, 
  title, 
  description 
}: FundRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editableAmount, setEditableAmount] = useState('');
  const [editableRemark, setEditableRemark] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fund requests
  const { data: allFundRequests = [], isLoading, refetch } = useQuery<FundRequest[]>({
    queryKey: ["/api/admin/fund-requests"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/fund-requests');
      return response.json();
    },
  });

  // Filter requests by status
  const fundRequests = allFundRequests.filter((request: FundRequest) => request.status === statusFilter);

  // Button configuration based on status
  const getButtonConfig = () => {
    switch (statusFilter) {
      case 'pending':
        return {
          showApprove: true,
          showReject: true,
          showCancel: true,
          approveText: 'Approve',
          rejectText: 'Reject'
        };
      case 'approved':
        return {
          showApprove: false,
          showReject: false,
          showCancel: false,
          approveText: 'Update Transaction',
          rejectText: 'Reject'
        };
      case 'rejected':
        return {
          showApprove: true,
          showReject: true,
          showCancel: true,
          approveText: 'Approve',
          rejectText: 'Update Rejection'
        };
      default:
        return {
          showApprove: true,
          showReject: true,
          showCancel: true,
          approveText: 'Approve',
          rejectText: 'Reject'
        };
    }
  };

  const buttonConfig = getButtonConfig();

  // Update fund request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes, amount, action }: { id: string; status: string; adminNotes: string; amount?: string; action: 'approve' | 'reject' }) => {
      // Set loading state based on action
      if (action === 'approve') {
        setIsApproving(true);
      } else {
        setIsRejecting(true);
      }
      
      const requestBody: any = {
        status,
        adminNotes
      };
      
      // Only add amount if it's provided
      if (amount !== undefined) {
        requestBody.amount = amount;
        console.log('📤 Frontend: Including amount in request:', amount);
      } else {
        console.log('📤 Frontend: No amount provided');
      }
      
      console.log('📤 Frontend: Request body:', requestBody);
      
      const response = await apiRequest('PUT', `/api/admin/fund-requests/${id}`, requestBody);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fund-requests"] });
      
      // Show enhanced success message for approved requests with wallet credit info
      if (result.data?.walletCredit) {
        toast({
          title: "Fund Request Approved & Wallet Credited!",
          description: `₹${result.data.walletCredit.amount} credited to user's wallet. New balance: ₹${result.data.walletCredit.newBalance}`,
        });
      } else {
        toast({
          title: "Success",
          description: result.message,
        });
      }
      
      setIsViewDialogOpen(false);
      setSelectedRequest(null);
      setEditableAmount('');
      setEditableRemark('');
      setIsApproving(false);
      setIsRejecting(false);
    },
    onError: (error: any) => {
      console.error('Error updating fund request:', error);
      
      // Enhanced error handling for wallet credit failures
      let errorTitle = "Error";
      let errorDescription = error.message || "Failed to update fund request";
      
      if (error.message?.includes('Failed to credit wallet')) {
        errorTitle = "Wallet Credit Failed";
        errorDescription = "Fund request approval cancelled due to wallet credit failure. Please check user wallet status and try again.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
      
      setIsApproving(false);
      setIsRejecting(false);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'upi':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      case 'cash':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'cheque':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    return `₹${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReceiptDataUrl = (request: FundRequest): string | null => {
    if (request.receiptData && request.receiptContentType) {
      return `data:${request.receiptContentType};base64,${request.receiptData}`;
    }
    return request.receiptUrl || null;
  };

  const handleViewReceipt = (request: FundRequest) => {
    const dataUrl = getReceiptDataUrl(request);
    if (!dataUrl) return;

    // For PDFs, open in new tab directly
    if (request.receiptContentType === 'application/pdf' || dataUrl.includes('.pdf')) {
      window.open(dataUrl, '_blank');
    } else {
      // For images, create a preview window
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
  };

  const handleView = (request: FundRequest) => {
    setSelectedRequest(request);
    setEditableAmount(request.amount);
    setEditableRemark(request.adminNotes || '');
    setIsViewDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    
    // Validate amount
    const amountNum = parseFloat(editableAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }
    
    // Check if amount has changed (convert both to numbers for comparison)
    const originalAmount = parseFloat(selectedRequest.amount.toString());
    const newAmount = parseFloat(editableAmount);
    const amountChanged = originalAmount !== newAmount;
    
    console.log('=== APPROVE REQUEST ===');
    console.log('Original amount:', selectedRequest.amount, '(type:', typeof selectedRequest.amount, ')');
    console.log('New amount:', editableAmount, '(type:', typeof editableAmount, ')');
    console.log('Original parsed:', originalAmount);
    console.log('New parsed:', newAmount);
    console.log('Amount changed:', amountChanged);
    
    const mutationData = {
      id: selectedRequest.id,
      status: 'approved',
      adminNotes: editableRemark,
      amount: amountChanged ? editableAmount : undefined,
      action: 'approve' as const
    };
    
    console.log('🚀 Sending mutation data:', mutationData);
    
    updateRequestMutation.mutate(mutationData);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    
    // Validate amount
    const amountNum = parseFloat(editableAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }
    
    // Check if amount has changed (convert both to numbers for comparison)
    const originalAmount = parseFloat(selectedRequest.amount.toString());
    const newAmount = parseFloat(editableAmount);
    const amountChanged = originalAmount !== newAmount;
    
    console.log('=== REJECT REQUEST ===');
    console.log('Original amount:', selectedRequest.amount, '(type:', typeof selectedRequest.amount, ')');
    console.log('New amount:', editableAmount, '(type:', typeof editableAmount, ')');
    console.log('Original parsed:', originalAmount);
    console.log('New parsed:', newAmount);
    console.log('Amount changed:', amountChanged);
    
    const mutationData = {
      id: selectedRequest.id,
      status: 'rejected',
      adminNotes: editableRemark,
      amount: amountChanged ? editableAmount : undefined,
      action: 'reject' as const
    };
    
    console.log('🚀 Sending mutation data:', mutationData);
    
    updateRequestMutation.mutate(mutationData);
  };

  const handleCancel = () => {
    setIsViewDialogOpen(false);
    setSelectedRequest(null);
    setEditableAmount('');
    setEditableRemark('');
  };

  const getDisplayName = (request: FundRequest) => {
    if (request.userName && request.userLastName) {
      return `${request.userName} ${request.userLastName}`.trim();
    }
    return request.userDisplayId || request.userId;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : `${fundRequests.length} fund requests`}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
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
            <span className="ml-2 text-gray-600">Loading fund requests...</span>
          </div>
        ) : fundRequests.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No fund requests found</h3>
            <p className="mt-1 text-sm text-gray-500">There are no fund requests at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[200px]">User</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[120px]">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[130px]">Receipt</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[120px]">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[180px]">Payment Method</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[200px]">Transaction ID</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[300px]">Remark</th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[200px]">Date</th>
                  {statusFilter !== 'approved' && (
                    <th className="text-left p-3 font-medium text-gray-700 min-w-[100px]">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {fundRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 min-w-[200px]">
                      <div>
                        <p className="font-medium">{getDisplayName(request)}</p>
                        <p className="text-sm text-gray-500">{request.userEmail || 'No email'}</p>
                        <p className="text-xs text-gray-400">ID: {request.userDisplayId || request.userId}</p>
                      </div>
                    </td>
                    <td className="p-3 min-w-[120px]">
                      <div className="flex items-center">
                        <span className="font-medium text-green-600">
                          {formatAmount(request.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 min-w-[130px]">
                      {(request.receiptData || request.receiptUrl) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(request)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">No receipt</span>
                      )}
                    </td>
                    <td className="p-3 min-w-[120px]">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <Badge className={`ml-2 ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 min-w-[180px]">
                      <div className="flex items-center">
                        {getPaymentMethodIcon(request.paymentMethod)}
                        <span className="ml-2 text-sm">
                          {request.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 min-w-[200px]">
                      <span className="text-sm font-mono text-gray-600 break-all">
                        {request.transactionId || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 min-w-[300px]">
                      <span className="text-sm text-gray-600 break-words">
                        {request.adminNotes || 'No remarks'}
                      </span>
                    </td>
                    <td className="p-3 min-w-[200px]">
                      <div className="flex items-center text-sm text-gray-600 whitespace-nowrap">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    {statusFilter !== 'approved' && (
                      <td className="p-3 min-w-[100px]">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(request)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fund Request Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedRequest && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">User</Label>
                  <p className="text-sm text-gray-600">{getDisplayName(selectedRequest)}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <Label className="font-medium">Transaction ID</Label>
                  <p className="text-sm text-gray-600">{selectedRequest.transactionId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Payment Method</Label>
                  <p className="text-sm text-gray-600">{selectedRequest.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={`${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Receipt</Label>
                  {(selectedRequest.receiptData || selectedRequest.receiptUrl) ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(selectedRequest)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Receipt
                      </Button>
                      {selectedRequest.receiptFilename && (
                        <span className="text-xs text-gray-600">
                          {selectedRequest.receiptFilename}
                          {selectedRequest.receiptSize && ` (${(selectedRequest.receiptSize / 1024).toFixed(2)} KB)`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No receipt</span>
                  )}
                </div>
                <div>
                  <Label className="font-medium">Date</Label>
                  <p className="text-sm text-gray-600">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="0"
                  value={editableAmount}
                  onChange={(e) => setEditableAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={editableAmount !== selectedRequest?.amount ? 'border-orange-300 bg-orange-50' : ''}
                />
                {editableAmount !== selectedRequest?.amount && (
                  <p className="text-xs text-orange-600 mt-1">Amount has been modified</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="remark">Admin Remark</Label>
                <Textarea
                  id="remark"
                  value={editableRemark}
                  onChange={(e) => setEditableRemark(e.target.value)}
                  placeholder="Enter your remark..."
                  className={`min-h-[100px] ${editableRemark !== (selectedRequest?.adminNotes || '') ? 'border-orange-300 bg-orange-50' : ''}`}
                />
                {editableRemark !== (selectedRequest?.adminNotes || '') && (
                  <p className="text-xs text-orange-600 mt-1">Remark has been modified</p>
                )}
              </div>
            </div>
          </div>
          
          {statusFilter !== 'approved' && (
            <DialogFooter className="flex justify-between">
              {buttonConfig.showCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
              <div className="flex space-x-2">
                {buttonConfig.showReject && (
                  <Button
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                    variant="destructive"
                  >
                    {isRejecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        {buttonConfig.rejectText}
                      </>
                    )}
                  </Button>
                )}
                {buttonConfig.showApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isApproving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {buttonConfig.approveText}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
          {statusFilter === 'approved' && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}