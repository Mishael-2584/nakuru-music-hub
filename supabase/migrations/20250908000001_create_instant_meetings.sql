-- Migration: Create instant_meetings table for on-demand video conferencing
-- This enables teachers to create instant meetings and invite students via messages

CREATE TABLE IF NOT EXISTS public.instant_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_url TEXT NOT NULL,
  host_id UUID NOT NULL,
  host_name TEXT NOT NULL,
  host_role TEXT NOT NULL CHECK (host_role IN ('teacher', 'admin')),
  participants UUID[] DEFAULT '{}',
  max_participants INTEGER DEFAULT 10 CHECK (max_participants > 0 AND max_participants <= 20),
  duration INTEGER DEFAULT 60 CHECK (duration > 0), -- minutes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  meeting_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  allow_recording BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER, -- minutes
  participant_join_log JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_instant_meetings_host_id ON public.instant_meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_instant_meetings_status ON public.instant_meetings(status);
CREATE INDEX IF NOT EXISTS idx_instant_meetings_meeting_code ON public.instant_meetings(meeting_code);
CREATE INDEX IF NOT EXISTS idx_instant_meetings_created_at ON public.instant_meetings(created_at);
CREATE INDEX IF NOT EXISTS idx_instant_meetings_participants ON public.instant_meetings USING GIN(participants);

-- Enable RLS
ALTER TABLE public.instant_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instant_meetings
-- Hosts can manage their own meetings
CREATE POLICY "Hosts can manage their own instant meetings" ON public.instant_meetings
  FOR ALL USING (
    host_id = auth.uid()
  );

-- Participants can view meetings they're invited to or public meetings
CREATE POLICY "Participants can view invited or public instant meetings" ON public.instant_meetings
  FOR SELECT USING (
    is_public = true OR
    auth.uid() = ANY(participants) OR
    host_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all instant meetings
CREATE POLICY "Admins can manage all instant meetings" ON public.instant_meetings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Service role can manage all instant meetings (for Edge Functions)
CREATE POLICY "Service role can manage instant meetings" ON public.instant_meetings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instant_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_instant_meetings_updated_at
  BEFORE UPDATE ON public.instant_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_instant_meetings_updated_at();

-- Add meeting_id column to portal_messages for meeting invitations
ALTER TABLE public.portal_messages 
ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES public.instant_meetings(id) ON DELETE CASCADE;

-- Add index for meeting_id in messages
CREATE INDEX IF NOT EXISTS idx_portal_messages_meeting_id ON public.portal_messages(meeting_id);

-- Update message_type check constraint to include meeting invitation
ALTER TABLE public.portal_messages 
DROP CONSTRAINT IF EXISTS portal_messages_message_type_check;

ALTER TABLE public.portal_messages 
ADD CONSTRAINT portal_messages_message_type_check 
CHECK (message_type IN ('general', 'lesson', 'assignment', 'payment', 'emergency', 'meeting_invitation'));

-- Create function to clean up old completed/cancelled instant meetings (optional)
CREATE OR REPLACE FUNCTION cleanup_old_instant_meetings()
RETURNS void AS $$
BEGIN
  -- Delete meetings older than 30 days that are completed or cancelled
  DELETE FROM public.instant_meetings 
  WHERE status IN ('completed', 'cancelled') 
    AND created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON public.instant_meetings TO authenticated;
GRANT ALL ON public.instant_meetings TO service_role;