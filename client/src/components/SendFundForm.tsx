import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User, MessageSquare, IndianRupee, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SendFundFormData {
  userId: string;
  option: 'Credit' | 'Debit';
  amount: string;
  remarks: string;
}

export default function SendFundForm() {
  const [formData, setFormData] = useState<SendFundFormData>({
    userId: '',
    option: 'Credit',
    amount: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for display
  const getCurrencySymbol = () => '₹'; // Always INR
  const getCurrencyIcon = () => IndianRupee;
  const getOptionIcon = () => formData.option === 'Credit' ? Plus : Minus;
  const getOptionColor = () => formData.option === 'Credit' ? 'text-green-600' : 'text-red-600';

  const CurrencyIcon = getCurrencyIcon();
  const OptionIcon = getOptionIcon();

  // Mutation for sending fund
  const sendFundMutation = useMutation({
    mutationFn: async (data: SendFundFormData) => {
      console.log('Sending fund request:', data);
      const response = await apiRequest('POST', '/api/admin/send-fund', data);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          return { 
            success: false, 
            error: errorData.message || `HTTP ${response.status}: ${response.statusText}` 
          };
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          const errorText = await response.text();
          console.log('Error text:', errorText);
          return { 
            success: false, 
            error: `HTTP ${response.status}: ${response.statusText} - ${errorText}` 
          };
        }
      }
      
      try {
        const result = await response.json();
        console.log('Success result:', result);
        return { success: true, data: result };
      } catch (jsonError) {
        console.error('Success JSON parse error:', jsonError);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        return { 
          success: false, 
          error: 'Invalid JSON response from server' 
        };
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: `Fund ${formData.option.toLowerCase()}ed successfully`,
        });
        // Reset form
        setFormData({
          userId: '',
          option: 'Credit',
          amount: '',
          remarks: ''
        });
        // Invalidate wallet queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/admin/wallet-balances'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Send fund mutation error:', error);
      let errorMessage = "Failed to process fund transaction";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check for authentication errors
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        errorMessage = "Please log in as an admin to use this feature";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof SendFundFormData, value: string) => {
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
      await sendFundMutation.mutateAsync(formData);
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
            Send Fund
          </CardTitle>
          <p className="text-sm text-gray-600">
            Credit or debit funds to/from a user's wallet
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
                Enter the User ID of the user for whom you want to process the fund transaction
              </p>
            </div>

            {/* Option Field */}
            <div className="space-y-2">
              <Label htmlFor="option" className="text-sm font-medium text-gray-700 flex items-center">
                <OptionIcon className={`mr-2 h-4 w-4 ${getOptionColor()}`} />
                Option
              </Label>
              <Select
                value={formData.option}
                onValueChange={(value: 'Credit' | 'Debit') => handleInputChange('option', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4 text-green-600" />
                      Credit (Add to balance)
                    </div>
                  </SelectItem>
                  <SelectItem value="Debit">
                    <div className="flex items-center">
                      <Minus className="mr-2 h-4 w-4 text-red-600" />
                      Debit (Subtract from balance)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose whether to add (Credit) or subtract (Debit) funds from the user's wallet
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
                placeholder={`Enter amount in ${getCurrencySymbol()}`}
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the amount to {formData.option.toLowerCase()} in {getCurrencySymbol()}
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
                placeholder="Enter remarks for this fund transaction"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                className="w-full min-h-[100px]"
                required
              />
              <p className="text-xs text-gray-500">
                Provide details or notes about this fund transaction
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-2 text-white ${
                  formData.option === 'Credit' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <OptionIcon className="mr-2 h-4 w-4" />
                    {formData.option} Fund
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
