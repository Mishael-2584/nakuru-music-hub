import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
  audio_file_url?: string;
}

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: OrderItem[];
  invoice_url?: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderData): Promise<boolean> => {
  try {
    console.log('📧 Sending order confirmation email to:', orderData.customer_email);

    // Validate required fields
    if (!orderData.order_number || !orderData.customer_name || !orderData.customer_email) {
      console.error('❌ Missing required fields for email');
      return false;
    }

    const siteUrl = 'https://damonmusicacademy.co.ke';

    // Create professional HTML email content for shop order
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Damon Music Academy Shop</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: linear-gradient(135deg, #6f42c1 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .order-header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #6f42c1;
          }
          .order-number {
            font-size: 24px;
            font-weight: bold;
            color: #6f42c1;
            margin: 0;
          }
          .customer-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin: 20px 0 10px 0;
            border-bottom: 2px solid #6f42c1;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #6f42c1;
          }
          table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .price-column {
            text-align: right;
          }
          .totals {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
          }
          .total-row.final {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #6f42c1;
            padding: 12px 0;
          }
          .payment-box {
            background: #e8f3ff;
            border-left: 4px solid #6f42c1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .payment-box h3 {
            margin-top: 0;
            color: #6f42c1;
          }
          .payment-method {
            background: white;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 4px;
            border-left: 3px solid #6f42c1;
          }
          .button {
            background: #6f42c1;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
          }
          .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎵 Order Confirmation</h1>
          <p>Thank you for shopping with Damon Music Academy!</p>
        </div>

        <div class="content">
          <div class="order-header">
            <p class="order-number">Order #${orderData.order_number}</p>
            <p style="margin: 5px 0; color: #666;">Your order has been received and confirmed</p>
          </div>

          <div class="customer-info">
            <p><strong>${orderData.customer_name}</strong></p>
            <p>${orderData.customer_email}</p>
            <p>${orderData.customer_phone}</p>
            <p>${orderData.shipping_address}</p>
          </div>

          <h2 class="section-title">Order Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="width: 60px; text-align: center;">Qty</th>
                <th style="width: 80px;" class="price-column">Price</th>
                <th style="width: 80px;" class="price-column">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.items.map(item => `
                <tr>
                  <td>
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.product_name}" style="max-width: 50px; margin-right: 10px; border-radius: 5px;">` : ''}
                    ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}
                    ${item.audio_file_url ? `<br><small style="color: #6f42c1; font-weight: bold;">🎵 Digital Download Available</small>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td class="price-column">KES ${item.price.toFixed(2)}</td>
                  <td class="price-column">KES ${item.subtotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${orderData.items.some(item => item.audio_file_url) ? `
            <div class="payment-box" style="background: #f0f7ff; border-left: 4px solid #6f42c1; margin-top: 20px;">
              <h3 style="margin-top: 0; color: #6f42c1;">🎵 Digital Downloads</h3>
              <p style="margin-bottom: 15px;">Your backing tracks/soundtracks are ready for download:</p>
              <div style="space-y: 10px;">
                ${orderData.items.filter(item => item.audio_file_url).map((item, index) => `
                  <div style="background: white; padding: 12px; margin-bottom: 10px; border-radius: 4px; border-left: 3px solid #6f42c1;">
                    <strong>${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</strong>
                    ${item.quantity > 1 ? ` <span style="color: #666;">x${item.quantity}</span>` : ''}
                    <br>
                    <a href="${item.audio_file_url}" 
                       style="display: inline-block; background: #6f42c1; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; margin-top: 8px; font-weight: bold;"
                       target="_blank">
                      ⬇️ Download Audio File
                    </a>
                  </div>
                `).join('')}
              </div>
              <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
                <strong>Note:</strong> Download links are valid indefinitely. Please save your files after downloading.
              </p>
            </div>
          ` : ''}

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>KES ${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fee:</span>
              <span>KES ${orderData.delivery_fee.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL:</span>
              <span>KES ${orderData.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="payment-box">
            <h3>💳 Payment Instructions</h3>
            <div class="payment-method">
              <strong>M-Pesa Paybill</strong><br>
              Paybill: <strong>522123</strong><br>
              Account: <strong>22569k</strong><br>
              Amount: <strong>KES ${orderData.total.toFixed(2)}</strong>
            </div>
            <div class="payment-method">
              <strong>Bank Transfer</strong><br>
              Bank: <strong>KCB Bank - Nakuru Branch</strong><br>
              Reference: <strong>${orderData.order_number}</strong>
            </div>
            <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
              Please include your order number as the payment reference to help us process your payment faster.
            </p>
          </div>

          <p>Thank you for your purchase! If you have any questions, please reply to this email.</p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Damon Music Academy. All rights reserved.</p>
          <p>Nakuru, Kenya | info@damonmusicacademy.com</p>
        </div>
      </body>
      </html>
    `;

    // Send email using the existing send-confirmation-email Edge Function
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: orderData.customer_email,
        subject: `Order Confirmation - Order #${orderData.order_number}`,
        html: emailHTML,
        registration: {
          id: orderData.order_number,
          receipt_number: orderData.order_number
        }
      }
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    return false;
  }
};

export const sendOrderStatusUpdateEmail = async (order: any, newStatus: string): Promise<boolean> => {
  try {
    console.log('📧 Sending order status update email to:', order.customer_email);

    if (!order.customer_email) {
      console.error('❌ Missing customer email for status update');
      return false;
    }

    // Define status-specific messages and colors
    const statusInfo: { [key: string]: { title: string; message: string; color: string; icon: string } } = {
      pending: {
        title: 'Order Received',
        message: 'Your order has been received and is being processed. We will ship it soon!',
        color: '#FF9500',
        icon: '⏳'
      },
      confirmed: {
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and is being prepared for shipment.',
        color: '#007AFF',
        icon: '✅'
      },
      processing: {
        title: 'Order Processing',
        message: 'Your order is currently being packaged and will be shipped within 24 hours.',
        color: '#5856D6',
        icon: '📦'
      },
      shipped: {
        title: 'Order Shipped',
        message: 'Great news! Your order has been shipped and is on its way to you.',
        color: '#34C759',
        icon: '🚚'
      },
      delivered: {
        title: 'Order Delivered',
        message: 'Your order has been delivered! We hope you enjoy your purchase.',
        color: '#00B894',
        icon: '🎉'
      },
      completed: {
        title: 'Order Completed',
        message: 'Thank you for your purchase! Your order has been completed successfully.',
        color: '#6f42c1',
        icon: '✨'
      },
      cancelled: {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact us.',
        color: '#FF3B30',
        icon: '❌'
      }
    };

    const info = statusInfo[newStatus] || {
      title: 'Order Status Updated',
      message: `Your order status has been updated to ${newStatus}.`,
      color: '#6f42c1',
      icon: '📝'
    };

    // Create professional HTML email
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${info.title} - Order #${order.order_number}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6f42c1 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .status-banner {
            background: ${info.color};
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
          }
          .status-icon {
            font-size: 32px;
            margin-right: 10px;
          }
          .content {
            padding: 30px;
          }
          .status-message {
            background: #f0f7ff;
            border-left: 4px solid ${info.color};
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 25px;
            font-size: 16px;
            line-height: 1.6;
          }
          .order-details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: bold;
            color: #666;
          }
          .detail-value {
            color: #333;
          }
          .order-items {
            margin-bottom: 20px;
          }
          .order-items h3 {
            margin: 20px 0 10px 0;
            color: #333;
            font-size: 16px;
          }
          .item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-name {
            flex: 1;
          }
          .item-price {
            text-align: right;
            white-space: nowrap;
            margin-left: 10px;
          }
          .next-steps {
            background: #e8f3ff;
            border-left: 4px solid #2196f3;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .next-steps h4 {
            margin-top: 0;
            color: #1976d2;
          }
          .next-steps p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
          .footer-links {
            margin-top: 10px;
          }
          .footer-links a {
            color: #6f42c1;
            text-decoration: none;
            margin: 0 10px;
          }
          .cta-button {
            display: inline-block;
            background: #6f42c1;
            color: white;
            padding: 12px 30px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 15px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 Damon Music Academy Shop</h1>
            <p>Order Status Update</p>
          </div>

          <div class="status-banner">
            <span class="status-icon">${info.icon}</span>${info.title}
          </div>

          <div class="content">
            <div class="status-message">
              ${info.message}
            </div>

            <div class="order-details">
              <div class="detail-row">
                <span class="detail-label">Order Number:</span>
                <span class="detail-value">#${order.order_number}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: ${info.color}; font-weight: bold;">
                  ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">KES ${order.total.toFixed(2)}</span>
              </div>
            </div>

            ${order.items && order.items.length > 0 ? `
              <div class="order-items">
                <h3>Order Items</h3>
                ${order.items.map((item: any) => `
                  <div class="item">
                    <div class="item-name">
                      ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}
                      <br><small style="color: #666;">Qty: ${item.quantity}</small>
                    </div>
                    <div class="item-price">KES ${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${newStatus === 'shipped' ? `
              <div class="next-steps">
                <h4>📦 What's Next?</h4>
                <p>Your order is on its way! You can expect delivery within 2-5 business days depending on your location.</p>
                <p>Keep an eye on your email for tracking updates.</p>
              </div>
            ` : ''}

            ${newStatus === 'processing' ? `
              <div class="next-steps">
                <h4>⏱️ What's Next?</h4>
                <p>We're preparing your order for shipment. Most orders ship within 24 hours. You'll receive a shipping notification once your order is on its way.</p>
              </div>
            ` : ''}

            ${newStatus === 'confirmed' ? `
              <div class="next-steps">
                <h4>✅ What's Next?</h4>
                <p>Your order is confirmed and being prepared. We're working hard to get your items ready for shipment as quickly as possible.</p>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>If you have any questions about your order, please don't hesitate to contact us.</p>
            <div class="footer-links">
              <a href="https://damonmusicacademy.co.ke">Visit Our Website</a>
              <a href="mailto:info@damonmusicacademy.com">Contact Us</a>
            </div>
            <p style="margin-top: 15px; color: #999;">
              © ${new Date().getFullYear()} Damon Music Academy. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using the existing send-confirmation-email Edge Function
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: order.customer_email,
        subject: `${info.icon} ${info.title} - Order #${order.order_number}`,
        html: emailHTML,
        registration: {
          id: order.id,
          receipt_number: order.order_number
        }
      }
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    if (!data || !data.success) {
      console.error('❌ Email API returned non-success response:', data);
      return false;
    }

    console.log('✅ Status update email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    return false;
  }
};

export const testOrderStatusEmail = async () => {
  try {
    console.log('🧪 Testing order status email...');
    
    const testOrder = {
      id: 'test-order-id',
      order_number: 'TEST-ORDER-001',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '0701234567',
      total: 5000,
      delivery_fee: 200,
      subtotal: 4800,
      created_at: new Date().toISOString(),
      items: [
        {
          product_name: 'Test Product',
          variant_name: 'Test Variant',
          price: 2400,
          quantity: 2,
          subtotal: 4800
        }
      ]
    };

    console.log('🧪 Sending test email with order:', testOrder);
    const result = await sendOrderStatusUpdateEmail(testOrder, 'confirmed');
    console.log('🧪 Test email result:', result);
    return result;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
};
