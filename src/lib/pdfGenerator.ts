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

  // 1. Calculate due date as 7th of the next month if invoiceDetails is present
  let invoiceOrQuoteDate = currentDate;
  let dueDateStr = invoiceMeta?.dueDate;
  // Format dueDateStr if present and in ISO format
  if (dueDateStr && /^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
    const dueDateObj = new Date(dueDateStr);
    dueDateStr = dueDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  if (!dueDateStr && invoiceDetails && invoiceMeta) {
    // If periodEnd is e.g. 2025-08-31, due date is 7th of next month (2025-09-07)
    const periodEnd = new Date(invoiceMeta.periodEnd);
    const dueDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 1);
    dueDate.setDate(7);
    dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Determine course/instrument for specificity
  let courseOrInstrument = '';
  if (invoiceMeta && invoiceMeta.registrationId) {
    courseOrInstrument = invoiceMeta.registrationId;
  } else if (invoiceDetails && invoiceDetails.lineItems && invoiceDetails.lineItems.length > 0) {
    courseOrInstrument = invoiceDetails.lineItems[0].description;
  } else if (quoteData && quoteData.service_category) {
    courseOrInstrument = quoteData.service_category;
  }

  pdfContainer.innerHTML = `
  <div style="max-width: 794px; margin: 0 auto; background: #fff; font-family: 'Arial', sans-serif; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0 0 20px 0;">
    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 24px 32px 8px 32px; border-bottom: 2px solid #e5e7eb;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="height: 70px; width: 70px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 50%; border: 3px solid #1e40af; box-shadow: 0 2px 8px #e0e7ef;">
          <img src="/damon-logo.png" alt="Logo" style="height: 54px; width: 54px; object-fit: contain; border-radius: 50%; background: #fff;" />
        </div>
        <div>
          <div style="font-size: 22px; font-weight: bold; color: #1e293b; letter-spacing: 1px;">Damon Music Academy</div>
          <div style="font-size: 13px; color: #475569;">Professional Music & Media Services</div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">0701 195 460 | 0721 962 647</div>
          <div style="font-size: 12px; color: #475569;">damonmusicacademy@gmail.com</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 28px; font-weight: bold; color: #1e40af; letter-spacing: 2px; margin-bottom: 2px;">INVOICE</div>
        <div style="font-size: 15px; color: #64748b;">Receipt: <b>${invoiceMeta?.invoiceNumber || '-'}</b></div>
        <div style="font-size: 13px; color: #64748b;">Date: ${invoiceOrQuoteDate}</div>
        <div style="font-size: 15px; color: #e11d48; font-weight: bold; margin-top: 4px;">Due Date: ${dueDateStr || '-'}</div>
        <div style="font-size: 13px; color: #1e293b; margin-top: 4px;">Course/Instrument: <b>${courseOrInstrument}</b></div>
      </div>
    </div>

    <!-- From/To Section -->
    <div style="display: flex; justify-content: space-between; padding: 18px 32px 8px 32px; font-size: 13px;">
      <div>
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 2px;">From:</div>
        <div>Damon Music Academy</div>
        <div>0701 195 460</div>
        <div>damonmusicacademy@gmail.com</div>
        <div>Nakuru, Kenya</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 2px;">To:</div>
        <div>${quoteData.name}</div>
        <div>${quoteData.email}</div>
        <div>${quoteData.phone || '-'}</div>
      </div>
    </div>

    <!-- Table -->
    <div style="padding: 8px 32px 0 32px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px;">
        <thead>
          <tr style="background: #f1f5f9; color: #1e293b;">
            <th style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600;">Description</th>
            <th style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">Quantity</th>
            <th style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">Unit Price</th>
            <th style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: right; font-weight: 600;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceDetails?.lineItems.map(item => `
            <tr>
              <td style="padding: 8px 4px; border: 1px solid #e5e7eb; color: #334155;">${item.description}</td>
              <td style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: right; color: #334155;">${item.quantity}</td>
              <td style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: right; color: #334155;">KES ${item.unitPrice.toLocaleString()}</td>
              <td style="padding: 8px 4px; border: 1px solid #e5e7eb; text-align: right; color: #334155; font-weight: 600;">KES ${item.amount.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="display: flex; justify-content: flex-end;">
        <table style="font-size: 13px;">
          <tbody>
            <tr><td style="padding: 2px 8px; color: #64748b;">Subtotal:</td><td style="padding: 2px 8px; text-align: right; color: #1e293b;">KES ${invoiceDetails?.subtotal.toLocaleString()}</td></tr>
            <tr><td style="padding: 2px 8px; color: #64748b; font-weight: bold;">Total:</td><td style="padding: 2px 8px; text-align: right; color: #1e40af; font-weight: bold;">KES ${invoiceDetails?.total.toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payment Information -->
    <div style="margin: 18px 32px 0 32px; background: #f1f5f9; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #1e40af; font-size: 13px;">
      <div style="font-weight: bold; color: #1e293b; margin-bottom: 4px;">Payment Information</div>
      <div>Paybill Number: <b>522123</b></div>
      <div>Account Number: <b>22569k</b></div>
      <div>Bank Name: <b>KCB</b></div>
      <div>Bank Account Name: <b>Damon Music Academy</b></div>
      <div>Account Number: <b>1265204926</b></div>
      <div>Branch: <b>Nakuru</b></div>
    </div>

    <!-- Footer / Notes -->
    ${invoiceMeta && invoiceMeta.notes ? `
      <div style="margin: 18px 32px 0 32px; background: #fef3c7; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 12px;">
        <b>Notes:</b> ${invoiceMeta.notes}
      </div>
    ` : ''}
    ${adminNotes ? `
      <div style="margin: 18px 32px 0 32px; background: #fef3c7; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 12px;">
        <b>Admin Notes:</b> ${adminNotes}
      </div>
    ` : ''}
    <div style="margin: 18px 32px 0 32px; font-size: 11px; color: #64748b;">
      <div><b>Due Date:</b> ${dueDateStr || invoiceMeta?.dueDate || ''}</div>
      <div style="margin-top: 4px;">Thank you for choosing Damon Music Academy. For any queries, contact us at 0701 195 460.</div>
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