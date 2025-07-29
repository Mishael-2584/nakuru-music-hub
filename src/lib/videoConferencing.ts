// Video Conferencing Service for Damon Music Academy
// Handles meeting room creation, Jitsi Meet integration, and meeting management

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
  const params = new URLSearchParams({
    // Room configuration
    room: roomName,
    
    // Video/Audio settings
    video: settings.enableVideo ? '1' : '0',
    audio: settings.enableAudio ? '1' : '0',
    
    // Recording settings
    recording: settings.enableRecording ? '1' : '0',
    
    // Chat settings
    chat: settings.enableChat ? '1' : '0',
    
    // Screen sharing
    screenshare: settings.enableScreenShare ? '1' : '0',
    
    // Security settings
    password: '', // No password for now, can be added later
    
    // UI settings
    startWithAudioMuted: '0',
    startWithVideoMuted: '0',
    
    // Music academy specific settings
    prejoinPageEnabled: '1', // Allow pre-join page for setup
    disableAudioLevels: '0', // Keep audio levels for music
    disableSimulcast: '0', // Enable simulcast for better quality
    
    // Custom branding (optional)
    brandingRoomAlias: 'Damon Music Academy',
  });

  return `${baseUrl}/${roomName}?${params.toString()}`;
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
  
  const roomName = generateMeetingRoomName(teacherName, studentName, lessonType, startTime);
  const meetingUrl = generateJitsiMeetUrl(roomName);
  
  const meetingRoom: Omit<MeetingRoom, 'id' | 'createdAt' | 'updatedAt'> = {
    roomName,
    meetingUrl,
    teacherId,
    studentId,
    bookingId,
    lessonType: lessonType as 'lesson' | 'practice' | 'consultation',
    startTime,
    endTime,
    status: 'scheduled',
    notes,
  };

  const { data, error } = await supabase
    .from('meeting_rooms')
    .insert(meetingRoom)
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

  return data;
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

  return data || [];
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
  // Add user name to URL for display in meeting
  const urlWithUser = `${meetingUrl}&userInfo.displayName=${encodeURIComponent(userName)}`;
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