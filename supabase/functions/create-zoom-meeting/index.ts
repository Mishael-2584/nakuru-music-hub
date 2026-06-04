// Create Zoom meetings via Server-to-Server OAuth (secrets in Supabase)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateZoomMeetingRequest {
  topic: string;
  startTime?: string;
  duration?: number;
  agenda?: string;
  alternativeHostEmails?: string[];
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getZoomAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      'Missing Zoom credentials. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in Supabase secrets.'
    );
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const tokenRes = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Zoom token error:', errText);
    throw new Error(`Failed to obtain Zoom access token: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  cachedToken = {
    accessToken: tokenData.access_token,
    expiresAt: now + (tokenData.expires_in ?? 3600) * 1000,
  };
  return cachedToken.accessToken;
}

async function resolveZoomHostUserId(accessToken: string): Promise<string> {
  const hostUserId = Deno.env.get('ZOOM_HOST_USER_ID');
  if (hostUserId) return hostUserId;

  const hostEmail = Deno.env.get('ZOOM_HOST_EMAIL');
  if (!hostEmail) {
    throw new Error('Set ZOOM_HOST_USER_ID or ZOOM_HOST_EMAIL in Supabase secrets.');
  }

  const res = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Zoom user lookup error:', errText);
    throw new Error(`Could not resolve Zoom host user for ${hostEmail}`);
  }

  const user = await res.json();
  return user.id;
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
    const accessToken = await getZoomAccessToken();
    const hostUserId = await resolveZoomHostUserId(accessToken);

    const hasStartTime = !!body.startTime;
    const startDate = hasStartTime ? new Date(body.startTime!) : new Date();

    const alternativeHosts = (body.alternativeHostEmails ?? [])
      .map((e) => e.trim())
      .filter(Boolean)
      .slice(0, 10)
      .join(';');

    const meetingPayload: Record<string, unknown> = {
      topic,
      type: hasStartTime ? 2 : 1,
      duration,
      timezone: 'Africa/Nairobi',
      agenda: body.agenda?.trim() || topic,
      settings: {
        waiting_room: true,
        join_before_host: true,
        jbh_time: 0,
        mute_upon_entry: true,
        host_video: true,
        participant_video: true,
        audio: 'both',
        auto_recording: 'none',
        approval_type: 0,
        meeting_authentication: false,
        ...(alternativeHosts ? { alternative_hosts: alternativeHosts } : {}),
      },
    };

    if (hasStartTime) {
      meetingPayload.start_time = startDate.toISOString();
    }

    const createRes = await fetch(
      `https://api.zoom.us/v2/users/${hostUserId}/meetings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingPayload),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Zoom create meeting error:', errText);
      return new Response(
        JSON.stringify({ error: 'Failed to create Zoom meeting', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const meeting = await createRes.json();

    return new Response(
      JSON.stringify({
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        meetingId: String(meeting.id),
        password: meeting.password || null,
        hostEmail: meeting.host_email || null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
