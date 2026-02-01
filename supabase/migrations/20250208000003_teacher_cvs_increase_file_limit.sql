-- Increase teacher-cvs bucket file size limit (was 10 MB; CVs/PDFs can be larger)
-- 50 MB = 52428800 bytes
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'teacher-cvs';
