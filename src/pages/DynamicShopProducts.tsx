import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/priceFormatter';
import ProductImageGallery from '@/components/shop/ProductImageGallery';

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  specs?: string;
  brand?: string;
  availability_status: 'in_stock' | 'on_demand' | 'out_of_stock';
  stock_quantity: number;
  is_active: boolean;
  featured: boolean;
  category_id: string;
}

export default function DynamicShopProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*')
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200" />
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
        <p className="text-gray-600">Check back soon for new products!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/95 hover:-translate-y-1 flex flex-col max-h-[380px]"
        >
          {/* Product Image with Gallery */}
          <div className="relative overflow-hidden">
            <ProductImageGallery 
              productId={product.id}
              fallbackImage={product.image_url}
              className="w-full h-32 group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {product.featured && (
                <Badge className="bg-yellow-500 text-xs">Featured</Badge>
              )}
              {product.availability_status === 'on_demand' && (
                <Badge className="bg-orange-500 text-xs">On Demand</Badge>
              )}
              {product.availability_status === 'in_stock' && product.stock_quantity > 0 && (
                <Badge className="bg-green-500 text-xs">In Stock</Badge>
              )}
              {product.availability_status === 'out_of_stock' && (
                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <CardHeader className="pb-2 flex-1">
            <CardTitle className="text-xs font-bold line-clamp-1">{product.name}</CardTitle>
            {product.brand && product.specs && (
              <CardDescription className="text-xs line-clamp-1">
                {product.brand} • {product.specs}
              </CardDescription>
            )}
          </CardHeader>

          {/* Price and Actions */}
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-primary">
                  {formatPrice(product.base_price)}
                </span>
                {product.availability_status === 'on_demand' && (
                  <Badge variant="outline" className="text-xs">3-7 days</Badge>
                )}
              </div>

              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}

              {product.availability_status === 'on_demand' && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>On Demand</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>1 year warranty</span>
                  </div>
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full text-xs py-2" 
              disabled={product.availability_status === 'out_of_stock'}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.availability_status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
