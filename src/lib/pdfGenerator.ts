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

export const generateQuotePDF = async (quoteData: QuoteData, quoteAmount: number, adminNotes?: string): Promise<Blob> => {
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
    <div style="max-width: 720px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <img src="/damon-logo.png" alt="Damon Music Academy Logo" style="width: 80px; height: 80px; object-fit: contain; margin-right: 20px;" />
          <div>
            <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: bold;">Damon Music Academy</h1>
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Professional Music & Media Services</p>
          </div>
        </div>
        <h2 style="color: #333; margin: 0; font-size: 24px;">Official Quote</h2>
        <p style="color: #666; margin: 10px 0; font-size: 14px;">Date: ${currentDate}</p>
      </div>

      <!-- Client Information -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Client Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0; color: #333;"><strong>Name:</strong> ${quoteData.name}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${quoteData.email}</p>
            ${quoteData.phone ? `<p style="margin: 5px 0; color: #333;"><strong>Phone:</strong> ${quoteData.phone}</p>` : ''}
          </div>
          <div>
            <p style="margin: 5px 0; color: #333;"><strong>Preferred Contact:</strong> ${quoteData.preferred_contact_method}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Quote Date:</strong> ${currentDate}</p>
          </div>
        </div>
      </div>

      <!-- Project Details -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Project Details</h3>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <p style="margin: 5px 0; color: #333;"><strong>Service:</strong> ${quoteData.service_category}</p>
          ${quoteData.project_type ? `<p style="margin: 5px 0; color: #333;"><strong>Project Type:</strong> ${quoteData.project_type}</p>` : ''}
          ${quoteData.event_date ? `<p style="margin: 5px 0; color: #333;"><strong>Event Date:</strong> ${quoteData.event_date}</p>` : ''}
          ${quoteData.location ? `<p style="margin: 5px 0; color: #333;"><strong>Location:</strong> ${quoteData.location}</p>` : ''}
          ${quoteData.budget_range ? `<p style="margin: 5px 0; color: #333;"><strong>Budget Range:</strong> ${quoteData.budget_range}</p>` : ''}
          ${quoteData.timeline ? `<p style="margin: 5px 0; color: #333;"><strong>Timeline:</strong> ${quoteData.timeline}</p>` : ''}
        </div>
      </div>

      <!-- Quote Amount -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Quote Amount</h3>
        <div style="background-color: #f0f9ff; padding: 25px; border-radius: 8px; border: 2px solid #2563eb; text-align: center;">
          <p style="font-size: 32px; font-weight: bold; color: #2563eb; margin: 0;">
            KES ${quoteAmount.toLocaleString()}
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Total Quote Amount</p>
        </div>
      </div>

      ${adminNotes ? `
        <!-- Additional Notes -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Additional Notes</h3>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p style="color: #333; margin: 0; line-height: 1.6;">${adminNotes}</p>
          </div>
        </div>
      ` : ''}

      <!-- Terms and Conditions -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Terms & Conditions</h3>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <ul style="color: #333; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>This quote is valid for 30 days from the date of issue</li>
            <li>Payment terms: 50% deposit required to confirm booking</li>
            <li>Final payment due before service delivery</li>
            <li>Cancellation policy: 48 hours notice required for full refund</li>
            <li>All services subject to availability and weather conditions</li>
          </ul>
        </div>
      </div>

      <!-- Contact Information -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #2563eb; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Contact Information</h3>
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 5px 0; color: #333;"><strong>Email:</strong> admin@damonmusicacademy.co.ke</p>
              <p style="margin: 5px 0; color: #333;"><strong>Phone:</strong> +254 701 195 460</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #333;"><strong>Location:</strong> Nakuru, Kenya</p>
              <p style="margin: 5px 0; color: #333;"><strong>Website:</strong> damonmusicacademy.co.ke</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; margin: 5px 0; font-size: 14px;">Thank you for choosing Damon Music Academy</p>
        <p style="color: #666; margin: 5px 0; font-size: 12px;">© 2025 Damon Music Academy. All rights reserved.</p>
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