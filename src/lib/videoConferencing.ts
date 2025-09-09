// Video Conferencing Service for Damon Music Academy
// Handles meeting room creation, Jitsi Meet integration, and meeting management
// Enhanced with Instant Meet capabilities

export interface MeetingRoom {
  id: string;
  roomName: string;
  meetingUrl: string;
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

// New interface for instant meetings
export interface InstantMeeting {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  hostId: string;
  hostName: string;
  hostRole: 'teacher' | 'admin';
  participants: string[]; // User IDs
  maxParticipants: number;
  duration: number; // minutes
  status: 'scheduled' | 'pending' | 'active' | 'completed' | 'cancelled';
  meetingCode: string;
  isPublic: boolean;
  allowRecording: boolean;
  scheduledStartTime?: string; // Added for scheduled meetings
  startedAt?: string;
  endedAt?: string;
  actualDuration?: number; // minutes
  participantJoinLog: MeetingParticipantLog[];
  createdAt: string;
  updatedAt: string;
}

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
  maxParticipants: 4, // Teacher + Student + possible accompanist/parent
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

// Generate Jitsi Meet URL with custom settings
export const generateJitsiMeetUrl = (
  roomName: string,
  settings: VideoCallSettings = DEFAULT_VIDEO_SETTINGS
): string => {
  const baseUrl = 'https://meet.jit.si';
  
  // Jitsi Meet uses simple room URLs: https://meet.jit.si/RoomName
  // Additional configuration can be passed via URL fragments
  const url = `${baseUrl}/${encodeURIComponent(roomName)}`;
  
  // Add configuration via URL hash (fragment)
  const config = {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: true,
    disableAudioLevels: false,
    enableNoisyMicDetection: true,
    enableTalkWhileMuted: false,
    // Music-specific optimizations
    disableAP: true, // Disable audio processing for better music quality
    disableAEC: true, // Disable echo cancellation for instruments
    disableNS: true,  // Disable noise suppression for music
    enableOpusRed: true, // Enable Opus RED for better audio
    stereo: true, // Enable stereo audio for music
  };
  
  return url;
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
  const meetingUrl = generateJitsiMeetUrl(roomName);
  
  const meetingRoom: Omit<MeetingRoom, 'id' | 'createdAt' | 'updatedAt'> = {
    roomName,
    meetingUrl,
    teacherId,
    studentId,
    bookingId,
    lessonType: mappedLessonType,
    startTime,
    endTime,
    status: 'scheduled',
    notes,
  };



  // Map camelCase to snake_case for database
  const dbMeetingRoom = {
    room_name: meetingRoom.roomName,
    meeting_url: meetingRoom.meetingUrl,
    teacher_id: meetingRoom.teacherId,
    student_id: meetingRoom.studentId,
    booking_id: meetingRoom.bookingId,
    lesson_type: meetingRoom.lessonType,
    start_time: meetingRoom.startTime,
    end_time: meetingRoom.endTime,
    status: meetingRoom.status,
    notes: meetingRoom.notes,
  };



  const { data, error } = await supabase
    .from('meeting_rooms')
    .insert(dbMeetingRoom)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create meeting room: ${error.message}`);
  }

  return data;
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

  // Map snake_case to camelCase for interface
  if (data) {
    return {
      id: data.id,
      roomName: data.room_name,
      meetingUrl: data.meeting_url,
      teacherId: data.teacher_id,
      studentId: data.student_id,
      bookingId: data.booking_id,
      lessonType: data.lesson_type,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.status,
      notes: data.notes,
      recordingUrl: data.recording_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
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

  // Map snake_case to camelCase for interface
  return (data || []).map(room => ({
    id: room.id,
    roomName: room.room_name,
    meetingUrl: room.meeting_url,
    teacherId: room.teacher_id,
    studentId: room.student_id,
    bookingId: room.booking_id,
    lessonType: room.lesson_type,
    startTime: room.start_time,
    endTime: room.end_time,
    status: room.status,
    notes: room.notes,
    recordingUrl: room.recording_url,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
  }));
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

// Join meeting room (opens in new tab)
export const joinMeetingRoom = (meetingUrl: string, userName: string): void => {
  // Add user name to URL for display in meeting using correct Jitsi format
  const urlWithUser = `${meetingUrl}#userInfo.displayName="${encodeURIComponent(userName)}"`;
  window.open(urlWithUser, '_blank', 'width=1200,height=800');
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
  const roomName = generateInstantMeetingName(hostName, title);
  const meetingUrl = generateJitsiMeetUrl(roomName, {
    ...DEFAULT_VIDEO_SETTINGS,
    enableRecording: allowRecording,
    maxParticipants: Math.min(maxParticipants, 20) // Cap at 20 for performance
  });
  
  // Determine initial status based on whether it's scheduled or instant
  const initialStatus = scheduledStartTime ? 'scheduled' : 'pending';
  
  const instantMeeting = {
    title,
    description,
    meeting_url: meetingUrl,
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
    id: data.id,
    title: data.title,
    description: data.description,
    meetingUrl: data.meeting_url,
    hostId: data.host_id,
    hostName: data.host_name,
    hostRole: data.host_role,
    participants: data.participants,
    maxParticipants: data.max_participants,
    duration: data.duration,
    status: data.status,
    meetingCode: data.meeting_code,
    isPublic: data.is_public,
    allowRecording: data.allow_recording,
    scheduledStartTime: data.scheduled_start_time,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    actualDuration: data.actual_duration,
    participantJoinLog: data.participant_join_log || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

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

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    meetingUrl: data.meeting_url,
    hostId: data.host_id,
    hostName: data.host_name,
    hostRole: data.host_role,
    participants: data.participants,
    maxParticipants: data.max_participants,
    duration: data.duration,
    status: data.status,
    meetingCode: data.meeting_code,
    isPublic: data.is_public,
    allowRecording: data.allow_recording,
    scheduledStartTime: data.scheduled_start_time,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    actualDuration: data.actual_duration,
    participantJoinLog: data.participant_join_log || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
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

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    meetingUrl: data.meeting_url,
    hostId: data.host_id,
    hostName: data.host_name,
    hostRole: data.host_role,
    participants: data.participants,
    maxParticipants: data.max_participants,
    duration: data.duration,
    status: data.status,
    meetingCode: data.meeting_code,
    isPublic: data.is_public,
    allowRecording: data.allow_recording,
    scheduledStartTime: data.scheduled_start_time,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    actualDuration: data.actual_duration,
    participantJoinLog: data.participant_join_log || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

// Get user's instant meetings (hosted and invited)
export const getUserInstantMeetings = async (
  userId: string,
  status?: 'scheduled' | 'pending' | 'active' | 'completed' | 'cancelled'
): Promise<InstantMeeting[]> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  let query = supabase
    .from('instant_meetings')
    .select('*')
    .or(`host_id.eq.${userId},participants.cs.{"${userId}"}`);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get user instant meetings: ${error.message}`);
  }

  return (data || []).map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    meetingUrl: meeting.meeting_url,
    hostId: meeting.host_id,
    hostName: meeting.host_name,
    hostRole: meeting.host_role,
    participants: meeting.participants,
    maxParticipants: meeting.max_participants,
    duration: meeting.duration,
    status: meeting.status,
    meetingCode: meeting.meeting_code,
    isPublic: meeting.is_public,
    allowRecording: meeting.allow_recording,
    scheduledStartTime: meeting.scheduled_start_time,
    startedAt: meeting.started_at,
    endedAt: meeting.ended_at,
    actualDuration: meeting.actual_duration,
    participantJoinLog: meeting.participant_join_log || [],
    createdAt: meeting.created_at,
    updatedAt: meeting.updated_at
  }));
};

// Get meetings where user is invited (for student dashboard)
export const getUserInvitedMeetings = async (userId: string): Promise<InstantMeeting[]> => {
  const { supabase } = await import('../integrations/supabase/client');
  
  const { data, error } = await supabase
    .from('instant_meetings')
    .select('*')
    .contains('participants', [userId])
    .neq('host_id', userId)
    .in('status', ['scheduled', 'pending', 'active'])
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get invited meetings: ${error.message}`);
  }

  return (data || []).map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    meetingUrl: meeting.meeting_url,
    hostId: meeting.host_id,
    hostName: meeting.host_name,
    hostRole: meeting.host_role,
    participants: meeting.participants,
    maxParticipants: meeting.max_participants,
    duration: meeting.duration,
    status: meeting.status,
    meetingCode: meeting.meeting_code,
    isPublic: meeting.is_public,
    allowRecording: meeting.allow_recording,
    scheduledStartTime: meeting.scheduled_start_time,
    startedAt: meeting.started_at,
    endedAt: meeting.ended_at,
    actualDuration: meeting.actual_duration,
    participantJoinLog: meeting.participant_join_log || [],
    createdAt: meeting.created_at,
    updatedAt: meeting.updated_at
  }));
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

  // Record participation
  await joinInstantMeeting(meeting.id, userId, userName);
  
  // Debug: Log the meeting URL to console
  console.log('Meeting URL:', meeting.meetingUrl);
  
  // Open meeting in new tab with correct Jitsi URL format
  const urlWithUser = `${meeting.meetingUrl}#userInfo.displayName="${encodeURIComponent(userName)}"`;
  console.log('Final URL with user:', urlWithUser);
  
  // Test if the base URL is valid
  if (!meeting.meetingUrl.startsWith('https://meet.jit.si/')) {
    console.error('Invalid Jitsi URL detected:', meeting.meetingUrl);
    throw new Error('Invalid meeting URL format');
  }
  
  window.open(urlWithUser, '_blank', 'width=1200,height=800');
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