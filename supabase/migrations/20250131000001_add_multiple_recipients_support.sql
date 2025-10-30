-- Add support for multiple recipients in portal messages
-- This migration enhances the existing portal_messages system to support multiple recipients
-- by creating a lightweight junction table that works alongside the existing structure

-- 1. Create message_recipients junction table (minimal, only for tracking multiple recipients)
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.portal_messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, recipient_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_is_read ON public.message_recipients(is_read);

-- 3. Enable RLS on message_recipients table
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for message_recipients
-- Users can view recipients for messages they sent or received
CREATE POLICY "Users can view message recipients" ON public.message_recipients
  FOR SELECT USING (
    recipient_id = auth.uid() OR
    message_id IN (SELECT id FROM public.portal_messages WHERE sender_id = auth.uid())
  );

-- Users can insert recipients when sending messages
CREATE POLICY "Users can add message recipients" ON public.message_recipients
  FOR INSERT WITH CHECK (
    message_id IN (SELECT id FROM public.portal_messages WHERE sender_id = auth.uid())
  );

-- Users can update their own read status
CREATE POLICY "Users can update own read status" ON public.message_recipients
  FOR UPDATE USING (recipient_id = auth.uid());

-- Admins can manage all message recipients
CREATE POLICY "Admins can manage all message recipients" ON public.message_recipients
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

-- 5. Create function to automatically update read_at timestamp
CREATE OR REPLACE FUNCTION update_message_recipient_read_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Create trigger to update read_at timestamp
CREATE TRIGGER trigger_update_message_recipient_read_at
  BEFORE UPDATE ON public.message_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_message_recipient_read_at();

-- 7. Migrate existing messages to use the new junction table
-- This preserves all existing single-recipient messages
INSERT INTO public.message_recipients (message_id, recipient_id, is_read, created_at)
SELECT 
  id as message_id,
  recipient_id,
  is_read,
  created_at
FROM public.portal_messages
WHERE recipient_id IS NOT NULL
ON CONFLICT (message_id, recipient_id) DO NOTHING;

-- 8. Create a helper view to easily query messages with all their recipients
CREATE OR REPLACE VIEW portal_messages_with_recipients AS
SELECT 
  pm.id as message_id,
  pm.sender_id,
  pm.subject,
  pm.message,
  pm.message_type,
  pm.created_at as sent_at,
  array_agg(DISTINCT mr.recipient_id) as recipient_ids,
  array_agg(DISTINCT mr.is_read) as read_statuses,
  COUNT(DISTINCT mr.recipient_id) as recipient_count,
  COUNT(DISTINCT CASE WHEN mr.is_read = true THEN mr.recipient_id END) as read_count
FROM public.portal_messages pm
LEFT JOIN public.message_recipients mr ON pm.id = mr.message_id
GROUP BY pm.id, pm.sender_id, pm.subject, pm.message, pm.message_type, pm.created_at;

-- 9. Add helpful comments
COMMENT ON TABLE public.message_recipients IS 'Junction table to support multiple recipients per message. Works alongside portal_messages table. Each row represents one recipient for a message.';
COMMENT ON VIEW portal_messages_with_recipients IS 'Helper view that shows messages with aggregated recipient information for easy querying.';

-- Note: The existing portal_messages table structure remains unchanged for backward compatibility.
-- The recipient_id field in portal_messages is still used and represents the primary/first recipient.
-- Additional recipients are tracked in the message_recipients junction table.
