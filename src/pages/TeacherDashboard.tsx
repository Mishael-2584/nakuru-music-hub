import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, BookOpen, Clock, BarChart3, MessageSquare, CreditCard, User, LogOut, Bell, Music, FileText, Users, Calendar as CalendarIcon, Target, TrendingUp, Plus, Download, Eye, Edit, Trash2, Upload, Camera, Video, Copy, Check, ChevronLeft, ChevronRight, Phone, Mail, Award, RefreshCw, ExternalLink } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LessonCalendar, LessonEvent } from '../components/LessonCalendar';
import VideoConferenceModal from '../components/VideoConferenceModal';
import { MeetingRoom, getUserMeetingRooms, getMeetingRoomByBooking, getUserInvitedMeetings, getUserInstantMeetings, InstantMeeting, joinBookingOnlineMeeting, joinInstantMeetingRoom } from '../lib/videoConferencing';
import MessagingUI from '../components/MessagingUI';
import InstantMeetManager from '../components/InstantMeetManager';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  experience?: string;
  category: string;
  subjects: string[];
  status: string;
  created_at: string;
  user_id?: string; // Add user_id field
  avatar_url?: string;
  notFound?: boolean;
}

interface Student {
  id: string;
  user_id: string;
  student_name: string;
  email: string;
  phone: string;
  instrument: string;
  proficiency_level: string;
  status: string;
  enrollment_date: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  lesson_type: string;
  notes?: string;
  student_id: string;
  student_name?: string;
  materials_url?: string[]; // Added for lesson materials
}

interface Message {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  recipient_name?: string;
}

interface TimeSlot {
  id: string;
  teacher_id?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  slot_type?: string;
  max_students?: number;
  description?: string;
}

// Add EventDetailsModal component
const EventDetailsModal = ({ open, onClose, event, isTeacher }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [file, setFile] = useState(null);
  const [materials, setMaterials] = useState(event?.materials_url || []);

  // Don't render if no event is provided
  if (!event) {
    return null;
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !event) return;
    setUploading(true);
    setUploadError("");
    try {
      const filePath = `lesson-materials/${event.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage.from('lesson-materials').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // Get public URL
      const { data } = supabase.storage.from('lesson-materials').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      // Update lesson's materials_url array
      const newMaterials = [...(materials || []), publicUrl];
      const { error: updateError } = await supabase.from('lessons').update({ materials_url: newMaterials }).eq('id', event.id);
      if (updateError) throw updateError;
      setMaterials(newMaterials);
      setFile(null);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div><b>Status:</b> {event.status}</div>
          <div><b>Type:</b> {event.lesson_type}</div>
          <div><b>Date:</b> {event.lesson_date ? new Date(`${event.lesson_date}T${event.start_time}`).toLocaleDateString() : ''}</div>
          <div><b>Time:</b> {event.start && event.end ? `${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
          {event.student_name && <div><b>Student:</b> {event.student_name}</div>}
          {event.notes && <div><b>Notes:</b> {event.notes}</div>}
        </div>
        {/* Lesson Materials Section */}
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Lesson Materials</h4>
          {materials && materials.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {materials.map((url, idx) => (
                <li key={idx}><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download Material {idx + 1}</a></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No materials uploaded yet.</p>
          )}
          {isTeacher && (
            <div className="mt-3 space-y-2">
              <input type="file" onChange={handleFileChange} />
              <Button onClick={handleUpload} disabled={uploading || !file} variant="outline">
                {uploading ? 'Uploading...' : 'Upload Material'}
              </Button>
              {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const navigate = useNavigate();

  // Modal states
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  // Classroom state
  const [showCreateClassroomModal, setShowCreateClassroomModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: '', description: '' });
  const [teacherClassrooms, setTeacherClassrooms] = useState<any[]>([]);
  const [selectedTeacherClassroom, setSelectedTeacherClassroom] = useState<any | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [teacherClassroomFeed, setTeacherClassroomFeed] = useState<any[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<Set<string>>(new Set());
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  
  // Students pagination and details
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [studentBookings, setStudentBookings] = useState<any[]>([]);
  
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    lesson_date: '',
    start_time: '',
    end_time: '',
    lesson_type: 'regular',
    student_id: '',
    notes: ''
  });
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    recipient_id: ''
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file_url: ''
  });
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Add video conferencing state
  const [showVideoConferenceModal, setShowVideoConferenceModal] = useState(false);
  const [selectedMeetingRoom, setSelectedMeetingRoom] = useState<MeetingRoom | null>(null);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [invitedMeetings, setInvitedMeetings] = useState<InstantMeeting[]>([]);
  const [teacherInstantMeetings, setTeacherInstantMeetings] = useState<InstantMeeting[]>([]);
  // Filter state
  const [calendarStudent, setCalendarStudent] = useState('all');
  const [calendarLessonType, setCalendarLessonType] = useState('all');
  const [calendarStatus, setCalendarStatus] = useState('all');

  // Add bookings state
  const [bookings, setBookings] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [pastBookings, setPastBookings] = useState<any[]>([]);

  // Time slot management functions
  const handleAddTimeSlot = async () => {
    try {
      if (!profile?.id) {
        throw new Error('Teacher profile not found');
      }

      // Validate required fields
      if (!newTimeSlot.start_time || !newTimeSlot.end_time) {
      toast({
          title: "Validation Error",
          description: "Please fill in both start time and end time",
        variant: "destructive",
      });
      return;
    }

      // Validate that end time is after start time
    if (newTimeSlot.start_time >= newTimeSlot.end_time) {
      toast({
          title: "Validation Error",
          description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

      console.log('[handleAddTimeSlot] Adding time slot:', {
        teacher_id: profile.id,
        day_of_week: newTimeSlot.day_of_week,
      start_time: newTimeSlot.start_time,
      end_time: newTimeSlot.end_time,
        slot_type: newTimeSlot.slot_type,
        max_students: newTimeSlot.max_students,
      description: newTimeSlot.description
      });

      const { data, error } = await supabase
        .from('time_slots')
        .insert({
          teacher_id: profile.id,
          day_of_week: newTimeSlot.day_of_week,
          start_time: newTimeSlot.start_time,
          end_time: newTimeSlot.end_time,
          slot_type: newTimeSlot.slot_type,
          max_students: newTimeSlot.max_students,
          description: newTimeSlot.description,
          is_available: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Time slot created successfully:', data);
      setTimeSlots([...timeSlots, data]);
      
      // Reset form and close modal
      setNewTimeSlot({
        day_of_week: 'Monday',
        start_time: '',
        end_time: '',
        slot_type: 'regular',
        max_students: 1,
        description: ''
      });
      setShowTimeSlotModal(false);

      toast({
        title: "Success",
        description: "Time slot added successfully!",
      });
    } catch (error) {
      console.error('[handleAddTimeSlot] JS error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add time slot",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTimeSlot = async (slotId: string, updates: Partial<TimeSlot>) => {
    try {
      // Validate time fields if they're being updated
      if (updates.start_time && updates.end_time) {
        if (updates.start_time >= updates.end_time) {
          toast({
            title: "Validation Error",
            description: "End time must be after start time",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await supabase
        .from('time_slots')
        .update(updates)
        .eq('id', slotId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTimeSlots(timeSlots.map(slot => 
        slot.id === slotId ? { ...slot, ...data } : slot
      ));

      // Close modal and reset form
      setShowTimeSlotModal(false);
      setEditingTimeSlot(null);
      setNewTimeSlot({
        day_of_week: 'Monday',
        start_time: '',
        end_time: '',
        slot_type: 'regular',
        max_students: 1,
        description: ''
      });

      toast({
        title: "Success",
        description: "Time slot updated successfully!",
      });
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast({
        title: "Error",
        description: "Failed to update time slot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', slotId);

      if (error) {
        throw error;
      }

      setTimeSlots(timeSlots.filter(slot => slot.id !== slotId));

      toast({
        title: "Success",
        description: "Time slot deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    }
  };

  // Handle delete time slot with booking check
  const handleDeleteTimeSlotWithCheck = (slot: TimeSlot) => {
    if (hasBookings(slot.id)) {
      const bookingCount = getBookingCount(slot.id);
      const confirmed = window.confirm(
        `This time slot has ${bookingCount} booking${bookingCount > 1 ? 's' : ''}. ` +
        `Deleting it will also cancel all associated bookings. Are you sure you want to continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    handleDeleteTimeSlot(slot.id);
  };

  // Check if a time slot has any bookings
  const hasBookings = (slotId: string) => {
    return bookings.some(booking => booking.time_slot_id === slotId);
  };

  // Get booking count for a time slot
  const getBookingCount = (slotId: string) => {
    return bookings.filter(booking => booking.time_slot_id === slotId).length;
  };

  // Determine slot status based on bookings and capacity
  const getSlotStatus = (slot: TimeSlot) => {
    const bookingCount = getBookingCount(slot.id);
    const maxStudents = slot.max_students || 1;
    
    if (bookingCount === 0) {
      return { status: 'Available', color: 'bg-green-100 text-green-800' };
    } else if (bookingCount >= maxStudents) {
      return { status: 'Booked', color: 'bg-red-100 text-red-800' };
    } else {
      // Group slot with some bookings but still has capacity
      return { 
        status: `Partially Booked (${bookingCount}/${maxStudents})`, 
        color: 'bg-orange-100 text-orange-800' 
      };
    }
  };

  // Handle edit time slot with booking check
  const handleEditTimeSlot = (slot: TimeSlot) => {
    if (hasBookings(slot.id)) {
      toast({
        title: "Cannot Edit",
        description: "This time slot has bookings and cannot be edited. Please cancel existing bookings first.",
        variant: "destructive",
      });
      return;
    }
    setEditingTimeSlot(slot);
    setNewTimeSlot({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_type: slot.slot_type || 'regular',
      max_students: slot.max_students || 1,
      description: slot.description || ''
    });
    setShowTimeSlotModal(true);
  };

  // Add state for time slot management
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState({
    day_of_week: 'Monday',
    start_time: '',
    end_time: '',
    slot_type: 'regular',
    max_students: 1,
    description: ''
  });

  // Helper to normalize day_of_week display (handles string day names)
  const getDayName = (dayOfWeek: string) => {
    // If it's already a valid day name, return it trimmed
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const trimmedDay = (dayOfWeek || '').trim();
    
    // Check if it's a valid day name
    if (validDays.includes(trimmedDay)) {
      return trimmedDay;
    }
    
    // If it's a number or invalid, default to Monday
    return "Monday";
  };



  useEffect(() => {
    const checkUserRole = async () => {
      console.log('[TeacherDashboard] checkUserRole called');
      
      if (!user) {
        console.log('[TeacherDashboard] No user, skipping checkUserRole');
        return;
      }

      try {
        console.log('[TeacherDashboard] Checking user role for:', user.email);
        
        // First try to find teacher by user_id (Auth UID)
        let { data: teacherProfile, error: teacherError } = await supabase
              .from('teachers')
              .select('*')
          .eq('user_id', user.id)
              .single();

        console.log('[TeacherDashboard] Teacher lookup by user_id:', {
          found: !!teacherProfile,
          profile: teacherProfile,
          error: teacherError
        });

        // If not found by user_id, try by email
        if (!teacherProfile && user.email) {
          const { data: teacherByEmail, error: emailError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .single();

          console.log('[TeacherDashboard] Teacher lookup by email:', {
            found: !!teacherByEmail,
            profile: teacherByEmail,
            error: emailError
          });

          teacherProfile = teacherByEmail;
          teacherError = emailError;
        }

        if (teacherProfile) {
          console.log('[TeacherDashboard] Teacher profile found:', teacherProfile);
          setProfile(teacherProfile);
          setIsTeacher(true);
          setIsApproved(teacherProfile.status === 'approved');
        } else {
          console.log('[TeacherDashboard] No teacher profile found');
            setIsTeacher(false);
            setIsApproved(false);
        }
      } catch (error) {
        console.error('[TeacherDashboard] Error in checkUserRole:', error);
        setIsTeacher(false);
        setIsApproved(false);
      } finally {
        setChecking(false);
      }
    };
    checkUserRole();
  }, [user]);

  // Fetch teacher data when profile is set
  useEffect(() => {
    if (profile && isTeacher && isApproved) {
      console.log('[TeacherDashboard] Profile set, fetching teacher data for:', profile.id);
      fetchTeacherData(profile.id);
    }
  }, [profile, isTeacher, isApproved]);

  // Refresh meetings when opening the Video Conferencing tab
  useEffect(() => {
    if (activeTab === 'video-conferencing' && profile?.id) {
      fetchMeetingRooms();
      fetchTeacherBookings();
      refreshInstantMeetings();
    }
  }, [activeTab, profile?.id]);

  // Refetch meetings when returning to the browser tab
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && profile?.id) {
        fetchMeetingRooms();
        if (activeTab === 'video-conferencing' || activeTab === 'bookings') {
          fetchTeacherBookings();
          refreshInstantMeetings();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [profile?.id, activeTab]);

  // Realtime meeting updates for teacher
  useEffect(() => {
    if (!profile?.id || !profile?.user_id) return;

    const refreshMeetings = () => {
      fetchMeetingRooms();
      fetchTeacherBookings();
      refreshInstantMeetings();
    };

    const channel = supabase
      .channel(`teacher-meetings-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_rooms', filter: `teacher_id=eq.${profile.id}` },
        refreshMeetings
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'instant_meetings', filter: `host_id=eq.${profile.user_id}` },
        refreshMeetings
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `teacher_id=eq.${profile.id}` },
        refreshMeetings
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.user_id]);

  const fetchTeacherData = async (teacherId: string) => {
    console.log('[TeacherDashboard] fetchTeacherData called with teacherId:', teacherId);
    
    try {
      // Fetch teacher's time slots
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('day_of_week', { ascending: true });

      if (timeSlotsError) {
        console.error('❌ Error fetching time slots:', timeSlotsError);
      } else {
        console.log('✅ Time slots loaded:', timeSlotsData?.length || 0);
        console.log('📋 Time slots data:', timeSlotsData);
        setTimeSlots(timeSlotsData || []);
      }

      // Fetch teacher's lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('lesson_date', { ascending: false });

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      } else {
        setLessons(lessonsData || []);
        console.log('[TeacherDashboard] Lessons loaded:', lessonsData?.length || 0);
      }

      

      // Fetch portal messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (!messagesError && messagesData) {
        setMessages(messagesData);
        console.log('[TeacherDashboard] Messages loaded:', messagesData?.length || 0);
      }

      // Fetch recent assignments from teacher's classrooms
      await fetchRecentAssignments();

      // Fetch students for messaging
      await fetchStudents();
      
      // Fetch admin profiles for messaging
      await fetchAdminProfiles();
      
      // Fetch meeting rooms
      await fetchMeetingRooms();
      
      // Fetch teacher bookings
      await fetchTeacherBookings();

      // Fetch notifications
      await fetchNotifications();

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    }
  };

  // Refresh instant meetings (called when a new meeting is created)
  const refreshInstantMeetings = async () => {
    if (!profile?.user_id) return;
    
    try {
      const instantMeetings = await getUserInstantMeetings(profile.user_id);
      const hostedMeetings = instantMeetings.filter(meeting => meeting.hostId === profile.user_id);
      setTeacherInstantMeetings(hostedMeetings);
    } catch (error) {
      console.error('Error refreshing instant meetings:', error);
    }
  };

  // Fetch notifications for teacher
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadNotificationCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fetch recent assignments from teacher's classrooms
  const fetchRecentAssignments = async () => {
    if (!profile?.id) return;
    
    try {
      // Get teacher's classrooms
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('teacher_id', profile.id)
        .eq('status', 'approved');

      if (classroomsError || !classroomsData?.length) {
        console.log('[TeacherDashboard] No classrooms found for teacher');
        setRecentAssignments([]);
        return;
      }

      const classroomIds = classroomsData.map(c => c.id);

      // Get recent assignments from these classrooms
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('classroom_posts')
        .select(`
          id:post_id,
          content,
          assignment_title,
          due_date,
          max_points,
          is_timed,
          time_limit_minutes,
          created_at,
          classrooms!inner(name)
        `)
        .in('classroom_id', classroomIds)
        .eq('is_assignment', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (assignmentsError) {
        console.error('[TeacherDashboard] Error fetching assignments:', assignmentsError);
        setRecentAssignments([]);
        return;
      }

      // Transform the data for display
      const transformedAssignments = assignmentsData?.map(assignment => ({
        id: assignment.post_id,
        title: assignment.assignment_title || 'Untitled Assignment',
        content: assignment.content,
        dueDate: assignment.due_date,
        maxPoints: assignment.max_points,
        isTimed: assignment.is_timed,
        timeLimit: assignment.time_limit_minutes,
        classroomName: assignment.classrooms?.name || 'Unknown Classroom',
        createdAt: assignment.created_at
      })) || [];

      setRecentAssignments(transformedAssignments);
      console.log('[TeacherDashboard] Recent assignments loaded:', transformedAssignments.length);
    } catch (error) {
      console.error('[TeacherDashboard] Error in fetchRecentAssignments:', error);
      setRecentAssignments([]);
    }
  };

  // Fetch students who have booked sessions with this teacher
  const fetchStudents = async () => {
    if (!profile?.id) return;
    
    try {
      // Get students who have bookings with this teacher
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, user_id, student_name, email, phone, instrument, 
          learning_mode, age, proficiency_level, status, enrollment_date,
          bookings!inner(teacher_id)
        `)
        .eq('bookings.teacher_id', profile.id)
        .not('user_id', 'is', null);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      } else {
        // Remove duplicates (students might have multiple bookings)
        const uniqueStudents = studentsData?.reduce((acc: any[], student) => {
          if (!acc.find(s => s.id === student.id)) {
            // Remove the bookings data from the student object
            const { bookings, ...studentData } = student;
            acc.push(studentData);
          }
          return acc;
        }, []) || [];
        
        setStudents(uniqueStudents);
        console.log('[TeacherDashboard] Students with bookings loaded:', uniqueStudents.length);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Fetch admin profiles for messaging
  const fetchAdminProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .in('role', ['admin', 'super_admin'])
        .order('email', { ascending: true });

      if (error) {
        console.error('Error fetching admin profiles:', error);
        return;
      }

      if (data) {
        setAdminProfiles(data);
      }
    } catch (error) {
      console.error('Error in fetchAdminProfiles:', error);
    }
  };

  // Fetch user's meeting rooms
  const fetchMeetingRooms = async () => {
    if (!profile) return;

    try {
      const rooms = await getUserMeetingRooms(profile.id, 'teacher');
      setMeetingRooms(rooms);
      
      // Also fetch invited meetings for teachers
      if (profile.user_id) {
        const invited = await getUserInvitedMeetings(profile.user_id);
        setInvitedMeetings(invited);
        
        // Fetch teacher's own instant meetings
        const instantMeetings = await getUserInstantMeetings(profile.user_id);
        // Filter to only show meetings where teacher is the host
        const hostedMeetings = instantMeetings.filter(meeting => meeting.hostId === profile.user_id);
        setTeacherInstantMeetings(hostedMeetings);
      }
    } catch (error) {
      console.error('Error fetching meeting rooms:', error);
    }
  };



  // Fetch teacher's bookings with complete information
  const fetchTeacherBookings = async () => {
    console.log('[TeacherDashboard] fetchTeacherBookings called');
    
    if (!profile) {
      console.log('[TeacherDashboard] No profile, skipping fetchTeacherBookings');
      return;
    }

    try {
      console.log('[TeacherDashboard] Fetching bookings for teacher:', {
        profileId: profile.id,
        profileName: profile.name,
        profileEmail: profile.email,
        profileUserId: profile.user_id
      });
      
      // Fetch all bookings for this teacher with all necessary fields
      const { data: allBookings, error: allBookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          time_slot_id,
          student_id,
          teacher_id,
          booking_date,
          start_time,
          end_time,
          status,
          lesson_type,
          notes,
          created_at,
          updated_at
        `)
        .eq('teacher_id', profile.id)
        .order('booking_date', { ascending: true });
      
      console.log('[TeacherDashboard] All bookings for teacher:', {
        bookings: allBookings,
        error: allBookingsError,
        count: allBookings?.length || 0
      });
      
      // Check if teacher exists in teachers table
      const { data: teacherCheck, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', profile.id);
      
      console.log('[TeacherDashboard] Teacher check:', {
        teacher: teacherCheck,
        error: teacherError,
        found: teacherCheck?.length > 0
      });
      
      // Check auth user info
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[TeacherDashboard] Auth user:', user);
      
      // Fetch student information separately
      if (allBookings && allBookings.length > 0) {
        const studentIds = [...new Set(allBookings.map(booking => booking.student_id))];
        console.log('[TeacherDashboard] Fetching student info for IDs:', studentIds);
        
        // Try multiple approaches to get student data
        console.log('[TeacherDashboard] Student IDs to fetch:', studentIds);
        
        // Approach 1: Direct query
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            user_id,
            student_name,
            email,
            phone,
            instrument,
            learning_mode,
            age,
            proficiency_level,
            status
          `)
          .in('id', studentIds);
        
        console.log('[TeacherDashboard] Direct query result:', {
          students: studentsData,
          error: studentsError,
          count: studentsData?.length || 0
        });
        
        // Approach 2: If direct query fails, try individual queries
        let finalStudentsData = studentsData;
        if (!studentsData || studentsData.length === 0) {
          console.log('[TeacherDashboard] Direct query failed, trying individual queries...');
          
          const individualStudents = [];
          for (const studentId of studentIds) {
            console.log('[TeacherDashboard] Fetching individual student:', studentId);
            const { data: singleStudent, error: singleError } = await supabase
              .from('students')
              .select('*')
              .eq('id', studentId)
              .single();
            
            console.log('[TeacherDashboard] Individual student result:', {
              student: singleStudent,
              error: singleError,
              studentId: studentId
            });
            
            if (singleStudent) {
              individualStudents.push(singleStudent);
            }
          }
          
          finalStudentsData = individualStudents;
          console.log('[TeacherDashboard] Individual students collected:', finalStudentsData);
          
          // Approach 3: If still no data, create a fallback student object
          if (finalStudentsData.length === 0) {
            console.log('[TeacherDashboard] No student data found, creating fallback...');
            finalStudentsData = studentIds.map(studentId => ({
              id: studentId,
              user_id: studentId, // Use the same ID as fallback
              student_name: `Student ${studentId.slice(0, 8)}`,
              email: 'student@example.com',
              phone: '',
              instrument: 'Unknown',
              learning_mode: 'in-person',
              age: 0,
              proficiency_level: 'beginner',
              status: 'active'
            }));
            console.log('[TeacherDashboard] Created fallback students:', finalStudentsData);
          }
        }
        
        // Fetch time slot information for each booking
        const timeSlotIds = [...new Set(allBookings.map(booking => booking.time_slot_id).filter(Boolean))];
        console.log('[TeacherDashboard] Fetching time slot info for IDs:', timeSlotIds);
        
        const { data: timeSlotsData, error: timeSlotsError } = await supabase
          .from('time_slots')
          .select(`
            id,
            teacher_id,
            day_of_week,
            start_time,
            end_time,
            is_available,
            slot_type,
            max_students,
            description
          `)
          .in('id', timeSlotIds);
        
        console.log('[TeacherDashboard] Time slots data:', {
          timeSlots: timeSlotsData,
          error: timeSlotsError
        });
        
        // Create maps for easy lookup
        const studentsMap = {};
        if (finalStudentsData) {
          finalStudentsData.forEach(student => {
            studentsMap[student.id] = student;
          });
        }
        
        const timeSlotsMap = {};
        if (timeSlotsData) {
          timeSlotsData.forEach(slot => {
            timeSlotsMap[slot.id] = slot;
          });
        }
        
                  // Process bookings with all information
          const bookingsWithFullInfo = allBookings.map(booking => {
            const student = studentsMap[booking.student_id];
            const timeSlot = timeSlotsMap[booking.time_slot_id];
            
            console.log('[TeacherDashboard] Processing booking:', {
              bookingId: booking.id,
              studentId: booking.student_id,
              student: student,
              timeSlotId: booking.time_slot_id,
              timeSlot: timeSlot
            });
            
            return {
            ...booking,
            // Student information
            student_name: student?.student_name || 'Unknown Student',
            student_email: student?.email || '',
            student_phone: student?.phone || '',
            student_instrument: student?.instrument || '',
            student_learning_mode: student?.learning_mode || '',
            student_age: student?.age || '',
            student_proficiency: student?.proficiency_level || '',
            student_status: student?.status || '',
            // Time slot information
            day_of_week: timeSlot?.day_of_week || '',
            slot_type: timeSlot?.slot_type || '',
            max_students: timeSlot?.max_students || 1,
            slot_description: timeSlot?.description || '',
            slot_is_available: timeSlot?.is_available || false,
            // Booking information
            booking_status: booking.status,
            booking_lesson_type: booking.lesson_type,
            booking_notes: booking.notes,
            // Formatted dates and times
            formatted_date: new Date(booking.booking_date).toLocaleDateString(),
            formatted_start_time: booking.start_time,
            formatted_end_time: booking.end_time,
            // Calculate if booking is upcoming or past
            is_upcoming: new Date(`${booking.booking_date}T${booking.start_time}`) > new Date(),
            is_past: new Date(`${booking.booking_date}T${booking.start_time}`) <= new Date()
          };
        });
        
        console.log('[TeacherDashboard] Processed bookings with full info:', bookingsWithFullInfo);
        
        setBookings(bookingsWithFullInfo);
        
        // Separate upcoming and past bookings
        const upcoming = bookingsWithFullInfo.filter(booking => booking.is_upcoming);
        const past = bookingsWithFullInfo.filter(booking => booking.is_past);
        
        setUpcomingBookings(upcoming);
        setPastBookings(past);
        
        console.log('[TeacherDashboard] Processed bookings:', {
          total: bookingsWithFullInfo.length,
          upcoming: upcoming.length,
          past: past.length
        });
      } else {
        console.log('[TeacherDashboard] No bookings found, setting empty arrays');
        setBookings([]);
        setUpcomingBookings([]);
        setPastBookings([]);
      }
    } catch (error) {
      console.error('Error fetching teacher bookings:', error);
    }
  };

  // Handle opening video conference
  const handleOpenVideoConference = (meetingRoom: MeetingRoom) => {
    setSelectedMeetingRoom(meetingRoom);
    setShowVideoConferenceModal(true);
  };

  // Create meeting room for existing booking if it doesn't have one
                  const createMeetingRoomForExistingBooking = async (booking: any) => {
                  try {
                    // Check if meeting room already exists for this booking
                    const { getMeetingRoomByBooking } = await import('../lib/videoConferencing');
                    const existingMeetingRoom = await getMeetingRoomByBooking(booking.id);
                    
                    if (existingMeetingRoom) {
                      toast({
                        title: "Meeting Room Already Exists",
                        description: "A video conference room already exists for this booking.",
                      });
                      return existingMeetingRoom;
                    }
                    
                    console.log('[TeacherDashboard] Creating meeting room for existing booking:', booking);
                    
                    const { createMeetingRoom } = await import('../lib/videoConferencing');
                    
                    // Get student and teacher names
                    const studentName = booking.student_name || 'Student';
                    const teacherName = profile?.name || 'Teacher';
                    
                    const meetingRoom = await createMeetingRoom(
                      booking.id,
                      booking.teacher_id,
                      booking.student_id,
                      teacherName,
                      studentName,
                      booking.booking_lesson_type || booking.lesson_type || 'regular',
                      `${booking.booking_date}T${booking.start_time}`,
                      `${booking.booking_date}T${booking.end_time}`,
                      booking.booking_notes || booking.notes
                    );
                    
                    console.log('[TeacherDashboard] Meeting room created for existing booking:', meetingRoom);
                    
                    // Update booking with meeting link
                    await supabase
                      .from('bookings')
                      .update({ 
                        meeting_link: meetingRoom.meetingUrl,
                        mode: 'online'
                      })
                      .eq('id', booking.id);
                      
                    toast({
                      title: "Meeting Room Created",
                      description: `Meeting room created successfully for ${studentName} on ${new Date(booking.booking_date).toLocaleDateString()}`,
                    });

                    await fetchTeacherBookings();
                      
                    return meetingRoom;
    } catch (error) {
                    console.error('[TeacherDashboard] Error creating meeting room for existing booking:', error);
      toast({
                      title: "Error Creating Meeting Room",
                      description: error instanceof Error ? error.message : "Failed to create meeting room. Please try again.",
        variant: "destructive",
      });
                    return null;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleAddLesson = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          student_id: newLesson.student_id,
          teacher_id: profile?.id,
          title: newLesson.title,
          description: newLesson.description,
          lesson_date: newLesson.lesson_date,
          start_time: newLesson.start_time,
          end_time: newLesson.end_time,
          lesson_type: newLesson.lesson_type,
          notes: newLesson.notes
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setLessons([...lessons, data]);
      setShowLessonModal(false);
      setNewLesson({
        title: '',
        description: '',
        lesson_date: '',
        start_time: '',
        end_time: '',
        lesson_type: 'regular',
        student_id: '',
        notes: ''
      });

      toast({
        title: "Success",
        description: "Lesson scheduled successfully!",
      });
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast({
        title: "Error",
        description: "Failed to schedule lesson",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          sender_id: user.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          message: newMessage.message
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setShowMessageModal(false);
      setNewMessage({
        subject: '',
        message: '',
        recipient_id: ''
      });

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleAddMaterial = async () => {
    try {
      // In a real implementation, you'd upload the file first
      const { data, error } = await supabase
        .from('lesson_materials')
        .insert({
          title: newMaterial.title,
          description: newMaterial.description,
          file_url: newMaterial.file_url,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setMaterials([...materials, data]);
      setShowMaterialModal(false);
      setNewMaterial({
        title: '',
        description: '',
        file_url: ''
      });

      toast({
        title: "Success",
        description: "Material uploaded successfully!",
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Error",
        description: "Failed to upload material",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert lessons and bookings to calendar events
  const lessonEventKeys = lessons.map(l => `${l.lesson_date}_${l.start_time}_${l.end_time}`);
  

  
  const calendarEvents: LessonEvent[] = [
    ...lessons.map(lesson => {
      const event = {
    id: lesson.id,
    title: lesson.title || 'Lesson',
    start: new Date(`${lesson.lesson_date}T${lesson.start_time}`),
    end: new Date(`${lesson.lesson_date}T${lesson.end_time}`),
    status: lesson.status,
    lesson_type: lesson.lesson_type,
    student_name: lesson.student_name,
    notes: lesson.notes,
    lesson_date: lesson.lesson_date,
    start_time: lesson.start_time,
    end_time: lesson.end_time,
        materials_url: lesson.materials_url || [],
    ...lesson,
      };
              return event;
      }),
    ...bookings.filter(booking => {
      // Only show if no lesson exists for this slot/date/time
      const key = `${booking.booking_date}_${booking.start_time}_${booking.end_time}`;
              const shouldInclude = !lessonEventKeys.includes(key) && booking.booking_status !== 'cancelled';
        return shouldInclude;
    }).map(booking => {
      const event = {
        id: booking.id,
        title: booking.booking_status === 'pending' ? 'Pending Booking' : 
               (booking.booking_lesson_type === 'makeup' ? 'Make-up Booking' : 
               `${booking.student_name} - ${booking.student_instrument} (${booking.booking_lesson_type || 'Regular'})`),
        start: new Date(`${booking.booking_date}T${booking.start_time}`),
        end: new Date(`${booking.booking_date}T${booking.end_time}`),
        status: booking.booking_status || booking.status,
        lesson_type: booking.booking_lesson_type || booking.lesson_type || 'lesson',
        student_name: booking.student_name,
        student_instrument: booking.student_instrument,
        student_learning_mode: booking.student_learning_mode,
        student_age: booking.student_age,
        student_proficiency: booking.student_proficiency,
        day_of_week: booking.day_of_week,
        slot_type: booking.slot_type,
        notes: booking.booking_notes || booking.notes,
        lesson_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        formatted_date: booking.formatted_date,
        formatted_start_time: booking.formatted_start_time,
        formatted_end_time: booking.formatted_end_time,
        is_upcoming: booking.is_upcoming,
        is_past: booking.is_past,
        materials_url: booking.materials_url || [],
        ...booking,
              };
        return event;
      }),
  ];
  


  // Filtered events for the calendar
  const filteredCalendarEvents = useMemo(() => {
    return calendarEvents.filter(event =>
      (calendarStudent === 'all' || event.student_name === calendarStudent) &&
      (calendarLessonType === 'all' || event.lesson_type === calendarLessonType) &&
      (calendarStatus === 'all' || event.status === calendarStatus)
    );
  }, [calendarEvents, calendarStudent, calendarLessonType, calendarStatus]);

  // Handler for event selection
  const handleSelectEvent = (event: LessonEvent) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };



  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<any>(null);
  const [availableTimeSlotsForReschedule, setAvailableTimeSlotsForReschedule] = useState<TimeSlot[]>([]);

  // Handle reschedule booking
  const handleRescheduleBooking = async () => {
    if (!selectedBookingForReschedule || !rescheduleTimeSlot || !rescheduleDate) {
      toast({
        title: "Error",
        description: "Please select a new date and time slot for rescheduling.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the booking with new date and time slot
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          booking_date: rescheduleDate,
          start_time: rescheduleTimeSlot.start_time,
          end_time: rescheduleTimeSlot.end_time,
          time_slot_id: rescheduleTimeSlot.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBookingForReschedule.id);

      if (updateError) {
        throw updateError;
      }

      // Update meeting room if it exists
      if (selectedBookingForReschedule.meeting_room) {
        const { updateMeetingRoomStatus } = await import('../lib/videoConferencing');
        await updateMeetingRoomStatus(selectedBookingForReschedule.meeting_room.id, 'cancelled');
        
        // Create new meeting room for the rescheduled booking
        const { createMeetingRoom } = await import('../lib/videoConferencing');
        const teacherName = profile?.name || 'Teacher';
        
        const newMeetingRoom = await createMeetingRoom(
          selectedBookingForReschedule.id,
          selectedBookingForReschedule.teacher_id,
          selectedBookingForReschedule.student_id,
          teacherName,
          selectedBookingForReschedule.student_name,
          selectedBookingForReschedule.booking_lesson_type || selectedBookingForReschedule.lesson_type || 'regular',
          `${rescheduleDate}T${rescheduleTimeSlot.start_time}`,
          `${rescheduleDate}T${rescheduleTimeSlot.end_time}`,
          `Rescheduled from ${selectedBookingForReschedule.booking_date}`
        );

        // Update booking with new meeting link
        await supabase
          .from('bookings')
          .update({ 
            meeting_link: newMeetingRoom.meetingUrl,
            mode: 'online'
          })
          .eq('id', selectedBookingForReschedule.id);
      }

      toast({
        title: "Booking Rescheduled",
        description: `Booking has been successfully rescheduled to ${new Date(rescheduleDate).toLocaleDateString()} at ${rescheduleTimeSlot.start_time}`,
      });

      // Refresh data
      await fetchTeacherBookings();
      await fetchAvailableTimeSlotsForReschedule();

      // Close modal and reset state
      setShowRescheduleModal(false);
      setSelectedBookingForReschedule(null);
      setRescheduleDate('');
      setRescheduleTimeSlot(null);

    } catch (error) {
      console.error('Error rescheduling booking:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch available time slots for rescheduling
  const fetchAvailableTimeSlotsForReschedule = async () => {
    if (!profile) return;

    try {
      const { data: timeSlots, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('teacher_id', profile.id)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching time slots for reschedule:', error);
        return;
      }

      setAvailableTimeSlotsForReschedule(timeSlots || []);
    } catch (error) {
      console.error('Error fetching time slots for reschedule:', error);
    }
  };

  // Open reschedule modal
  const openRescheduleModal = (booking: any) => {
    setSelectedBookingForReschedule(booking);
    setShowRescheduleModal(true);
    fetchAvailableTimeSlotsForReschedule();
  };

  // Classroom handlers
  const fetchTeacherClassrooms = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, name, description, status, class_code')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false });
    if (!error) setTeacherClassrooms(data || []);
  };

  const fetchRecentQuizAssignments = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        created_at,
        classroom_id,
        classrooms!inner(
          id,
          name,
          teacher_id
        )
      `)
      .eq('classrooms.teacher_id', profile.id)
      .eq('has_quiz', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error) {
      const assignments = data?.map(post => ({
        id: post.id,
        title: post.title,
        classroom_id: post.classroom_id,
        classroom_name: post.classrooms?.name || 'Unknown Classroom',
        created_at: post.created_at
      })) || [];
      setRecentAssignments(assignments);
    }
  };

  useEffect(() => {
    if (profile && isTeacher && isApproved) {
      fetchTeacherClassrooms();
      fetchRecentQuizAssignments();
    }
  }, [profile, isTeacher, isApproved]);

  const handleCreateClassroom = async () => {
    if (!profile || !newClassroom.name.trim()) return;
    const { data, error } = await supabase.rpc('create_classroom', {
      teacher_id_param: profile.id,
      name_param: newClassroom.name.trim(),
      description_param: newClassroom.description || null
    });
    if (!error) {
      setShowCreateClassroomModal(false);
      setNewClassroom({ name: '', description: '' });
      await fetchTeacherClassrooms();
      toast({ title: 'Submitted', description: 'Classroom submitted for approval.' });
    } else {
      toast({ title: 'Error', description: 'Failed to create classroom.', variant: 'destructive' });
    }
  };

  const handleCopyClassCode = async (classCode: string) => {
    try {
      await navigator.clipboard.writeText(classCode);
      setCopiedCodes(prev => new Set(prev).add(classCode));
      toast({ title: 'Success', description: 'Class code copied to clipboard!' });
      
      // Reset the copied state after 3 seconds
      setTimeout(() => {
        setCopiedCodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(classCode);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({ title: 'Error', description: 'Failed to copy class code', variant: 'destructive' });
    }
  };

  const handleViewStudentDetails = async (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetailsModal(true);
    
    // Fetch student's booking history with this teacher
    if (!profile?.id) return;
    
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          time_slots(day_of_week, start_time, end_time)
        `)
        .eq('student_id', student.id)
        .eq('teacher_id', profile.id)
        .order('booking_date', { ascending: false });

      if (!error) {
        setStudentBookings(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching student bookings:', error);
    }
  };

  // Pagination logic
  const totalStudents = students.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);
  const startIndex = (studentsPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const paginatedStudents = students.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setStudentsPage(page);
  };

  const selectTeacherClassroom = async (c: any) => {
    setSelectedTeacherClassroom(c);
    const { data, error } = await supabase.rpc('get_classroom_feed', { classroom_id_param: c.id });
    if (!error) setTeacherClassroomFeed(data || []);
  };

  const handleCreatePost = async () => {
    if (!selectedTeacherClassroom || !profile) return;
    const content = newPostContent.trim();
    if (!content) return;
    const { error } = await supabase.rpc('create_classroom_post', {
      classroom_id_param: selectedTeacherClassroom.id,
      author_teacher_id_param: profile.id,
      content_param: content
    });
    if (!error) {
      setNewPostContent('');
      const { data } = await supabase.rpc('get_classroom_feed', { classroom_id_param: selectedTeacherClassroom.id });
      setTeacherClassroomFeed(data || []);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="text-lg text-muted-foreground">Checking account status...</div>
      </div>
    );
  }
  if (!isTeacher || !isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="text-lg text-muted-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      {/* Hero/Header Section - Mobile responsive */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 shadow-lg">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">
          <Link to="/" className="group">
            <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-16 sm:h-20 w-16 sm:w-20 mb-4 rounded-full shadow-lg border-4 border-white/80 bg-white/80 object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
            Damon Music Academy
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Teacher Portal
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white/80 shadow-lg">
              <AvatarImage 
                src={profile?.avatar_url} 
                alt={profile?.name || 'Teacher'} 
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg">
                {profile?.name?.charAt(0)?.toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-base sm:text-lg font-semibold text-white drop-shadow">Welcome, {profile?.name || 'Teacher'}</span>
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-semibold shadow">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Teacher
            </span>
          </div>
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-4 px-4">Empowering education and managing your teaching journey</p>
          <div className="flex flex-col sm:flex-row justify-center w-full max-w-4xl mx-auto mt-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 text-xs sm:text-sm relative"
              onClick={() => setActiveTab('notifications')}
            >
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-700" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 text-xs sm:text-sm">
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-700" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </section>
      <main className="w-full max-w-6xl px-2 sm:px-4 lg:px-8 py-4 sm:py-8 mx-auto">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-3 sm:p-4 lg:p-8 shadow-xl border border-primary/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            {/* Mobile dropdown for tabs */}
            <div className="lg:hidden">
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <SelectTrigger className="w-full bg-white/80 shadow-sm rounded-lg border border-primary/20">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="students">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Students</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="messages">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Messages</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="classroom">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Classroom</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz-management">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Quiz Management</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="availability">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Availability</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="schedule">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Schedule</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="bookings">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Bookings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="video-conferencing">
                    <div className="flex items-center gap-2 relative">
                      <Video className="w-4 h-4" />
                      <span>Video Calls</span>
                      {/* Live Meeting Notification Badge for mobile */}
                      {invitedMeetings.filter(m => m.status === 'active').length > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-4 rounded-full animate-pulse flex items-center justify-center">
                          {invitedMeetings.filter(m => m.status === 'active').length}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="instant-meetings">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      <span>Instant Meet</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="account">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Account</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Responsive tabs: scroll on small, wrap on larger screens */}
            <TabsList className="flex w-full bg-white/80 shadow-sm rounded-lg gap-1 justify-start p-1 overflow-x-auto sm:justify-center sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
              <TabsTrigger value="dashboard" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-md transition-all">
                <Bell className="w-5 h-5" />
                <span>Dashboard</span>
              </TabsTrigger>

              <TabsTrigger value="students" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-secondary data-[state=active]:bg-secondary/10 data-[state=active]:shadow-md transition-all">
                <Users className="w-5 h-5" />
                <span>Students</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-pink-600 data-[state=active]:bg-pink-100 data-[state=active]:shadow-md transition-all relative">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
                {messages.filter(m => !m.is_read).length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {messages.filter(m => !m.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="classroom" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all">
                <BookOpen className="w-5 h-5" />
                <span>Classroom</span>
              </TabsTrigger>
              <TabsTrigger value="quiz-management" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-purple-700 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md transition-all">
                <FileText className="w-5 h-5" />
                <span>Quiz Management</span>
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:shadow-md transition-all">
                <Clock className="w-5 h-5" />
                <span>Availability</span>
              </TabsTrigger>

              <TabsTrigger value="schedule" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:shadow-md transition-all">
                <CalendarIcon className="w-5 h-5" />
                <span>Schedule</span>
              </TabsTrigger>

              <TabsTrigger value="bookings" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all">
                <Calendar className="w-5 h-5" />
                <span>Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="video-conferencing" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-indigo-700 data-[state=active]:bg-indigo-100 data-[state=active]:shadow-md transition-all relative">
                <Video className="w-5 h-5" />
                <span>Video Calls</span>
                {/* Live Meeting Notification Badge */}
                {invitedMeetings.filter(m => m.status === 'active').length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 rounded-full animate-pulse flex items-center justify-center">
                    {invitedMeetings.filter(m => m.status === 'active').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:shadow-md transition-all relative">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="account" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-amber-700 data-[state=active]:bg-amber-100 data-[state=active]:shadow-md transition-all">
                <User className="w-5 h-5" />
                <span>Account</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab - Mobile responsive */}
            <TabsContent value="dashboard" className="mt-6 sm:mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">Active students</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Lessons</CardTitle>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{lessons.filter(l => l.status === 'scheduled').length}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Unread Messages</CardTitle>
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{messages.filter(m => !m.is_read).length}</div>
                    <p className="text-xs text-muted-foreground">New messages</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Available Slots</CardTitle>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{timeSlots.filter(s => s.is_available).length}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Recent Assignments</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Latest classroom work and assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentAssignments.length > 0 ? (
                      <div className="space-y-3">
                        {recentAssignments.slice(0, 3).map(assignment => (
                          <div key={assignment.id} className="flex flex-col p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{assignment.title}</h4>
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                {assignment.classroomName}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{assignment.content}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-3">
                                {assignment.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                {assignment.maxPoints && (
                                  <span className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    {assignment.maxPoints} pts
                                  </span>
                                )}
                                {assignment.isTimed && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {assignment.timeLimit} min
                                  </span>
                                )}
                              </div>
                              <span className="text-xs">
                                {new Date(assignment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {recentAssignments.length > 3 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{recentAssignments.length - 3} more assignments
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No assignments posted yet</p>
                        <p className="text-xs text-gray-400 mt-1">Create assignments in your classrooms to see them here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Recent Messages</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Latest communications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.slice(0, 3).map(message => (
                          <div key={message.id} className={`p-3 rounded-lg ${!message.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                            <h4 className="font-semibold text-sm sm:text-base">{message.subject}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{message.message.substring(0, 50)}...</p>
                            <p className="text-xs text-gray-500">{formatDate(message.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No recent messages</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>



            {/* Students Tab */}
            <TabsContent value="students" className="mt-8">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-blue-50">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    My Students
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Students who have booked sessions with you • {students.length} total
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {students.length > 0 ? (
                    <>
                      {/* Students List */}
                      <div className="space-y-3 mb-6">
                        {paginatedStudents.map((student, index) => (
                          <Card key={student.id} className="hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  {/* Student Avatar */}
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {student.student_name.charAt(0)}
                  </div>
                                  
                                  {/* Student Info - Desktop */}
                                  <div className="hidden md:flex items-center space-x-6 flex-1">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-semibold text-gray-800 text-lg truncate">{student.student_name}</h4>
                                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                        <div className="flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          <span className="truncate">{student.email}</span>
                        </div>
                                        {student.phone && (
                                          <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{student.phone}</span>
                        </div>
                                        )}
                        </div>
                        </div>
                                    
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Music className="w-4 h-4 text-purple-500" />
                                        <span className="text-gray-700">{student.instrument}</span>
                        </div>
                                      <div className="flex items-center gap-1">
                                        <Award className="w-4 h-4 text-blue-500" />
                                        <span className="text-gray-700">{student.proficiency_level}</span>
                        </div>
                      </div>
                                    
                                    <Badge className={`${getStatusColor(student.status)} text-xs flex-shrink-0`}>
                                      {student.status}
                                    </Badge>
                      </div>
                                  
                                  {/* Student Info - Mobile */}
                                  <div className="md:hidden flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-800 truncate">{student.student_name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                      <Music className="w-3 h-3 text-purple-500" />
                                      <span className="truncate">{student.instrument}</span>
                            </div>
                                    <Badge className={`${getStatusColor(student.status)} text-xs mt-2 inline-block`}>
                                      {student.status}
                                    </Badge>
                          </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewStudentDetails(student)}
                                    className="hidden sm:flex"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewStudentDetails(student)}
                                    className="sm:hidden w-8 h-8 p-0"
                                  >
                                    <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                  </div>
                </CardContent>
              </Card>
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, totalStudents)} of {totalStudents} students
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(studentsPage - 1)}
                              disabled={studentsPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <Button
                                    key={page}
                                    variant={studentsPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(page)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {page}
                            </Button>
                                );
                              })}
                              {totalPages > 5 && (
                                <>
                                  <span className="text-gray-400">...</span>
                                  <Button
                                    variant={studentsPage === totalPages ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => goToPage(totalPages)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {totalPages}
                                  </Button>
                                </>
                              )}
                          </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(studentsPage + 1)}
                              disabled={studentsPage === totalPages}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No students have booked sessions yet</p>
                      <p className="text-gray-400 text-sm mt-2">Students will appear here once they book lessons with you</p>
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95 h-[600px]">
                <CardContent className="p-0 h-full">
                  <MessagingUI
                    recipients={(() => {
                      // Students
                      const studentRecipients = students.map(student => ({
                        id: student.id,
                        user_id: student.user_id,
                        name: student.student_name,
                        email: student.email,
                        type: 'student' as const,
                        profile_photo_url: undefined // Students table doesn't have profile_photo_url
                      })).filter(s => s.user_id); // Ensure user_id exists
                      
                      // Admins
                      const adminRecipients = adminProfiles.map(admin => ({
                        id: admin.id,
                        user_id: admin.id,
                        name: `Admin (${admin.email})`,
                        email: admin.email,
                        type: 'admin' as const,
                        profile_photo_url: undefined
                      }));

                      const allRecipients = [
                        ...studentRecipients,
                        ...adminRecipients
                      ];



                      return allRecipients;
                    })()}
                    currentUserId={user?.id || ''}
                    currentUserName={profile?.name || ''}
                    userType="teacher"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classroom Tab */}
            <TabsContent value="classroom" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Classroom</CardTitle>
                    <CardDescription>Create classrooms and post updates</CardDescription>
                  </div>
                  <Dialog open={showCreateClassroomModal} onOpenChange={setShowCreateClassroomModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Classroom
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>New Classroom</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="classroom_name" className="text-right">Name</Label>
                          <Input id="classroom_name" value={newClassroom.name} onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="classroom_desc" className="text-right">Description</Label>
                          <Textarea id="classroom_desc" value={newClassroom.description} onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })} className="col-span-3" />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateClassroomModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateClassroom}>Submit</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Teacher's classrooms list */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">My Classrooms</h4>
                      {teacherClassrooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {teacherClassrooms.map(c => (
                            <Card key={c.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-lg text-gray-800 mb-1">{c.name}</div>
                                    {c.description && (
                                      <div className="text-sm text-gray-600 mb-2 max-w-md">
                                        {c.description}
                                      </div>
                                    )}
                                    <div className="text-sm text-gray-600 mb-2">
                                      Status: <Badge className={`ml-1 ${c.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {c.status}
                                      </Badge>
                            </div>
                                    {c.class_code && (
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="text-sm text-gray-600">Class Code:</span>
                                        <Badge variant="outline" className="font-mono text-sm px-2 py-1">
                                          {c.class_code}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyClassCode(c.class_code);
                                          }}
                                          className="h-6 w-6 p-0 hover:bg-purple-100"
                                        >
                                          {copiedCodes.has(c.class_code) ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                          ) : (
                                            <Copy className="h-3 w-3 text-gray-500" />
                                          )}
                                        </Button>
                          </div>
                                    )}
                        </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => navigate(`/classrooms/${c.id}`)}
                                    className="flex-1"
                                  >
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Open Classroom
                                  </Button>
                                  {c.class_code && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyClassCode(c.class_code);
                                      }}
                                      className="px-3"
                                    >
                                      {copiedCodes.has(c.class_code) ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
                          ))}
                  </div>
                      ) : (
                        <p className="text-gray-500">No classrooms yet.</p>
                      )}
                        </div>

                    {/* Feed composer and posts for selected classroom */}
                    {selectedTeacherClassroom && (
                      <div className="space-y-4">
                        <div className="p-3 border rounded">
                          <div className="font-semibold mb-2">Post to {selectedTeacherClassroom.name}</div>
                          <Textarea placeholder="Share an update with your class" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
                          <div className="mt-2 flex justify-end">
                            <Button size="sm" onClick={handleCreatePost} disabled={!newPostContent.trim()}>Post</Button>
                        </div>
                        </div>
                        <div className="space-y-3">
                          {teacherClassroomFeed.length > 0 ? teacherClassroomFeed.map(post => (
                            <Card key={post.post_id}>
                              <CardHeader>
                                <CardTitle className="text-base">{post.author_name}</CardTitle>
                                <CardDescription>{new Date(post.created_at).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                                <p className="whitespace-pre-wrap">{post.content}</p>
                          </CardContent>
                        </Card>
                          )) : (
                            <p className="text-gray-500">No posts yet.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quiz Management Tab */}
            <TabsContent value="quiz-management" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Quiz Management
                  </CardTitle>
                  <CardDescription>Manage quizzes across all your classrooms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Quick Access to All Classrooms */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Access Any Classroom</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Click on any classroom below to manage quizzes and view student submissions.
                      </p>
                      {teacherClassrooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {teacherClassrooms.map(classroom => (
                            <Card key={classroom.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="font-semibold text-lg text-gray-800 mb-1">{classroom.name}</div>
                                    {classroom.description && (
                                      <div className="text-sm text-gray-600 mb-2 max-w-md">
                                        {classroom.description}
                                      </div>
                                    )}
                                    <div className="text-sm text-gray-600 mb-2">
                                      Status: <Badge className={`ml-1 ${classroom.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {classroom.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    onClick={() => navigate(`/classrooms/${classroom.id}`)}
                                    className="flex-1"
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Manage Quizzes
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No Classrooms Yet</p>
                          <p className="text-sm mb-4">Create a classroom first to start managing quizzes.</p>
                          <Button onClick={() => setShowCreateClassroomModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Classroom
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Recent Quiz Activity */}
                    {recentAssignments.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Recent Quiz Activity</h4>
                        <div className="space-y-2">
                          {recentAssignments.slice(0, 5).map(assignment => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{assignment.title || 'Untitled Quiz'}</div>
                                <div className="text-sm text-gray-600">
                                  {assignment.classroom_name} • {new Date(assignment.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/classrooms/${assignment.classroom_id}`)}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Availability & Time Off</CardTitle>
                  <CardDescription>Request time off or update your availability.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add Time Slot Button and Modal */}
                  <div className="flex justify-end mb-4">
                    <Dialog open={showTimeSlotModal} onOpenChange={setShowTimeSlotModal}>
                      <DialogTrigger asChild>
                        <Button variant="default">+ Add Time Slot</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{editingTimeSlot ? 'Edit Time Slot' : 'Add New Time Slot'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="day_of_week" className="text-right">Day</Label>
                            <Select value={newTimeSlot.day_of_week} onValueChange={v => setNewTimeSlot({...newTimeSlot, day_of_week: v})}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                                  <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="start_time" className="text-right">Start Time</Label>
                            <Input id="start_time" type="time" value={newTimeSlot.start_time} onChange={e => setNewTimeSlot({...newTimeSlot, start_time: e.target.value})} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="end_time" className="text-right">End Time</Label>
                            <Input id="end_time" type="time" value={newTimeSlot.end_time} onChange={e => setNewTimeSlot({...newTimeSlot, end_time: e.target.value})} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="slot_type" className="text-right">Type</Label>
                            <Select value={newTimeSlot.slot_type} onValueChange={v => setNewTimeSlot({...newTimeSlot, slot_type: v})}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="regular">Regular</SelectItem>
                                <SelectItem value="group">Group</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="max_students" className="text-right">Max Students</Label>
                            <Input id="max_students" type="number" min={1} value={newTimeSlot.max_students} onChange={e => setNewTimeSlot({...newTimeSlot, max_students: Number(e.target.value)})} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Textarea id="description" value={newTimeSlot.description} onChange={e => setNewTimeSlot({...newTimeSlot, description: e.target.value})} className="col-span-3" />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setShowTimeSlotModal(false);
                            setEditingTimeSlot(null);
                            setNewTimeSlot({
                              day_of_week: 'Monday',
                              start_time: '',
                              end_time: '',
                              slot_type: 'regular',
                              max_students: 1,
                              description: ''
                            });
                          }}>Cancel</Button>
                          <Button onClick={editingTimeSlot ? () => handleUpdateTimeSlot(editingTimeSlot.id, newTimeSlot) : handleAddTimeSlot}>
                            {editingTimeSlot ? 'Update Slot' : 'Add Slot'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-4">
                    {timeSlots.length > 0 ? (
                      timeSlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">{getDayName(slot.day_of_week)}</h4>
                              <p className="text-sm text-gray-600">{slot.start_time} - {slot.end_time}</p>
                              <p className="text-xs text-gray-500">{slot.slot_type} | Max: {slot.max_students}</p>
                              {slot.description && <p className="text-xs text-gray-500">{slot.description}</p>}
                              {hasBookings(slot.id) && (
                                <p className="text-xs text-orange-600 font-medium">
                                  ⚠️ {getBookingCount(slot.id)} booking{getBookingCount(slot.id) > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSlotStatus(slot).color}>
                              {getSlotStatus(slot).status}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditTimeSlot(slot)}
                              disabled={hasBookings(slot.id)}
                              title={hasBookings(slot.id) ? "Cannot edit - has bookings" : "Edit time slot"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteTimeSlotWithCheck(slot)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No availability slots set</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-8">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5" /> My Teaching Schedule</h2>
                

                
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div>
                    <Label htmlFor="calendar-student">Student</Label>
                    <Select value={calendarStudent} onValueChange={setCalendarStudent}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Students" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {[...new Set([
                          ...lessons.map(l => l.student_name).filter(Boolean),
                          ...bookings.map(b => b.student_name).filter(Boolean)
                        ])].map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="calendar-lesson-type">Lesson Type</Label>
                    <Select value={calendarLessonType} onValueChange={setCalendarLessonType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {[...new Set([
                          ...lessons.map(l => l.lesson_type).filter(Boolean),
                          ...bookings.map(b => b.lesson_type).filter(Boolean)
                        ])].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="calendar-status">Status</Label>
                    <Select value={calendarStatus} onValueChange={setCalendarStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {[...new Set([
                          ...lessons.map(l => l.status).filter(Boolean),
                          ...bookings.map(b => b.status).filter(Boolean)
                        ])].map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Calendar */}
                <div className="border rounded-lg p-4">
                  {filteredCalendarEvents.length > 0 ? (
                <LessonCalendar
                  events={filteredCalendarEvents}
                  onSelectEvent={handleSelectEvent}
                  defaultView="week"
                />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No events to display in calendar.</p>
                      <p className="text-sm mt-2">This could be because:</p>
                      <ul className="text-sm mt-1 text-left max-w-md mx-auto">
                        <li>• No lessons or bookings have been created yet</li>
                        <li>• Current filters are hiding all events</li>
                        <li>• Data is still loading</li>
                      </ul>
                      <div className="mt-4 p-3 bg-yellow-100 rounded">
                        <p className="text-sm"><strong>Debug Info:</strong></p>
                        <p className="text-xs">Lessons: {lessons.length}</p>
                        <p className="text-xs">Bookings: {bookings.length}</p>
                        <p className="text-xs">Calendar Events: {calendarEvents.length}</p>
                        <p className="text-xs">Filtered Events: {filteredCalendarEvents.length}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedEvent && (
                <EventDetailsModal open={eventModalOpen} onClose={() => setEventModalOpen(false)} event={selectedEvent} isTeacher={isTeacher} />
                )}
              </Card>
            </TabsContent>



            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Upcoming and Past Bookings</CardTitle>
                    <CardDescription>Manage your bookings and see upcoming and past lessons.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      You currently have {bookings.length} booking(s) scheduled.
                      Click on a booking to view details or manage it.
                    </p>
                    {bookings.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-green-700">Upcoming Bookings ({upcomingBookings.length})</h3>
                        {upcomingBookings.map(booking => (
                          <div key={booking.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{booking.student_name}</h4>
                                <p className="text-sm text-gray-600">Instrument: {booking.student_instrument}</p>
                                <p className="text-sm text-gray-600">Learning Mode: {booking.student_learning_mode}</p>
                                <p className="text-sm text-gray-600">Date: {formatDate(booking.booking_date)}</p>
                                <p className="text-sm text-gray-600">Time: {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                <p className="text-sm text-gray-600">Day: {booking.day_of_week}</p>
                                <p className="text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>{booking.status}</span></p>
                                <p className="text-sm text-gray-600">Type: {booking.lesson_type}</p>
                                {booking.notes && <p className="text-sm text-gray-600">Notes: {booking.notes}</p>}
                              </div>
                              <div className="flex flex-col space-y-2">
                                {!booking.meeting_link && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => createMeetingRoomForExistingBooking(booking)}
                                  >
                                    Create Meeting Room
                                  </Button>
                                )}
                                {booking.meeting_link && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() =>
                                      void joinBookingOnlineMeeting(booking, {
                                        isHost: true,
                                        teacherName: profile?.name,
                                        teacherUserId: profile?.user_id,
                                      })
                                    }
                                  >
                                    Join Meeting
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <h3 className="text-lg font-semibold text-gray-700 mt-6">Past Bookings ({pastBookings.length})</h3>
                        {pastBookings.map(booking => (
                          <div key={booking.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{booking.student_name}</h4>
                                <p className="text-sm text-gray-600">Instrument: {booking.student_instrument}</p>
                                <p className="text-sm text-gray-600">Learning Mode: {booking.student_learning_mode}</p>
                                <p className="text-sm text-gray-600">Date: {formatDate(booking.booking_date)}</p>
                                <p className="text-sm text-gray-600">Time: {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                <p className="text-sm text-gray-600">Day: {booking.day_of_week}</p>
                                <p className="text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>{booking.status}</span></p>
                                <p className="text-sm text-gray-600">Type: {booking.lesson_type}</p>
                                {booking.notes && <p className="text-sm text-gray-600">Notes: {booking.notes}</p>}
                              </div>
                              <div className="flex flex-col space-y-2">
                                {!booking.meeting_link && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => createMeetingRoomForExistingBooking(booking)}
                                  >
                                    Create Meeting Room
                                  </Button>
                                )}
                                {booking.meeting_link && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() =>
                                      void joinBookingOnlineMeeting(booking, {
                                        isHost: true,
                                        teacherName: profile?.name,
                                        teacherUserId: profile?.user_id,
                                      })
                                    }
                                  >
                                    Join Meeting
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No bookings scheduled yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Conferencing Tab */}
            <TabsContent value="video-conferencing" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Video Conferencing</CardTitle>
                    <CardDescription>Manage your video conference rooms and bookings.</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshInstantMeetings}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground rounded-lg border border-blue-100 bg-blue-50 p-3">
                      Classes use the academy Zoom Pro account. Sign into Zoom with the same email as your teacher
                      profile, then click <strong>Start class</strong> or <strong>Join class</strong>. No host key is
                      needed in this app. If Zoom says &quot;waiting for host&quot;, create a new meeting or ask the
                      academy admin (Pro license owner) to open the class first.
                    </p>
                    {/* Teacher's Instant Meetings Section */}
                    {teacherInstantMeetings.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          My Instant Meetings ({teacherInstantMeetings.length})
                        </h3>
                        <div className="grid gap-3">
                          {teacherInstantMeetings.map(meeting => (
                            <div key={meeting.id} className="p-4 border border-green-200 rounded-lg bg-green-50 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-green-900">{meeting.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge className={meeting.status === 'active' ? 'bg-red-500 text-white animate-pulse' : meeting.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}>
                                    {meeting.status === 'active' ? '🔴 LIVE' : meeting.status === 'pending' ? '⏳ Ready' : '📅 Scheduled'}
                                  </Badge>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {meeting.meetingCode}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-green-700 mb-3">
                                <div>
                                  <span className="font-medium">Host:</span> {meeting.hostName} (You)
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span> {meeting.duration} min
                                </div>
                                <div>
                                  <span className="font-medium">Participants:</span> {meeting.participants.length}/{meeting.maxParticipants}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {new Date(meeting.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              {meeting.description && (
                                <p className="text-sm text-green-600 mb-3 italic">"{meeting.description}"</p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  onClick={async () => {
                                    if (!profile?.user_id) return;
                                    try {
                                      if (meeting.status === 'pending') {
                                        const { startInstantMeeting } = await import('../lib/videoConferencing');
                                        await startInstantMeeting(meeting.id);
                                      }
                                      await joinInstantMeetingRoom(
                                        meeting,
                                        profile.user_id,
                                        profile.name || 'Teacher'
                                      );
                                    } catch (err) {
                                      toast({
                                        title: 'Could not open meeting',
                                        description:
                                          err instanceof Error ? err.message : 'Please try again.',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                  className={`flex items-center gap-1 ${
                                    meeting.status === 'active'
                                      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                  size="sm"
                                >
                                  <Video className="w-4 h-4" />
                                  {meeting.status === 'active' ? 'Join class' : 'Start class'}
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(meeting.meetingCode);
                                    toast({ title: "Copied", description: "Meeting code copied to clipboard" });
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Code
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(meeting.meetingUrl);
                                    toast({ title: "Copied", description: "Meeting URL copied to clipboard" });
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Copy URL
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Invited Meetings Section */}
                    {invitedMeetings.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Invited Meetings ({invitedMeetings.length})
                        </h3>
                        <div className="grid gap-3">
                          {invitedMeetings.map(meeting => (
                            <div key={meeting.id} className="p-4 border border-purple-200 rounded-lg bg-purple-50 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-purple-900">{meeting.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge className={meeting.status === 'active' ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}>
                                    {meeting.status === 'active' ? '🔴 LIVE' : '📅 Scheduled'}
                                  </Badge>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {meeting.meetingCode}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-purple-700 mb-3">
                                <div>
                                  <span className="font-medium">Host:</span> {meeting.hostName}
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span> {meeting.duration} min
                                </div>
                              </div>
                              {meeting.description && (
                                <p className="text-sm text-purple-600 mb-3 italic">"{meeting.description}"</p>
                              )}
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => {
                                    if (!profile?.user_id) return;
                                    void joinInstantMeetingRoom(
                                      meeting,
                                      profile.user_id,
                                      profile.name || 'Teacher'
                                    );
                                  }}
                                  className={`flex items-center gap-1 ${
                                    meeting.status === 'active' 
                                      ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                                      : 'bg-purple-600 hover:bg-purple-700'
                                  }`}
                                  size="sm"
                                >
                                  <Video className="w-4 h-4" />
                                  {meeting.status === 'active' ? '🚀 Join Live Meeting' : 'Join Meeting'}
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(meeting.meetingCode);
                                    toast({ title: "Copied", description: "Meeting code copied to clipboard" });
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy Code
                                </Button>
                              </div>
                            </div>
                          ))}
                    </div>
                      </div>
                    )}

                    {/* Create Instant Meeting Section */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Instant Meeting
                      </h3>
                      <InstantMeetManager 
                        userId={profile?.user_id || user?.id || ''}
                        userName={profile?.name || user?.email || ''}
                        userRole={profile?.category === 'admin' ? 'admin' : 'teacher'}
                        className="space-y-6"
                        onMeetingCreated={refreshInstantMeetings}
                      />
                    </div>

                    {/* Regular Meeting Rooms Section */}
                    <div>
                      <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Scheduled Lesson Rooms ({meetingRooms.length})
                      </h3>
                      <p className="text-gray-700 mb-4">
                        You currently have {meetingRooms.length} video conference room(s) available.
                        Click on a room to manage its bookings or create a new one.
                      </p>
                      {meetingRooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {meetingRooms.map(room => (
                            <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-4">
                                <h4 className="font-semibold">{room.roomName}</h4>
                                <p className="text-sm text-gray-600">Lesson Type: {room.lessonType}</p>
                                <p className="text-sm text-gray-600">Date: {formatDate(room.startTime)}</p>
                                <p className="text-sm text-gray-600">Time: {formatTime(room.startTime)} - {formatTime(room.endTime)}</p>
                                <p className="text-sm text-gray-600">Status: {room.status}</p>
                                <Button variant="outline" size="sm" onClick={() => handleOpenVideoConference(room)}>
                                  Join Meeting
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">No video conference rooms available.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                  {unreadNotificationCount > 0 && (
                    <Badge variant="destructive">
                      {unreadNotificationCount} unread
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Notifications</h3>
                      <p className="text-gray-500">You don't have any notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            notification.is_read 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-blue-50 border-blue-200 shadow-sm'
                          }`}
                          onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{notification.title}</h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                {new Date(notification.created_at).toLocaleTimeString()}
                              </p>
                              {notification.notification_type === 'trial_assignment' && notification.data && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                  <p><strong>Student:</strong> {notification.data.student_name}</p>
                                  <p><strong>Instrument:</strong> {notification.data.instrument}</p>
                                  <p><strong>Skill Level:</strong> {notification.data.skill_level}</p>
                                  {notification.data.scheduled_datetime && (
                                    <p><strong>Scheduled:</strong> {new Date(notification.data.scheduled_datetime).toLocaleString()}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account redirect tab */}
            <TabsContent value="account" className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your profile picture, bio, and documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/teacher/account" className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700">Open Account</Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Student Details Modal */}
      <Dialog open={showStudentDetailsModal} onOpenChange={setShowStudentDetailsModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {selectedStudent?.student_name?.charAt(0)}
              </div>
              {selectedStudent?.student_name}
            </DialogTitle>
            </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Information */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span className="text-gray-700">{selectedStudent.email}</span>
                  </div>
                    {selectedStudent.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Phone:</span>
                        <span className="text-gray-700">{selectedStudent.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Instrument:</span>
                      <span className="text-gray-700">{selectedStudent.instrument}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Level:</span>
                      <span className="text-gray-700">{selectedStudent.proficiency_level}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Learning Mode:</span>
                      <span className="text-gray-700">{(selectedStudent as any).learning_mode || 'Not specified'}</span>
                    </div>
                    {selectedStudent.age && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Age:</span>
                        <span className="text-gray-700">{selectedStudent.age} years</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Enrolled:</span>
                      <span className="text-gray-700">
                        {selectedStudent.enrollment_date ? new Date(selectedStudent.enrollment_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(selectedStudent.status)}>
                        {selectedStudent.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking History */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Booking History ({studentBookings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studentBookings.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {studentBookings.slice(0, 10).map((booking, index) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-purple-500" />
                                <span className="font-medium">
                                  {new Date(booking.booking_date).toLocaleDateString()}
                                </span>
                              </div>
                              {booking.time_slots && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-blue-500" />
                                  <span>
                                    {booking.time_slots.start_time} - {booking.time_slots.end_time}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Type:</span>
                                <span>{booking.lesson_type}</span>
                              </div>
                            </div>
                            {booking.notes && (
                              <p className="text-xs text-gray-600 mt-1">Notes: {booking.notes}</p>
                            )}
                          </div>
                          <Badge className={`text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </Badge>
                </div>
              ))}
                      {studentBookings.length > 10 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Showing latest 10 bookings out of {studentBookings.length} total
                        </p>
                      )}
            </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No booking history available</p>
            </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule Lesson
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Add Notes
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStudentDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>

    </div>
  );
};

export default TeacherDashboard; 