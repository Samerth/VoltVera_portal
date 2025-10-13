import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, IndianRupee, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WithdrawalRequestFormData {
  amount: string;
  remarks: string;
}

export default function WithdrawalRequestForm() {
  const [formData, setFormData] = useState<WithdrawalRequestFormData>({
    amount: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for currency display
  const getCurrencySymbol = () => '₹'; // Always INR for user withdrawals
  const getCurrencyIcon = () => IndianRupee;

  const CurrencyIcon = getCurrencyIcon();

  // Mutation for creating withdrawal request
  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalRequestFormData) => {
      const response = await apiRequest('POST', '/api/user/withdrawal-requests', data);
      const result = await response.json();
      return { success: true, data: result };
    },
    onSuccess: (result) => {
      toast({
        title: "Withdrawal Request Submitted!",
        description: "Your withdrawal request has been submitted successfully. You will be notified once it's processed.",
      });
      // Reset form
      setFormData({
        amount: '',
        remarks: ''
      });
      // Invalidate withdrawal queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/withdrawal-requests'] });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create withdrawal request";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
    if (!formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please enter the withdrawal amount.",
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
    createWithdrawalMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof WithdrawalRequestFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800 flex items-center">
          <CurrencyIcon className="mr-2 h-5 w-5 text-green-600" />
          Withdrawal Request
        </CardTitle>
        <p className="text-sm text-gray-600">
          Submit a request to withdraw funds from your account. Your request will be reviewed by the admin.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Withdrawal Amount ({getCurrencySymbol()})
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
                placeholder="Enter withdrawal amount"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Remarks Field */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">
              Remarks (Optional)
            </Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="Enter any additional remarks for your withdrawal request"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Important Information:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Withdrawal requests are processed within 24-48 hours</li>
                  <li>Funds will be transferred to your registered bank account</li>
                  <li>Minimum withdrawal amount is ₹100</li>
                  <li>You can only withdraw up to your available wallet balance</li>
                </ul>
              </div>
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
                Submit Withdrawal Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
