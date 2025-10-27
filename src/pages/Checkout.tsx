import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ShoppingCart, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateShopInvoicePDF } from '@/lib/shopInvoiceGenerator';
import { sendOrderConfirmationEmail } from '@/lib/shopEmailService';

interface Product {
  id: string;
  name: string;
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

interface OrderFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  country: string;
  county: string;
  town: string;
  street_address: string;
  postal_code: string;
  notes: string;
  terms_accepted: boolean;
}

// Kenya Counties data
const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale',
  'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Kericho', 'Machakos', 'Kisii', 'Embu',
  'Narok', 'Kitui', 'Bungoma', 'Busia', 'Homa Bay', 'Migori', 'Siaya', 'Vihiga',
  'Bomet', 'Laikipia', 'Murang\'a', 'Kiambu', 'Kirinyaga', 'Nyandarua', 'Nandi',
  'Uasin Gishu', 'Trans Nzoia', 'West Pokot', 'Samburu', 'Turkana', 'Marsabit',
  'Isiolo', 'Mandera', 'Wajir', 'Tana River', 'Lamu', 'Taita Taveta', 'Kwale',
  'Kilifi', 'Kajiado', 'Makueni', 'Nyamira'
];

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    country: 'Kenya',
    county: '',
    town: '',
    street_address: '',
    postal_code: '',
    notes: '',
    terms_accepted: false
  });

  useEffect(() => {
    loadCartItems();
  }, []);

  // No automatic redirect - let user see the empty cart message

  const loadCartItems = async () => {
    setLoading(true);
    try {
      // Load cart from localStorage (same as DynamicShop)
      const savedCart = localStorage.getItem('shop_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCartItems(cartData);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      toast({ title: 'Error', description: 'Failed to load cart items', variant: 'destructive' });
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item: CartItem) => {
    const basePrice = item.product.base_price;
    const adjustment = item.variant?.price_adjustment || 0;
    return basePrice + adjustment;
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getDeliveryFee = () => {
    // 200 KES delivery fee within Kenya, 0 for other countries
    return formData.country === 'Kenya' ? 200 : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const handleInputChange = (field: keyof OrderFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) {
      toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
      return false;
    }
    if (!formData.customer_email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' });
      return false;
    }
    if (!formData.customer_phone.trim()) {
      toast({ title: 'Error', description: 'Please enter your phone number', variant: 'destructive' });
      return false;
    }
    if (!formData.country.trim()) {
      toast({ title: 'Error', description: 'Please select your country', variant: 'destructive' });
      return false;
    }
    if (formData.country === 'Kenya' && !formData.county.trim()) {
      toast({ title: 'Error', description: 'Please select your county', variant: 'destructive' });
      return false;
    }
    if (!formData.town.trim()) {
      toast({ title: 'Error', description: 'Please enter your town/city', variant: 'destructive' });
      return false;
    }
    if (!formData.street_address.trim()) {
      toast({ title: 'Error', description: 'Please enter your street address', variant: 'destructive' });
      return false;
    }
    if (!formData.terms_accepted) {
      toast({ title: 'Error', description: 'Please accept the terms and conditions', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      toast({ title: 'Error', description: 'Your cart is empty', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      
      const subtotal = getSubtotal();
      const deliveryFee = getDeliveryFee();
      const total = getTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('shop_orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          shipping_address: `${formData.street_address}, ${formData.town}, ${formData.county}, ${formData.country} ${formData.postal_code}`,
          country: formData.country,
          county: formData.county,
          town: formData.town,
          street_address: formData.street_address,
          postal_code: formData.postal_code,
          subtotal: subtotal,
          delivery_fee: getDeliveryFee(),
          total: total,
          notes: formData.notes,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        variant_name: item.variant?.variant_name,
        price: getItemPrice(item),
        quantity: item.quantity,
        subtotal: getItemPrice(item) * item.quantity,
        image_url: item.product.image_url
      }));

      const { error: itemsError } = await supabase
        .from('shop_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Generate invoice PDF
      const invoiceUrl = await generateShopInvoicePDF({
        order_number: order.order_number,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: `${formData.street_address}, ${formData.town}, ${formData.county}, ${formData.country} ${formData.postal_code}`,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: total,
        items: orderItems,
        created_at: order.created_at
      });

      // Create invoice record
      const { error: invoiceError } = await supabase
        .from('shop_invoices')
        .insert({
          order_id: order.id,
          invoice_number: `SHOP-INV-${order.order_number}`,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: total,
          pdf_url: invoiceUrl,
          status: 'pending'
        });

      if (invoiceError) throw invoiceError;

      // Send confirmation email (optional - doesn't block order)
      try {
        const emailSent = await sendOrderConfirmationEmail({
          order_number: order.order_number,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          shipping_address: `${formData.street_address}, ${formData.town}, ${formData.county}, ${formData.country} ${formData.postal_code}`,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          items: orderItems,
          invoice_url: invoiceUrl
        });
        
        if (emailSent) {
          toast({ title: 'Success', description: 'Order confirmation email sent successfully!' });
        } else {
          console.warn('Email sending returned false');
          toast({ title: 'Info', description: 'Order confirmed. Email notification is being processed.' });
        }
      } catch (emailError) {
        console.warn('Email sending error (non-blocking):', emailError);
        toast({ title: 'Info', description: 'Order confirmed. A confirmation email will be sent shortly.' });
      }

      // Clear cart from localStorage (for all users including guests)
      localStorage.removeItem('shop_cart');

      // Clear cart from database (for logged-in users)
      if (user) {
        await supabase
          .from('shop_cart_items')
          .delete()
          .eq('user_id', user.id);
      }

      // Redirect to confirmation page
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({ title: 'Error', description: 'Failed to place order. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading cart...</h2>
            <p className="text-gray-600">Please wait while we load your cart items.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some items to your cart before checking out.</p>
            <Button onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Email Address *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleInputChange('customer_email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                {/* Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => handleInputChange('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                        <SelectItem value="Uganda">Uganda</SelectItem>
                        <SelectItem value="Tanzania">Tanzania</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.country === 'Kenya' && (
                    <div>
                      <Label htmlFor="county">County *</Label>
                      <Select
                        value={formData.county}
                        onValueChange={(value) => handleInputChange('county', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent>
                          {KENYA_COUNTIES.map((county) => (
                            <SelectItem key={county} value={county}>
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="town">Town/City *</Label>
                    <Input
                      id="town"
                      value={formData.town}
                      onChange={(e) => handleInputChange('town', e.target.value)}
                      placeholder="Enter your town or city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="Enter postal code (optional)"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="street_address">Street Address *</Label>
                  <Textarea
                    id="street_address"
                    value={formData.street_address}
                    onChange={(e) => handleInputChange('street_address', e.target.value)}
                    placeholder="Enter your street address, building, apartment, etc."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special instructions for your order"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms_accepted}
                    onCheckedChange={(checked) => handleInputChange('terms_accepted', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and conditions *
                    </label>
                    <p className="text-xs text-muted-foreground">
                      By checking this box, you agree to our terms of service and privacy policy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {item.product.name}
                        </h3>
                        {item.variant && (
                          <p className="text-xs text-gray-500 truncate">
                            {item.variant.variant_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        KES {(getItemPrice(item) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>KES {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee:</span>
                    <span>KES {getDeliveryFee().toFixed(2)}</span>
                  </div>
                  {formData.country !== 'Kenya' && (
                    <div className="text-xs text-gray-500">
                      * Delivery fee only applies within Kenya
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>KES {getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    After placing your order, you'll receive an email with payment details.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">Payment Methods:</p>
                    <ul className="mt-1 space-y-1 text-blue-800">
                      <li>• M-Pesa Paybill: 522123 (Account: 22569k)</li>
                      <li>• Bank Transfer: KCB Bank - Nakuru Branch</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              disabled={loading || !formData.terms_accepted}
              className="w-full"
              size="lg"
            >
              {loading ? (
                'Processing Order...'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Place Order - KES {getTotal().toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
