import type { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AdminClient = ReturnType<typeof createClient>;

export interface CreateZoomMeetingParams {
  topic: string;
  startTime?: string;
  duration: number;
  agenda?: string;
  alternativeHostEmails?: string[];
  teacherEmail?: string | null;
}

export interface ZoomMeetingCreateResult {
  provider: 'zoom';
  joinUrl: string;
  startUrl: string;
  meetingId: string;
  password: string | null;
  hostEmail: string;
  alternativeHostEmail: string | null;
  alternativeHostWarning: string | null;
  singleLicenseMode: boolean;
  teacherEmail: string | null;
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

function isAlternativeHostError(errText: string): boolean {
  try {
    const parsed = JSON.parse(errText);
    if (parsed.code === 1115) return true;
    return /alternative host/i.test(String(parsed.message ?? ''));
  } catch {
    return /alternative host|"code"\s*:\s*1115/i.test(errText);
  }
}

async function resolveVerifiedAlternativeHosts(
  accessToken: string,
  candidates: string[],
  licensedHostEmail: string
): Promise<string[]> {
  const licensedLower = licensedHostEmail.toLowerCase();
  const seen = new Set<string>();
  const verified: string[] = [];

  for (const raw of candidates) {
    const email = raw.trim();
    if (!email) continue;
    const lower = email.toLowerCase();
    if (lower === licensedLower || seen.has(lower)) continue;
    seen.add(lower);

    const userId = await lookupZoomUserId(accessToken, email);
    if (userId) {
      verified.push(email);
    }
  }

  return verified.slice(0, 10);
}

async function postZoomMeeting(
  accessToken: string,
  hostUserId: string,
  meetingPayload: Record<string, unknown>,
  alternativeHostEmails: string[]
): Promise<Response> {
  const settings = {
    ...(meetingPayload.settings as Record<string, unknown>),
  };
  const hosts = alternativeHostEmails.filter(Boolean);
  if (hosts.length > 0) {
    settings.alternative_hosts = hosts.join(';');
  } else {
    delete settings.alternative_hosts;
  }

  return fetch(`https://api.zoom.us/v2/users/${hostUserId}/meetings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...meetingPayload, settings }),
  });
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

export async function getZoomEmailForPortalUser(
  admin: AdminClient,
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

export async function createZoomMeetingSession(
  params: CreateZoomMeetingParams
): Promise<ZoomMeetingCreateResult> {
  const accessToken = await getZoomAccessToken();
  const host = await resolveMeetingHost(accessToken, params.teacherEmail);
  const hasStartTime = !!params.startTime;
  const startDate = hasStartTime ? new Date(params.startTime!) : new Date();

  const alternativeCandidates = [
    ...(params.alternativeHostEmails ?? []),
    ...(host.alternativeHostEmail ? [host.alternativeHostEmail] : []),
  ];

  const verifiedAlternativeHosts = await resolveVerifiedAlternativeHosts(
    accessToken,
    alternativeCandidates,
    host.licensedHostEmail
  );

  const meetingPayload: Record<string, unknown> = {
    topic: params.topic,
    type: hasStartTime ? 2 : 1,
    duration: params.duration,
    timezone: 'Africa/Nairobi',
    agenda: params.agenda?.trim() || params.topic,
    settings: {
      waiting_room: false,
      join_before_host: true,
      jbh_time: 0,
      mute_upon_entry: true,
      host_video: true,
      participant_video: true,
      audio: 'both',
      auto_recording: 'none',
      approval_type: 0,
      meeting_authentication: false,
    },
  };

  if (hasStartTime) {
    meetingPayload.start_time = startDate.toISOString();
  }

  let alternativeHostWarning: string | null = null;
  let createRes = await postZoomMeeting(
    accessToken,
    host.userId,
    meetingPayload,
    verifiedAlternativeHosts
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    if (verifiedAlternativeHosts.length > 0 && isAlternativeHostError(errText)) {
      alternativeHostWarning =
        'Meeting created on academy Zoom. Join using the meeting link — teachers on Basic Zoom seats cannot be assigned as alternative hosts.';
      createRes = await postZoomMeeting(accessToken, host.userId, meetingPayload, []);
    } else {
      throw new Error(`Failed to create Zoom meeting: ${errText}`);
    }
  }

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Zoom meeting: ${errText}`);
  }

  const meeting = await createRes.json();
  const assignedAlternativeHost =
    alternativeHostWarning == null && verifiedAlternativeHosts.length > 0
      ? host.alternativeHostEmail || verifiedAlternativeHosts[0]
      : null;

  return {
    provider: 'zoom',
    joinUrl: meeting.join_url,
    startUrl: meeting.start_url,
    meetingId: String(meeting.id),
    password: meeting.password || null,
    hostEmail: meeting.host_email || host.licensedHostEmail,
    alternativeHostEmail: assignedAlternativeHost,
    alternativeHostWarning,
    singleLicenseMode: host.singleLicenseMode,
    teacherEmail: params.teacherEmail || null,
  };
}
