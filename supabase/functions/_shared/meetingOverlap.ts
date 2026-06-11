import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface TimeWindow {
  startMs: number;
  endMs: number;
}

export function buildTimeWindow(startIso: string, durationMinutes: number): TimeWindow {
  const startMs = new Date(startIso).getTime();
  return {
    startMs,
    endMs: startMs + durationMinutes * 60_000,
  };
}

export function windowsOverlap(a: TimeWindow, b: TimeWindow): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

function isZoomProvider(provider: string | null | undefined): boolean {
  return !provider || provider === 'zoom';
}

function instantMeetingWindow(row: {
  status: string;
  scheduled_start_time: string | null;
  started_at: string | null;
  created_at: string;
  duration: number | null;
  meeting_provider?: string | null;
}): TimeWindow | null {
  if (!isZoomProvider(row.meeting_provider)) return null;
  if (row.status === 'completed' || row.status === 'cancelled') return null;

  const duration = row.duration ?? 60;
  let startIso: string | null = null;

  if (row.scheduled_start_time) {
    startIso = row.scheduled_start_time;
  } else if (row.started_at) {
    startIso = row.started_at;
  } else if (row.status === 'pending' || row.status === 'active' || row.status === 'scheduled') {
    startIso = row.created_at;
  }

  if (!startIso) return null;
  return buildTimeWindow(startIso, duration);
}

function meetingRoomWindow(row: {
  status: string;
  start_time: string;
  end_time: string;
  meeting_provider?: string | null;
}): TimeWindow | null {
  if (!isZoomProvider(row.meeting_provider)) return null;
  if (row.status === 'completed' || row.status === 'cancelled') return null;

  return {
    startMs: new Date(row.start_time).getTime(),
    endMs: new Date(row.end_time).getTime(),
  };
}

/**
 * Count Zoom meetings that overlap the requested window.
 * Google Meet sessions are excluded — they do not consume the Zoom license.
 */
export async function countOverlappingZoomMeetings(
  admin: SupabaseClient,
  window: TimeWindow,
  excludeInstantMeetingId?: string,
  excludeMeetingRoomId?: string
): Promise<number> {
  const [{ data: instantRows }, { data: roomRows }] = await Promise.all([
    admin
      .from('instant_meetings')
      .select(
        'id, status, scheduled_start_time, started_at, created_at, duration, meeting_provider'
      )
      .in('status', ['scheduled', 'pending', 'active']),
    admin
      .from('meeting_rooms')
      .select('id, status, start_time, end_time, meeting_provider')
      .in('status', ['scheduled', 'active']),
  ]);

  let count = 0;

  for (const row of instantRows ?? []) {
    if (excludeInstantMeetingId && row.id === excludeInstantMeetingId) continue;
    const existing = instantMeetingWindow(row);
    if (existing && windowsOverlap(window, existing)) {
      count += 1;
    }
  }

  for (const row of roomRows ?? []) {
    if (excludeMeetingRoomId && row.id === excludeMeetingRoomId) continue;
    const existing = meetingRoomWindow(row);
    if (existing && windowsOverlap(window, existing)) {
      count += 1;
    }
  }

  return count;
}

export function shouldUseGoogleMeetFallback(
  overlappingZoomCount: number,
  maxConcurrentZoom: number
): boolean {
  return overlappingZoomCount >= maxConcurrentZoom;
}
