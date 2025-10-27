import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderItem {
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  subtotal: number;
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
  created_at: string;
  street_address?: string;
  town?: string;
  county?: string;
  country?: string;
  postal_code?: string;
  admin_notes?: string;
}

export const generateShopInvoicePDF = async (orderData: OrderData): Promise<string> => {
  try {
    const invoiceDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const invoiceNumber = `SHOP-INV-${orderData.order_number}-${Date.now()}`;

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(orderData);

    // Store invoice HTML in sessionStorage for later download
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`invoice-${orderData.order_number}`, htmlContent);
    }

    // Return a data URL that can be used for download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Also try to store in Supabase for backup, but don't fail if it doesn't work
    try {
      const fileName = `invoices/invoice-${orderData.order_number}-${Date.now()}.html`;
      await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: 'text/html',
          upsert: true,
        });
      
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      // Return the storage URL if successful
      if (urlData?.publicUrl) {
        return urlData.publicUrl;
      }
    } catch (storageError) {
      console.warn('Storage upload failed, using data URL:', storageError);
    }

    // Fallback: return data URL for download
    return url;
  } catch (error) {
    console.error('Error generating shop invoice PDF:', error);
    throw error;
  }
};

const generateInvoiceHTML = (order: OrderData): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalBeforeDelivery = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          background: #f5f5f5;
          padding: 20px;
        }
        .container {
          max-width: 794px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 0 20px 0;
        }
        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px 8px 32px;
          border-bottom: 2px solid #e5e7eb;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-circle {
          height: 70px;
          width: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border-radius: 50%;
          border: 3px solid #1e40af;
          box-shadow: 0 2px 8px #e0e7ef;
        }
        .logo-circle img {
          height: 54px;
          width: 54px;
          object-fit: contain;
          border-radius: 50%;
          background: #fff;
        }
        .company-info h1 {
          font-size: 22px;
          font-weight: bold;
          color: #1e293b;
          letter-spacing: 1px;
        }
        .company-info p {
          font-size: 12px;
          color: #475569;
          margin-top: 2px;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title .type {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          letter-spacing: 2px;
          margin-bottom: 2px;
        }
        .invoice-title p {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0;
        }
        .invoice-title .due-date {
          font-size: 15px;
          color: #e11d48;
          font-weight: bold;
          margin-top: 4px;
        }
        /* From/To Section */
        .from-to {
          display: flex;
          justify-content: space-between;
          padding: 18px 32px 8px 32px;
          font-size: 13px;
        }
        .from-to div {
          flex: 1;
        }
        .from-to .to {
          text-align: right;
        }
        .from-to strong {
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 4px;
          display: block;
        }
        .from-to p {
          margin: 2px 0;
          color: #334155;
        }
        /* Items Table */
        .table-section {
          padding: 8px 32px 0 32px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .items-table thead {
          background: #f1f5f9;
          color: #1e293b;
        }
        .items-table th {
          padding: 10px 8px;
          border: 1px solid #e5e7eb;
          text-align: left;
          font-weight: 600;
        }
        .items-table th.right {
          text-align: right;
        }
        .items-table td {
          padding: 10px 8px;
          border: 1px solid #e5e7eb;
          color: #334155;
        }
        .items-table td.right {
          text-align: right;
        }
        .items-table td.amount {
          font-weight: 600;
        }
        /* Totals */
        .totals-section {
          padding: 0 32px;
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }
        .totals-table {
          font-size: 13px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 8px 4px;
        }
        .totals-table .label {
          text-align: right;
          font-weight: 600;
          color: #1e293b;
          padding-right: 16px;
        }
        .totals-table .value {
          text-align: right;
          font-weight: 600;
          color: #1e293b;
        }
        .totals-table .total-row .label,
        .totals-table .total-row .value {
          font-weight: 700;
          color: #1e40af;
          font-size: 15px;
        }
        /* Delivery Fee */
        .delivery-section {
          margin: 18px 32px 0 32px;
          background: #f0f9ff;
          padding: 12px 18px;
          border-radius: 8px;
          border-left: 4px solid #0284c7;
          font-size: 13px;
        }
        .delivery-section strong {
          color: #1e293b;
          display: block;
          margin-bottom: 4px;
        }
        .delivery-section p {
          color: #334155;
          margin: 4px 0;
        }
        /* Shipping Address */
        .shipping-section {
          margin: 18px 32px 0 32px;
          background: #f8fafc;
          padding: 12px 18px;
          border-radius: 8px;
          border-left: 4px solid #64748b;
          font-size: 13px;
        }
        .shipping-section strong {
          color: #1e293b;
          display: block;
          margin-bottom: 4px;
        }
        .shipping-section p {
          color: #334155;
          margin: 2px 0;
        }
        /* Notes Section */
        .notes-section {
          margin: 18px 32px 0 32px;
          background: #fef3c7;
          padding: 10px 16px;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          font-size: 12px;
          color: #78350f;
        }
        .notes-section strong {
          display: block;
          margin-bottom: 4px;
        }
        /* Footer */
        .footer {
          margin: 18px 32px 0 32px;
          font-size: 11px;
          color: #64748b;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div class="logo-circle">
              <img src="/damon-logo.png" alt="Logo" />
            </div>
            <div class="company-info">
              <h1>Damon Music Academy</h1>
              <p>Professional Music & Media Services</p>
              <p>0701 195 460 | 0721 962 647</p>
              <p>damonmusicacademy@gmail.com</p>
            </div>
          </div>
          <div class="invoice-title">
            <div class="type">INVOICE</div>
            <p>Order Number: <b>#${order.order_number}</b></p>
            <p>Date: ${currentDate}</p>
            <div class="due-date">Order Date: ${new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</div>
          </div>
        </div>

        <!-- From/To Section -->
        <div class="from-to">
          <div>
            <strong>From:</strong>
            <p>Damon Music Academy</p>
            <p>0701 195 460</p>
            <p>damonmusicacademy@gmail.com</p>
            <p>Nakuru, Kenya</p>
          </div>
          <div class="to">
            <strong>To:</strong>
            <p>${order.customer_name}</p>
            <p>${order.customer_email}</p>
            <p>${order.customer_phone || '-'}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-section">
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="right">Quantity</th>
                <th class="right">Unit Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">KES ${item.price.toLocaleString()}</td>
                  <td class="right amount">KES ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals -->
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="value">KES ${totalBeforeDelivery.toLocaleString()}</td>
              </tr>
              ${order.delivery_fee > 0 ? `
                <tr>
                  <td class="label">Delivery Fee:</td>
                  <td class="value">KES ${order.delivery_fee.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td class="label">Total:</td>
                <td class="value">KES ${order.total.toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Delivery Fee Info -->
        ${order.delivery_fee > 0 ? `
          <div class="delivery-section">
            <strong>📦 Delivery Information</strong>
            <p>Delivery Fee: KES ${order.delivery_fee.toLocaleString()}</p>
            <p>Location: ${order.country}</p>
          </div>
        ` : ''}

        <!-- Shipping Address -->
        ${order.street_address ? `
          <div class="shipping-section">
            <strong>📍 Shipping Address</strong>
            <p>${order.street_address}</p>
            ${order.town ? `<p>${order.town}</p>` : ''}
            ${order.county ? `<p>${order.county} County</p>` : ''}
            ${order.country ? `<p>${order.country}</p>` : ''}
            ${order.postal_code ? `<p>Postal Code: ${order.postal_code}</p>` : ''}
          </div>
        ` : ''}

        <!-- Admin Notes if any -->
        ${order.admin_notes ? `
          <div class="notes-section">
            <strong>📝 Admin Notes:</strong>
            ${order.admin_notes}
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Payment Information</strong></p>
          <p>Paybill Number: <b>522123</b></p>
          <p>Account Number: <b>22569k</b></p>
          <p>Bank Name: <b>KCB</b></p>
          <p>Bank Account Name: <b>Damon Music Academy</b></p>
          <p>Account Number: <b>1265204926</b></p>
          <p>Branch: <b>Nakuru</b></p>
          <p style="margin-top: 8px;">Thank you for your purchase! For any queries, contact us at 0701 195 460.</p>
          <p style="margin-top: 4px; color: #999; font-size: 10px;">© ${new Date().getFullYear()} Damon Music Academy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate and download a shop order invoice as PDF
 * @param order - Order data including items and customer info
 * @returns void (downloads file directly)
 */
export const downloadShopOrderInvoice = async (order: any) => {
  try {
    console.log('📄 Generating invoice for order:', order.order_number);

    // Prepare order data for invoice
    const orderData: OrderData = {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone || '',
      shipping_address: `${order.street_address || ''}, ${order.town || ''}, ${order.county || ''}, ${order.country || ''}`.trim(),
      subtotal: order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      delivery_fee: order.delivery_fee || 0,
      total: order.total,
      items: order.items.map((item: any) => ({
        product_name: item.product_name,
        variant_name: item.variant_name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      created_at: order.created_at,
      street_address: order.street_address,
      town: order.town,
      county: order.county,
      country: order.country,
      postal_code: order.postal_code,
      admin_notes: order.admin_notes
    };

    // Generate professional HTML invoice
    const htmlContent = generateInvoiceHTML(orderData);

    // Create container for HTML rendering
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '794px';
    container.style.background = '#ffffff';
    document.body.appendChild(container);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true
      });

      // Create PDF from canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add pages as needed
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Download PDF
      const fileName = `Invoice-${order.order_number}-${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ Invoice downloaded successfully');
    } finally {
      // Clean up container
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    throw error;
  }
};
