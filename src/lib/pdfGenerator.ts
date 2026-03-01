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
  reference_materials_url?: string | null;
}

// Label lookups for quote form value keys (match QuoteForm.tsx)
const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Under KES 10,000',
  '10k-25k': 'KES 10,000 - 25,000',
  '25k-50k': 'KES 25,000 - 50,000',
  '50k-100k': 'KES 50,000 - 100,000',
  '100k-250k': 'KES 100,000 - 250,000',
  'over-250k': 'Over KES 250,000'
};
const TIMELINE_LABELS: Record<string, string> = {
  'asap': 'ASAP (Within 1 week)',
  '1-2-weeks': '1-2 weeks',
  '1-month': '1 month',
  '2-3-months': '2-3 months',
  '3-6-months': '3-6 months',
  'flexible': 'Flexible timeline'
};
const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  'live-sound-lighting': 'Live Sound & Lighting',
  'livestreaming': 'Livestreaming Services',
  'event-coverage': 'Event Coverage',
  'photography': 'Photography Services',
  'songwriting': 'Songwriting',
  'studio-recording': 'Studio Recording & Production',
  'audio-mixing': 'Audio Mixing & Mastering',
  'voice-over': 'Voice-over Production',
  'podcast': 'Podcast Production',
  'live-feed': 'Live Feed Services',
  'stage-lighting': 'Stage Lighting Setup',
  'led-screen': 'LED Screen Rental',
  'rehearsal-space': 'Rehearsal Space Rental',
  'music-production': 'Music Production for Artists',
  'dj-mc': 'DJ & MC Services',
  'music-arrangement': 'Music Arrangement & Transcription',
  'music-composition': 'Music Composition Services',
  'session-musicians': 'Session & Event Musicians'
};

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
  // Debug: log invoiceMeta and dueDate at PDF generation
  console.log('PDF GENERATOR: invoiceMeta =', invoiceMeta);
  console.log('PDF GENERATOR: invoiceMeta.dueDate =', invoiceMeta?.dueDate);
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

  let invoiceOrQuoteDate = currentDate;

  // Quote/Project details for PDF (label mapping and formatted event date) — compute early for quote-only
  const formatEventDate = (d: string | null | undefined) => {
    if (!d) return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return d;
  };
  const budgetLabel = quoteData?.budget_range ? (BUDGET_LABELS[quoteData.budget_range] || quoteData.budget_range) : '-';
  const timelineLabel = quoteData?.timeline ? (TIMELINE_LABELS[quoteData.timeline] || quoteData.timeline) : '-';
  const serviceLabel = quoteData?.service_category ? (SERVICE_CATEGORY_LABELS[quoteData.service_category] || quoteData.service_category) : '';

  // Determine course/instrument: from invoice line items, or quote-only use human-readable service label
  let courseOrInstrument = '';
  if (invoiceDetails && invoiceDetails.lineItems && invoiceDetails.lineItems.length > 0) {
    const firstItem = invoiceDetails.lineItems[0];
    courseOrInstrument = firstItem.description.includes(' - ') ? firstItem.description.split(' - ')[0] : firstItem.description;
  } else {
    courseOrInstrument = serviceLabel || (quoteData?.service_category ?? '');
  }

  // Safe line items and totals: quote-only gets one synthetic line; never call .map/.toLocaleString on undefined
  const isQuoteOnly = !invoiceDetails && !invoiceMeta;
  const lineItemsForTable: InvoiceLineItem[] = invoiceDetails?.lineItems?.length
    ? invoiceDetails.lineItems
    : [{ description: quoteData?.project_type ? `${serviceLabel || 'Quote'} – ${quoteData.project_type}` : (serviceLabel || 'Quote'), quantity: 1, unitPrice: quoteAmount, amount: quoteAmount }];
  const subtotalVal = invoiceDetails?.subtotal ?? quoteAmount;
  const totalVal = invoiceDetails?.total ?? quoteAmount;

  const quoteDetailsHtml = quoteData ? `
    <div style="margin: 12px 32px 0 32px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155;">
      <div style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">Quote / Project details</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px;">
        <div><strong>Service:</strong> ${serviceLabel}</div>
        <div><strong>Project type:</strong> ${quoteData.project_type || '-'}</div>
        <div><strong>Event date:</strong> ${formatEventDate(quoteData.event_date)}</div>
        <div><strong>Location:</strong> ${quoteData.location || '-'}</div>
        <div><strong>Budget range:</strong> ${budgetLabel}</div>
        <div><strong>Timeline:</strong> ${timelineLabel}</div>
        <div><strong>Preferred contact:</strong> ${quoteData.preferred_contact_method || '-'}</div>
        ${quoteData.reference_materials_url ? `<div><strong>Reference:</strong> ${quoteData.reference_materials_url}</div>` : ''}
      </div>
      ${quoteData.specific_requirements ? `<div style="margin-top: 8px;"><strong>Specific requirements:</strong> ${quoteData.specific_requirements}</div>` : ''}
      ${quoteData.additional_notes ? `<div style="margin-top: 4px;"><strong>Additional notes:</strong> ${quoteData.additional_notes}</div>` : ''}
    </div>
  ` : '';

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
        <div style="font-size: 28px; font-weight: bold; color: #1e40af; letter-spacing: 2px; margin-bottom: 2px;">${isQuoteOnly ? 'QUOTE' : 'INVOICE'}</div>
        <div style="font-size: 15px; color: #64748b;">${isQuoteOnly ? 'Reference:' : 'Receipt:'} <b>${isQuoteOnly ? 'Quote' : (invoiceMeta?.invoiceNumber || '-')}</b></div>
        <div style="font-size: 13px; color: #64748b;">Date: ${invoiceOrQuoteDate}</div>
        <div style="font-size: 13px; color: #1e293b; margin-top: 4px;">Course/Instrument: <b>${courseOrInstrument || '-'}</b></div>
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
        <div>${quoteData?.name ?? '-'}</div>
        <div>${quoteData?.email ?? '-'}</div>
        <div>${quoteData?.phone || '-'}</div>
      </div>
    </div>
    ${isQuoteOnly ? quoteDetailsHtml : ''}

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
          ${lineItemsForTable.map(item => `
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
            <tr>
              <td style="padding: 8px 4px; text-align: right; font-weight: 600; color: #1e293b;">Subtotal:</td>
              <td style="padding: 8px 4px; text-align: right; font-weight: 600; color: #1e293b;">KES ${subtotalVal.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 4px; text-align: right; font-weight: 700; color: #1e40af; font-size: 15px;">Total:</td>
              <td style="padding: 8px 4px; text-align: right; font-weight: 700; color: #1e40af; font-size: 15px;">KES ${totalVal.toLocaleString()}</td>
            </tr>
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
    ${invoiceMeta ? `
    <div style="margin: 12px 32px 0 32px; background: #fef2f2; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #ef4444; font-size: 12px; color: #dc2626;">
      <strong>Please note:</strong> Monthly fees are payable upfront at the beginning of the month. Late payments may affect lesson scheduling. Thank you for your cooperation.
    </div>
    ` : ''}

    <!-- Footer / Notes -->
    ${adminNotes ? `
      <div style="margin: 18px 32px 0 32px; background: #fef3c7; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 12px;">
        <b>Admin Notes:</b> ${adminNotes}
      </div>
    ` : ''}
    ${invoiceMeta && invoiceMeta.invoiceNumber && invoiceMeta.invoiceNumber !== 'first' ? `
      <div style="margin: 18px 32px 0 32px; background: #fef3c7; padding: 10px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 12px; color: #92400e;">
        <b>⚠️ Automated Invoice:</b> This is an automated invoice kindly ignore if already paid.
      </div>
    ` : ''}
    <div style="margin: 18px 32px 0 32px; font-size: 11px; color: #64748b;">
      <div style="margin-bottom: 4px;"><strong>Please note:</strong> Monthly fees are payable upfront at the beginning of the month. Late payments may affect lesson scheduling. Thank you for your cooperation.</div>
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