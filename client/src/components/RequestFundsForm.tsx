import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Upload, FileText, CreditCard, Smartphone, Building2, Receipt, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RequestFundsFormData {
  amount: string;
  transactionId: string;
  paymentMethod: string;
  receiptUrl: string;
}

export default function RequestFundsForm() {
  const [formData, setFormData] = useState<RequestFundsFormData>({
    amount: '',
    transactionId: '',
    paymentMethod: '',
    receiptUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for display
  const getCurrencySymbol = () => '₹'; // Always INR
  const getCurrencyIcon = () => DollarSign;
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI': return Smartphone;
      case 'Bank transfer': return Building2;
      case 'Cash': return DollarSign;
      case 'Cheque': return FileText;
      default: return CreditCard;
    }
  };

  const CurrencyIcon = getCurrencyIcon();

  // Mutation for requesting funds
  const requestFundsMutation = useMutation({
    mutationFn: async (data: RequestFundsFormData) => {
      console.log('Requesting funds:', data);
      const response = await apiRequest('POST', '/api/user/fund-requests', data);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to request funds');
        } catch (parseError) {
          throw new Error('Failed to request funds');
        }
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fund Request Submitted!",
        description: "Your fund request has been submitted successfully. You will be notified once it's processed.",
      });
      // Reset form
      setFormData({
        amount: '',
        transactionId: '',
        paymentMethod: '',
        receiptUrl: ''
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/fund-requests'] });
    },
    onError: (error: any) => {
      console.error('Fund request error:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit fund request. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.transactionId || !formData.paymentMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // For now, use a dummy URL for receipt
    const requestData = {
      ...formData,
      receiptUrl: `https://example.com/receipts/${Date.now()}.pdf` // Dummy URL
    };
    
    requestFundsMutation.mutate(requestData);
  };

  const handleInputChange = (field: keyof RequestFundsFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const PaymentMethodIcon = formData.paymentMethod ? getPaymentMethodIcon(formData.paymentMethod) : CreditCard;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
          <CurrencyIcon className="mr-2 h-5 w-5 text-green-600" />
          Request Funds
        </CardTitle>
        <p className="text-sm text-gray-600">
          Submit a request to add funds to your account. Your request will be reviewed by the admin.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Fund Amount ({getCurrencySymbol()})
            </Label>
            <div className="relative">
              <CurrencyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="1"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="Enter amount"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Transaction ID Field */}
          <div className="space-y-2">
            <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
              Transaction ID
            </Label>
            <Input
              id="transactionId"
              type="text"
              value={formData.transactionId}
              onChange={(e) => handleInputChange('transactionId', e.target.value)}
              placeholder="Enter transaction ID"
              required
            />
          </div>

          {/* Payment Method Field */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
              Payment Method
            </Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">
                  <div className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4" />
                    UPI
                  </div>
                </SelectItem>
                <SelectItem value="Bank transfer">
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="Cash">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="Cheque">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Cheque
                  </div>
                </SelectItem>
                <SelectItem value="Other">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Upload Field */}
          <div className="space-y-2">
            <Label htmlFor="receipt" className="text-sm font-medium text-gray-700">
              Payment Receipt
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload your payment receipt (PDF, JPG, PNG)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // For now, just set a dummy URL
                  handleInputChange('receiptUrl', `https://example.com/receipts/${Date.now()}.pdf`);
                  toast({
                    title: "Receipt Uploaded",
                    description: "Receipt uploaded successfully (demo mode)",
                  });
                }}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Upload Receipt
              </Button>
              {formData.receiptUrl && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Receipt uploaded successfully
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <CurrencyIcon className="mr-2 h-4 w-4" />
                Submit Fund Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
