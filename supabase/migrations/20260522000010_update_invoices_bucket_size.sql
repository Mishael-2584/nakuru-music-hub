-- Raise invoice PDF size limit (compressed PDFs are ~200KB–2MB; old PNG-based files could be very large)
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'invoices';
