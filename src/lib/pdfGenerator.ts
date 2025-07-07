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

export const generateQuotePDF = async (
  quoteData: QuoteData,
  quoteAmount: number,
  adminNotes?: string,
  invoiceDetails?: InvoiceDetails
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
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; margin-bottom: 30px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex; align-items: center;">
            <img src="/damon-logo.png" alt="Damon Music Academy Logo" style="width: 60px; height: 60px; object-fit: contain; margin-right: 15px; background: white; border-radius: 8px; padding: 5px;" />
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">DAMON MUSIC ACADEMY</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Professional Music & Media Services</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${invoiceDetails ? 'INVOICE' : 'QUOTE'}</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Date: ${currentDate}</p>
          </div>
        </div>
        
        <!-- Contact Info Bar -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; font-size: 12px; opacity: 0.9;">
          <div>
            <strong>Email:</strong> admin@damonmusicacademy.co.ke
          </div>
          <div>
            <strong>Phone:</strong> +254 701 195 460
          </div>
          <div>
            <strong>Location:</strong> Nakuru, Kenya
          </div>
        </div>
      </div>

      <!-- Client Information -->
      <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">CLIENT INFORMATION</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px;">
          <div>
            <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> ${quoteData.name}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> ${quoteData.email}</p>
            ${quoteData.phone ? `<p style="margin: 5px 0; color: #374151;"><strong>Phone:</strong> ${quoteData.phone}</p>` : ''}
          </div>
          <div>
            <p style="margin: 5px 0; color: #374151;"><strong>Preferred Contact:</strong> ${quoteData.preferred_contact_method}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Quote Date:</strong> ${currentDate}</p>
          </div>
        </div>
      </div>

      <!-- Project Details -->
      <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">PROJECT DETAILS</h3>
        <div style="font-size: 14px; color: #374151;">
          <p style="margin: 5px 0;"><strong>Service:</strong> ${quoteData.service_category}</p>
          ${quoteData.project_type ? `<p style="margin: 5px 0;"><strong>Project Type:</strong> ${quoteData.project_type}</p>` : ''}
          ${quoteData.event_date ? `<p style="margin: 5px 0;"><strong>Event Date:</strong> ${quoteData.event_date}</p>` : ''}
          ${quoteData.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${quoteData.location}</p>` : ''}
          ${quoteData.budget_range ? `<p style="margin: 5px 0;"><strong>Budget Range:</strong> ${quoteData.budget_range}</p>` : ''}
          ${quoteData.timeline ? `<p style="margin: 5px 0;"><strong>Timeline:</strong> ${quoteData.timeline}</p>` : ''}
        </div>
      </div>

      <!-- Invoice Table (if invoiceDetails provided) -->
      ${invoiceDetails ? `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">INVOICE BREAKDOWN</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 14px;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 12px 8px; border: 1px solid #1e40af; text-align: left; font-weight: 600;">Description</th>
              <th style="padding: 12px 8px; border: 1px solid #1e40af; text-align: right; font-weight: 600;">Quantity</th>
              <th style="padding: 12px 8px; border: 1px solid #1e40af; text-align: right; font-weight: 600;">Unit Price</th>
              <th style="padding: 12px 8px; border: 1px solid #1e40af; text-align: right; font-weight: 600;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceDetails.lineItems.map(item => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; color: #374151;">${item.description}</td>
                <td style="padding: 12px 8px; text-align: right; color: #374151;">${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right; color: #374151;">KES ${item.unitPrice.toLocaleString()}</td>
                <td style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600;">KES ${item.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: right; margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #2563eb;">
          <div style="font-size: 16px; margin-bottom: 5px;"><strong>Subtotal:</strong> KES ${invoiceDetails.subtotal.toLocaleString()}</div>
          <div style="font-size: 20px; color: #1e40af; font-weight: bold;"><strong>TOTAL:</strong> KES ${invoiceDetails.total.toLocaleString()}</div>
        </div>
      </div>
      ` : ''}

      ${invoiceDetails ? `
        <!-- Service Breakdown -->
        ${invoiceDetails.serviceBreakdown ? `
        <div style="margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">SERVICE BREAKDOWN</h3>
          <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 14px;">${invoiceDetails.serviceBreakdown}</p>
        </div>
        ` : ''}

        <!-- Equipment Breakdown -->
        ${invoiceDetails.equipmentBreakdown ? `
        <div style="margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">EQUIPMENT & TECHNICAL DETAILS</h3>
          <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 14px;">${invoiceDetails.equipmentBreakdown}</p>
        </div>
        ` : ''}

        <!-- Additional Information -->
        ${invoiceDetails.additionalInfo ? `
        <div style="margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">ADDITIONAL INFORMATION</h3>
          <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 14px;">${invoiceDetails.additionalInfo}</p>
        </div>
        ` : ''}
      ` : ''}

      <!-- Quote Amount (if not invoice) -->
      ${!invoiceDetails ? `
      <div style="margin-bottom: 30px; background: #f0f9ff; padding: 25px; border-radius: 8px; border: 2px solid #2563eb; text-align: center;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">QUOTE AMOUNT</h3>
        <p style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 0;">
          KES ${quoteAmount.toLocaleString()}
        </p>
        <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">Total Quote Amount</p>
      </div>
      ` : ''}

      ${adminNotes ? `
        <!-- Additional Notes -->
        <div style="margin-bottom: 25px; background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">ADDITIONAL NOTES</h3>
          <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 14px;">${adminNotes}</p>
        </div>
      ` : ''}

      <!-- Terms and Conditions -->
      <div style="margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">TERMS & CONDITIONS</h3>
        <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
          <li>${invoiceDetails ? invoiceDetails.paymentTerms : '50% deposit required to confirm booking'}</li>
          <li>This ${invoiceDetails ? 'invoice' : 'quote'} is valid for ${invoiceDetails ? invoiceDetails.validUntil : '30 days from the date of issue'}</li>
          <li>Final payment due before service delivery</li>
          <li>Cancellation policy: 48 hours notice required for full refund</li>
          <li>All services subject to availability and weather conditions</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding: 20px; background: #1e40af; color: white; border-radius: 8px;">
        <p style="margin: 5px 0; font-size: 14px;">Thank you for choosing Damon Music Academy</p>
        <p style="margin: 5px 0; font-size: 12px; opacity: 0.8;">© 2025 Damon Music Academy. All rights reserved.</p>
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