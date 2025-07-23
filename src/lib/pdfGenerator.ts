import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QuoteData {
  name: string;
  email: string;
  phone: string | null;
  service_category: string;
  project_type: string | null;
  event_date: string | null;
  location: string | null;
  budget_range: string | null;
  timeline: string | null;
  specific_requirements: string | null;
  preferred_contact_method: string;
  additional_notes: string | null;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceDetails {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
  validUntil: string;
  serviceBreakdown: string;
  equipmentBreakdown: string;
  additionalInfo: string;
}

// 1. Update interfaces to accept more invoice metadata
interface InvoiceMeta {
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paymentStatus: string;
  studentId: string;
  registrationId?: string;
  sessionsPerWeek?: number;
  notes?: string;
}

export const generateQuotePDF = async (
  quoteData: QuoteData,
  quoteAmount: number,
  adminNotes?: string,
  invoiceDetails?: InvoiceDetails,
  invoiceMeta?: InvoiceMeta
): Promise<Blob> => {
  // Create a temporary div to render the PDF content
  const pdfContainer = document.createElement('div');
  pdfContainer.style.width = '800px';
  pdfContainer.style.padding = '40px';
  pdfContainer.style.backgroundColor = '#ffffff';
  pdfContainer.style.fontFamily = 'Arial, sans-serif';
  pdfContainer.style.position = 'absolute';
  pdfContainer.style.left = '-9999px';
  pdfContainer.style.top = '0';
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  pdfContainer.innerHTML = `
    <div style="max-width: 720px; margin: 0 auto; background-color: #ffffff; font-family: 'Arial', sans-serif;">
      <!-- Professional Header -->
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 24px 24px 16px 24px; border-radius: 8px 8px 0 0; margin-bottom: 18px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div style="display: flex; align-items: center;">
            <img src="/damon-logo.png" alt="Damon Music Academy Logo" style="width: 48px; height: 48px; object-fit: contain; margin-right: 12px; background: white; border-radius: 8px; padding: 3px;" />
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">DAMON MUSIC ACADEMY</h1>
              <p style="margin: 2px 0 0 0; font-size: 12px; opacity: 0.9;">Professional Music & Media Services</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${invoiceDetails ? 'INVOICE' : 'QUOTE'}</h2>
            <p style="margin: 2px 0 0 0; font-size: 11px; opacity: 0.8;">Date: ${currentDate}</p>
            ${invoiceMeta ? `<p style='margin:2px 0 0 0;font-size:11px;'>Invoice #: <b>${invoiceMeta.invoiceNumber}</b></p>` : ''}
            ${invoiceMeta ? `<p style='margin:2px 0 0 0;font-size:11px;'>Status: <b>${invoiceMeta.paymentStatus}</b></p>` : ''}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 11px; opacity: 0.9;">
          <div><strong>Email:</strong> admin@damonmusicacademy.co.ke</div>
          <div><strong>Phone:</strong> +254 701 195 460</div>
          <div><strong>Location:</strong> Nakuru, Kenya</div>
        </div>
      </div>

      <!-- Invoice Summary -->
      ${invoiceMeta ? `
      <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #2563eb; font-size: 13px; display: flex; flex-wrap: wrap; gap: 18px;">
        <div><b>Student ID:</b> ${invoiceMeta.studentId}</div>
        ${invoiceMeta.registrationId ? `<div><b>Registration ID:</b> ${invoiceMeta.registrationId}</div>` : ''}
        <div><b>Period:</b> ${invoiceMeta.periodStart} to ${invoiceMeta.periodEnd}</div>
        <div><b>Due Date:</b> ${invoiceMeta.dueDate}</div>
        ${invoiceMeta.sessionsPerWeek ? `<div><b>Sessions/Week:</b> ${invoiceMeta.sessionsPerWeek}</div>` : ''}
      </div>
      ` : ''}

      <!-- Client Information -->
      <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #2563eb; font-size: 13px;">
        <b>Client:</b> ${quoteData.name} &nbsp; | &nbsp; <b>Email:</b> ${quoteData.email} &nbsp; | &nbsp; <b>Phone:</b> ${quoteData.phone || '-'}
      </div>

      <!-- Invoice Table (if invoiceDetails provided) -->
      ${invoiceDetails ? `
      <div style="margin-bottom: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 8px 4px; border: 1px solid #1e40af; text-align: left; font-weight: 600;">Description</th>
              <th style="padding: 8px 4px; border: 1px solid #1e40af; text-align: right; font-weight: 600;">Quantity</th>
              <th style="padding: 8px 4px; border: 1px solid #1e40af; text-align: right; font-weight: 600;">Unit Price</th>
              <th style="padding: 8px 4px; border: 1px solid #1e40af; text-align: right; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceDetails.lineItems.map(item => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 4px; color: #374151;">${item.description}</td>
                <td style="padding: 8px 4px; text-align: right; color: #374151;">${item.quantity}</td>
                <td style="padding: 8px 4px; text-align: right; color: #374151;">KES ${item.unitPrice.toLocaleString()}</td>
                <td style="padding: 8px 4px; text-align: right; color: #374151; font-weight: 600;">KES ${item.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 8px; padding: 8px; background: #f0f9ff; border-radius: 8px; border: 1px solid #2563eb; font-size: 13px;">
          <div style="margin-bottom: 2px;"><strong>Subtotal:</strong> KES ${invoiceDetails.subtotal.toLocaleString()}</div>
          <div style="font-size: 15px; color: #1e40af; font-weight: bold;"><strong>TOTAL:</strong> KES ${invoiceDetails.total.toLocaleString()}</div>
        </div>
      </div>
      ` : ''}

      <!-- Notes and Credits -->
      ${invoiceMeta && invoiceMeta.notes ? `
        <div style="margin-bottom: 10px; background: #fef3c7; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 12px;">
          <b>Notes:</b> ${invoiceMeta.notes}
        </div>
      ` : ''}

      ${adminNotes ? `
        <div style="margin-bottom: 10px; background: #fef3c7; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 12px;">
          <b>Admin Notes:</b> ${adminNotes}
        </div>
      ` : ''}

      <!-- Terms and Conditions -->
      <div style="margin-bottom: 10px; background: #f8fafc; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #2563eb; font-size: 11px;">
        <b>Terms & Conditions:</b>
        <ul style="margin: 0; padding-left: 18px; line-height: 1.5;">
          <li>${invoiceDetails ? invoiceDetails.paymentTerms : '50% deposit required to confirm booking'}</li>
          <li>This ${invoiceDetails ? 'invoice' : 'quote'} is valid for ${invoiceDetails ? invoiceDetails.validUntil : '30 days from the date of issue'}</li>
          <li>Final payment due before service delivery</li>
          <li>Cancellation policy: 48 hours notice required for full refund</li>
          <li>All services subject to availability and weather conditions</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 18px; padding: 10px; background: #1e40af; color: white; border-radius: 8px; font-size: 11px;">
        <p style="margin: 2px 0;">Thank you for choosing Damon Music Academy</p>
        <p style="margin: 2px 0; opacity: 0.8;">© 2025 Damon Music Academy. All rights reserved.</p>
      </div>
    </div>
  `;

  // Add the container to the document temporarily
  document.body.appendChild(pdfContainer);

  try {
    // Convert the HTML to canvas
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert to blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } finally {
    // Clean up
    document.body.removeChild(pdfContainer);
  }
}; 