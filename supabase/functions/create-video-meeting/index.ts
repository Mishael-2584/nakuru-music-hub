// Creates Zoom or Google Meet based on academy Zoom concurrent capacity.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildTimeWindow,
  countOverlappingZoomMeetings,
  shouldUseGoogleMeetFallback,
} from '../_shared/meetingOverlap.ts';
import { createGoogleMeetEvent, isGoogleMeetConfigured } from '../_shared/googleMeet.ts';
import { createZoomMeetingSession, getZoomEmailForPortalUser } from '../_shared/zoomMeeting.ts';

interface CreateVideoMeetingRequest {
  topic: string;
  startTime?: string;
  duration?: number;
  agenda?: string;
  alternativeHostEmails?: string[];
  hostUserId?: string;
  /** Force a provider (admin override). */
  forceProvider?: 'zoom' | 'google_meet';
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

async function resolveTeacherEmail(
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
      throw new Error('You can only create meetings under your own account.');
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
    const body: CreateVideoMeetingRequest = await req.json();
    const topic = body.topic?.trim();
    if (!topic) {
      return new Response(JSON.stringify({ error: 'topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const duration = Math.min(Math.max(body.duration ?? 60, 15), 480);
    const startIso = body.startTime || new Date().toISOString();
    const window = buildTimeWindow(startIso, duration);
    const endIso = new Date(window.endMs).toISOString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase service configuration');
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const teacherEmail = await resolveTeacherEmail(req, body.hostUserId);

    const maxConcurrentZoom = Math.max(
      1,
      Number.parseInt(Deno.env.get('ZOOM_MAX_CONCURRENT') || '1', 10) || 1
    );

    const overlappingZoom = await countOverlappingZoomMeetings(admin, window);
    const meetFallbackEnabled = Deno.env.get('GOOGLE_MEET_FALLBACK') !== 'false';

    let useGoogleMeet = false;
    let providerNote: string | null = null;

    if (body.forceProvider === 'google_meet') {
      useGoogleMeet = true;
      providerNote = 'Google Meet selected for this class.';
    } else if (body.forceProvider === 'zoom') {
      useGoogleMeet = false;
    } else if (
      meetFallbackEnabled &&
      shouldUseGoogleMeetFallback(overlappingZoom, maxConcurrentZoom)
    ) {
      useGoogleMeet = true;
      providerNote =
        overlappingZoom === 1
          ? 'Another class is using the academy Zoom license at this time. Google Meet was used automatically.'
          : `${overlappingZoom} other class(es) overlap this time slot. Google Meet was used automatically.`;
    }

    if (useGoogleMeet) {
      if (!isGoogleMeetConfigured()) {
        return new Response(
          JSON.stringify({
            error:
              'Academy Zoom is already in use for another class at this time. Configure Google Meet fallback (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) or schedule at a different time.',
            overlappingZoomCount: overlappingZoom,
            maxConcurrentZoom,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const meet = await createGoogleMeetEvent({
        topic,
        startTimeIso: startIso,
        endTimeIso: endIso,
        teacherEmail,
        agenda: body.agenda || topic,
      });

      return new Response(
        JSON.stringify({
          provider: 'google_meet',
          joinUrl: meet.joinUrl,
          startUrl: meet.joinUrl,
          meetingId: meet.calendarEventId,
          password: null,
          hostEmail: meet.hostEmail,
          googleCalendarEventId: meet.calendarEventId,
          alternativeHostEmail: null,
          alternativeHostWarning: null,
          singleLicenseMode: true,
          teacherEmail,
          providerNote,
          overlappingZoomCount: overlappingZoom,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const zoom = await createZoomMeetingSession({
      topic,
      startTime: body.startTime,
      duration,
      agenda: body.agenda,
      alternativeHostEmails: body.alternativeHostEmails,
      teacherEmail,
    });

    return new Response(
      JSON.stringify({
        ...zoom,
        providerNote: providerNote ?? 'Academy Zoom license.',
        overlappingZoomCount: overlappingZoom,
        googleCalendarEventId: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('create-video-meeting error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error creating video meeting',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
