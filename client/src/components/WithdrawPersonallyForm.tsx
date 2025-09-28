import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User, FileText, MessageSquare, IndianRupee } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawFormData {
  userId: string;
  withdrawalType: 'INR' | 'USD';
  amount: string;
  remarks: string;
}

export default function WithdrawPersonallyForm() {
  const [formData, setFormData] = useState<WithdrawFormData>({
    userId: '',
    withdrawalType: 'INR',
    amount: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for currency display
  const getCurrencySymbol = () => {
    return formData.withdrawalType === 'INR' ? '₹' : '$';
  };

  const getCurrencyIcon = () => {
    return formData.withdrawalType === 'INR' ? IndianRupee : DollarSign;
  };

  const CurrencyIcon = getCurrencyIcon();

  // Mutation for creating withdrawal request
  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawFormData) => {
      const response = await apiRequest('POST', '/api/admin/withdraw-personally', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        // Return error result instead of throwing
        return { 
          success: false, 
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      const result = await response.json();
      return { success: true, data: result };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: "Withdrawal request created successfully",
        });
        // Reset form
        setFormData({
          userId: '',
          withdrawalType: 'INR',
          amount: '',
          remarks: ''
        });
        // Invalidate withdrawal queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      } else {
        // Handle error case - only show toast, no form error
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      // This should not be called with our new approach, but keep as fallback
      let errorMessage = "Failed to create withdrawal request";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Only show toast, no form error
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof WithdrawFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.userId.trim()) {
      toast({
        title: "Validation Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount.trim() || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!formData.remarks.trim()) {
      toast({
        title: "Validation Error",
        description: "Remarks are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawalMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
            <CurrencyIcon className="mr-2 h-5 w-5 text-volt-light" />
            Create Withdrawal Request
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create a withdrawal request on behalf of a user
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User ID Field */}
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-sm font-medium text-gray-700 flex items-center">
                <User className="mr-2 h-4 w-4" />
                User ID
              </Label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter User ID (e.g., VV0001)"
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the User ID of the user for whom you want to create the withdrawal request
              </p>
            </div>

            {/* Withdrawal Type Field */}
            <div className="space-y-2">
              <Label htmlFor="withdrawalType" className="text-sm font-medium text-gray-700 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Withdrawal Type
              </Label>
              <Select
                value={formData.withdrawalType}
                onValueChange={(value: 'INR' | 'USD') => handleInputChange('withdrawalType', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select withdrawal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (Indian Rupees)</SelectItem>
                  <SelectItem value="USD">USD (US Dollars)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose the currency type for the withdrawal
              </p>
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center">
                <CurrencyIcon className="mr-2 h-4 w-4" />
                Amount ({getCurrencySymbol()})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder={`Enter withdrawal amount in ${getCurrencySymbol()}`}
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the amount to be withdrawn in {getCurrencySymbol()}
              </p>
            </div>

            {/* Remarks Field */}
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-medium text-gray-700 flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Remarks
              </Label>
              <Textarea
                id="remarks"
                placeholder="Enter remarks for this withdrawal request"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                className="w-full min-h-[100px]"
                required
              />
              <p className="text-xs text-gray-500">
                Provide details or notes about this withdrawal request
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-volt-light hover:bg-volt-dark text-white px-8 py-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CurrencyIcon className="mr-2 h-4 w-4" />
                    Create Withdrawal Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
