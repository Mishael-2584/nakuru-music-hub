import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, BookOpen, Clock, BarChart3, MessageSquare, CreditCard, User, LogOut, Bell, Music, FileText, Users, Calendar as CalendarIcon, Target, TrendingUp, Plus, Download, Eye, Edit, Trash2, Upload, Camera, Video } from "lucide-react";
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
import { MeetingRoom, getUserMeetingRooms, getMeetingRoomByBooking } from '../lib/videoConferencing';

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
  notFound?: boolean;
}

interface Student {
  id: string;
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
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [makeupCredits, setMakeupCredits] = useState<any[]>([]);

  const navigate = useNavigate();

  // Modal states
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
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
  const [showAssignMakeupModal, setShowAssignMakeupModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Add video conferencing state
  const [showVideoConferenceModal, setShowVideoConferenceModal] = useState(false);
  const [selectedMeetingRoom, setSelectedMeetingRoom] = useState<MeetingRoom | null>(null);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
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
    if (!user) return;

    // Check if teacher profile is properly set up
    if (!profile || !profile.id || profile.id === 'not-found') {
      toast({
        title: "Account Error",
        description: "Your teacher account is not properly set up. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    // Validation: required fields
    if (!newTimeSlot.day_of_week || !newTimeSlot.start_time || !newTimeSlot.end_time) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (day, start time, end time).",
        variant: "destructive",
      });
      return;
    }
    // Validation: start < end
    if (newTimeSlot.start_time >= newTimeSlot.end_time) {
      toast({
        title: "Invalid Time",
        description: "Start time must be before end time.",
        variant: "destructive",
      });
      return;
    }
    // Validation: overlap
    const overlap = timeSlots.some(slot =>
      slot.day_of_week === newTimeSlot.day_of_week &&
      // Check if times overlap
      ((newTimeSlot.start_time < slot.end_time && newTimeSlot.end_time > slot.start_time))
    );
    if (overlap) {
      toast({
        title: "Overlapping Slot",
        description: "This time slot overlaps with an existing slot.",
        variant: "destructive",
      });
      return;
    }

    // Prepare payload
    const payload = {
      teacher_id: profile?.id,
      day_of_week: newTimeSlot.day_of_week, // Keep as text: 'Monday', 'Tuesday', etc.
      start_time: newTimeSlot.start_time,
      end_time: newTimeSlot.end_time,
      is_available: true,
      slot_type: newTimeSlot.slot_type || 'regular',
      max_students: newTimeSlot.max_students || 1,
      description: newTimeSlot.description
    };
    console.log('[handleAddTimeSlot] Payload:', payload);

    try {
      const { data, error } = await supabase
        .from('time_slots')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[handleAddTimeSlot] Supabase error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add time slot",
          variant: "destructive",
        });
        return;
      }

      setTimeSlots([...timeSlots, data]);
      setShowTimeSlotModal(false);
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

  // Helper to map day_of_week to day name (handles both text and number formats)
  const getDayName = (dayNum: number | string) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const idx = typeof dayNum === 'string' ? parseInt(dayNum) : dayNum;
    return days[(idx || 1) - 1] || "Monday";
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
        console.error('Error fetching time slots:', timeSlotsError);
      } else {
        setTimeSlots(timeSlotsData || []);
        console.log('[TeacherDashboard] Time slots loaded:', timeSlotsData?.length || 0);
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

      

      // Fetch meeting rooms
      await fetchMeetingRooms();
      
      // Fetch teacher bookings
      await fetchTeacherBookings();

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    }
  };

  // Fetch user's meeting rooms
  const fetchMeetingRooms = async () => {
    if (!profile) return;

    try {
      const rooms = await getUserMeetingRooms(profile.id, 'teacher');
      setMeetingRooms(rooms);
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
          <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-16 sm:h-20 w-16 sm:w-20 mb-4 rounded-full shadow-lg border-4 border-white/80 bg-white/80 object-contain" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
            Damon Music Academy
          </h1>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Teacher Panel
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
            <span className="text-base sm:text-lg font-semibold text-white drop-shadow">Welcome, {profile?.name || 'Teacher'}</span>
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-semibold shadow">
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Teacher
            </span>
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-4 px-4">Empowering music education and managing your teaching journey</p>
          <div className="flex flex-col sm:flex-row justify-center w-full max-w-4xl mx-auto mt-2 gap-2">
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 text-xs sm:text-sm">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-700" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notifications</span>
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
                  <SelectItem value="schedule">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Schedule</span>
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
                  <SelectItem value="resources">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Resources</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="availability">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Availability</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="makeup-credits">
                    <div className="flex items-center gap-2">
                      <Badge className="w-4 h-4" />
                      <span>Make-up Credits</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="calendar">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Calendar</span>
                    </div>
                  </SelectItem>

                  <SelectItem value="bookings">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Bookings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="video-conferencing">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      <span>Video Calls</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop horizontal tabs */}
            <TabsList className="hidden lg:flex flex-wrap w-full bg-white/80 shadow-sm rounded-lg overflow-x-auto gap-1 justify-center p-1">
              <TabsTrigger value="dashboard" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-md transition-all">
                <Bell className="w-5 h-5" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-accent data-[state=active]:bg-accent/10 data-[state=active]:shadow-md transition-all">
                <Calendar className="w-5 h-5" />
                <span>Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-secondary data-[state=active]:bg-secondary/10 data-[state=active]:shadow-md transition-all">
                <Users className="w-5 h-5" />
                <span>Students</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-pink-600 data-[state=active]:bg-pink-100 data-[state=active]:shadow-md transition-all">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all">
                <BookOpen className="w-5 h-5" />
                <span>Resources</span>
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:shadow-md transition-all">
                <Clock className="w-5 h-5" />
                <span>Availability</span>
              </TabsTrigger>
              <TabsTrigger value="makeup-credits" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-purple-700 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md transition-all">
                <Badge className="w-5 h-5" />
                <span>Make-up Credits</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:shadow-md transition-all">
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar</span>
              </TabsTrigger>

              <TabsTrigger value="bookings" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all">
                <Calendar className="w-5 h-5" />
                <span>Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="video-conferencing" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-indigo-700 data-[state=active]:bg-indigo-100 data-[state=active]:shadow-md transition-all">
                <Video className="w-5 h-5" />
                <span>Video Calls</span>
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
                    <CardTitle className="text-base sm:text-lg">Next Lesson</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your upcoming lesson details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lessons.filter(l => l.status === 'scheduled').length > 0 ? (
                      <div className="space-y-4">
                        {lessons.filter(l => l.status === 'scheduled').slice(0, 1).map(lesson => (
                          <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-blue-50 rounded-lg gap-2">
                            <div>
                              <h4 className="font-semibold text-sm sm:text-base">{lesson.title}</h4>
                              <p className="text-xs sm:text-sm text-gray-600">{formatDate(lesson.lesson_date)} at {formatTime(lesson.start_time)}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Student: {lesson.student_name}</p>
                            </div>
                            <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No upcoming lessons scheduled</p>
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

            {/* Schedule Tab - Mobile responsive */}
            <TabsContent value="schedule" className="mt-6 sm:mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Time Slot Management</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Manage your available teaching slots</CardDescription>
                  </div>
                  <Button onClick={() => setShowLessonModal(true)} className="text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add Time Slot</span>
                    <span className="sm:hidden">Add Slot</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot) => (
                        <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-sm sm:text-base">{getDayName(slot.day_of_week)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-gray-600">{slot.start_time} - {slot.end_time}</span>
                              <Badge variant={slot.is_available ? "default" : "secondary"} className="text-xs">
                                {slot.is_available ? "Available" : "Booked"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateTimeSlot(slot.id, { is_available: !slot.is_available })}
                              className="text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteTimeSlot(slot.id)}
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No time slots configured yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add your first time slot to start receiving bookings</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Student Management</CardTitle>
                  <CardDescription>Mark attendance, add lesson notes, upload resources, view progress.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students.length > 0 ? (
                      students.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <User className="w-10 h-10 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">{student.student_name}</h4>
                              <p className="text-sm text-gray-600">{student.email}</p>
                              <p className="text-sm text-gray-600">Instrument: {student.instrument}</p>
                              <p className="text-sm text-gray-600">Level: {student.proficiency_level}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No students assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Messages</CardTitle>
                    <CardDescription>Communicate securely with students, parents, and admin.</CardDescription>
                  </div>
                  <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send New Message</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="recipient" className="text-right">To</Label>
                          <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map(student => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.student_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subject" className="text-right">Subject</Label>
                          <Input
                            id="subject"
                            value={newMessage.subject}
                            onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="message" className="text-right">Message</Label>
                          <Textarea
                            id="message"
                            value={newMessage.message}
                            onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendMessage}>
                          Send Message
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages.length > 0 ? (
                      messages.map(message => (
                        <div key={message.id} className={`p-4 border rounded-lg ${!message.is_read ? 'bg-blue-50 border-blue-200' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{message.subject}</h4>
                            <div className="flex items-center space-x-2">
                              {!message.is_read && <Badge variant="secondary">New</Badge>}
                              <span className="text-sm text-gray-500">{formatDate(message.created_at)}</span>
                            </div>
                          </div>
                          <p className="text-gray-700">{message.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Academy Resources</CardTitle>
                    <CardDescription>Access internal documents and policies.</CardDescription>
                  </div>
                  <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Upload New Material</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="material_title" className="text-right">Title</Label>
                          <Input
                            id="material_title"
                            value={newMaterial.title}
                            onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="material_description" className="text-right">Description</Label>
                          <Textarea
                            id="material_description"
                            value={newMaterial.description}
                            onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="material_file" className="text-right">File URL</Label>
                          <Input
                            id="material_file"
                            value={newMaterial.file_url}
                            onChange={(e) => setNewMaterial({...newMaterial, file_url: e.target.value})}
                            className="col-span-3"
                            placeholder="https://example.com/file.pdf"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowMaterialModal(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMaterial}>
                          Upload Material
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materials.length > 0 ? (
                      materials.map(material => (
                        <Card key={material.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-8 h-8 text-blue-600" />
                              <div className="flex-1">
                                <h4 className="font-semibold">{material.title}</h4>
                                <p className="text-sm text-gray-600">{material.description}</p>
                              </div>
                              {material.file_url && (
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No materials available yet</p>
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
                          <DialogTitle>Add New Time Slot</DialogTitle>
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
                          <Button variant="outline" onClick={() => setShowTimeSlotModal(false)}>Cancel</Button>
                          <Button onClick={handleAddTimeSlot}>Add Slot</Button>
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
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {slot.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => setEditingTimeSlot(slot)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteTimeSlot(slot.id)}>
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

            {/* Make-up Credits Tab */}
            <TabsContent value="makeup-credits" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Students' Make-up Credits</CardTitle>
                  <CardDescription>View and manage make-up credits for your students.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {makeupCredits.length > 0 ? (
                      makeupCredits.map(credit => (
                        <div key={credit.id} className="p-4 border rounded-lg bg-green-50 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-green-800">{credit.students?.student_name || 'Unknown Student'}</div>
                            <div className="text-xs text-gray-600">{credit.students?.email}</div>
                            <div className="text-sm text-green-700 mt-1">Type: {credit.credit_type}</div>
                            <div className="text-sm text-green-700">Expires: {formatDate(credit.expires_at)}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
                            <Badge variant="secondary" className="bg-green-200 text-green-800">
                              {credit.is_used ? 'Used' : 'Available'}
                            </Badge>
                            {!credit.is_used && (
                              <Button size="sm" variant="outline" className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                                onClick={() => { setSelectedCredit(credit); setShowAssignMakeupModal(true); }}>
                                Assign Make-up Lesson
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No make-up credits available for your students.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="mt-8">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5" /> My Teaching Calendar</h2>
                

                
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
                                    onClick={() => window.open(booking.meeting_link, '_blank')}
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
                                    onClick={() => window.open(booking.meeting_link, '_blank')}
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* Modal for assigning a make-up lesson */}
      {showAssignMakeupModal && selectedCredit && (
        <Dialog open={showAssignMakeupModal} onOpenChange={setShowAssignMakeupModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Make-up Lesson</DialogTitle>
            </DialogHeader>
            <div className="mb-4">Select an available slot for this make-up lesson:</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {timeSlots.filter(slot => slot.is_available).map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-semibold">{profile?.name}</div>
                    <div className="text-xs text-gray-600">{slot.day_of_week}, {slot.start_time} - {slot.end_time}</div>
                  </div>
                  <Button size="sm" onClick={async () => {
                    // Schedule the make-up lesson
                    const { data, error } = await supabase.from('lessons').insert({
                      student_id: selectedCredit.student_id,
                      teacher_id: profile?.id,
                      title: 'Make-up Lesson',
                      lesson_date: new Date().toISOString().split('T')[0],
                      start_time: slot.start_time,
                      end_time: slot.end_time,
                      lesson_type: 'makeup',
                      notes: 'Assigned by teacher using make-up credit',
                    }).select().single();
                    if (!error) {
                      // Mark the credit as used
                      await supabase.from('makeup_credits').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', selectedCredit.id);
                      setShowAssignMakeupModal(false);
                      toast({ title: 'Success', description: 'Make-up lesson assigned!' });
                      // Optionally refresh credits/lessons
                      fetchTeacherData(profile?.id);
                    } else {
                      toast({ title: 'Error', description: 'Failed to assign make-up lesson.' });
                    }
                  }}>Assign</Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowAssignMakeupModal(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Video Conference Modal */}
      <VideoConferenceModal
        open={showVideoConferenceModal}
        onClose={() => setShowVideoConferenceModal(false)}
        meetingRoom={selectedMeetingRoom}
        userName={profile?.name || 'Teacher'}
        userRole="teacher"
      />
      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Select a new date and time slot for the booking:</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableTimeSlotsForReschedule.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-semibold">{profile?.name}</div>
                  <div className="text-xs text-gray-600">{slot.day_of_week}, {slot.start_time} - {slot.end_time}</div>
                </div>
                <Button size="sm" onClick={async () => {
                  setRescheduleTimeSlot(slot);
                  setRescheduleDate(new Date().toISOString().split('T')[0]);
                  handleRescheduleBooking();
                }}>Select</Button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowRescheduleModal(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard; 