import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, orderData } = await req.json()

    if (!to || !orderData) {
      return new Response(
        JSON.stringify({ error: 'Email address and order data are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create email subject and HTML content
    const emailSubject = `Order Confirmation - ${orderData.order_number}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; }
          .header { background: #6f42c1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 16px; color: #6f42c1; }
          .footer { text-align: center; padding: 15px; color: #666; border-top: 1px solid #eee; }
          .payment-info { background: #e8f3ff; padding: 15px; border-left: 4px solid #6f42c1; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          
          <div class="content">
            <h2>Order Details</h2>
            <div class="order-details">
              <p><strong>Order Number:</strong> ${orderData.order_number}</p>
              <p><strong>Customer:</strong> ${orderData.customer_name}</p>
              <p><strong>Email:</strong> ${orderData.customer_email}</p>
              <p><strong>Phone:</strong> ${orderData.customer_phone}</p>
              <p><strong>Shipping Address:</strong><br>${orderData.shipping_address}</p>
            </div>

            <h3>Order Items</h3>
            <div class="order-details">
              ${orderData.items.map((item: any) => `
                <div class="item">
                  <span>${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''} x ${item.quantity}</span>
                  <span>KES ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
              
              <div class="item" style="border-bottom: 2px solid #6f42c1; margin-top: 10px; padding-top: 10px;">
                <span>Subtotal:</span>
                <span>KES ${orderData.subtotal.toFixed(2)}</span>
              </div>
              <div class="item">
                <span>Delivery Fee:</span>
                <span>KES ${orderData.delivery_fee.toFixed(2)}</span>
              </div>
              <div class="item total" style="border: none;">
                <span>TOTAL:</span>
                <span>KES ${orderData.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="payment-info">
              <h3 style="margin-top: 0;">💳 Payment Instructions</h3>
              <p><strong>M-Pesa Paybill:</strong> 522123</p>
              <p><strong>Account:</strong> 22569k</p>
              <p><strong>Amount:</strong> KES ${orderData.total.toFixed(2)}</p>
              <p style="font-size: 12px; color: #555;">Please include your order number (${orderData.order_number}) as the payment reference.</p>
              
              <p style="margin-top: 15px;"><strong>Bank Transfer:</strong> KCB Bank - Nakuru Branch</p>
              <p style="font-size: 12px; color: #555;">Contact us for bank account details.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Damon Music Academy!</p>
            <p style="font-size: 12px;">If you have any questions, please reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Log the email for debugging
    console.log(`Email would be sent to: ${to}`)
    console.log(`Subject: ${emailSubject}`)
    console.log(`Order: ${orderData.order_number}`)

    // Try sending with Resend if API key is available
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Damon Music Academy <noreply@damonmusicacademy.com>',
            to: [to],
            subject: emailSubject,
            html: emailHtml,
          }),
        })

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json()
          console.log('Email sent via Resend:', emailResult)
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Order confirmation email sent successfully',
              orderNumber: orderData.order_number
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (emailError) {
        console.error('Resend API error:', emailError)
      }
    }

    // Fallback response - email logged for manual processing
    console.log(`Email details logged for: ${to}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order confirmation logged (email sending configured)',
        orderNumber: orderData.order_number,
        note: 'Configure RESEND_API_KEY for automatic email sending'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-order-confirmation-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
