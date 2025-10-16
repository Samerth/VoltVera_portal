import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  bv: string;
  gst: string;
  sponsorIncomePercentage: string;
  category: string;
  purchaseType: 'first_purchase' | 'second_purchase';
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);

  // Fetch all products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Create product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    bv: '',
    gst: '18',
    sponsorIncomePercentage: '10',
    category: '',
    purchaseType: 'first_purchase' as 'first_purchase' | 'second_purchase',
    isActive: true,
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: typeof newProduct) => {
      const response = await apiRequest('POST', '/api/admin/products', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "The product has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        bv: '',
        gst: '18',
        sponsorIncomePercentage: '10',
        category: '',
        purchaseType: 'first_purchase',
        isActive: true,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await apiRequest('PATCH', `/api/admin/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Updated",
        description: "The product has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Upload product image
  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, imageUrl }: { productId: string; imageUrl: string }) => {
      const response = await apiRequest('POST', `/api/admin/products/${productId}/image`, { imageUrl });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Image Uploaded",
        description: "Product image has been updated successfully.",
      });
      setUploadingImageFor(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      setUploadingImageFor(null);
    },
  });

  const handleUploadImage = async (productId: string) => {
    setUploadingImageFor(productId);
  };

  const handleCreateProduct = () => {
    createProductMutation.mutate(newProduct);
  };

  const handleUpdateProduct = () => {
    if (!selectedProduct) return;
    updateProductMutation.mutate({
      id: selectedProduct.id,
      data: selectedProduct,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6" data-testid="admin-product-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Manage products, upload images, and set pricing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>Add a new product to the catalog</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    data-testid="input-product-name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="water_purifier">Water Purifier</SelectItem>
                      <SelectItem value="led_tv">LED TV</SelectItem>
                      <SelectItem value="ceiling_fan">Ceiling Fan</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="input-description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    data-testid="input-price"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bv">BV</Label>
                  <Input
                    id="bv"
                    type="number"
                    data-testid="input-bv"
                    value={newProduct.bv}
                    onChange={(e) => setNewProduct({ ...newProduct, bv: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input
                    id="gst"
                    type="number"
                    data-testid="input-gst"
                    value={newProduct.gst}
                    onChange={(e) => setNewProduct({ ...newProduct, gst: e.target.value })}
                    placeholder="18"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sponsorIncome">Sponsor Income (%)</Label>
                  <Input
                    id="sponsorIncome"
                    type="number"
                    data-testid="input-sponsor-income"
                    value={newProduct.sponsorIncomePercentage}
                    onChange={(e) => setNewProduct({ ...newProduct, sponsorIncomePercentage: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseType">Purchase Type</Label>
                  <Select
                    value={newProduct.purchaseType}
                    onValueChange={(value: 'first_purchase' | 'second_purchase') => 
                      setNewProduct({ ...newProduct, purchaseType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-purchase-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_purchase">First Purchase</SelectItem>
                      <SelectItem value="second_purchase">Second Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={createProductMutation.isPending}
                data-testid="button-submit-product"
              >
                {createProductMutation.isPending ? "Creating..." : "Create Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} data-testid={`card-product-${product.id}`}>
            <CardHeader>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    data-testid={`img-product-${product.id}`}
                    onError={(e) => {
                      console.log('Image failed to load:', product.imageUrl);
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                {!product.imageUrl && (
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                )}
                <div 
                  className={`image-placeholder absolute inset-0 flex items-center justify-center bg-gray-100 ${product.imageUrl ? 'hidden' : 'flex'}`}
                  style={{ display: product.imageUrl ? 'none' : 'flex' }}
                >
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                </div>
              </div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BV:</span>
                  <span className="font-semibold">{product.bv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sponsor Income:</span>
                  <span className="font-semibold">{product.sponsorIncomePercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="capitalize">{product.category.replace('_', ' ')}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  buttonClassName="flex-1"
                  onGetUploadParameters={async () => {
                    const response = await fetch(`/api/admin/products/${product.id}/upload-url`, {
                      credentials: 'include',
                    });
                    const data = await response.json();
                    return { method: 'PUT' as const, url: data.url };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful[0]) {
                      const uploadedUrl = result.successful[0].uploadURL;
                      uploadImageMutation.mutate({ productId: product.id, imageUrl: uploadedUrl });
                    }
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </ObjectUploader>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsEditDialogOpen(true);
                  }}
                  data-testid={`button-edit-${product.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={selectedProduct.category}
                    onValueChange={(value) => setSelectedProduct({ ...selectedProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="water_purifier">Water Purifier</SelectItem>
                      <SelectItem value="led_tv">LED TV</SelectItem>
                      <SelectItem value="ceiling_fan">Ceiling Fan</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedProduct.description || ''}
                  onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={selectedProduct.price}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bv">BV</Label>
                  <Input
                    id="edit-bv"
                    type="number"
                    value={selectedProduct.bv}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, bv: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gst">GST (%)</Label>
                  <Input
                    id="edit-gst"
                    type="number"
                    value={selectedProduct.gst}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, gst: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sponsor-income">Sponsor Income (%)</Label>
                  <Input
                    id="edit-sponsor-income"
                    type="number"
                    value={selectedProduct.sponsorIncomePercentage}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, sponsorIncomePercentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedProduct.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) => setSelectedProduct({ ...selectedProduct, isActive: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
