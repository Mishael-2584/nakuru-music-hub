let cachedGoogleToken: { accessToken: string; expiresAt: number } | null = null;

export function isGoogleMeetConfigured(): boolean {
  return Boolean(
    Deno.env.get('GOOGLE_CLIENT_ID') &&
      Deno.env.get('GOOGLE_CLIENT_SECRET') &&
      Deno.env.get('GOOGLE_REFRESH_TOKEN')
  );
}

async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > now + 60_000) {
    return cachedGoogleToken.accessToken;
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Meet fallback is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in Supabase secrets.'
    );
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Google token error:', errText);
    throw new Error(`Failed to obtain Google access token: ${tokenRes.status}`);
  }

  const tokenData = await tokenRes.json();
  cachedGoogleToken = {
    accessToken: tokenData.access_token,
    expiresAt: now + (tokenData.expires_in ?? 3600) * 1000,
  };
  return cachedGoogleToken.accessToken;
}

export interface GoogleMeetResult {
  joinUrl: string;
  calendarEventId: string;
  hostEmail: string | null;
}

export async function createGoogleMeetEvent(params: {
  topic: string;
  startTimeIso: string;
  endTimeIso: string;
  teacherEmail?: string | null;
  agenda?: string;
}): Promise<GoogleMeetResult> {
  const accessToken = await getGoogleAccessToken();
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary';
  const hostEmail = Deno.env.get('GOOGLE_HOST_EMAIL') || null;
  const requestId = crypto.randomUUID();

  const attendees: { email: string }[] = [];
  if (params.teacherEmail?.trim()) {
    attendees.push({ email: params.teacherEmail.trim() });
  }

  const event = {
    summary: params.topic,
    description: params.agenda?.trim() || 'Damon Music Academy online class',
    start: { dateTime: params.startTimeIso, timeZone: 'Africa/Nairobi' },
    end: { dateTime: params.endTimeIso, timeZone: 'Africa/Nairobi' },
    attendees,
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const createRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Google Calendar create event error:', errText);
    throw new Error(`Failed to create Google Meet: ${errText}`);
  }

  const data = await createRes.json();
  const entryPoints = data.conferenceData?.entryPoints as
    | { entryPointType?: string; uri?: string }[]
    | undefined;
  const meetUrl =
    data.hangoutLink ||
    entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
    entryPoints?.[0]?.uri;

  if (!meetUrl) {
    throw new Error('Google Calendar event created but no Meet link was returned');
  }

  return {
    joinUrl: meetUrl,
    calendarEventId: data.id as string,
    hostEmail,
  };
}
