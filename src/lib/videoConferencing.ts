// Video Conferencing Service for Damon Music Academy
// Zoom (primary) + Google Meet fallback when the academy Zoom license is in use

export type MeetingProvider = 'zoom' | 'google_meet';

export interface MeetingRoom {
  id: string;
  roomName: string;
  meetingUrl: string;
  meetingHostUrl?: string;
  zoomMeetingId?: string;
  zoomHostEmail?: string;
  alternativeHostEmail?: string;
  meetingProvider?: MeetingProvider;
  googleCalendarEventId?: string;
  providerNote?: string;
  teacherId: string;
  studentId?: string;
  bookingId?: string;
  lessonType: 'lesson' | 'practice' | 'consultation';
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstantMeeting {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  meetingHostUrl?: string;
  zoomMeetingId?: string;
  hostId: string;
  hostName: string;
  hostRole: 'teacher' | 'admin';
  participants: string[];
  maxParticipants: number;
  duration: number;
  status: 'scheduled' | 'pending' | 'active' | 'completed' | 'cancelled';
  meetingCode: string;
  isPublic: boolean;
  allowRecording: boolean;
  scheduledStartTime?: string;
  startedAt?: string;
  endedAt?: string;
  actualDuration?: number;
  participantJoinLog: MeetingParticipantLog[];
  zoomHostEmail?: string;
  alternativeHostEmail?: string;
  alternativeHostWarning?: string | null;
  meetingProvider?: MeetingProvider;
  googleCalendarEventId?: string;
  providerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoMeetingResult {
  provider: MeetingProvider;
  zoomHostEmail?: string | null;
  alternativeHostEmail?: string | null;
  alternativeHostWarning?: string | null;
  providerNote?: string | null;
  singleLicenseMode?: boolean;
  teacherEmail?: string | null;
  joinUrl: string;
  startUrl: string;
  meetingId: string;
  password?: string | null;
  googleCalendarEventId?: string | null;
  overlappingZoomCount?: number;
}

/** @deprecated Use VideoMeetingResult */
export type ZoomMeetingResult = VideoMeetingResult;

export function isGoogleMeetUrl(url: string): boolean {
  return /meet\.google\.com/i.test(url);
}

export function resolveMeetingProvider(
  url: string,
  stored?: MeetingProvider | null
): MeetingProvider {
  if (stored) return stored;
  return isGoogleMeetUrl(url) ? 'google_meet' : 'zoom';
}

export function getMeetingProviderLabel(provider?: MeetingProvider | null): string {
  return provider === 'google_meet' ? 'Google Meet' : 'Zoom';
}

/** Portal user email used for Zoom alternative-host matching. */
export async function getPortalUserZoomEmail(userId: string): Promise<string | undefined> {
  const { supabase } = await import('../integrations/supabase/client');
  const { data: teacher } = await supabase
    .from('teachers')
    .select('zoom_email, email')
    .eq('user_id', userId)
    .maybeSingle();
  if (teacher) {
    return (teacher.zoom_email || teacher.email)?.trim() || undefined;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();
  return profile?.email?.trim() || undefined;
}

/** Start URL only works for the one licensed Zoom account; teachers use join URL as alternative hosts. */
export function shouldUseZoomStartUrl(
  portalUserEmail: string | undefined,
  licensedZoomHostEmail: string | undefined | null
): boolean {
  if (!portalUserEmail || !licensedZoomHostEmail) return false;
  return portalUserEmail.toLowerCase() === licensedZoomHostEmail.toLowerCase();
}

const mapMeetingRoomRow = (data: Record<string, unknown>): MeetingRoom => ({
  id: data.id as string,
  roomName: data.room_name as string,
  meetingUrl: data.meeting_url as string,
  meetingHostUrl: (data.meeting_host_url as string) || undefined,
  zoomMeetingId: (data.zoom_meeting_id as string) || undefined,
  zoomHostEmail: (data.zoom_host_email as string) || undefined,
  alternativeHostEmail: (data.alternative_host_email as string) || undefined,
  meetingProvider: (data.meeting_provider as MeetingProvider) || undefined,
  googleCalendarEventId: (data.google_calendar_event_id as string) || undefined,
  providerNote: (data.provider_note as string) || undefined,
  teacherId: data.teacher_id as string,
  studentId: (data.student_id as string) || undefined,
  bookingId: (data.booking_id as string) || undefined,
  lessonType: data.lesson_type as MeetingRoom['lessonType'],
  startTime: data.start_time as string,
  endTime: data.end_time as string,
  status: data.status as MeetingRoom['status'],
  notes: (data.notes as string) || undefined,
  recordingUrl: (data.recording_url as string) || undefined,
  createdAt: data.created_at as string,
  updatedAt: data.updated_at as string,
});

const mapInstantMeetingRow = (data: Record<string, unknown>): InstantMeeting => ({
  id: data.id as string,
  title: data.title as string,
  description: (data.description as string) || undefined,
  meetingUrl: data.meeting_url as string,
  meetingHostUrl: (data.meeting_host_url as string) || undefined,
  zoomMeetingId: (data.zoom_meeting_id as string) || undefined,
  hostId: data.host_id as string,
  hostName: data.host_name as string,
  hostRole: data.host_role as InstantMeeting['hostRole'],
  participants: (data.participants as string[]) || [],
  maxParticipants: data.max_participants as number,
  duration: data.duration as number,
  status: data.status as InstantMeeting['status'],
  meetingCode: data.meeting_code as string,
  isPublic: data.is_public as boolean,
  allowRecording: data.allow_recording as boolean,
  scheduledStartTime: (data.scheduled_start_time as string) || undefined,
  startedAt: (data.started_at as string) || undefined,
  endedAt: (data.ended_at as string) || undefined,
  actualDuration: (data.actual_duration as number) || undefined,
  participantJoinLog: (data.participant_join_log as MeetingParticipantLog[]) || [],
  zoomHostEmail: (data.zoom_host_email as string) || undefined,
  alternativeHostEmail: (data.alternative_host_email as string) || undefined,
  meetingProvider: (data.meeting_provider as MeetingProvider) || undefined,
  googleCalendarEventId: (data.google_calendar_event_id as string) || undefined,
  providerNote: (data.provider_note as string) || undefined,
  createdAt: data.created_at as string,
  updatedAt: data.updated_at as string,
});

export interface MeetingParticipantLog {
  userId: string;
  userName: string;
  joinedAt: string;
  leftAt?: string;
  duration?: number; // minutes
}

export interface VideoCallSettings {
  enableVideo: boolean;
  enableAudio: boolean;
  enableRecording: boolean;
  enableChat: boolean;
  enableScreenShare: boolean;
  maxParticipants: number;
}

// Default video call settings for music lessons
export const DEFAULT_VIDEO_SETTINGS: VideoCallSettings = {
  enableVideo: true,
  enableAudio: true,
  enableRecording: false, // Disabled by default for privacy
  enableChat: true,
  enableScreenShare: true,
  maxParticipants: 100,
};

/** Create Zoom or Google Meet (auto-fallback when Zoom license is busy). */
export const createVideoMeeting = async (params: {
  topic: string;
  startTime?: string;
  duration?: number;
  agenda?: string;
  alternativeHostEmails?: string[];
  hostUserId?: string;
  forceProvider?: MeetingProvider;
}): Promise<VideoMeetingResult> => {
  const { supabase } = await import('../integrations/supabase/client');

  const { data, error } = await supabase.functions.invoke('create-video-meeting', {
    body: {
      topic: params.topic,
      startTime: params.startTime,
      duration: params.duration ?? 60,
      agenda: params.agenda,
      alternativeHostEmails: params.alternativeHostEmails,
      hostUserId: params.hostUserId,
      forceProvider: params.forceProvider,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to create video meeting');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (!data?.joinUrl) {
    throw new Error('Video meeting response missing join URL');
  }

  const provider: MeetingProvider =
    data.provider === 'google_meet' ? 'google_meet' : 'zoom';

  return {
    provider,
    joinUrl: data.joinUrl,
    startUrl: data.startUrl || data.joinUrl,
    meetingId: String(data.meetingId),
    password: data.password ?? null,
    zoomHostEmail: data.hostEmail ?? null,
    alternativeHostEmail: data.alternativeHostEmail ?? null,
    alternativeHostWarning: data.alternativeHostWarning ?? null,
    providerNote: data.providerNote ?? null,
    singleLicenseMode: data.singleLicenseMode ?? true,
    teacherEmail: data.teacherEmail ?? null,
    googleCalendarEventId: data.googleCalendarEventId ?? null,
    overlappingZoomCount: data.overlappingZoomCount,
  };
};

/** Force Zoom only (legacy). Prefer createVideoMeeting for automatic Meet fallback. */
export const createZoomMeeting = async (params: {
  topic: string;
  startTime?: string;
  duration?: number;
  agenda?: string;
  alternativeHostEmails?: string[];
  hostUserId?: string;
}): Promise<VideoMeetingResult> =>
  createVideoMeeting({ ...params, forceProvider: 'zoom' });

/** Resolve a teacher's portal user id from teachers.id (for Zoom host on lesson rooms). */
async function getTeacherUserId(teacherId: string): Promise<string | undefined> {
  const { supabase } = await import('../integrations/supabase/client');
  const { data } = await supabase
    .from('teachers')
    .select('user_id')
    .eq('id', teacherId)
    .maybeSingle();
  return data?.user_id || undefined;
}

/** True if URL is an old Jitsi Meet link (pre-Zoom migration). */
export const isLegacyJitsiUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('meet.jit.si') || lower.includes('jitsi');
};

/** Replace legacy Jitsi links with fresh Zoom URLs in the database. */
export const upgradeInstantMeetingToZoom = async (
  meeting: InstantMeeting
): Promise<InstantMeeting> => {
  if (!isLegacyJitsiUrl(meeting.meetingUrl)) {
    return meeting;
  }

  const { supabase } = await import('../integrations/supabase/client');
  const video = await createVideoMeeting({
    topic: meeting.title,
    startTime: meeting.scheduledStartTime,
    duration: meeting.duration || 60,
    agenda: meeting.description || meeting.title,
    hostUserId: meeting.hostId,
  });

  const { data, error } = await supabase
    .from('instant_meetings')
    .update({
      meeting_url: video.joinUrl,
      meeting_host_url: video.startUrl,
      zoom_meeting_id: video.provider === 'zoom' ? video.meetingId : null,
      zoom_host_email: video.zoomHostEmail,
      alternative_host_email: video.alternativeHostEmail,
      meeting_provider: video.provider,
      google_calendar_event_id: video.googleCalendarEventId,
      provider_note: video.providerNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meeting.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upgrade meeting to Zoom: ${error.message}`);
  }

  return mapInstantMeetingRow(data);
};

export const upgradeMeetingRoomToZoom = async (room: MeetingRoom): Promise<MeetingRoom> => {
  if (!isLegacyJitsiUrl(room.meetingUrl)) {
    return room;
  }

  const { supabase } = await import('../integrations/supabase/client');
  const durationMinutes = Math.max(
    15,
    Math.round(
      (new Date(room.endTime).getTime() - new Date(room.startTime).getTime()) / (1000 * 60)
    ) || 60
  );

  const teacherUserId = await getTeacherUserId(room.teacherId);

  const video = await createVideoMeeting({
    topic: room.roomName.replace(/-/g, ' '),
    startTime: room.startTime,
    duration: durationMinutes,
    agenda: room.notes || 'Damon Music Academy lesson',
    hostUserId: teacherUserId,
  });

  const { data, error } = await supabase
    .from('meeting_rooms')
    .update({
      meeting_url: video.joinUrl,
      meeting_host_url: video.startUrl,
      zoom_meeting_id: video.provider === 'zoom' ? video.meetingId : null,
      zoom_host_email: video.zoomHostEmail,
      alternative_host_email: video.alternativeHostEmail,
      meeting_provider: video.provider,
      google_calendar_event_id: video.googleCalendarEventId,
      provider_note: video.providerNote,
      updated_at: new Date().toISOString(),
    })
    .eq('id', room.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upgrade lesson room to Zoom: ${error.message}`);
  }

  const upgraded = mapMeetingRoomRow(data);

  if (upgraded.bookingId) {
    await supabase
      .from('bookings')
      .update({ meeting_link: video.joinUrl })
      .eq('id', upgraded.bookingId);
  }

  return upgraded;
};

/** Open video meeting in a new tab (Zoom or Google Meet). */
export const openMeetingLink = (
  joinUrl: string,
  options?: {
    isHost?: boolean;
    hostUrl?: string | null;
    isLicensedZoomHost?: boolean;
    provider?: MeetingProvider;
  }
): void => {
  if (isLegacyJitsiUrl(joinUrl)) {
    throw new Error(
      'This meeting still uses an old Jitsi link. Please try joining again — the app will upgrade it automatically.'
    );
  }

  const provider = options?.provider ?? resolveMeetingProvider(joinUrl);
  const useStartUrl =
    provider === 'zoom' &&
    options?.isHost &&
    options?.isLicensedZoomHost &&
    options?.hostUrl;
  const url = useStartUrl ? options.hostUrl! : joinUrl;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/** Join an online booking — upgrades legacy Jitsi links on the booking/meeting room. */
export const joinBookingOnlineMeeting = async (
  booking: {
    id: string;
    meeting_link: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    student_name?: string;
    teacher_id?: string;
  },
  options: { isHost: boolean; teacherName?: string; teacherUserId?: string }
): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  let joinUrl = booking.meeting_link;
  let hostUrl: string | null | undefined;

  let licensedZoomEmail: string | undefined;
  let provider: MeetingProvider = resolveMeetingProvider(joinUrl);
  const existingRoom = await getMeetingRoomByBooking(booking.id);
  if (existingRoom) {
    const upgraded = await upgradeMeetingRoomToZoom(existingRoom);
    joinUrl = upgraded.meetingUrl;
    hostUrl = upgraded.meetingHostUrl;
    licensedZoomEmail = upgraded.zoomHostEmail;
    provider = upgraded.meetingProvider ?? resolveMeetingProvider(joinUrl);
  } else if (isLegacyJitsiUrl(joinUrl)) {
    const startTime = `${booking.booking_date}T${booking.start_time}`;
    const endTime = `${booking.booking_date}T${booking.end_time}`;
    const teacherUserId =
      options.teacherUserId ||
      (booking.teacher_id ? await getTeacherUserId(booking.teacher_id) : undefined);
    const video = await createVideoMeeting({
      topic: `Lesson with ${booking.student_name || 'student'}`,
      startTime,
      duration: Math.max(15, getMeetingDuration(startTime, endTime) || 60),
      hostUserId: teacherUserId,
    });
    joinUrl = video.joinUrl;
    hostUrl = video.startUrl;
    licensedZoomEmail = video.zoomHostEmail ?? undefined;
    provider = video.provider;
    await supabase
      .from('bookings')
      .update({ meeting_link: video.joinUrl })
      .eq('id', booking.id);
  }

  let isLicensedZoomHost = false;
  if (options.isHost && options.teacherUserId) {
    const email = await getPortalUserZoomEmail(options.teacherUserId);
    isLicensedZoomHost = shouldUseZoomStartUrl(email, licensedZoomEmail);
  }
  openMeetingLink(joinUrl, { isHost: options.isHost, hostUrl, isLicensedZoomHost, provider });
};

// Generate a unique meeting room name
export const generateMeetingRoomName = (
  teacherName: string,
  studentName: string,
  lessonType: string,
  date: string
): string => {
  const sanitizedTeacher = teacherName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const sanitizedStudent = studentName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const sanitizedType = lessonType.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const dateStr = date.replace(/[^a-zA-Z0-9]/g, '');
  
  return `damon-music-${sanitizedTeacher}-${sanitizedStudent}-${sanitizedType}-${dateStr}`;
};

// Create a meeting room for a booking
export const createMeetingRoom = async (
  bookingId: string,
  teacherId: string,
  studentId: string,
  teacherName: string,
  studentName: string,
  lessonType: string,
  startTime: string,
  endTime: string,
  notes?: string
): Promise<MeetingRoom> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  // Map booking lesson types to meeting room lesson types
  const mapLessonType = (type: string): 'lesson' | 'practice' | 'consultation' => {
    switch (type.toLowerCase()) {
      case 'regular':
      case 'lesson':
        return 'lesson';
      case 'practice':
        return 'practice';
      case 'consultation':
      case 'makeup':
        return 'consultation';
      default:
        return 'lesson'; // Default to lesson
    }
  };
  
  const mappedLessonType = mapLessonType(lessonType);
  const roomName = generateMeetingRoomName(teacherName, studentName, lessonType, startTime);
  const durationMinutes = Math.max(
    15,
    Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)
    ) || 60
  );

  const teacherUserId = await getTeacherUserId(teacherId);

  const video = await createVideoMeeting({
    topic: `${lessonType} lesson: ${teacherName} & ${studentName}`,
    startTime,
    duration: durationMinutes,
    agenda: notes || `Damon Music Academy — ${lessonType}`,
    hostUserId: teacherUserId,
  });

  const dbMeetingRoom = {
    room_name: roomName,
    meeting_url: video.joinUrl,
    meeting_host_url: video.startUrl,
    zoom_meeting_id: video.provider === 'zoom' ? video.meetingId : null,
    zoom_host_email: video.zoomHostEmail,
    alternative_host_email: video.alternativeHostEmail,
    meeting_provider: video.provider,
    google_calendar_event_id: video.googleCalendarEventId,
    provider_note: video.providerNote,
    teacher_id: teacherId,
    student_id: studentId,
    booking_id: bookingId,
    lesson_type: mappedLessonType,
    start_time: startTime,
    end_time: endTime,
    status: 'scheduled',
    notes,
  };

  const { data, error } = await supabase
    .from('meeting_rooms')
    .insert(dbMeetingRoom)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meeting room: ${error.message}`);
  }

  return mapMeetingRoomRow(data);
};

// Get meeting room by booking ID
export const getMeetingRoomByBooking = async (bookingId: string): Promise<MeetingRoom | null> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { data, error } = await supabase
    .from('meeting_rooms')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get meeting room: ${error.message}`);
  }

  if (data) {
    return mapMeetingRoomRow(data);
  }

  return null;
};

// Get all meeting rooms for a user (teacher or student)
export const getUserMeetingRooms = async (userId: string, userRole: 'teacher' | 'student'): Promise<MeetingRoom[]> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { data, error } = await supabase
    .from('meeting_rooms')
    .select('*')
    .eq(userRole === 'teacher' ? 'teacher_id' : 'student_id', userId)
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`Failed to get meeting rooms: ${error.message}`);
  }

  return (data || []).map((room) => mapMeetingRoomRow(room));
};

// Update meeting room status
export const updateMeetingRoomStatus = async (
  meetingRoomId: string,
  status: MeetingRoom['status']
): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { error } = await supabase
    .from('meeting_rooms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', meetingRoomId);

  if (error) {
    throw new Error(`Failed to update meeting room status: ${error.message}`);
  }
};

// Join meeting room (opens Zoom in new tab; upgrades legacy Jitsi first)
export const joinMeetingRoom = async (
  room: MeetingRoom,
  _userName: string,
  options?: { isHost?: boolean; userId?: string }
): Promise<MeetingRoom> => {
  const upgraded = await upgradeMeetingRoomToZoom(room);
  let isLicensedZoomHost = false;
  if (options?.isHost && options.userId) {
    const email = await getPortalUserZoomEmail(options.userId);
    isLicensedZoomHost = shouldUseZoomStartUrl(email, upgraded.zoomHostEmail);
  }
  openMeetingLink(upgraded.meetingUrl, {
    isHost: options?.isHost,
    hostUrl: upgraded.meetingHostUrl,
    isLicensedZoomHost,
    provider: upgraded.meetingProvider ?? resolveMeetingProvider(upgraded.meetingUrl),
  });
  return upgraded;
};

// Check if meeting is currently active (within 15 minutes of start time)
export const isMeetingActive = (startTime: string, endTime: string): boolean => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Meeting is active if current time is within 15 minutes before start or during the meeting
  const fifteenMinutesBefore = new Date(start.getTime() - 15 * 60 * 1000);
  
  return now >= fifteenMinutesBefore && now <= end;
};

// Check if meeting link should be available (24 hours before start time)
export const isMeetingLinkAvailable = (startTime: string): boolean => {
  const now = new Date();
  const start = new Date(startTime);
  
  // Meeting link is available 24 hours before the meeting starts
  const twentyFourHoursBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  
  return now >= twentyFourHoursBefore;
};

// Get meeting status based on time
export const getMeetingStatus = (startTime: string, endTime: string): MeetingRoom['status'] => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (now < start) return 'scheduled';
  if (now >= start && now <= end) return 'active';
  if (now > end) return 'completed';
  
  return 'scheduled';
};

// Format meeting time for display
export const formatMeetingTime = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const startStr = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const endStr = end.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return `${startStr} - ${endStr}`;
};

// Get meeting duration in minutes
export const getMeetingDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

// ============================================
// INSTANT MEETING FUNCTIONS
// ============================================

// Generate instant meeting room name
export const generateInstantMeetingName = (
  hostName: string,
  title: string,
  timestamp?: string
): string => {
  const sanitizedHost = hostName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const timeStr = timestamp ? new Date(timestamp).getTime().toString() : Date.now().toString();
  
  return `damon-instant-${sanitizedHost}-${sanitizedTitle}-${timeStr.slice(-8)}`;
};

// Generate unique meeting code for instant meetings
export const generateMeetingCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** Create Zoom links without DB (e.g. when teacher has no user_id). */
export const createSimpleTrialMeeting = async (
  hostName: string,
  title: string,
  scheduledStartTime?: string,
  hostUserId?: string
): Promise<{
  meetingUrl: string;
  meetingHostUrl: string;
  meetingCode: string;
  zoomMeetingId?: string;
  meetingProvider: MeetingProvider;
  providerNote?: string | null;
}> => {
  const meetingCode = generateMeetingCode();
  const video = await createVideoMeeting({
    topic: title,
    startTime: scheduledStartTime,
    duration: 60,
    agenda: `Trial class — ${hostName}`,
    hostUserId,
  });
  return {
    meetingUrl: video.joinUrl,
    meetingHostUrl: video.startUrl,
    meetingCode,
    zoomMeetingId: video.provider === 'zoom' ? video.meetingId : undefined,
    meetingProvider: video.provider,
    providerNote: video.providerNote,
  };
};

// Create instant meeting
export const createInstantMeeting = async ({
  title,
  description,
  hostId,
  hostName,
  hostRole,
  participants,
  duration = 60,
  maxParticipants = 10,
  isPublic = false,
  allowRecording = false,
  scheduledStartTime // New parameter for scheduled meetings
}: {
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  hostRole: 'teacher' | 'admin';
  participants: string[];
  duration?: number;
  maxParticipants?: number;
  isPublic?: boolean;
  allowRecording?: boolean;
  scheduledStartTime?: string; // ISO string for scheduled meetings
}): Promise<InstantMeeting> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const meetingCode = generateMeetingCode();

  const video = await createVideoMeeting({
    topic: title,
    startTime: scheduledStartTime,
    duration,
    agenda: description || title,
    hostUserId: hostId,
  });

  const initialStatus = scheduledStartTime ? 'scheduled' : 'pending';

  const instantMeeting = {
    title,
    description,
    meeting_url: video.joinUrl,
    meeting_host_url: video.startUrl,
    zoom_meeting_id: video.provider === 'zoom' ? video.meetingId : null,
    zoom_host_email: video.zoomHostEmail,
    alternative_host_email: video.alternativeHostEmail,
    meeting_provider: video.provider,
    google_calendar_event_id: video.googleCalendarEventId,
    provider_note: video.providerNote,
    host_id: hostId,
    host_name: hostName,
    host_role: hostRole,
    participants: participants,
    max_participants: maxParticipants,
    duration: duration,
    status: initialStatus as const,
    meeting_code: meetingCode,
    is_public: isPublic,
    allow_recording: allowRecording,
    scheduled_start_time: scheduledStartTime,
    participant_join_log: []
  };

  const { data, error } = await supabase
    .from('instant_meetings')
    .insert(instantMeeting)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create instant meeting: ${error.message}`);
  }

  return {
    ...mapInstantMeetingRow(data),
    alternativeHostWarning: video.alternativeHostWarning ?? null,
  };
};

/** Parse academy meeting code from invitation message body (legacy messages without meeting_id). */
export function parseMeetingCodeFromInvitationMessage(message: string): string | null {
  const match = message.match(/Meeting Code:\s*([A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
}

/** Resolve instant_meetings.id from a portal message (meeting_id or embedded code). */
export async function resolveMeetingIdFromInvitationMessage(
  meetingId: string | null | undefined,
  messageBody: string
): Promise<string | null> {
  if (meetingId) return meetingId;
  const code = parseMeetingCodeFromInvitationMessage(messageBody);
  if (!code) return null;
  const meeting = await getInstantMeetingByCode(code);
  return meeting?.id ?? null;
}

// Send meeting invitations
export const sendMeetingInvitations = async (
  meetingId: string,
  hostId: string,
  hostName: string,
  participantIds: string[],
  meetingTitle: string,
  meetingUrl: string,
  meetingCode: string,
  scheduledStartTime?: string
): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const isScheduled = !!scheduledStartTime;
  const scheduledText = isScheduled 
    ? `\n🕒 Scheduled for: ${new Date(scheduledStartTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n`
    : '\n🚀 Ready to start now!\n';
  
  const inviteMessages = participantIds.map(participantId => {
    // Build the tips section
    let tipsSection = `💡 Tips:
• Test your camera and microphone before joining
• Use a stable internet connection
• Join from a quiet environment`;
    
    if (isScheduled) {
      tipsSection += `
• You can join 15 minutes before the scheduled time`;
    }
    
    return {
      sender_id: hostId,
      recipient_id: participantId,
      subject: `🎬 ${isScheduled ? 'Scheduled' : 'Instant'} Meeting Invitation: ${meetingTitle}`,
      message: `🎉 You've been invited to join a${isScheduled ? ' scheduled' : 'n instant'} video meeting!

📋 Meeting: ${meetingTitle}
👨‍🏫 Host: ${hostName}${scheduledText}
🔑 Meeting Code: ${meetingCode}

🚀 To join the meeting:
• Click the "Join Meeting" button in this invitation
• Or visit: ${meetingUrl}
• Or use meeting code: ${meetingCode}

${tipsSection}

🎵 Optimized for music lessons with high-quality audio!`,
      message_type: 'meeting_invitation',
      meeting_id: meetingId,
      is_read: false
    };
  });

  const { error } = await supabase
    .from('portal_messages')
    .insert(inviteMessages);

  if (error) {
    console.error('Failed to send meeting invitations:', error);
    // Don't throw error as meeting creation succeeded
  }
};

// Get instant meeting by code
export const getInstantMeetingByCode = async (meetingCode: string): Promise<InstantMeeting | null> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { data, error } = await supabase
    .from('instant_meetings')
    .select('*')
    .eq('meeting_code', meetingCode)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get instant meeting by code: ${error.message}`);
  }

  if (!data) return null;

  return mapInstantMeetingRow(data);
};

// Get instant meeting by ID
export const getInstantMeeting = async (meetingId: string): Promise<InstantMeeting | null> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { data, error } = await supabase
    .from('instant_meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get instant meeting: ${error.message}`);
  }

  if (!data) return null;

  return mapInstantMeetingRow(data);
};

// Get user's instant meetings (hosted and invited)
export const getUserInstantMeetings = async (
  userId: string,
  status?: 'scheduled' | 'pending' | 'active' | 'completed' | 'cancelled'
): Promise<InstantMeeting[]> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  console.log('[getUserInstantMeetings] Fetching meetings for user:', userId, 'status filter:', status);
  
  let query = supabase
    .from('instant_meetings')
    .select('*')
    .or(`host_id.eq.${userId},participants.cs.{"${userId}"}`);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  
  console.log('[getUserInstantMeetings] Query result:', { data, error });

  if (error) {
    console.error('[getUserInstantMeetings] Error:', error);
    throw new Error(`Failed to get user instant meetings: ${error.message}`);
  }

  const meetings = (data || []).map((meeting) => mapInstantMeetingRow(meeting));

  console.log('[getUserInstantMeetings] Mapped meetings:', meetings);
  return meetings;
};

// Check if an instant meeting has ended and should no longer appear in invited lists
export const isInstantMeetingPast = (meeting: InstantMeeting): boolean => {
  if (meeting.status === 'completed' || meeting.status === 'cancelled') {
    return true;
  }

  const now = Date.now();
  const graceMs = 30 * 60 * 1000;

  if (meeting.endedAt && now > new Date(meeting.endedAt).getTime()) {
    return true;
  }

  const startReference = meeting.startedAt || meeting.scheduledStartTime;
  if (startReference) {
    const endMs =
      new Date(startReference).getTime() +
      meeting.duration * 60 * 1000 +
      graceMs;
    if (now > endMs) {
      return true;
    }
  }

  return false;
};

// Get meetings where user is invited (for student dashboard)
export const getUserInvitedMeetings = async (userId: string): Promise<InstantMeeting[]> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  console.log('[getUserInvitedMeetings] Fetching invited meetings for user:', userId);

  try {
    await cleanupExpiredMeetings();
  } catch (error) {
    console.warn('[getUserInvitedMeetings] Cleanup skipped:', error);
  }
  
  const { data, error } = await supabase
    .from('instant_meetings')
    .select('*')
    .contains('participants', [userId])
    .neq('host_id', userId)
    .in('status', ['scheduled', 'pending', 'active'])
    .order('scheduled_start_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  console.log('[getUserInvitedMeetings] Query result:', { data, error });

  if (error) {
    console.error('[getUserInvitedMeetings] Error:', error);
    throw new Error(`Failed to get invited meetings: ${error.message}`);
  }

  const meetings = (data || [])
    .map((meeting) => mapInstantMeetingRow(meeting))
    .filter((meeting) => !isInstantMeetingPast(meeting));

  console.log('[getUserInvitedMeetings] Mapped meetings:', meetings);
  return meetings;
};

// Check if user can join instant meeting
export const canUserJoinInstantMeeting = (
  meeting: InstantMeeting,
  userId: string
): { canJoin: boolean; reason?: string } => {
  // Host can always join
  if (meeting.hostId === userId) {
    return { canJoin: true };
  }

  // Check if meeting is completed or cancelled
  if (meeting.status === 'completed' || meeting.status === 'cancelled') {
    return { canJoin: false, reason: 'Meeting has ended' };
  }

  // Check if meeting is scheduled and not yet time to join
  if (meeting.status === 'scheduled' && meeting.scheduledStartTime) {
    const now = new Date();
    const scheduledTime = new Date(meeting.scheduledStartTime);
    const joinTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    
    if (now < joinTime) {
      const timeUntilJoin = Math.ceil((joinTime.getTime() - now.getTime()) / (1000 * 60));
      return { 
        canJoin: false, 
        reason: `Meeting is scheduled. You can join ${timeUntilJoin} minutes before the start time.` 
      };
    }
  }

  // Check if user is invited
  if (!meeting.isPublic && !meeting.participants.includes(userId)) {
    return { canJoin: false, reason: 'You are not invited to this meeting' };
  }

  // Check participant limit
  const currentParticipants = meeting.participantJoinLog.filter(log => !log.leftAt).length;
  if (currentParticipants >= meeting.maxParticipants) {
    return { canJoin: false, reason: 'Meeting is full' };
  }

  return { canJoin: true };
};

// Join instant meeting (record participant)
export const joinInstantMeeting = async (
  meetingId: string, 
  userId: string, 
  userName: string
): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  // Get current meeting
  const { data: meeting, error: fetchError } = await supabase
    .from('instant_meetings')
    .select('*')
    .eq('id', meetingId)
    .single();

  if (fetchError || !meeting) {
    throw new Error('Meeting not found');
  }

  // Check if user is already in the log
  const participantLog = meeting.participant_join_log || [];
  const existingLog = participantLog.find(log => log.userId === userId && !log.leftAt);
  if (existingLog) {
    return; // User already joined and hasn't left
  }

  // Add participant to join log
  const newJoinEntry: MeetingParticipantLog = {
    userId,
    userName,
    joinedAt: new Date().toISOString()
  };

  const updatedLog = [...participantLog, newJoinEntry];

  const { error } = await supabase
    .from('instant_meetings')
    .update({
      participant_join_log: updatedLog,
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);

  if (error) {
    throw new Error(`Failed to record meeting join: ${error.message}`);
  }
};

// Join instant meeting (opens in new tab and records participation)
export const joinInstantMeetingRoom = async (
  meeting: InstantMeeting,
  userId: string,
  userName: string
): Promise<void> => {
  // Check if user can join
  const { canJoin, reason } = canUserJoinInstantMeeting(meeting, userId);
  if (!canJoin) {
    throw new Error(reason || 'Cannot join meeting');
  }

  const zoomMeeting = await upgradeInstantMeetingToZoom(meeting);

  await joinInstantMeeting(zoomMeeting.id, userId, userName);

  const isHost = zoomMeeting.hostId === userId;
  const portalEmail = await getPortalUserZoomEmail(userId);
  const isLicensedZoomHost = shouldUseZoomStartUrl(portalEmail, zoomMeeting.zoomHostEmail);
  openMeetingLink(zoomMeeting.meetingUrl, {
    isHost,
    hostUrl: zoomMeeting.meetingHostUrl,
    isLicensedZoomHost,
    provider:
      zoomMeeting.meetingProvider ?? resolveMeetingProvider(zoomMeeting.meetingUrl),
  });
};

// Join meeting by code (for direct joining)
export const joinMeetingByCode = async (
  meetingCode: string,
  userId: string,
  userName?: string
): Promise<InstantMeeting | null> => {
  const meeting = await getInstantMeetingByCode(meetingCode);
  if (!meeting) {
    return null;
  }

  const { canJoin, reason } = canUserJoinInstantMeeting(meeting, userId);
  if (!canJoin) {
    throw new Error(reason || 'Cannot join meeting');
  }

  if (userName) {
    await joinInstantMeetingRoom(meeting, userId, userName);
  }
  return meeting;
};

// Start instant meeting
export const startInstantMeeting = async (meetingId: string): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { error } = await supabase
    .from('instant_meetings')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);

  if (error) {
    throw new Error(`Failed to start instant meeting: ${error.message}`);
  }
};

// End instant meeting
export const endInstantMeeting = async (meetingId: string): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { error } = await supabase
    .from('instant_meetings')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);

  if (error) {
    throw new Error(`Failed to end instant meeting: ${error.message}`);
  }
};

// Cancel instant meeting
export const cancelInstantMeeting = async (meetingId: string): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { error } = await supabase
    .from('instant_meetings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', meetingId);

  if (error) {
    throw new Error(`Failed to cancel instant meeting: ${error.message}`);
  }
};

// Delete instant meeting (host only)
export const deleteInstantMeeting = async (meetingId: string, hostId: string): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  // Verify the user is the host
  const { data: meeting, error: fetchError } = await supabase
    .from('instant_meetings')
    .select('host_id')
    .eq('id', meetingId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to verify meeting ownership: ${fetchError.message}`);
  }

  if (meeting.host_id !== hostId) {
    throw new Error('Only the meeting host can delete this meeting');
  }

  const { error } = await supabase
    .from('instant_meetings')
    .delete()
    .eq('id', meetingId);

  if (error) {
    throw new Error(`Failed to delete instant meeting: ${error.message}`);
  }
};

// Auto-cleanup expired meetings with conservative rules
export const cleanupExpiredMeetings = async (): Promise<void> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const now = new Date();
  
  // Clean up rules based on memory:
  // - Completed meetings: delete after 24 hours
  // - Cancelled meetings: delete after 24 hours (but teachers can manually delete anytime)
  // - Active meetings: auto-complete after duration + 30 min grace period
  // - Pending meetings: cancel after 4 hours
  
  // Delete completed/cancelled meetings older than 24 hours
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const { error: cleanupError } = await supabase
    .from('instant_meetings')
    .delete()
    .in('status', ['completed', 'cancelled'])
    .lt('updated_at', oneDayAgo.toISOString());

  if (cleanupError) {
    console.error('Error cleaning up old meetings:', cleanupError);
  }
  
  // Auto-complete active meetings that have exceeded duration + 30 min grace period
  const { data: activeMeetings, error: fetchError } = await supabase
    .from('instant_meetings')
    .select('id, started_at, duration')
    .eq('status', 'active');
    
  if (!fetchError && activeMeetings) {
    for (const meeting of activeMeetings) {
      if (meeting.started_at) {
        const startTime = new Date(meeting.started_at);
        const endTimeWithGrace = new Date(startTime.getTime() + (meeting.duration + 30) * 60 * 1000);
        
        if (now > endTimeWithGrace) {
          await supabase
            .from('instant_meetings')
            .update({
              status: 'completed',
              ended_at: endTimeWithGrace.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', meeting.id);
        }
      }
    }
  }

  // Auto-complete scheduled meetings whose end time (+ grace) has passed
  const { data: scheduledMeetings, error: scheduledFetchError } = await supabase
    .from('instant_meetings')
    .select('id, scheduled_start_time, duration')
    .eq('status', 'scheduled');

  if (!scheduledFetchError && scheduledMeetings) {
    for (const meeting of scheduledMeetings) {
      if (!meeting.scheduled_start_time) continue;

      const endTimeWithGrace = new Date(
        new Date(meeting.scheduled_start_time).getTime() +
          (meeting.duration + 30) * 60 * 1000
      );

      if (now > endTimeWithGrace) {
        await supabase
          .from('instant_meetings')
          .update({
            status: 'completed',
            ended_at: endTimeWithGrace.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', meeting.id);
      }
    }
  }
  
  // Cancel pending meetings older than 4 hours
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  
  const { error: cancelError } = await supabase
    .from('instant_meetings')
    .update({
      status: 'cancelled',
      updated_at: now.toISOString()
    })
    .eq('status', 'pending')
    .lt('created_at', fourHoursAgo.toISOString());
    
  if (cancelError) {
    console.error('Error cancelling old pending meetings:', cancelError);
  }
};

// Get active participants in instant meeting
export const getActiveParticipants = (meeting: InstantMeeting): MeetingParticipantLog[] => {
  return meeting.participantJoinLog.filter(log => !log.leftAt);
};