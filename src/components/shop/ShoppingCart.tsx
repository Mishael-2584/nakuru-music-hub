import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product: {
    name: string;
    base_price: number;
    image_url?: string;
    availability_status: string;
  };
  variant?: {
    variant_name: string;
    price_adjustment: number;
  };
}

interface ShoppingCartProps {
  onCheckout: () => void;
}

export default function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCartItems();
    } else {
      // Load from localStorage for guest users
      loadGuestCart();
    }
  }, [user]);

  const loadCartItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shop_cart_items')
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          products!inner(
            name,
            base_price,
            image_url,
            availability_status
          ),
          shop_product_variants(
            variant_name,
            price_adjustment
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const items = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        product: item.products,
        variant: item.shop_product_variants
      })) || [];

      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  const loadGuestCart = () => {
    const guestCart = localStorage.getItem('guest_cart');
    if (guestCart) {
      try {
        setCartItems(JSON.parse(guestCart));
      } catch (error) {
        console.error('Error loading guest cart:', error);
      }
    }
  };

  const saveGuestCart = (items: CartItem[]) => {
    localStorage.setItem('guest_cart', JSON.stringify(items));
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('shop_cart_items')
          .update({ quantity: newQuantity })
          .eq('id', itemId);

        if (error) throw error;
      }

      setCartItems(prev => {
        const updated = prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        if (!user) saveGuestCart(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({ title: 'Error', description: 'Failed to update quantity', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('shop_cart_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      }

      setCartItems(prev => {
        const updated = prev.filter(item => item.id !== itemId);
        if (!user) saveGuestCart(updated);
        return updated;
      });

      toast({ title: 'Success', description: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item: CartItem) => {
    const basePrice = item.product.base_price;
    const adjustment = item.variant?.price_adjustment || 0;
    return basePrice + adjustment;
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      toast({ 
        title: 'Login Required', 
        description: 'Please log in to proceed to checkout', 
        variant: 'destructive' 
      });
      return;
    }
    setIsOpen(false);
    onCheckout();
  };

  return (
    <>
      {/* Cart Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <ShoppingCart className="h-4 w-4" />
        {getTotalItems() > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {getTotalItems()}
          </Badge>
        )}
      </Button>

      {/* Cart Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Add some items to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex gap-3">
                          {/* Product Image */}
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {item.product.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ShoppingCart className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {item.product.name}
                            </h3>
                            {item.variant && (
                              <p className="text-xs text-gray-500 truncate">
                                {item.variant.variant_name}
                              </p>
                            )}
                            <p className="text-sm font-medium text-primary">
                              KES {getItemPrice(item).toFixed(2)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={loading}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={loading}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              disabled={loading}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>KES {getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    onClick={handleCheckout}
                    className="w-full"
                    disabled={loading}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  {!user && (
                    <p className="text-xs text-center text-gray-500">
                      You'll need to log in to complete your purchase
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
