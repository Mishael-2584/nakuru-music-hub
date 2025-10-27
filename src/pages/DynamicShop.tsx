import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Search, Filter, Star, Package, Truck, Shield, Heart, Plus, Minus, X, Music, Headphones, Shirt, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppChat from '@/components/WhatsAppChat';

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

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export default function DynamicShop() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .eq('is_active', true)
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
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithCategories = data?.map(product => ({
        ...product,
        category: product.shop_categories,
        variants: product.shop_product_variants?.filter(v => v.is_active) || []
      })) || [];

      setProducts(productsWithCategories);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered = [...filtered].sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price_high':
        filtered = [...filtered].sort((a, b) => b.base_price - a.base_price);
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'featured':
      default:
        filtered = [...filtered].sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        break;
    }

    setFilteredProducts(filtered);
  };

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('shop_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    }
  };

  const saveCartToStorage = (newCart: CartItem[]) => {
    try {
      localStorage.setItem('shop_cart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const addToCart = (product: Product, variant?: ProductVariant, qty: number = 1) => {
    const cartKey = `${product.id}-${variant?.id || 'no-variant'}`;
    const existingItem = cart.find(item => 
      item.product.id === product.id && 
      item.variant?.id === variant?.id
    );

    let newCart;
    if (existingItem) {
      newCart = cart.map(item =>
        item.product.id === product.id && item.variant?.id === variant?.id
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    } else {
      newCart = [...cart, { product, variant, quantity: qty }];
    }

    setCart(newCart);
    saveCartToStorage(newCart);
    toast({ title: 'Success', description: 'Item added to cart' });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const newCart = cart.filter(item => 
      !(item.product.id === productId && item.variant?.id === variantId)
    );
    setCart(newCart);
    saveCartToStorage(newCart);
    toast({ title: 'Success', description: 'Item removed from cart' });
  };

  const updateQuantity = (productId: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    const newCart = cart.map(item =>
      item.product.id === productId && item.variant?.id === variantId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(newCart);
    saveCartToStorage(newCart);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.variant 
        ? item.product.base_price + item.variant.price_adjustment
        : item.product.base_price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const openProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setQuantity(1);
    setIsProductDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, selectedVariant || undefined, quantity);
    setIsProductDialogOpen(false);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Your cart is empty', variant: 'destructive' });
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 sm:pt-36 pb-8 sm:pb-12 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Damon Music Shop
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Discover premium musical instruments, accessories, and exclusive merchandise. 
              Everything you need for your musical journey.
            </p>
            
            {/* Floating Cart Button - Responsive */}
            <div className="fixed top-28 sm:top-32 right-2 sm:right-4 z-40">
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-sm sm:text-base"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Cart ({getTotalItems()})</span>
                <span className="sm:hidden">({getTotalItems()})</span>
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center text-xs bg-accent text-white animate-pulse">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="mb-6 sm:mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm border border-primary/20 h-auto">
              <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-3">
                <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">All Products</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              {categories.map(category => {
                const getIcon = (name: string) => {
                  if (name.toLowerCase().includes('track')) return <Music className="h-3 w-3 sm:h-4 sm:w-4" />;
                  if (name.toLowerCase().includes('instrument')) return <Headphones className="h-3 w-3 sm:h-4 sm:w-4" />;
                  if (name.toLowerCase().includes('merchandise')) return <Shirt className="h-3 w-3 sm:h-4 sm:w-4" />;
                  return <Package className="h-3 w-3 sm:h-4 sm:w-4" />;
                };
                
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-3">
                    {getIcon(category.name)}
                    <span className="hidden sm:inline">{category.name}</span>
                    <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 sm:mb-8 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="search" className="text-xs sm:text-sm font-semibold text-gray-700">Search Products</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search products, brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 text-sm sm:text-base border-primary/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="sort" className="text-xs sm:text-sm font-semibold text-gray-700">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1 border-primary/20 focus:border-primary text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">⭐ Featured First</SelectItem>
                    <SelectItem value="price_low">💰 Price: Low to High</SelectItem>
                    <SelectItem value="price_high">💎 Price: High to Low</SelectItem>
                    <SelectItem value="name">🔤 Name A-Z</SelectItem>
                    <SelectItem value="newest">🆕 Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button 
                  onClick={loadProducts} 
                  variant="outline" 
                  className="w-full border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors text-sm sm:text-base"
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh Results</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Overlay badges */}
                <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex justify-between">
                  {product.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg text-xs">
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      <span className="hidden sm:inline">Featured</span>
                    </Badge>
                  )}
                  <Badge className={`${
                    product.availability_status === 'in_stock' ? 'bg-green-500' :
                    product.availability_status === 'on_demand' ? 'bg-blue-500' : 'bg-red-500'
                  } text-white shadow-lg text-xs`}>
                    <span className="hidden sm:inline">{product.availability_status.replace('_', ' ')}</span>
                    <span className="sm:hidden">{product.availability_status.replace('_', ' ').charAt(0).toUpperCase()}</span>
                  </Badge>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              
              <CardContent className="p-3 sm:p-5">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">{product.brand}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      KES {product.base_price.toFixed(2)}
                    </p>
                    {product.variants && product.variants.length > 0 && (
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                        {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {product.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span className="font-medium truncate mr-2">{product.category?.name}</span>
                    {product.delivery_days_min && product.delivery_days_max && (
                      <span className="flex items-center text-primary flex-shrink-0">
                        <Truck className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <span className="hidden sm:inline">{product.delivery_days_min}-{product.delivery_days_max} days</span>
                        <span className="sm:hidden">{product.delivery_days_min}-{product.delivery_days_max}d</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                  onClick={() => openProductDialog(product)}
                  disabled={product.availability_status === 'out_of_stock'}
                >
                  {product.availability_status === 'out_of_stock' ? 'Out of Stock' : 'View Details'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No products found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-4">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters to see more products.'
                  : 'Products will appear here once they are added to the shop.'}
              </p>
              <Button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-sm sm:text-base"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <Footer />
      <WhatsAppChat />

      {/* Shopping Cart Sidebar */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-sm sm:max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🛒 Cart ({getTotalItems()})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Your cart is empty</h3>
                <p className="text-sm sm:text-base text-gray-600">Add some products to get started!</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 border border-primary/20 rounded-lg sm:rounded-xl bg-white/50 backdrop-blur-sm">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm truncate text-gray-900">{item.product.name}</h4>
                    {item.variant && (
                      <p className="text-xs text-gray-600 truncate">{item.variant.variant_name}</p>
                    )}
                    <p className="text-xs sm:text-sm font-bold text-primary">
                      KES {((item.variant ? item.product.base_price + item.variant.price_adjustment : item.product.base_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 border-primary/20 hover:border-primary"
                    >
                      <Minus className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    <span className="text-xs sm:text-sm font-semibold w-6 sm:w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 border-primary/20 hover:border-primary"
                    >
                      <Plus className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                      className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <X className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t border-primary/20 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
              <div className="flex justify-between text-lg sm:text-xl font-bold">
                <span>Total:</span>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  KES {getTotalPrice().toFixed(2)}
                </span>
              </div>
              <Button 
                onClick={proceedToCheckout} 
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
              >
                🛒 Proceed to Checkout
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-2xl lg:max-w-4xl w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 sm:h-20 sm:w-20 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{selectedProduct.name}</h3>
                    {selectedProduct.brand && (
                      <p className="text-sm sm:text-lg text-gray-600 font-medium">{selectedProduct.brand}</p>
                    )}
                  </div>
                  
                  <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    KES {selectedProduct.base_price.toFixed(2)}
                  </div>

                  {selectedProduct.description && (
                    <p className="text-gray-700 text-sm sm:text-lg leading-relaxed">{selectedProduct.description}</p>
                  )}

                  {selectedProduct.specs && (
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-gray-900">Specifications:</h4>
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm sm:text-base">{selectedProduct.specs}</p>
                    </div>
                  )}

                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div>
                      <Label htmlFor="variant" className="text-base sm:text-lg font-semibold text-gray-900">Select Variant</Label>
                      <Select value={selectedVariant?.id || ''} onValueChange={(value) => {
                        const variant = selectedProduct.variants?.find(v => v.id === value);
                        setSelectedVariant(variant || null);
                      }}>
                        <SelectTrigger className="mt-1 sm:mt-2 border-primary/20 focus:border-primary text-sm sm:text-base">
                          <SelectValue placeholder="Choose a variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProduct.variants.map(variant => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.variant_name} 
                              {variant.price_adjustment !== 0 && (
                                <span className="ml-2 font-semibold">
                                  ({variant.price_adjustment > 0 ? '+' : ''}KES {variant.price_adjustment.toFixed(2)})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-10 w-10 sm:h-12 sm:w-12 border-primary/20 hover:border-primary"
                      >
                        <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <span className="text-lg sm:text-xl font-bold w-10 sm:w-12 text-center">{quantity}</span>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-10 w-10 sm:h-12 sm:w-12 border-primary/20 hover:border-primary"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                    <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      KES {((selectedVariant ? selectedProduct.base_price + selectedVariant.price_adjustment : selectedProduct.base_price) * quantity).toFixed(2)}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={selectedProduct.availability_status === 'out_of_stock'}
                  >
                    {selectedProduct.availability_status === 'out_of_stock' ? 'Out of Stock' : '🛒 Add to Cart'}
                  </Button>

                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-8 text-xs sm:text-sm text-gray-600 pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-primary" />
                      <span className="font-medium text-center">
                        {selectedProduct.delivery_days_min && selectedProduct.delivery_days_max 
                          ? `${selectedProduct.delivery_days_min}-${selectedProduct.delivery_days_max} days delivery`
                          : 'Delivery info not available'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-primary" />
                      <span className="font-medium">Secure Payment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
