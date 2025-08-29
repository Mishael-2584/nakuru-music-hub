-- Create storage bucket for classroom files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'classroom-files',
  'classroom-files',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage.objects are managed by Supabase automatically
-- The bucket creation is sufficient for basic functionality
