import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Package, User, Calendar, DollarSign, TrendingUp, RefreshCw, ShoppingCart, Save, X, Pencil, Truck } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PurchaseWithDetails {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  totalAmount: string;
  totalBV: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  deliveryAddress: string | null;
  trackingId: string | null;
  createdAt: string;
  userDisplayId: string;
  userName: string;
  userEmail: string;
  userMobile: string | null;
  productName: string;
  productDescription: string | null;
  productCategory: string;
  productPrice: string;
  productBV: string;
}

export default function AdminPurchasesTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>("all");
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [editDeliveryStatus, setEditDeliveryStatus] = useState<string>("");
  const [editTrackingId, setEditTrackingId] = useState<string>("");

  const { data: purchases = [], isLoading, refetch } = useQuery<PurchaseWithDetails[]>({
    queryKey: ['/api/admin/purchases'],
  });

  // Mutation to update delivery status
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ id, deliveryStatus, trackingId }: { id: string; deliveryStatus: string; trackingId?: string }) => {
      return await apiRequest(
        'PATCH',
        `/api/admin/purchases/${id}/delivery-status`,
        { deliveryStatus, trackingId }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/purchases'] });
      toast({
        title: "Success",
        description: "Delivery status updated successfully",
      });
      setEditingPurchaseId(null);
      setEditDeliveryStatus("");
      setEditTrackingId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  const handleEditDeliveryStatus = (purchase: PurchaseWithDetails) => {
    setEditingPurchaseId(purchase.id);
    setEditDeliveryStatus(purchase.deliveryStatus);
    setEditTrackingId(purchase.trackingId || "");
  };

  const handleSaveDeliveryStatus = () => {
    if (editingPurchaseId && editDeliveryStatus) {
      updateDeliveryStatusMutation.mutate({
        id: editingPurchaseId,
        deliveryStatus: editDeliveryStatus,
        trackingId: editTrackingId || undefined,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPurchaseId(null);
    setEditDeliveryStatus("");
    setEditTrackingId("");
  };

  // Filter purchases based on search and status filters
  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (purchase.userDisplayId || '').toLowerCase().includes(searchLower) ||
      (purchase.userName || '').toLowerCase().includes(searchLower) ||
      (purchase.userEmail || '').toLowerCase().includes(searchLower) ||
      (purchase.productName || '').toLowerCase().includes(searchLower);
    
    const matchesPaymentStatus = paymentStatusFilter === "all" || purchase.paymentStatus === paymentStatusFilter;
    const matchesDeliveryStatus = deliveryStatusFilter === "all" || purchase.deliveryStatus === deliveryStatusFilter;
    
    return matchesSearch && matchesPaymentStatus && matchesDeliveryStatus;
  });

  // Calculate summary statistics
  const stats = {
    totalPurchases: filteredPurchases.length,
    totalRevenue: filteredPurchases.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0),
    totalBV: filteredPurchases.reduce((sum, p) => sum + parseFloat(p.totalBV), 0),
    completedPurchases: filteredPurchases.filter(p => p.paymentStatus === 'completed').length,
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'} data-testid={`payment-status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDeliveryStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800 border-green-200',
      shipped: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'} data-testid={`delivery-status-${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="admin-purchases-table">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-volt-light" />
            All Purchases
          </CardTitle>
          <CardDescription>
            Monitor all product purchases across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Purchases</p>
                    <p className="text-2xl font-bold text-blue-900" data-testid="total-purchases">
                      {stats.totalPurchases}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900" data-testid="total-revenue">
                      ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total BV</p>
                    <p className="text-2xl font-bold text-purple-900" data-testid="total-bv">
                      {stats.totalBV.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-yellow-900" data-testid="completed-purchases">
                      {stats.completedPurchases}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by user ID, name, email, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-purchases"
                />
              </div>
            </div>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-payment-status">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryStatusFilter} onValueChange={setDeliveryStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-delivery-status">
                <SelectValue placeholder="Delivery Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="refresh-purchases"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Purchases Table */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-volt-light mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchases...</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Purchases Found</h3>
              <p className="text-gray-500">
                {searchTerm || paymentStatusFilter !== 'all' || deliveryStatusFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "No purchases have been made yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="purchases-data-table">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">BV</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50" data-testid={`purchase-row-${purchase.id}`}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(purchase.createdAt), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900" data-testid={`user-display-id-${purchase.id}`}>
                              {purchase.userDisplayId}
                            </div>
                            <div className="text-gray-600">{purchase.userName}</div>
                            <div className="text-xs text-gray-500">{purchase.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900" data-testid={`product-name-${purchase.id}`}>
                          {purchase.productName}
                        </div>
                        <div className="text-xs text-gray-500">{purchase.productCategory}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {purchase.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ₹{parseFloat(purchase.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {parseFloat(purchase.totalBV).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getPaymentStatusBadge(purchase.paymentStatus)}
                        <div className="text-xs text-gray-500 mt-1">{purchase.paymentMethod || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingPurchaseId === purchase.id ? (
                          <div className="space-y-2 min-w-[200px]">
                            <Select
                              value={editDeliveryStatus}
                              onValueChange={setEditDeliveryStatus}
                              data-testid={`edit-delivery-status-${purchase.id}`}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Tracking ID (optional)"
                              value={editTrackingId}
                              onChange={(e) => setEditTrackingId(e.target.value)}
                              className="h-8 text-xs"
                              data-testid={`edit-tracking-id-${purchase.id}`}
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={handleSaveDeliveryStatus}
                                disabled={updateDeliveryStatusMutation.isPending}
                                className="h-7 text-xs px-2"
                                data-testid={`save-delivery-status-${purchase.id}`}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={updateDeliveryStatusMutation.isPending}
                                className="h-7 text-xs px-2"
                                data-testid={`cancel-delivery-edit-${purchase.id}`}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getDeliveryStatusBadge(purchase.deliveryStatus)}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditDeliveryStatus(purchase)}
                                className="h-6 w-6 p-0"
                                data-testid={`edit-delivery-btn-${purchase.id}`}
                              >
                                <Pencil className="h-3 w-3 text-gray-500" />
                              </Button>
                            </div>
                            {purchase.trackingId && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Truck className="h-3 w-3" />
                                {purchase.trackingId}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
