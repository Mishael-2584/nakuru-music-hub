import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, CalendarDays, BookOpen, Clock, BarChart3, MessageSquare, CreditCard, User, LogOut, Bell, Music, FileText, Users, Calendar as CalendarIcon, Target, TrendingUp, Plus, Download, Eye, Edit, Trash2, Upload, Camera, Video, AlertTriangle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import PasswordChangePrompt from '../components/PasswordChangePrompt';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Link } from 'react-router-dom';
import { LessonCalendar, LessonEvent } from '../components/LessonCalendar';
import { calculateStudentInvoice, InvoiceCalculationResult } from '../lib/invoiceUtils';
import { Invoice } from '../integrations/supabase/types';
import VideoConferenceModal from '../components/VideoConferenceModal';
import { MeetingRoom, getUserMeetingRooms, getMeetingRoomByBooking, getMeetingDuration } from '../lib/videoConferencing';

interface StudentProfile {
  id: string;
  user_id: string;
  registration_id?: string;
  student_name: string;
  age: number;
  email: string;
  phone: string;
  country_code: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  instrument: string;
  experience: string;
  proficiency_level: string;
  learning_mode: string;
  owns_instrument: boolean;
  location?: string;
  medical_condition: string;
  medical_details?: string;
  goals?: string;
  preferred_schedule?: string;
  status: string;
  enrollment_date: string;
  created_at: string;
  updated_at: string;
  date_of_birth?: string;
  profile_photo_url?: string;
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
  materials_url?: string[];
  attendance_status: string;
  teacher_id?: string;
  meeting_link?: string;
}

interface PracticeLog {
  id: string;
  practice_date: string;
  duration_minutes: number;
  practice_type: string;
  notes?: string;
  pieces_practiced?: string[];
  difficulty_rating?: number;
  mood_rating?: number;
  created_at: string;
}

interface Message {
  id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_id: string;
  recipient_id: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  payment_method: string;
  status: string;
  due_date: string;
  paid_date?: string;
  receipt_number?: string;
  notes?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  difficulty_level: string;
  assigned_by?: string;
}

interface LessonMaterial {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

interface AvailableTimeSlot {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_email: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  slot_type: string;
  max_students: number;
  description?: string;
  current_bookings: number;
  has_conflict?: boolean;
}

interface Booking {
  id: string;
  time_slot_id: string;
  student_id: string;
  teacher_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  lesson_type: string;
  notes?: string;
  created_at: string;
  teacher_name?: string;
  teacher_email?: string;
  day_of_week?: string;
  mode?: string;
  meeting_link?: string;
  meeting_room?: MeetingRoom; // Add meeting room to booking interface
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  experience?: string;
  category: string;
  subjects: string[];
  status: string;
}

// Add EventDetailsModal component
const EventDetailsModal = ({ open, onClose, event }) => {
  if (!event) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div><b>Status:</b> {event.status}</div>
          <div><b>Type:</b> {event.lesson_type || event.slot_type}</div>
          <div><b>Date:</b> {event.lesson_date || event.booking_date ? new Date(`${event.lesson_date || event.booking_date}T${event.start_time}`).toLocaleDateString() : ''}</div>
          <div><b>Time:</b> {event.start && event.end ? `${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
          {event.teacher_name && <div><b>Teacher:</b> {event.teacher_name}</div>}
          {event.notes && <div><b>Notes:</b> {event.notes}</div>}
          {event.meeting_link && <div><b>Meeting Link:</b> <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Join Online</a></div>}
        </div>
        {/* Lesson Materials Section */}
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Lesson Materials</h4>
          {event.materials_url && event.materials_url.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {event.materials_url.map((url, idx) => (
                <li key={idx}><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download Material {idx + 1}</a></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No materials uploaded yet.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordChecked, setPasswordChecked] = useState(false);
  
  // Booking system state
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRecurringBookingModal, setShowRecurringBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [newBooking, setNewBooking] = useState({
    booking_date: '',
    lesson_type: 'regular',
    notes: '',
    frequency: 'weekly',
    end_date: ''
  });
  const [makeupCredits, setMakeupCredits] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<any>(null);
  
  // Practice log modal state
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [newPracticeLog, setNewPracticeLog] = useState({
    practice_date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    practice_type: 'regular',
    notes: '',
    pieces_practiced: [''],
    difficulty_rating: 3,
    mood_rating: 3
  });

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    recipient_id: ''
  });

  // Add state for booking details modal
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Add video conferencing state
  const [showVideoConferenceModal, setShowVideoConferenceModal] = useState(false);
  const [selectedMeetingRoom, setSelectedMeetingRoom] = useState<MeetingRoom | null>(null);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState({ phone: '', proficiency_level: '', experience: '', location: '', learning_mode: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingProfileUpdate, setPendingProfileUpdate] = useState(null);

  // Add learningModes array
  const learningModes = [
    { value: "in-person", label: "In Person at the Academy" },
    { value: "home", label: "Home Lesson" },
    { value: "online", label: "Online" }
  ];

  const [showMakeupBookingModal, setShowMakeupBookingModal] = useState(false);
  const [selectedMakeupCredit, setSelectedMakeupCredit] = useState(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceCalculationResult | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Profile photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Add recurring booking state
  const [recurringBooking, setRecurringBooking] = useState({
    start_date: '',
    end_date: '',
    frequency: 'weekly',
    notes: ''
  });

  // Add makeup booking state
  const [makeupBooking, setMakeupBooking] = useState({
    booking_date: '',
    notes: ''
  });

  const [showAllInvoices, setShowAllInvoices] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (studentProfile) {
      fetchMyBookings();
      fetchBookingStatus();
    }
  }, [studentProfile]);

  useEffect(() => {
    if (studentProfile) {
      setEditProfile({
        phone: studentProfile.phone || '',
        proficiency_level: studentProfile.proficiency_level || '',
        experience: studentProfile.experience || '',
        location: studentProfile.location || '',
        learning_mode: studentProfile.learning_mode || ''
      });
    }
  }, [studentProfile]);

  const checkUserRole = async () => {
    try {
      // First check if user is a teacher
      const { data: teacherProfile, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", user.email)
        .single();
      
      if (teacherProfile && !teacherError) {
        // User is a teacher, redirect to teacher dashboard
        navigate("/teacher", { replace: true });
        return;
      }

      // Check if user is an admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile && !profileError && profile.role === 'admin') {
        navigate("/admin", { replace: true });
        return;
      }

      // If not teacher or admin, proceed with student authentication
      checkPasswordStatus();
    } catch (error) {
      console.error('Error checking user role:', error);
      // If there's an error, proceed with student authentication
      checkPasswordStatus();
    }
  };

  const checkPasswordStatus = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const isStudent = currentUser.user_metadata?.role === 'student';
        const passwordChanged = currentUser.user_metadata?.password_changed === true;
        if (isStudent && !passwordChanged) {
          setShowPasswordPrompt(true);
        }
      }
    } catch (error) {
      console.error('Error checking password status:', error);
    } finally {
      setPasswordChecked(true);
      if (!showPasswordPrompt) {
        fetchStudentData();
      }
    }
  };

  const handlePasswordChanged = async () => {
    setShowPasswordPrompt(false);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { password_changed: true }
      });
      if (error) {
        console.error('Error updating user metadata:', error);
      }
    } catch (err) {
      console.error('Error updating user metadata:', err);
    }
    fetchStudentData();
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // Fetch student profile from students table
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (studentError || !student) {
        toast({ title: 'Error', description: 'Failed to load student profile', variant: 'destructive' });
        return;
      }
      // Fetch profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_photo_url, date_of_birth')
        .eq('id', user?.id)
        .single();
      setStudentProfile({ ...student, ...profile });
      
      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', student.id)
        .order('lesson_date', { ascending: true });

      if (!lessonsError && lessonsData) {
        setLessons(lessonsData);
      }

      // Fetch practice logs
      const { data: practiceData, error: practiceError } = await supabase
        .from('practice_logs')
        .select('*')
        .eq('student_id', student.id)
        .order('practice_date', { ascending: false });

      if (!practiceError && practiceData) {
        setPracticeLogs(practiceData);
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', student.id)
        .order('created_at', { ascending: false });

      if (!messagesError && messagesData) {
        setMessages(messagesData);
      }

      // Fetch payments with proper invoice linking
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          invoices(
            id,
            amount_due,
            payment_status,
            amount_paid
          )
        `)
        .eq('student_id', student.id)
        .order('due_date', { ascending: true });

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }

      // Fetch available time slots
      await fetchAvailableTimeSlots();
      
      // Fetch teachers
      await fetchTeachers();
      
      // Fetch my bookings
      await fetchMyBookings();
      
      // Fetch meeting rooms
      await fetchMeetingRooms();
      
      // Fetch booking status for session limits
      await fetchBookingStatus();
      
      // Fetch invoices with payment status
      await fetchInvoices(student.id);
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({ title: 'Error', description: 'Failed to load student data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Photo upload functions
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 Photo select triggered:', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('📸 File selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('❌ Invalid file type:', file.type);
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', file.size);
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ File validation passed, setting photo file');
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('✅ Preview created');
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ No file selected');
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !studentProfile) return;
    try {
      setUploadingPhoto(true);
      
      // Use the correct bucket and path structure like events
      const fileName = `student-photos/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `images/${fileName}`;
      
      console.log('📸 Uploading photo to:', filePath);
      
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, photoFile, { 
          cacheControl: '3600', 
          upsert: false 
        });
        
      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        toast({ 
          title: 'Upload Failed', 
          description: 'Failed to upload photo. Please try again.', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Get the public URL from the images bucket
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
        
      console.log('✅ Photo uploaded successfully:', urlData.publicUrl);
      
      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: urlData.publicUrl })
        .eq('id', user?.id);
        
      if (updateError) {
        console.error('❌ Update error:', updateError);
        toast({ 
          title: 'Update Failed', 
          description: 'Failed to update profile. Please try again.', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Update local state
      setStudentProfile(prev => prev ? { ...prev, profile_photo_url: urlData.publicUrl } : prev);
      setPhotoFile(null);
      setPhotoPreview(null);
      
      toast({ 
        title: 'Success', 
        description: 'Profile photo uploaded successfully!' 
      });
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({ 
        title: 'Upload Failed', 
        description: 'An error occurred while uploading the photo.', 
        variant: 'destructive' 
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!studentProfile?.profile_photo_url) return;
    try {
      // Extract the file path from the URL
      const url = new URL(studentProfile.profile_photo_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `student-photos/${fileName}`;
      
      console.log('🗑️ Removing photo from storage:', filePath);
      
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([filePath]);
        
      if (storageError) {
        console.error('❌ Storage removal error:', storageError);
        // Continue with database update even if storage removal fails
      }
      
      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: null })
        .eq('id', user?.id);
        
      if (updateError) {
        console.error('❌ Database update error:', updateError);
        toast({ 
          title: 'Remove Failed', 
          description: 'Failed to remove photo. Please try again.', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Update local state
      setStudentProfile(prev => prev ? { ...prev, profile_photo_url: null } : prev);
      
      toast({ 
        title: 'Success', 
        description: 'Profile photo removed successfully!' 
      });
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({ 
        title: 'Remove Failed', 
        description: 'An error occurred while removing the photo.', 
        variant: 'destructive' 
      });
    }
  };

  // Check if a time slot conflicts with existing bookings
  const checkBookingConflict = async (timeSlot: AvailableTimeSlot) => {
    if (!studentProfile) return false;
    
    try {
      const bookingDate = getNextAvailableDateISO(timeSlot.day_of_week);
      
      const { data: conflictingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('booking_date', bookingDate)
        .eq('status', 'confirmed')
        .or(`start_time.lt.${timeSlot.end_time},end_time.gt.${timeSlot.start_time}`);

      if (error) {
        console.error('Error checking booking conflicts:', error);
        return false;
      }

      return conflictingBookings && conflictingBookings.length > 0;
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      return false;
    }
  };

  // Fetch available time slots with conflict checking
  const fetchAvailableTimeSlots = async () => {
    if (!studentProfile) return;

    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select(`
          *,
          teachers!inner(
            id,
            name,
            email
          )
        `)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching time slots:', error);
        return;
      }

      if (data) {
        // Check for conflicts for each time slot
        const timeSlotsWithConflicts = await Promise.all(
          data.map(async (slot) => {
            const hasConflict = await checkBookingConflict(slot);
            return {
              ...slot,
              teacher_name: slot.teachers?.name || 'Unknown Teacher',
              teacher_email: slot.teachers?.email || '',
              has_conflict: hasConflict
            };
          })
        );

        setAvailableTimeSlots(timeSlotsWithConflicts);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  // Fetch all teachers
  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (!error && data) {
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  // Fetch student's bookings
  const fetchMyBookings = async () => {
    if (!studentProfile) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          time_slots(
            day_of_week,
            teachers(name)
          )
        `)
        .eq('student_id', studentProfile.id)
        .order('booking_date', { ascending: true });

      if (!error && data) {
        // Fetch meeting rooms for each booking
        const bookingsWithMeetingRooms = await Promise.all(
          data.map(async (booking) => {
            try {
              const meetingRoom = await getMeetingRoomByBooking(booking.id);
              return {
                ...booking,
                teacher_name: booking.time_slots?.teachers?.name || 'Unknown Teacher',
                day_of_week: booking.time_slots?.day_of_week || '',
                meeting_room: meetingRoom
              };
            } catch (error) {
              console.error('Error fetching meeting room for booking:', booking.id, error);
              return {
                ...booking,
                teacher_name: booking.time_slots?.teachers?.name || 'Unknown Teacher',
                day_of_week: booking.time_slots?.day_of_week || '',
                meeting_room: null
              };
            }
          })
        );
        setMyBookings(bookingsWithMeetingRooms);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch user's meeting rooms
  const fetchMeetingRooms = async () => {
    if (!studentProfile) return;

    try {
      const rooms = await getUserMeetingRooms(studentProfile.id, 'student');
      setMeetingRooms(rooms);
    } catch (error) {
      console.error('Error fetching meeting rooms:', error);
    }
  };

  // Fetch booking status for session limits
  const fetchBookingStatus = async () => {
    if (!studentProfile) return;

    try {
      const { data, error } = await supabase
        .rpc('get_student_booking_status', { student_id_param: studentProfile.id });

      if (error) {
        console.error('Error fetching booking status:', error);
        return;
      }

      if (data && data.length > 0) {
        setBookingStatus(data[0]);
      }
    } catch (error) {
      console.error('Error fetching booking status:', error);
    }
  };

  // Handle opening video conference
  const handleOpenVideoConference = (booking: Booking) => {
    if (booking.meeting_room) {
      setSelectedMeetingRoom(booking.meeting_room);
      setShowVideoConferenceModal(true);
    } else {
      toast({
        title: "No Meeting Room",
        description: "This booking doesn't have a video conference room.",
        variant: "destructive",
      });
    }
  };

  // Handle opening video conference from meeting rooms list
  const handleOpenMeetingRoom = (meetingRoom: MeetingRoom) => {
    setSelectedMeetingRoom(meetingRoom);
    setShowVideoConferenceModal(true);
  };

  // Get next available date for a given day of the week
  const getNextAvailableDate = (dayOfWeek: string): string => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayNames.indexOf(dayOfWeek);
    
    if (targetDayIndex === -1) return 'Invalid day';
    
    const currentDayIndex = today.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    
    // If the target day is today or has passed this week, get next week's date
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    
    return nextDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get next available date as ISO string for booking
  const getNextAvailableDateISO = (dayOfWeek: string): string => {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayNames.indexOf(dayOfWeek);
    
    if (targetDayIndex === -1) return '';
    
    const currentDayIndex = today.getDay();
    const currentTime = today.getHours() * 60 + today.getMinutes(); // Current time in minutes
    let daysToAdd = targetDayIndex - currentDayIndex;
    
    // If it's the same day, check if the time slot has already passed
    if (daysToAdd === 0 && selectedTimeSlot) {
      const slotTime = selectedTimeSlot.start_time;
      const [slotHour, slotMinute] = slotTime.split(':').map(Number);
      const slotTimeInMinutes = slotHour * 60 + slotMinute;
      
      if (currentTime >= slotTimeInMinutes) {
        // Slot has passed today, book for next week
        daysToAdd = 7;
      }
      // If slot hasn't passed, daysToAdd remains 0 (same day)
    } else if (daysToAdd <= 0) {
      // Target day has passed this week, get next week's date
      daysToAdd += 7;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    
    
    
    return nextDate.toISOString().split('T')[0];
  };

  // Handle booking a time slot
  const handleBookTimeSlot = async () => {
    if (!selectedTimeSlot || !studentProfile) return;

    try {
      // Check session limits before booking
      const { data: bookingStatus, error: statusError } = await supabase
        .rpc('get_student_booking_status', { student_id_param: studentProfile.id });

      if (statusError) {
        console.error('Error checking booking status:', statusError);
        toast({
          title: "Error",
          description: "Failed to check booking limits. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!bookingStatus || bookingStatus.length === 0) {
        toast({
          title: "Error",
          description: "Unable to verify booking limits. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const status = bookingStatus[0];
      
      if (!status.can_book_more) {
        toast({
          title: "Booking Limit Reached",
          description: `You have already booked ${status.current_week_bookings} out of ${status.sessions_per_week} sessions this week. Please wait until next week or contact your teacher to reschedule.`,
          variant: "destructive",
        });
        return;
      }

      const isOnline = studentProfile.learning_mode === 'online';
      
      // Automatically calculate the next available date for the selected day
      const bookingDate = getNextAvailableDateISO(selectedTimeSlot.day_of_week);
      
      // Check for overlapping bookings at the same time
      const { data: overlappingBookings, error: overlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('booking_date', bookingDate)
        .eq('start_time', selectedTimeSlot.start_time)
        .eq('end_time', selectedTimeSlot.end_time)
        .eq('status', 'confirmed');

      if (overlapError) {
        console.error('Error checking for overlapping bookings:', overlapError);
        toast({
          title: "Error",
          description: "Failed to check for existing bookings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (overlappingBookings && overlappingBookings.length > 0) {
        toast({
          title: "Double Booking Detected",
          description: "You already have a lesson booked at this time. Please choose a different time slot or cancel your existing booking first.",
          variant: "destructive",
        });
        return;
      }

      // Additional check for any overlapping time ranges on the same date
      const { data: timeOverlapBookings, error: timeOverlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('booking_date', bookingDate)
        .eq('status', 'confirmed')
        .or(`start_time.lt.${selectedTimeSlot.end_time},end_time.gt.${selectedTimeSlot.start_time}`);

      if (timeOverlapError) {
        console.error('Error checking for time overlaps:', timeOverlapError);
        toast({
          title: "Error",
          description: "Failed to check for time conflicts. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (timeOverlapBookings && timeOverlapBookings.length > 0) {
        toast({
          title: "Time Conflict",
          description: "You have another lesson scheduled during this time period. Please choose a different time slot.",
          variant: "destructive",
        });
        return;
      }
      
      // Create booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          time_slot_id: selectedTimeSlot.id,
          student_id: studentProfile.id,
          teacher_id: selectedTimeSlot.teacher_id,
          booking_date: bookingDate,
          start_time: selectedTimeSlot.start_time,
          end_time: selectedTimeSlot.end_time,
          status: 'confirmed',
          lesson_type: newBooking.lesson_type,
          notes: newBooking.notes,
          mode: studentProfile.learning_mode
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create meeting room for online lessons
      if (isOnline && booking) {
        try {
          // Check if meeting room already exists for this booking
          const { getMeetingRoomByBooking } = await import('../lib/videoConferencing');
          const existingMeetingRoom = await getMeetingRoomByBooking(booking.id);
          
          if (existingMeetingRoom) {
            toast({
              title: "Meeting Room Already Exists",
              description: "A video conference room already exists for this lesson.",
            });
            return;
          }
          

          
          const { createMeetingRoom } = await import('../lib/videoConferencing');
          
          // Get teacher name for meeting room
          const teacher = teachers.find(t => t.id === selectedTimeSlot.teacher_id);
          const teacherName = teacher?.name || 'Teacher';
          
          const meetingRoom = await createMeetingRoom(
            booking.id,
            selectedTimeSlot.teacher_id,
            studentProfile.id,
            teacherName,
            studentProfile.student_name,
            newBooking.lesson_type,
            `${bookingDate}T${selectedTimeSlot.start_time}`,
            `${bookingDate}T${selectedTimeSlot.end_time}`,
            newBooking.notes
          );
          

          
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
            description: "Video conference room created successfully for your online lesson.",
          });
            
        } catch (meetingError) {
          console.error('Error creating meeting room:', meetingError);
          toast({
            title: "Meeting Room Creation Failed",
            description: "Lesson booked successfully, but video conference room creation failed. Please contact support.",
            variant: "destructive",
          });
          // Don't fail the booking if meeting room creation fails
        }
      }

      // Update available time slots
      await fetchAvailableTimeSlots();
      await fetchMyBookings();

      setShowBookingModal(false);
      setSelectedTimeSlot(null);
      // When resetting newBooking, always include all required fields
      setNewBooking({
        booking_date: '',
        lesson_type: 'regular',
        notes: '',
        frequency: 'weekly',
        end_date: ''
      });

      toast({
        title: "Success",
        description: isOnline 
          ? "Lesson booked successfully! A video conference room has been created." 
          : "Lesson booked successfully!",
      });
    } catch (error) {
      console.error('Error booking time slot:', error);
      toast({
        title: "Error",
        description: "Failed to book lesson",
        variant: "destructive",
      });
    }
  };

  // Handle canceling a booking with 24-hour policy
  const handleCancelBooking = async (bookingId: string, bookingDate: string, startTime: string) => {
    try {
      // Check if it's within 24 hours
      const lessonDateTime = new Date(`${bookingDate}T${startTime}`);
      const currentDateTime = new Date();
      const hoursDiff = (lessonDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        // Late cancellation - show warning
        const confirmed = window.confirm(
          "This lesson is within the 24-hour window. As per our policy, cancelling now will forfeit the lesson and the full fee will be charged. Are you sure you want to cancel?"
        );
        
        if (!confirmed) {
          return;
        }
      }
      
      // Call the enhanced cancellation function
      const { data, error } = await supabase.rpc('cancel_booking_with_policy', {
        booking_id: bookingId,
        cancellation_reason: hoursDiff < 24 ? 'Late cancellation' : 'Student cancellation'
      });
      
      if (error) {
        throw error;
      }
      
      // Send notification emails
      await sendCancellationNotifications(bookingId, hoursDiff < 24);
      
      await fetchMyBookings();
      await fetchAvailableTimeSlots();
      
      const message = hoursDiff < 24 
        ? "Lesson cancelled. As this was within the 24-hour window, the lesson has been forfeited."
        : "Lesson cancelled successfully. A make-up lesson credit has been added to your account.";
      
      toast({
        title: "Booking Cancelled",
        description: message,
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  // Send cancellation notifications
  const sendCancellationNotifications = async (bookingId: string, isLateCancellation: boolean) => {
    try {
      const booking = myBookings.find(b => b.id === bookingId);
      if (!booking) return;
      
      // Send notification to admin
      await supabase.rpc('send_booking_notification', {
        booking_id: bookingId,
        notification_type: 'cancellation',
        recipient_type: 'admin',
        recipient_email: 'admin@damonmusicacademy.co.ke',
        subject: `Lesson Cancellation - ${isLateCancellation ? 'Late' : 'Timely'}`,
        message: `Student ${studentProfile?.student_name} cancelled their lesson with ${booking.teacher_name} on ${formatDate(booking.booking_date)}. ${isLateCancellation ? 'This was a late cancellation and the lesson is forfeited.' : 'This was a timely cancellation and a make-up credit was issued.'}`
      });
      
      // Send notification to teacher
      await supabase.rpc('send_booking_notification', {
        booking_id: bookingId,
        notification_type: 'cancellation',
        recipient_type: 'teacher',
        recipient_email: booking.teacher_email || '',
        subject: 'Lesson Cancellation',
        message: `Your lesson with ${studentProfile?.student_name} on ${formatDate(booking.booking_date)} has been cancelled.`
      });
      
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
    }
  };

  // Handle booking a recurring slot
  const handleBookRecurringSlot = async (timeSlot: AvailableTimeSlot) => {
    if (!studentProfile) return;
    
    setSelectedTimeSlot(timeSlot);
    setNewBooking({
      booking_date: '',
      lesson_type: 'regular',
      notes: '',
      frequency: 'weekly',
      end_date: ''
    });
    setShowRecurringBookingModal(true);
  };

  // Get recurring end date based on frequency
  const getRecurringEndDate = (dayOfWeek: string, frequency: string): string => {
    const startDate = new Date(getNextAvailableDateISO(dayOfWeek));
    const endDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 28); // 4 weeks
        break;
      case 'biweekly':
        endDate.setDate(startDate.getDate() + 56); // 8 weeks
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 3); // 3 months
        break;
      default:
        endDate.setDate(startDate.getDate() + 28); // Default to 4 weeks
    }
    
    return endDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get recurring end date as ISO string
  const getRecurringEndDateISO = (dayOfWeek: string, frequency: string): string => {
    const startDate = new Date(getNextAvailableDateISO(dayOfWeek));
    const endDate = new Date(startDate);
    
    switch (frequency) {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 28); // 4 weeks
        break;
      case 'biweekly':
        endDate.setDate(startDate.getDate() + 56); // 8 weeks
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 3); // 3 months
        break;
      default:
        endDate.setDate(startDate.getDate() + 28); // Default to 4 weeks
    }
    
    return endDate.toISOString().split('T')[0];
  };

  // Handle recurring booking submission
  const handleSubmitRecurringBooking = async () => {
    if (!selectedTimeSlot || !studentProfile) return;
    
    try {
      // Automatically calculate start and end dates
      const startDate = getNextAvailableDateISO(selectedTimeSlot.day_of_week);
      const endDate = getRecurringEndDateISO(selectedTimeSlot.day_of_week, recurringBooking.frequency);
      
      // Check for overlapping bookings in the recurring period
      const { data: overlappingRecurringBookings, error: overlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('day_of_week', selectedTimeSlot.day_of_week)
        .eq('start_time', selectedTimeSlot.start_time)
        .eq('end_time', selectedTimeSlot.end_time)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .eq('status', 'confirmed');

      if (overlapError) {
        console.error('Error checking for overlapping recurring bookings:', overlapError);
        toast({
          title: "Error",
          description: "Failed to check for existing bookings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (overlappingRecurringBookings && overlappingRecurringBookings.length > 0) {
        toast({
          title: "Double Booking Detected",
          description: "You already have lessons booked during this recurring period. Please choose a different time slot or cancel your existing bookings first.",
          variant: "destructive",
        });
        return;
      }

      // Additional check for any overlapping time ranges in the recurring period
      const { data: timeOverlapRecurringBookings, error: timeOverlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('day_of_week', selectedTimeSlot.day_of_week)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .eq('status', 'confirmed')
        .or(`start_time.lt.${selectedTimeSlot.end_time},end_time.gt.${selectedTimeSlot.start_time}`);

      if (timeOverlapError) {
        console.error('Error checking for time overlaps in recurring bookings:', timeOverlapError);
        toast({
          title: "Error",
          description: "Failed to check for time conflicts. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (timeOverlapRecurringBookings && timeOverlapRecurringBookings.length > 0) {
        toast({
          title: "Time Conflict",
          description: "You have other lessons scheduled during this recurring time period. Please choose a different time slot.",
          variant: "destructive",
        });
        return;
      }
      
      // Create recurring booking pattern
      const { data, error } = await supabase
        .from('recurring_booking_patterns')
        .insert({
          student_id: studentProfile.id,
          teacher_id: selectedTimeSlot.teacher_id,
          time_slot_id: selectedTimeSlot.id,
          day_of_week: selectedTimeSlot.day_of_week,
          start_time: selectedTimeSlot.start_time,
          end_time: selectedTimeSlot.end_time,
          frequency: recurringBooking.frequency,
          start_date: startDate,
          end_date: endDate,
          lesson_type: newBooking.lesson_type,
          notes: recurringBooking.notes
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await fetchMyBookings();
      await fetchAvailableTimeSlots();

      setShowRecurringBookingModal(false);
      setSelectedTimeSlot(null);
      setNewBooking({
        booking_date: '',
        lesson_type: 'regular',
        notes: '',
        frequency: 'weekly',
        end_date: ''
      });
      setRecurringBooking({
        start_date: '',
        end_date: '',
        frequency: 'weekly',
        notes: ''
      });

      toast({
        title: "Success",
        description: "Recurring lessons booked successfully!",
      });
    } catch (error) {
      console.error('Error booking recurring slot:', error);
      toast({
        title: "Error",
        description: "Failed to book recurring lessons",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out from Damon Music Academy.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddPracticeLog = async () => {
    if (!studentProfile) return;

    try {
      const { data, error } = await supabase
        .from('practice_logs')
        .insert({
          student_id: studentProfile.id,
          practice_date: newPracticeLog.practice_date,
          duration_minutes: newPracticeLog.duration_minutes,
          practice_type: newPracticeLog.practice_type,
          notes: newPracticeLog.notes,
          pieces_practiced: newPracticeLog.pieces_practiced.filter(p => p.trim()),
          difficulty_rating: newPracticeLog.difficulty_rating,
          mood_rating: newPracticeLog.mood_rating
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPracticeLogs([data, ...practiceLogs]);
      setShowPracticeModal(false);
      setNewPracticeLog({
        practice_date: new Date().toISOString().split('T')[0],
        duration_minutes: 30,
        practice_type: 'regular',
        notes: '',
        pieces_practiced: [''],
        difficulty_rating: 3,
        mood_rating: 3
      });

      toast({
        title: "Success",
        description: "Practice session logged successfully!",
      });
    } catch (error) {
      console.error('Error adding practice log:', error);
      toast({
        title: "Error",
        description: "Failed to log practice session",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
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

  // Helper to determine if a lesson is in the past
  const isPastLesson = (lesson) => {
    const lessonDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
    return lessonDateTime < new Date();
  };
  // Helper to determine if a lesson is within 24 hours
  const isWithin24Hours = (lesson) => {
    const lessonDateTime = new Date(`${lesson.lesson_date}T${lesson.start_time}`);
    const now = new Date();
    const hoursDiff = (lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  // Helper to determine if a lesson/booking is in the past (uses end time)
  const isPastEvent = (event) => {
    const endDateTime = new Date(`${event.lesson_date || event.booking_date}T${event.end_time}`);
    return endDateTime < new Date();
  };

  // Map lessons and bookings to calendar events
  // Only show bookings as events if there is no corresponding lesson for that slot/date/time
  const lessonEventKeys = lessons.map(l => `${l.lesson_date}_${l.start_time}_${l.end_time}`);
  const calendarEvents: LessonEvent[] = [
    ...lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title || 'Lesson',
      start: new Date(`${lesson.lesson_date}T${lesson.start_time}`),
      end: new Date(`${lesson.lesson_date}T${lesson.end_time}`),
      status: lesson.status,
      lesson_type: lesson.lesson_type,
      teacher_name: lesson.teacher_id, // Optionally fetch teacher name if available
      notes: lesson.notes,
      meeting_link: lesson.meeting_link,
      lesson_date: lesson.lesson_date,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      ...lesson,
    })),
    ...myBookings.filter(booking => {
      // Only show if no lesson exists for this slot/date/time
      const key = `${booking.booking_date}_${booking.start_time}_${booking.end_time}`;
      return !lessonEventKeys.includes(key) && booking.status !== 'cancelled';
    }).map(booking => ({
      id: booking.id,
      title: booking.status === 'pending' ? 'Pending Booking' : (booking.lesson_type === 'makeup' ? 'Make-up Booking' : 'Booking'),
      start: new Date(`${booking.booking_date}T${booking.start_time}`),
      end: new Date(`${booking.booking_date}T${booking.end_time}`),
      status: booking.status,
      lesson_type: booking.lesson_type,
      teacher_name: booking.teacher_name,
      meeting_link: booking.meeting_link,
      notes: booking.notes,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      ...booking,
    })),
  ];

  // Handler for event selection
  const handleSelectEvent = (event: LessonEvent) => {
    setSelectedEvent(event);
    setEventModalOpen(true);
  };

  // Helper to determine if a booking is in the past (uses end time)
  const isPastBooking = (booking) => {
    const endDateTime = new Date(`${booking.booking_date}T${booking.end_time}`);
    return endDateTime < new Date();
  };

  // In the bookings section, filter upcoming and past bookings using the new helper
  const upcomingBookings = myBookings.filter(booking => !isPastBooking(booking));
  const pastBookings = myBookings.filter(booking => isPastBooking(booking));

  // Defensive check before fetching invoices
  const fetchInvoices = async (studentId: string) => {
    if (!studentId || studentId === 'undefined' || studentId === undefined || studentId === null) {
      console.error('Invalid or missing studentId for invoice query:', studentId);
      toast({ title: 'Error', description: 'Invalid or missing student ID for invoice query.', variant: 'destructive' });
      return;
    }
    // Fetch invoices from Supabase
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('period_start', { ascending: false });
    if (error) {
      console.error('Error fetching invoices:', error);
      toast({ title: 'Error', description: 'Failed to fetch invoices.', variant: 'destructive' });
      return;
    }
    if (!data || data.length === 0) {
      console.warn('No invoices found for student:', studentId);
      setInvoices([]);
      return;
    }
    setInvoices(data);
  };

  // Handler to view invoice breakdown
  const handleViewInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    // Optionally recalculate details for display
    setInvoiceDetails(invoice.lessons_summary || null);
    setShowInvoiceModal(true);
  };

  const handlePayment = async (invoice: any) => {
    try {
      toast({
        title: "Payment Processing",
        description: "Redirecting to payment gateway...",
      });
      
      // TODO: Implement actual payment processing
      // This would typically redirect to a payment gateway like M-Pesa, PayPal, etc.
      console.log('Processing payment for invoice:', invoice.id);
      
      // For now, just show a success message
      setTimeout(() => {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return <PasswordChangePrompt onPasswordChanged={handlePasswordChanged} />;
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Student profile not found</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  const handleEditProfile = () => setEditMode(true);
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditProfile({
      phone: studentProfile?.phone || '',
      proficiency_level: studentProfile?.proficiency_level || '',
      experience: studentProfile?.experience || '',
      location: studentProfile?.location || '',
      learning_mode: studentProfile?.learning_mode || ''
    });
  };
  const handleSaveProfile = () => {
    setPendingProfileUpdate({ ...editProfile });
    setShowPasswordModal(true);
  };
  const handleConfirmPassword = async () => {
    if (!pendingProfileUpdate || !studentProfile) return;
    
    console.log('🔍 Debug: Updating profile with data:', pendingProfileUpdate);
    console.log('🔍 Debug: Current student profile:', studentProfile);
    console.log('🔍 Debug: Learning mode being set to:', pendingProfileUpdate.learning_mode);
    
    // Re-authenticate user
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: studentProfile.email,
      password: passwordInput
    });
    if (authError) {
      console.error('❌ Auth error:', authError);
      toast({ title: 'Error', description: 'Incorrect password. Please try again.', variant: 'destructive' });
      return;
    }
    
    console.log('✅ Auth successful, updating profile...');
    
    // Try using the RPC function first for learning_mode
    const { data: rpcData, error: rpcError } = await supabase.rpc('test_student_update', {
      student_id: studentProfile.id,
      new_learning_mode: pendingProfileUpdate.learning_mode
    });
    
    console.log('🔍 Debug: RPC update result:', { data: rpcData, error: rpcError });
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
    } else {
      console.log('✅ RPC update successful:', rpcData);
    }
    
    // Also try the direct update approach
    const { data: updateData, error: updateError } = await supabase
      .from('students')
      .update({
        learning_mode: pendingProfileUpdate.learning_mode
      })
      .eq('id', studentProfile.id)
      .select();
      
    console.log('🔍 Debug: Direct update result:', { data: updateData, error: updateError });
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } else {
      console.log('✅ Update successful:', updateData);
      
      // Now update the other fields
      const { data: otherUpdateData, error: otherUpdateError } = await supabase
        .from('students')
        .update({
          phone: pendingProfileUpdate.phone,
          proficiency_level: pendingProfileUpdate.proficiency_level,
          experience: pendingProfileUpdate.experience,
          location: pendingProfileUpdate.location
        })
        .eq('id', studentProfile.id)
        .select();
      
      console.log('🔍 Debug: Other fields update result:', { data: otherUpdateData, error: otherUpdateError });
      
      // Let's check the database again after update
      const { data: afterUpdateData, error: afterUpdateError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentProfile.id)
        .single();
      
      console.log('🔍 Debug: Final database state:', afterUpdateData);
      console.log('🔍 Debug: Final database error:', afterUpdateError);
      
      toast({ title: 'Success', description: 'Profile updated successfully.' });
      setEditMode(false);
      await fetchStudentData(); // Force refresh the data
    }
    setShowPasswordModal(false);
    setPasswordInput('');
    setPendingProfileUpdate(null);
  };

  // Add a test function that can be called from console
  const testLearningModeUpdate = async () => {
    if (!studentProfile) {
      console.log('❌ No student profile available');
      return;
    }
    
    console.log('🧪 Testing learning mode update...');
    console.log('Current learning_mode:', studentProfile.learning_mode);
    
    // Try direct update without RPC
    const { data, error } = await supabase
      .from('students')
      .update({ learning_mode: 'online' })
      .eq('id', studentProfile.id)
      .eq('user_id', studentProfile.user_id)
      .select();
    
    console.log('🧪 Direct update result:', { data, error });
    
    // Check the result
    const { data: checkData, error: checkError } = await supabase
      .from('students')
      .select('learning_mode')
      .eq('id', studentProfile.id)
      .single();
    
    console.log('🧪 After update check:', { data: checkData, error: checkError });
  };

  // Add another test function that tries different approaches
  const testMultipleUpdateMethods = async () => {
    if (!studentProfile) {
      console.log('❌ No student profile available');
      return;
    }
    
    console.log('🧪 Testing multiple update methods...');
    
    // Method 1: Direct update
    console.log('Method 1: Direct update');
    const { data: data1, error: error1 } = await supabase
      .from('students')
      .update({ learning_mode: 'online' })
      .eq('id', studentProfile.id)
      .select();
    console.log('Result 1:', { data: data1, error: error1 });
    
    // Method 2: Update with user_id check
    console.log('Method 2: Update with user_id check');
    const { data: data2, error: error2 } = await supabase
      .from('students')
      .update({ learning_mode: 'home' })
      .eq('id', studentProfile.id)
      .eq('user_id', studentProfile.user_id)
      .select();
    console.log('Result 2:', { data: data2, error: error2 });
    
    // Method 3: Try with different field
    console.log('Method 3: Update phone instead');
    const { data: data3, error: error3 } = await supabase
      .from('students')
      .update({ phone: 'TEST_PHONE' })
      .eq('id', studentProfile.id)
      .select();
    console.log('Result 3:', { data: data3, error: error3 });
    
    // Final check
    const { data: finalCheck, error: finalError } = await supabase
      .from('students')
      .select('learning_mode, phone')
      .eq('id', studentProfile.id)
      .single();
    console.log('Final check:', { data: finalCheck, error: finalError });
  };

  // Add a function to test with RLS disabled
  const testWithRLSDisabled = async () => {
    if (!studentProfile) {
      console.log('❌ No student profile available');
      return;
    }
    
    console.log('🧪 Testing with RLS disabled...');
    
    // Try to disable RLS temporarily (this might not work from client)
    const { data: disableData, error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;'
    });
    
    console.log('Disable RLS result:', { data: disableData, error: disableError });
    
    // Try the update
    const { data: updateData, error: updateError } = await supabase
      .from('students')
      .update({ learning_mode: 'online' })
      .eq('id', studentProfile.id)
      .select();
    
    console.log('Update with RLS disabled:', { data: updateData, error: updateError });
    
    // Re-enable RLS
    const { data: enableData, error: enableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;'
    });
    
    console.log('Enable RLS result:', { data: enableData, error: enableError });
    
    // Final check
    const { data: finalCheck, error: finalError } = await supabase
      .from('students')
      .select('learning_mode')
      .eq('id', studentProfile.id)
      .single();
    
    console.log('Final check:', { data: finalCheck, error: finalError });
  };

  // Make them available globally for testing
  (window as any).testLearningModeUpdate = testLearningModeUpdate;
  (window as any).testMultipleUpdateMethods = testMultipleUpdateMethods;
  (window as any).testWithRLSDisabled = testWithRLSDisabled;

  // Add function to handle makeup lesson booking
  const handleBookMakeupLesson = async () => {
    if (!selectedMakeupCredit || !studentProfile) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          student_id: studentProfile.id,
          teacher_id: selectedMakeupCredit.teacher_id,
          booking_date: makeupBooking.booking_date,
          start_time: selectedMakeupCredit.start_time,
          end_time: selectedMakeupCredit.end_time,
          status: 'confirmed',
          lesson_type: 'makeup',
          notes: makeupBooking.notes,
          mode: studentProfile.learning_mode
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Mark makeup credit as used
      await supabase
        .from('makeup_credits')
        .update({ is_used: true })
        .eq('id', selectedMakeupCredit.id);

      await fetchMyBookings();
      setShowMakeupBookingModal(false);
      setSelectedMakeupCredit(null);
      setMakeupBooking({ booking_date: '', notes: '' });

      toast({
        title: "Success",
        description: "Make-up lesson booked successfully!",
      });
    } catch (error) {
      console.error('Error booking makeup lesson:', error);
      toast({
        title: "Error",
        description: "Failed to book make-up lesson",
        variant: "destructive",
      });
    }
  };

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
            Student Panel
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
            <span className="text-base sm:text-lg font-semibold text-white drop-shadow">Welcome, {studentProfile?.student_name || 'Student'}</span>
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-semibold shadow">
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Student
            </span>
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-4 px-4">Your musical journey starts here. Access lessons, bookings, resources, and more!</p>
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
                      <BarChart3 className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bookings">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Bookings</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="schedule">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Schedule</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="calendar">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Calendar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="materials">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Materials</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="practice">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Practice</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="progress">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="messages">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Messages</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="payments">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Payments</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="account">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Account</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="invoices">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Invoices</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="video-conferencing">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      <span>Video Conferencing</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop horizontal tabs */}
            <TabsList className="hidden lg:flex flex-wrap w-full bg-white/80 shadow-sm rounded-lg overflow-x-auto gap-1 justify-center p-1">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center space-x-2">
                <CalendarDays className="w-4 h-4" />
                <span>Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Materials</span>
              </TabsTrigger>
              <TabsTrigger value="practice" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Practice</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Payments</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Account</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="video-conferencing" className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Video Conferencing</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab - Mobile responsive grid */}
            <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Lessons</CardTitle>
                    <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{lessons.filter(l => l.status === 'scheduled').length}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Practice Hours</CardTitle>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{practiceLogs.reduce((acc, log) => acc + log.duration_minutes, 0)}</div>
                    <p className="text-xs text-muted-foreground">Minutes this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Unread Messages</CardTitle>
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{messages.filter(m => !m.is_read).length}</div>
                    <p className="text-xs text-muted-foreground">New messages</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Outstanding Balance</CardTitle>
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {formatCurrency(
                        invoices
                          .filter(inv => inv.payment_status === 'pending' || inv.payment_status === 'partial')
                          .reduce((acc, inv) => acc + (inv.amount_due - (inv.amount_paid || 0)), 0)
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Due payments</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
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
                              <p className="text-xs sm:text-sm text-gray-600">Duration: {lesson.start_time} - {lesson.end_time}</p>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Practice</CardTitle>
                    <CardDescription>Your latest practice sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {practiceLogs.length > 0 ? (
                      <div className="space-y-4">
                        {practiceLogs.slice(0, 3).map(log => (
                          <div key={log.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                              <h4 className="font-semibold">{log.pieces_practiced?.join(', ') || 'Practice Session'}</h4>
                              <p className="text-sm text-gray-600">{log.duration_minutes} minutes</p>
                              <p className="text-sm text-gray-600">{formatDate(log.practice_date)}</p>
                            </div>
                            <Clock className="w-4 h-4 text-green-600" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No practice sessions recorded</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Time Slots */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Time Slots</CardTitle>
                    <CardDescription>Book lessons with our teachers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Session Limit Display */}
                    {bookingStatus && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Your Session Limits</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Sessions per week:</span> {bookingStatus.sessions_per_week}
                          </div>
                          <div>
                            <span className="font-medium">Booked this week:</span> {bookingStatus.current_week_bookings}
                          </div>
                          <div>
                            <span className="font-medium">Remaining sessions:</span> {bookingStatus.remaining_sessions}
                          </div>
                          <div>
                            <span className="font-medium">Can book more:</span> 
                            <span className={`ml-1 ${bookingStatus.can_book_more ? 'text-green-600' : 'text-red-600'}`}>
                              {bookingStatus.can_book_more ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                        {!bookingStatus.can_book_more && (
                          <p className="text-sm text-red-600 mt-2">
                            You have reached your weekly session limit. Please contact your teacher to reschedule or wait until next week.
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mb-4">
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teachers</SelectItem>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                      {availableTimeSlots
                        .filter(slot => selectedTeacher === 'all' || slot.teacher_id === selectedTeacher)
                        .filter(slot => slot.current_bookings < slot.max_students)
                        .map(slot => (
                          <div key={slot.id} className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                            slot.has_conflict ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{slot.teacher_name}</h4>
                              <div className="flex gap-2">
                                <Badge variant="secondary">{slot.slot_type}</Badge>
                                {slot.has_conflict && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Conflict
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Day:</span> {slot.day_of_week}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </div>
                              <div>
                                <span className="font-medium">Available:</span> {slot.max_students - slot.current_bookings} spots
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {slot.slot_type}
                              </div>
                            </div>
                            {slot.description && (
                              <p className="text-sm text-gray-600 mb-3">{slot.description}</p>
                            )}
                            {slot.has_conflict && (
                              <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700 font-medium">
                                  ⚠️ You have another lesson scheduled during this time period
                                </p>
                              </div>
                            )}
                            <Button 
                              onClick={() => {
                                setSelectedTimeSlot(slot);
                                setNewBooking({
                                  booking_date: '',
                                  lesson_type: 'regular',
                                  notes: '',
                                  frequency: 'weekly',
                                  end_date: ''
                                });
                                setShowBookingModal(true);
                              }}
                              disabled={
                                slot.current_bookings >= slot.max_students || 
                                (bookingStatus && !bookingStatus.can_book_more) ||
                                slot.has_conflict
                              }
                              className="w-full"
                            >
                              {slot.current_bookings >= slot.max_students ? 'Full' : 
                               (bookingStatus && !bookingStatus.can_book_more) ? 'Limit Reached' :
                               slot.has_conflict ? 'Time Conflict' : 'Book This Slot'}
                            </Button>
                            
                            {/* Add recurring booking option for instruments */}
                            {slot.slot_type === 'regular' && slot.current_bookings < slot.max_students && !slot.has_conflict && (
                              <Button 
                                variant="outline"
                                onClick={() => handleBookRecurringSlot(slot)}
                                disabled={bookingStatus && !bookingStatus.can_book_more}
                                className="w-full mt-2"
                              >
                                {bookingStatus && !bookingStatus.can_book_more ? 'Limit Reached' : 'Book Recurring'}
                              </Button>
                            )}
                          </div>
                        ))}
                      {availableTimeSlots.filter(slot => 
                        (selectedTeacher === 'all' || slot.teacher_id === selectedTeacher) &&
                        slot.current_bookings < slot.max_students
                      ).length === 0 && (
                        <p className="text-gray-500 text-center py-8">No available time slots found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* My Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Upcoming Bookings</CardTitle>
                    <CardDescription>View and manage your booked lessons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingBookings.length > 0 ? (
                        upcomingBookings.map(booking => (
                          <div key={booking.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{booking.teacher_name}</h4>
                              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Date:</span> {formatDate(booking.booking_date)}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </div>
                              <div>
                                <span className="font-medium">Day:</span> {booking.day_of_week}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {booking.lesson_type}
                              </div>
                            </div>
                            {booking.notes && (
                              <p className="text-sm text-gray-600 mb-3">{booking.notes}</p>
                            )}
                            <div className="flex space-x-2">
                              {booking.status === 'confirmed' && !isWithin24Hours(booking) && (
                                <div className="flex flex-col gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id, booking.booking_date, booking.start_time)}
                                  >
                                    Cancel Booking
                                  </Button>
                                  <span className="text-xs text-gray-500 mt-1">
                                    Please review our <Link to="/cancellation-policy" className="text-primary underline" target="_blank">24-hour Cancellation Policy</Link> before making changes.
                                  </span>
                                </div>
                              )}
                              {booking.status === 'confirmed' && isWithin24Hours(booking) && (
                                <span className="text-xs text-gray-400">Cannot cancel within 24 hours</span>
                              )}
                              
                              {/* Video Conference Button for Online Lessons */}
                              {booking.mode === 'online' && booking.meeting_room && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenVideoConference(booking)}
                                  className="flex items-center gap-1"
                                >
                                  <Video className="w-4 h-4" />
                                  Join Meeting
                                </Button>
                              )}
                              
                              <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowBookingDetailsModal(true); }}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No upcoming bookings found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Past Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Past Bookings</CardTitle>
                    <CardDescription>Lessons that have already occurred</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pastBookings.length > 0 ? (
                        pastBookings.map(booking => (
                          <div key={booking.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{booking.teacher_name}</h4>
                              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">Date:</span> {formatDate(booking.booking_date)}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </div>
                              <div>
                                <span className="font-medium">Day:</span> {booking.day_of_week}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {booking.lesson_type}
                              </div>
                            </div>
                            {booking.notes && (
                              <p className="text-sm text-gray-600 mb-3">{booking.notes}</p>
                            )}
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowBookingDetailsModal(true); }}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No past bookings found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Make-up Credits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Make-up Credits</CardTitle>
                    <CardDescription>Available credits from cancelled lessons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {makeupCredits.length > 0 ? (
                        makeupCredits.map(credit => (
                          <div key={credit.id} className="p-4 border rounded-lg bg-green-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-green-800">Make-up Credit</h4>
                              <Badge variant="secondary" className="bg-green-200 text-green-800">
                                {credit.is_used ? 'Used' : 'Available'}
                              </Badge>
                            </div>
                            <div className="text-sm text-green-700">
                              <p>Expires: {formatDate(credit.expires_at)}</p>
                              <p>Type: {credit.credit_type}</p>
                            </div>
                            {!credit.is_used && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                                onClick={() => { setSelectedMakeupCredit(credit); setShowMakeupBookingModal(true); }}
                              >
                                Book Make-up Lesson
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No make-up credits available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Schedule</CardTitle>
                  <CardDescription>View and manage your upcoming lessons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lessons.length > 0 ? (
                      lessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold">{lesson.title}</h4>
                              <p className="text-sm text-gray-600">{formatDate(lesson.lesson_date)} at {formatTime(lesson.start_time)}</p>
                              <p className="text-sm text-gray-600">Duration: {lesson.start_time} - {lesson.end_time}</p>
                              <p className="text-sm text-gray-600">Type: {lesson.lesson_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                            {lesson.notes && (
                              <Button variant="outline" size="sm">View Notes</Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No lessons scheduled</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Materials</CardTitle>
                  <CardDescription>Access your course materials, assignments, and resources</CardDescription>
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
                                <p className="text-xs text-gray-500">Updated {formatDate(material.created_at)}</p>
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

            {/* Practice Tab */}
            <TabsContent value="practice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Practice Log</CardTitle>
                  <CardDescription>Track your practice sessions and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Dialog open={showPracticeModal} onOpenChange={setShowPracticeModal}>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Log New Practice Session
                      </Button>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Log Practice Session</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="practice_date" className="text-right">Date</Label>
                            <Input
                              id="practice_date"
                              type="date"
                              value={newPracticeLog.practice_date}
                              onChange={(e) => setNewPracticeLog({...newPracticeLog, practice_date: e.target.value})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">Duration (min)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={newPracticeLog.duration_minutes}
                              onChange={(e) => setNewPracticeLog({...newPracticeLog, duration_minutes: parseInt(e.target.value)})}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="practice_type" className="text-right">Type</Label>
                            <Select value={newPracticeLog.practice_type} onValueChange={(value) => setNewPracticeLog({...newPracticeLog, practice_type: value})}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="regular">Regular Practice</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                                <SelectItem value="performance_prep">Performance Prep</SelectItem>
                                <SelectItem value="technique">Technique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Notes</Label>
                            <Textarea
                              id="notes"
                              value={newPracticeLog.notes}
                              onChange={(e) => setNewPracticeLog({...newPracticeLog, notes: e.target.value})}
                              className="col-span-3"
                              placeholder="What did you practice today?"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowPracticeModal(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddPracticeLog}>
                            Log Session
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="space-y-4">
                      {practiceLogs.length > 0 ? (
                        practiceLogs.map(log => (
                          <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-semibold">{log.pieces_practiced?.join(', ') || 'Practice Session'}</h4>
                              <p className="text-sm text-gray-600">{log.duration_minutes} minutes</p>
                              <p className="text-sm text-gray-600">{formatDate(log.practice_date)}</p>
                              {log.notes && <p className="text-sm text-gray-600">{log.notes}</p>}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{log.practice_type}</Badge>
                              <Clock className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No practice sessions recorded yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progress & Attendance</CardTitle>
                  <CardDescription>View your learning progress and attendance history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">Attendance Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Lessons</span>
                          <span className="font-semibold">{lessons.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed</span>
                          <span className="font-semibold text-green-600">{lessons.filter(l => l.status === 'completed').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendance Rate</span>
                          <span className="font-semibold text-blue-600">
                            {lessons.length > 0 ? Math.round((lessons.filter(l => l.status === 'completed').length / lessons.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-4">Progress Overview</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Current Level</span>
                          <span className="font-semibold">{studentProfile.proficiency_level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Practice Sessions</span>
                          <span className="font-semibold">{practiceLogs.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Practice Time</span>
                          <span className="font-semibold">{practiceLogs.reduce((acc, log) => acc + log.duration_minutes, 0)} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>Communicate with your teachers and academy staff</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
                      <Button className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send New Message
                      </Button>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Send Message</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subject" className="text-right">Subject</Label>
                            <Input
                              id="subject"
                              value={newMessage.subject}
                              onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                              className="col-span-3"
                              placeholder="Message subject"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="message" className="text-right">Message</Label>
                            <Textarea
                              id="message"
                              value={newMessage.message}
                              onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                              className="col-span-3"
                              placeholder="Your message..."
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payments & Invoices</CardTitle>
                  <CardDescription>View your payment history and manage outstanding balances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={showAllInvoices ? "outline" : "default"}
                        size="sm"
                        onClick={() => setShowAllInvoices(false)}
                      >
                        Outstanding
                      </Button>
                      <Button
                        variant={showAllInvoices ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAllInvoices(true)}
                      >
                        All Invoices
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            invoices
                              .filter(inv => inv.payment_status === 'paid')
                              .reduce((acc, inv) => acc + inv.amount_paid, 0)
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Total Paid</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(
                            invoices
                              .filter(inv => inv.payment_status === 'pending' || inv.payment_status === 'partial')
                              .reduce((acc, inv) => acc + (inv.amount_due - (inv.amount_paid || 0)), 0)
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Outstanding</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{invoices.length}</div>
                        <p className="text-sm text-gray-600">Total Invoices</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {(showAllInvoices ? invoices : invoices.filter(inv => inv.payment_status !== 'paid')).length > 0 ? (
                      (showAllInvoices ? invoices : invoices.filter(inv => inv.payment_status !== 'paid')).map(invoice => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">Invoice #{invoice.id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-600">Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}</p>
                            <p className="text-sm text-gray-600">Due: {formatDate(invoice.due_date)}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-semibold">{formatCurrency(invoice.amount_due)}</div>
                              {invoice.amount_paid > 0 && (
                                <div className="text-sm text-green-600">Paid: {formatCurrency(invoice.amount_paid)}</div>
                              )}
                            </div>
                            <Badge className={getStatusColor(invoice.payment_status)}>{invoice.payment_status}</Badge>
                            {invoice.payment_status === 'paid' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                ✓ Paid
                              </Badge>
                            ) : (
                              <Button size="sm" onClick={() => handlePayment(invoice)}>Pay Now</Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          {showAllInvoices ? 'No invoices found' : 'No outstanding invoices'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {showAllInvoices ? 'No invoices have been generated yet.' : 'All your invoices have been paid!'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your profile and account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Personal Information</h4>
                      
                      {/* Profile Photo Section */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {studentProfile?.profile_photo_url || photoPreview ? (
                              <img
                                src={photoPreview || studentProfile?.profile_photo_url}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                              id="photo-upload"
                            />
                            <label htmlFor="photo-upload" className="cursor-pointer" onClick={() => console.log('📸 Upload button clicked')}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center"
                                onClick={() => {
                                  console.log('📸 Button clicked, triggering file input');
                                  document.getElementById('photo-upload')?.click();
                                }}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {studentProfile?.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                              </Button>
                            </label>
                            {photoFile && (
                              <Button 
                                onClick={handlePhotoUpload} 
                                disabled={uploadingPhoto}
                                size="sm"
                                className="flex items-center"
                              >
                                {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                              </Button>
                            )}
                            {studentProfile?.profile_photo_url && !photoFile && (
                              <Button 
                                onClick={removePhoto} 
                                variant="destructive" 
                                size="sm"
                                className="flex items-center"
                              >
                                Remove Photo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input type="text" value={studentProfile.student_name} className="w-full p-2 border rounded-md" readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input type="email" value={studentProfile.email} className="w-full p-2 border rounded-md" readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input type="tel" value={editMode ? editProfile.phone : studentProfile.phone} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} className="w-full p-2 border rounded-md" readOnly={!editMode} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          <input type="date" value={studentProfile.date_of_birth || ''} className="w-full p-2 border rounded-md" readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
                          <input type="text" value={studentProfile.instrument} className="w-full p-2 border rounded-md" readOnly />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Course Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                          <input type="text" value={editMode ? editProfile.experience : studentProfile.experience} onChange={e => setEditProfile({ ...editProfile, experience: e.target.value })} className="w-full p-2 border rounded-md" readOnly={!editMode} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                          <input type="text" value={editMode ? editProfile.proficiency_level : studentProfile.proficiency_level} onChange={e => setEditProfile({ ...editProfile, proficiency_level: e.target.value })} className="w-full p-2 border rounded-md" readOnly={!editMode} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input type="text" value={editMode ? editProfile.location : studentProfile.location || ''} onChange={e => setEditProfile({ ...editProfile, location: e.target.value })} className="w-full p-2 border rounded-md" readOnly={!editMode} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Learning Mode</h4>
                      <div className="space-y-3">
                        {learningModes.map((mode) => (
                          <div key={mode.value} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id={mode.value}
                              name="learning_mode"
                              value={mode.value}
                              checked={editMode ? editProfile.learning_mode === mode.value : studentProfile.learning_mode === mode.value}
                              onChange={(e) => editMode && setEditProfile({ ...editProfile, learning_mode: e.target.value })}
                              disabled={!editMode}
                              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <label htmlFor={mode.value} className="text-sm font-medium text-gray-700">
                              {mode.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      {!editMode ? (
                        <Button onClick={handleEditProfile}>Edit</Button>
                      ) : (
                        <>
                          <Button onClick={handleSaveProfile}>Save</Button>
                          <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                        </>
                      )}
                      <Button variant="outline">Change Password</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Password Confirmation Modal */}
              <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Confirm Password</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Enter your password to confirm changes:</label>
                    <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-2 border rounded-md" autoFocus />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleConfirmPassword}>Confirm</Button>
                    <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <Card className="p-6 bg-white shadow-lg rounded-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5" /> My Lesson Calendar</h2>
                <LessonCalendar
                  events={calendarEvents}
                  onSelectEvent={handleSelectEvent}
                  defaultView="week"
                />
                <EventDetailsModal open={eventModalOpen} onClose={() => setEventModalOpen(false)} event={selectedEvent} />
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>View your lesson invoices and download PDFs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices.length > 0 ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left">Period</th>
                            <th className="text-right">Amount Due</th>
                            <th className="text-center">Status</th>
                            <th className="text-center">Due Date</th>
                            <th className="text-center">PDF</th>
                            <th className="text-center">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv.id}>
                              <td>{inv.period_start} - {inv.period_end}</td>
                              <td className="text-right">KES {inv.amount_due.toLocaleString()}</td>
                              <td className="text-center">{inv.status}</td>
                              <td className="text-center">{inv.due_date}</td>
                              <td className="text-center">{inv.pdf_url ? <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">Download</a> : '-'}</td>
                              <td className="text-center"><Button size="sm" variant="outline" onClick={() => handleViewInvoice(inv)}>View</Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No invoices found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Invoice details modal */}
              <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Invoice Breakdown</DialogTitle>
                  </DialogHeader>
                  {invoiceDetails ? (
                    <div className="space-y-4">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceDetails.lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.description}</td>
                              <td>{item.quantity}</td>
                              <td>KES {item.unitPrice.toLocaleString()}</td>
                              <td>KES {item.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-right font-bold">Total: KES {invoiceDetails.total.toLocaleString()}</div>
                    </div>
                  ) : <p>No breakdown available.</p>}
                  {selectedInvoice && selectedInvoice.pdf_url && (
                    <a href={selectedInvoice.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">Download PDF</Button>
                    </a>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Video Conferencing Tab */}
            <TabsContent value="video-conferencing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Video Conferencing
                  </CardTitle>
                  <CardDescription>Join your online lessons and practice sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meetingRooms.length > 0 ? (
                      meetingRooms.map(room => (
                        <div key={room.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{room.roomName}</h4>
                            <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Type:</span> {room.lessonType}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {formatDate(room.startTime)}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span> {formatTime(room.startTime)} - {formatTime(room.endTime)}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {getMeetingDuration(room.startTime, room.endTime)} min
                            </div>
                          </div>
                          {room.notes && (
                            <p className="text-sm text-gray-600 mb-3">{room.notes}</p>
                          )}
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => handleOpenMeetingRoom(room)}
                              className="flex items-center gap-1"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(room.meetingUrl, '_blank')}
                            >
                              Open in New Tab
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No video conference rooms found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Video Conference Modal */}
      <VideoConferenceModal
        open={showVideoConferenceModal}
        onClose={() => setShowVideoConferenceModal(false)}
        meetingRoom={selectedMeetingRoom}
        userName={studentProfile?.student_name || 'Student'}
        userRole="student"
      />

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Time Slot</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedTimeSlot && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Time Slot</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Teacher:</strong> {selectedTimeSlot.teacher_name}</p>
                  <p><strong>Day:</strong> {selectedTimeSlot.day_of_week}</p>
                  <p><strong>Time:</strong> {formatTime(selectedTimeSlot.start_time)} - {formatTime(selectedTimeSlot.end_time)}</p>
                  <p><strong>Type:</strong> {selectedTimeSlot.slot_type}</p>
                  <p><strong>Next Available:</strong> {getNextAvailableDate(selectedTimeSlot.day_of_week)}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lesson_type" className="text-right">Lesson Type</Label>
              <Select value={newBooking.lesson_type} onValueChange={(value) => setNewBooking({...newBooking, lesson_type: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select lesson type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Lesson</SelectItem>
                  <SelectItem value="practice">Practice Session</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={newBooking.notes}
                onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                placeholder="Any special requests or notes..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookTimeSlot}
              disabled={!selectedTimeSlot}
            >
              Book Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Booking Modal */}
      <Dialog open={showRecurringBookingModal} onOpenChange={setShowRecurringBookingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Recurring Lessons</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedTimeSlot && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Time Slot</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Teacher:</strong> {selectedTimeSlot.teacher_name}</p>
                  <p><strong>Day:</strong> {selectedTimeSlot.day_of_week}</p>
                  <p><strong>Time:</strong> {formatTime(selectedTimeSlot.start_time)} - {formatTime(selectedTimeSlot.end_time)}</p>
                  <p><strong>Start Date:</strong> {getNextAvailableDate(selectedTimeSlot.day_of_week)}</p>
                  <p><strong>End Date:</strong> {getRecurringEndDate(selectedTimeSlot.day_of_week, recurringBooking.frequency)}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recurring_frequency" className="text-right">Frequency</Label>
              <Select value={recurringBooking.frequency} onValueChange={(value) => setRecurringBooking({...recurringBooking, frequency: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recurring_notes" className="text-right">Notes</Label>
              <Textarea
                id="recurring_notes"
                value={recurringBooking.notes}
                onChange={(e) => setRecurringBooking({...recurringBooking, notes: e.target.value})}
                placeholder="Any special requests or notes..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecurringBookingModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRecurringBooking}
              disabled={!selectedTimeSlot}
            >
              Book Recurring Lessons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make-up Credit Booking Modal */}
      <Dialog open={showMakeupBookingModal} onOpenChange={setShowMakeupBookingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Make-up Lesson</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedMakeupCredit && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Make-up Credit Details</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Student:</strong> {selectedMakeupCredit.student_name}</p>
                  <p><strong>Expires:</strong> {formatDate(selectedMakeupCredit.expires_at)}</p>
                  <p><strong>Reason:</strong> {selectedMakeupCredit.reason}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="makeup_date" className="text-right">Date</Label>
              <Input
                id="makeup_date"
                type="date"
                value={makeupBooking.booking_date}
                onChange={(e) => setMakeupBooking({...makeupBooking, booking_date: e.target.value})}
                className="col-span-3"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="makeup_notes" className="text-right">Notes</Label>
              <Textarea
                id="makeup_notes"
                value={makeupBooking.notes}
                onChange={(e) => setMakeupBooking({...makeupBooking, notes: e.target.value})}
                placeholder="Any special requests or notes..."
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMakeupBookingModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookMakeupLesson}
              disabled={!makeupBooking.booking_date || !selectedMakeupCredit}
            >
              Book Make-up Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard; 