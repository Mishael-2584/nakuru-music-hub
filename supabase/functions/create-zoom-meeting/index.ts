// Create Zoom meetings via Server-to-Server OAuth.
// Meetings are created under the authenticated user's Zoom account (teacher/admin email),
// not a single hard-coded host — falls back to ZOOM_HOST_EMAIL only when needed.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  /** Portal auth user id to create the meeting as (defaults to caller). */
  hostUserId?: string;
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

async function lookupZoomUserId(accessToken: string, email: string): Promise<string | null> {
  const res = await fetch(
    `https://api.zoom.us/v2/users/${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    console.warn(`Zoom user lookup failed for ${email}:`, await res.text());
    return null;
  }

  const user = await res.json();
  return user.id ?? null;
}

async function resolveDefaultZoomHost(accessToken: string): Promise<{ userId: string; email: string }> {
  const hostUserId = Deno.env.get('ZOOM_HOST_USER_ID');
  const hostEmail = Deno.env.get('ZOOM_HOST_EMAIL');

  if (hostUserId && hostEmail) {
    return { userId: hostUserId, email: hostEmail };
  }

  if (hostUserId) {
    return { userId: hostUserId, email: hostEmail || '' };
  }

  if (!hostEmail) {
    throw new Error('Set ZOOM_HOST_USER_ID or ZOOM_HOST_EMAIL in Supabase secrets as fallback host.');
  }

  const userId = await lookupZoomUserId(accessToken, hostEmail);
  if (!userId) {
    throw new Error(`Could not resolve default Zoom host user for ${hostEmail}`);
  }

  return { userId, email: hostEmail };
}

/**
 * Single Pro license model (default): all meetings are created under ZOOM_HOST_EMAIL.
 * The portal teacher is added as an alternative host so they can start/run the class.
 * Teachers must exist as Basic (free) users on the same Zoom account.
 */
async function resolveMeetingHost(
  accessToken: string,
  teacherEmail?: string | null
): Promise<{
  userId: string;
  licensedHostEmail: string;
  alternativeHostEmail?: string;
  singleLicenseMode: boolean;
}> {
  const singleLicenseMode = Deno.env.get('ZOOM_SINGLE_LICENSE_MODE') !== 'false';
  const teacher = teacherEmail?.trim() || undefined;
  const licensed = await resolveDefaultZoomHost(accessToken);

  if (!singleLicenseMode && teacher) {
    const teacherUserId = await lookupZoomUserId(accessToken, teacher);
    if (teacherUserId) {
      return {
        userId: teacherUserId,
        licensedHostEmail: teacher,
        singleLicenseMode: false,
      };
    }
    console.warn(`Licensed Zoom user not found for ${teacher}, using academy host.`);
  }

  const alternativeHostEmail =
    teacher && teacher.toLowerCase() !== licensed.email.toLowerCase() ? teacher : undefined;

  return {
    userId: licensed.userId,
    licensedHostEmail: licensed.email,
    alternativeHostEmail,
    singleLicenseMode: true,
  };
}

async function getZoomEmailForPortalUser(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data: teacher } = await admin
    .from('teachers')
    .select('email, zoom_email')
    .eq('user_id', userId)
    .maybeSingle();

  if (teacher) {
    const email = (teacher.zoom_email || teacher.email)?.trim();
    if (email) return email;
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.email?.trim()) {
    return profile.email.trim();
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  return authUser?.user?.email?.trim() || null;
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

/** Resolve Zoom host email from JWT caller and optional hostUserId override. */
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
    console.warn('Missing Supabase env vars for caller resolution');
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user?.id) {
    console.warn('Could not resolve auth user for Zoom host:', error?.message);
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
    const accessToken = await getZoomAccessToken();

    const teacherEmail = await resolveHostZoomEmail(req, body.hostUserId);
    const host = await resolveMeetingHost(accessToken, teacherEmail);

    const hasStartTime = !!body.startTime;
    const startDate = hasStartTime ? new Date(body.startTime!) : new Date();

    const alternativeHostSet = new Set(
      (body.alternativeHostEmails ?? []).map((e) => e.trim()).filter(Boolean)
    );

    if (host.alternativeHostEmail) {
      alternativeHostSet.add(host.alternativeHostEmail);
    }

    const alternativeHosts = Array.from(alternativeHostSet).slice(0, 10).join(';');

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

    console.log('Creating Zoom meeting', {
      topic,
      licensedHostEmail: host.licensedHostEmail,
      alternativeHostEmail: host.alternativeHostEmail,
      singleLicenseMode: host.singleLicenseMode,
      teacherEmail,
    });

    const createRes = await fetch(
      `https://api.zoom.us/v2/users/${host.userId}/meetings`,
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
        hostEmail: meeting.host_email || host.licensedHostEmail,
        alternativeHostEmail: host.alternativeHostEmail || null,
        singleLicenseMode: host.singleLicenseMode,
        teacherEmail: teacherEmail || null,
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
