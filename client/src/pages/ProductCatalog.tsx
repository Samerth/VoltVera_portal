import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // DISABLED: Removed purchase type tabs
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Zap, Tv, Fan, Droplets, IndianRupee, Star, TrendingUp, Target, DollarSign, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  bv: string;
  gst: string;
  category: string;
  purchaseType: 'first_purchase' | 'second_purchase';
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseData {
  productId: string;
  quantity: number;
  paymentMethod: string;
  deliveryAddress: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'water_purifier': return <Droplets className="h-4 w-4" />;
    case 'led_tv': return <Tv className="h-4 w-4" />;
    case 'ceiling_fan': return <Fan className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'water_purifier': return 'bg-blue-100 text-blue-800';
    case 'led_tv': return 'bg-purple-100 text-purple-800';
    case 'ceiling_fan': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatPrice = (price: string) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(parseFloat(price));
};

// Helper function to get proxied image URL for Google Cloud Storage
const getProxiedImageUrl = (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl) return undefined;
  
  // If it's a Google Cloud Storage URL, use our proxy
  if (imageUrl.startsWith('https://storage.googleapis.com/')) {
    return `/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // For other URLs (like placeholder URLs), use directly
  return imageUrl;
};

export default function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // const [selectedPurchaseType, setSelectedPurchaseType] = useState<string>('all'); // DISABLED: Removed purchase type filtering
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseData>({
    productId: '',
    quantity: 1,
    paymentMethod: 'wallet', // Always use E-wallet for purchases
    deliveryAddress: ''
  });

  // Fetch BV calculations data
  const { data: bvData, isLoading: bvLoading } = useQuery({
    queryKey: ['/api/test/bv-calculations'],
    enabled: true, // Always fetch BV data
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: true,
  });

  // Create purchase mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseData) => {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create purchase');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: "Your order has been placed successfully. You will receive confirmation shortly.",
      });
      setIsPurchaseModalOpen(false);
      setPurchaseForm({
        productId: '',
        quantity: 1,
        paymentMethod: 'wallet', // Always use E-wallet
        deliveryAddress: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter products based on selected category
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
    // const typeMatch = selectedPurchaseType === 'all' || product.purchaseType === selectedPurchaseType; // DISABLED: Removed purchase type filtering
    return categoryMatch && product.isActive; // && typeMatch removed
  });

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category)));

  const handlePurchase = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseForm(prev => ({
      ...prev,
      productId: product.id
    }));
    setIsPurchaseModalOpen(true);
  };

  const handleSubmitPurchase = () => {
    if (!purchaseForm.deliveryAddress.trim()) {
      toast({
        title: "Incomplete Information",
        description: "Please enter a delivery address.",
        variant: "destructive",
      });
      return;
    }

    // Payment method is always 'wallet' (E-wallet)
    createPurchaseMutation.mutate(purchaseForm);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return { amount: 0, bv: 0, gst: 0 };
    
    const baseAmount = parseFloat(selectedProduct.price) * purchaseForm.quantity;
    const gstAmount = (baseAmount * parseFloat(selectedProduct.gst)) / 100;
    const totalAmount = baseAmount + gstAmount;
    const totalBV = parseFloat(selectedProduct.bv) * purchaseForm.quantity;

    return {
      amount: totalAmount,
      bv: totalBV,
      gst: gstAmount
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="product-catalog">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="catalog-title">
          Voltvera Product Catalog
        </h1>
        <p className="text-gray-600">
          Discover our premium range of products with exclusive Business Volume benefits
        </p>
      </div>

      {/* BV Summary Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              Your BV Matching Summary
            </CardTitle>
            <CardDescription className="text-blue-600">
              Track your Business Volume and matching income from purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bvLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-blue-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : bvData?.lifetime ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-blue-700">Left BV</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {parseFloat(bvData.lifetime.leftBv || '0').toLocaleString()} BV
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-700">Right BV</span>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {parseFloat(bvData.lifetime.rightBv || '0').toLocaleString()} BV
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-700">Matched BV</span>
                  </div>
                  <div className="text-xl font-bold text-purple-600">
                    {parseFloat(bvData.lifetime.matchingBv || '0').toLocaleString()} BV
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-700">Income</span>
                  </div>
                  <div className="text-xl font-bold text-yellow-600">
                    ₹{parseFloat(bvData.lifetime.diffIncome || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">No BV data available</p>
                <p className="text-sm text-gray-400">Make a purchase to start earning BV matching income</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <Link href="/bv-calculations">
                <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                  View Detailed BV Calculations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* DISABLED: Purchase type tabs removed */}
        {/* <Tabs value={selectedPurchaseType} onValueChange={setSelectedPurchaseType} className="w-auto">
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-all">All Products</TabsTrigger>
            <TabsTrigger value="first_purchase" data-testid="filter-first">First Purchase</TabsTrigger>
            <TabsTrigger value="second_purchase" data-testid="filter-second">Second Purchase</TabsTrigger>
          </TabsList>
        </Tabs> */}

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="category-filter">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => {
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col" data-testid={`product-card-${product.id}`}>
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100">
                {product.imageUrl ? (
                  <img 
                    src={getProxiedImageUrl(product.imageUrl)} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onLoad={() => {
                      console.log('Image loaded successfully:', product.name);
                    }}
                    onError={(e) => {
                      console.log('Image failed to load:', product.imageUrl);
                      // Hide the broken image
                      e.currentTarget.style.display = 'none';
                      // Show placeholder
                      const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                
                {/* Placeholder - hidden by default when imageUrl exists */}
                <div 
                  className={`image-placeholder w-full h-full flex items-center justify-center bg-gray-100 ${product.imageUrl ? 'hidden' : 'flex'}`}
                  style={{ display: product.imageUrl ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">
                      {product.imageUrl ? 'Loading...' : 'No image'}
                    </p>
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle className="text-lg line-clamp-2" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {product.description}
                  </CardDescription>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getCategoryColor(product.category)} data-testid={`product-category-${product.id}`}>
                    {getCategoryIcon(product.category)}
                    <span className="ml-1">{product.category.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3 flex-1">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-semibold text-lg text-green-600" data-testid={`product-price-${product.id}`}>
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Business Volume:</span>
                    <span className="font-medium text-blue-600" data-testid={`product-bv-${product.id}`}>
                      {parseFloat(product.bv).toLocaleString()} BV
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">GST:</span>
                    <span className="text-sm">{product.gst}%</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button 
                  onClick={() => handlePurchase(product)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  data-testid={`purchase-button-${product.id}`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Now
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more products.</p>
        </div>
      )}

      {/* Purchase Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col" data-testid="purchase-modal">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Purchase Product</DialogTitle>
            <DialogDescription>
              Complete your purchase for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedProduct && (
              <div className="space-y-4">
                {/* Product Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{selectedProduct.name}</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>{formatPrice(selectedProduct.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit BV:</span>
                      <span>{parseFloat(selectedProduct.bv).toLocaleString()} BV</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span>{selectedProduct.gst}%</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={purchaseForm.quantity}
                      onChange={(e) => setPurchaseForm(prev => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1
                      }))}
                      data-testid="purchase-quantity"
                    />
                  </div>

                  {/* Payment Method: Always E-wallet (hidden from user) */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Payment Method: E-Wallet</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">Amount will be deducted from your E-wallet balance</p>
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      placeholder="Enter complete delivery address..."
                      value={purchaseForm.deliveryAddress}
                      onChange={(e) => setPurchaseForm(prev => ({
                        ...prev,
                        deliveryAddress: e.target.value
                      }))}
                      data-testid="delivery-address"
                      rows={3}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPrice((parseFloat(selectedProduct.price) * purchaseForm.quantity).toString())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST ({selectedProduct.gst}%):</span>
                        <span>{formatPrice(((parseFloat(selectedProduct.price) * purchaseForm.quantity * parseFloat(selectedProduct.gst)) / 100).toString())}</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {formatPrice(((parseFloat(selectedProduct.price) * purchaseForm.quantity) * (1 + parseFloat(selectedProduct.gst) / 100)).toString())}
                        </span>
                      </div>
                      <div className="flex justify-between text-blue-600 font-medium">
                        <span>Total BV Earned:</span>
                        <span>{(parseFloat(selectedProduct.bv) * purchaseForm.quantity).toLocaleString()} BV</span>
                      </div>
                    </div>
                  </div>

                  {/* BV Impact Preview */}
                  {bvData?.lifetime && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-medium mb-2 text-green-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        BV Impact Preview
                      </h4>
                      <div className="text-sm space-y-1 text-green-700">
                        <div className="flex justify-between">
                          <span>Current Self BV:</span>
                          <span>{parseFloat(bvData.lifetime.selfBv || '0').toLocaleString()} BV</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>After Purchase (Self BV):</span>
                          <span className="text-green-600">
                            {(parseFloat(bvData.lifetime.selfBv || '0') + (parseFloat(selectedProduct.bv) * purchaseForm.quantity)).toLocaleString()} BV
                          </span>
                        </div>
                        <div className="text-xs text-green-600 mt-2">
                          * This purchase will increase your Self BV by {(parseFloat(selectedProduct.bv) * purchaseForm.quantity).toLocaleString()} BV
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          * Your upline will receive this BV in their weaker leg
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPurchase}
              disabled={createPurchaseMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-blue-600"
              data-testid="confirm-purchase"
            >
              {createPurchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}