import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Upload, Package, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProductImageUploader from './ProductImageUploader';
import { formatPrice } from '@/lib/priceFormatter';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  image_filename?: string;
  primary_image_url?: string;
  specs?: string;
  brand?: string;
  delivery_days_min?: number;
  delivery_days_max?: number;
  availability_status: 'in_stock' | 'on_demand' | 'out_of_stock';
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  featured: boolean;
  category_id: string;
  category?: Category;
  variants?: ProductVariant[];
  enable_variants?: boolean;
}

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_type: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
  sku?: string;
  is_active: boolean;
}

export default function ShopProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    specs: '',
    brand: '',
    delivery_days_min: 0,
    delivery_days_max: 0,
    availability_status: 'in_stock' as const,
    stock_quantity: 0,
    low_stock_threshold: 5,
    is_active: true,
    featured: false,
    category_id: '',
    image_url: '',
    image_filename: '',
    enable_variants: true
  });

  const [variantForm, setVariantForm] = useState({
    variant_name: '',
    variant_type: '',
    variant_value: '',
    price_adjustment: 0,
    stock_quantity: 0,
    sku: '',
    is_active: true
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select(`
          *,
          shop_categories(*),
          shop_product_variants(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch primary images for all products
      const productsWithCategories = await Promise.all(
        (data || []).map(async (product) => {
          // Try to get primary image from product_images table
          const { data: primaryImage } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', product.id)
            .eq('is_primary', true)
            .single();

          return {
            ...product,
            category: product.shop_categories,
            variants: product.shop_product_variants || [],
            primary_image_url: primaryImage?.image_url || product.image_url // Fallback to old image_url
          };
        })
      );

      setProducts(productsWithCategories);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `shop-products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        filename: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
      return null;
    }
  };

  
  
  const handleCreateProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .insert(productForm)
        .select()
        .single();

      if (error) throw error;

      // Save uploaded images to database with the new product ID
      if (uploadedImages.length > 0) {
        const imagesToSave = uploadedImages
          .filter(img => img.image_url && img.image_filename) // Only save uploaded images
          .map((img, index) => ({
            product_id: data.id,
            image_url: img.image_url,
            image_filename: img.image_filename,
            display_order: index,
            is_primary: index === 0 // First image is primary
          }));

        if (imagesToSave.length > 0) {
          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imagesToSave);
          
          if (imageError) {
            console.error('Error saving images:', imageError);
            toast({ 
              title: 'Warning', 
              description: 'Product created but some images failed to save. Please try uploading again.',
              variant: 'destructive' 
            });
          }
        }
      }

      toast({ title: 'Success', description: 'Product created successfully with images.' });
      
      // Clear uploaded images after saving
      setUploadedImages([]);
      setIsDialogOpen(false);
      resetProductForm();
      loadProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({ title: 'Error', description: 'Failed to create product', variant: 'destructive' });
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('shop_products')
        .update(productForm)
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Product updated successfully' });
      setIsDialogOpen(false);
      setSelectedProduct(null);
      resetProductForm();
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('shop_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Product deleted successfully' });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const handleCreateVariant = async () => {
    if (!selectedProductForVariant) return;

    try {
      const { error } = await supabase
        .from('shop_product_variants')
        .insert({
          ...variantForm,
          product_id: selectedProductForVariant.id
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Variant created successfully' });
      setIsVariantDialogOpen(false);
      resetVariantForm();
      loadProducts();
    } catch (error) {
      console.error('Error creating variant:', error);
      toast({ title: 'Error', description: 'Failed to create variant', variant: 'destructive' });
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      base_price: 0,
      specs: '',
      brand: '',
      delivery_days_min: 0,
      delivery_days_max: 0,
      availability_status: 'in_stock' as const,
      stock_quantity: 0,
      low_stock_threshold: 5,
      is_active: true,
      featured: false,
      category_id: '',
      image_url: '',
      image_filename: '',
      enable_variants: true
    });
    setUploadedImages([]);
  };

  const resetVariantForm = () => {
    setVariantForm({
      variant_name: '',
      variant_type: '',
      variant_value: '',
      price_adjustment: 0,
      stock_quantity: 0,
      sku: '',
      is_active: true
    });
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      base_price: product.base_price,
      specs: product.specs || '',
      brand: product.brand || '',
      delivery_days_min: product.delivery_days_min || 0,
      delivery_days_max: product.delivery_days_max || 0,
      availability_status: product.availability_status,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      is_active: product.is_active,
      featured: product.featured,
      category_id: product.category_id,
      image_url: product.image_url || '',
      image_filename: product.image_filename || '',
      enable_variants: product.enable_variants ?? true
    });
    setUploadedImages([]); // Clear uploaded images when editing
    setIsDialogOpen(true);
  };

  const openVariantDialog = (product: Product) => {
    setSelectedProductForVariant(product);
    setIsVariantDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setUploadedImages([]); // Clear uploaded images when dialog closes
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setSelectedProduct(null); resetProductForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={productForm.category_id}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price (KES) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={productForm.low_stock_threshold}
                    onChange={(e) => setProductForm(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <Label htmlFor="availability_status">Availability Status</Label>
                  <Select
                    value={productForm.availability_status}
                    onValueChange={(value: any) => setProductForm(prev => ({ ...prev, availability_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="on_demand">On Demand</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_days_min">Min Delivery Days</Label>
                  <Input
                    id="delivery_days_min"
                    type="number"
                    value={productForm.delivery_days_min}
                    onChange={(e) => setProductForm(prev => ({ ...prev, delivery_days_min: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_days_max">Max Delivery Days</Label>
                  <Input
                    id="delivery_days_max"
                    type="number"
                    value={productForm.delivery_days_max}
                    onChange={(e) => setProductForm(prev => ({ ...prev, delivery_days_max: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="specs">Specifications</Label>
                <Textarea
                  id="specs"
                  value={productForm.specs}
                  onChange={(e) => setProductForm(prev => ({ ...prev, specs: e.target.value }))}
                  placeholder="Enter product specifications"
                  rows={2}
                />
              </div>

              {/* Multiple Image Upload Section */}
              <ProductImageUploader 
                productId={selectedProduct?.id}
                onImagesChange={setUploadedImages}
              />

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_variants"
                    checked={productForm.enable_variants}
                    onChange={(e) => setProductForm(prev => ({ ...prev, enable_variants: e.target.checked }))}
                  />
                  <Label htmlFor="enable_variants">Show variant selector</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={selectedProduct ? handleUpdateProduct : handleCreateProduct}>
                  {selectedProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  {product.primary_image_url ? (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {product.featured && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category?.name}</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(product.base_price)}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Stock: {product.stock_quantity}</span>
                      <Badge variant="outline">
                        {product.availability_status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {product.enable_variants && product.variants && product.variants.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openVariantDialog(product)}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Variant for {selectedProductForVariant?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variant_type">Variant Type</Label>
                <Select
                  value={variantForm.variant_type}
                  onValueChange={(value) => setVariantForm(prev => ({ ...prev, variant_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="variant_value">Variant Value</Label>
                <Input
                  id="variant_value"
                  value={variantForm.variant_value}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, variant_value: e.target.value }))}
                  placeholder="e.g., M, Red, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="variant_name">Display Name</Label>
              <Input
                id="variant_name"
                value={variantForm.variant_name}
                onChange={(e) => setVariantForm(prev => ({ ...prev, variant_name: e.target.value }))}
                placeholder="e.g., Size: M"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_adjustment">Price Adjustment (KES)</Label>
                <Input
                  id="price_adjustment"
                  type="number"
                  value={variantForm.price_adjustment}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, price_adjustment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="variant_stock">Stock Quantity</Label>
                <Input
                  id="variant_stock"
                  type="number"
                  value={variantForm.stock_quantity}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input
                id="sku"
                value={variantForm.sku}
                onChange={(e) => setVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Product SKU"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="variant_active"
                checked={variantForm.is_active}
                onChange={(e) => setVariantForm(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <Label htmlFor="variant_active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVariant}>
                Add Variant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
