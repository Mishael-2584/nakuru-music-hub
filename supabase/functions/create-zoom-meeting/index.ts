// Legacy Zoom-only endpoint — prefer create-video-meeting for automatic Meet fallback.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createZoomMeetingSession, getZoomEmailForPortalUser } from '../_shared/zoomMeeting.ts';

interface CreateZoomMeetingRequest {
  topic: string;
  startTime?: string;
  duration?: number;
  agenda?: string;
  alternativeHostEmails?: string[];
  hostUserId?: string;
}

async function isPortalAdmin(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return profile?.role === 'admin' || profile?.role === 'super_admin';
}

async function resolveHostZoomEmail(
  req: Request,
  hostUserId?: string
): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser(token);
  if (error || !user?.id) {
    return null;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey);
  const targetUserId = hostUserId?.trim() || user.id;

  if (targetUserId !== user.id) {
    const allowed = await isPortalAdmin(admin, user.id);
    if (!allowed) {
      throw new Error('You can only create Zoom meetings under your own account.');
    }
  }

  return getZoomEmailForPortalUser(admin, targetUserId);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: CreateZoomMeetingRequest = await req.json();
    const topic = body.topic?.trim();
    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const duration = Math.min(Math.max(body.duration ?? 60, 15), 480);
    const teacherEmail = await resolveHostZoomEmail(req, body.hostUserId);

    const zoom = await createZoomMeetingSession({
      topic,
      startTime: body.startTime,
      duration,
      agenda: body.agenda,
      alternativeHostEmails: body.alternativeHostEmails,
      teacherEmail,
    });

    return new Response(JSON.stringify(zoom), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-zoom-meeting error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error creating Zoom meeting',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
