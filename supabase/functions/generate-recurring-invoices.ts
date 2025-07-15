// Supabase Edge Function: generate-recurring-invoices
import { serve } from 'std/server';
import { generateRecurringInvoices } from '../../src/lib/invoiceUtils';

serve(async (req) => {
  try {
    await generateRecurringInvoices();
    return new Response('Recurring invoices generated successfully', { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}); 