import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, CalendarDays, BookOpen, Clock, BarChart3, MessageSquare, CreditCard, User, LogOut, Bell, Music, FileText, Users, Calendar as CalendarIcon, Target, TrendingUp, Plus, Download, Eye, Edit, Trash2, Upload, Camera, Video, AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
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
import { MeetingRoom, getUserMeetingRooms, getMeetingRoomByBooking, getMeetingDuration, getUserInvitedMeetings, joinMeetingByCode, InstantMeeting } from '../lib/videoConferencing';
import MessagingUI from '../components/MessagingUI';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import StudentAccountStatusBanner from '../components/StudentAccountStatusBanner';
import { checkBookingEligibility, validateBookingAttempt, getUnpaidInvoiceCount } from '../lib/bookingRestrictions';

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
  is_access_suspended?: boolean;
  suspension_reason?: string | null;
  suspension_updated_at?: string | null;
  allow_unpaid_access?: boolean;
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
  next_available_date?: string;
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
  user_id: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState(0);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  
  // Helper function to check if student is suspended
  const isSuspended = studentProfile ? (studentProfile.account_suspended || studentProfile.is_access_suspended) : false;
  const [passwordChecked, setPasswordChecked] = useState(false);
  
  // Classroom state
  const [classroomJoinCode, setClassroomJoinCode] = useState('');
  const [studentClassrooms, setStudentClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<any | null>(null);
  const [classroomFeed, setClassroomFeed] = useState<any[]>([]);
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  
  // Booking system state
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const [teacherAuthProfiles, setTeacherAuthProfiles] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);


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
  const [isUsingMakeupCredit, setIsUsingMakeupCredit] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<any>(null);
  

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
  const [invitedMeetings, setInvitedMeetings] = useState<InstantMeeting[]>([]);
  const [joinMeetingCode, setJoinMeetingCode] = useState('');
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);

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

  const musicInstruments = [
    "Piano", "Drums", "Violin", "Saxophone", "Bass Guitar", 
    "Acoustic Guitar", "Electric Guitar", "Flute", "Clarinet", "Cello", "Voice",
    "Music Theory", "Trumpet", "Trombone", "Other"
  ];

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

  // Learning mode change request functionality has been removed

  // Add recurring booking state
  const [recurringBooking, setRecurringBooking] = useState({
    start_date: '',
    end_date: '',
    frequency: 'weekly',
    notes: ''
  });


  const [isBookingWithMakeupCredit, setIsBookingWithMakeupCredit] = useState(false);
  const [timeSlotConflicts, setTimeSlotConflicts] = useState<{[key: string]: boolean}>({});
  // Pagination for available time slots
  const [timeSlotsPage, setTimeSlotsPage] = useState(1);
  const timeSlotsPerPage = 5;

  const [showAllInvoices, setShowAllInvoices] = useState(false);
  const [hasPaidFirstInvoice, setHasPaidFirstInvoice] = useState(false);
  const [accessLockReason, setAccessLockReason] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (studentProfile) {
      fetchMyBookings();
      fetchBookingStatus();
      // Ensure classrooms load when profile is available (on refresh)
      fetchStudentClassrooms();
    }
  }, [studentProfile]);

  // Load classrooms whenever user visits the Classroom tab
  useEffect(() => {
    if (activeTab === 'classroom' && studentProfile?.id) {
      fetchStudentClassrooms();
    }
  }, [activeTab, studentProfile?.id]);

  // Check all time slot conflicts and update state
  // Check if a time slot conflicts with existing bookings for the current student
  const checkTimeSlotConflict = async (timeSlot: AvailableTimeSlot) => {
    if (!studentProfile) return false;
    
    const bookingDate = getNextAvailableDateISO(timeSlot.day_of_week, timeSlot.start_time);
    
    try {
      // Check for overlapping bookings at the same time
      const { data: overlappingBookings, error: overlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('booking_date', bookingDate)
        .eq('start_time', timeSlot.start_time)
        .eq('end_time', timeSlot.end_time)
        .eq('status', 'confirmed');

      if (overlapError) {
        console.error('Error checking time slot conflicts:', overlapError);
        return false;
      }

      return overlappingBookings && overlappingBookings.length > 0;
    } catch (error) {
      console.error('Error checking time slot conflicts:', error);
      return false;
    }
  };

  const checkAllTimeSlotConflicts = async () => {
    if (!studentProfile || availableTimeSlots.length === 0) return;
    
    const conflicts: {[key: string]: boolean} = {};
    
    for (const slot of availableTimeSlots) {
      const hasConflict = await checkTimeSlotConflict(slot);
      conflicts[slot.id] = hasConflict;
    }
    
    setTimeSlotConflicts(conflicts);
  };

  // Check conflicts when time slots are loaded
  useEffect(() => {
    if (availableTimeSlots.length > 0 && studentProfile) {
      checkAllTimeSlotConflicts();
    }
  }, [availableTimeSlots, studentProfile]);

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

  // Auto-refresh invoice status when switching to payments tab
  useEffect(() => {
    if (activeTab === 'payments' && studentProfile?.id) {
      refreshInvoiceStatus();
    }
  }, [activeTab, studentProfile?.id]);

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
      const studentProfileData = { ...student, ...profile };
      setStudentProfile(studentProfileData);
      
      // Fetch unpaid invoice count for status banner
      if (student.id) {
        const unpaidCount = await getUnpaidInvoiceCount(student.id);
        setUnpaidInvoiceCount(unpaidCount);
      }
      
      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', student.id)
        .order('lesson_date', { ascending: true });

      if (!lessonsError && lessonsData) {
        setLessons(lessonsData);
      }


      // Fetch portal messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('recipient_id', user.id)
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

      // Fetch teachers
      await fetchTeachers();
      // Ensure all teacher auth profiles are available for messaging recipients
      await fetchTeacherAuthProfiles();
      
      // Fetch admin profiles
      await fetchAdminProfiles();
      
      // Fetch my bookings
      await fetchMyBookings();
      
      // Fetch meeting rooms
      await fetchMeetingRooms();
      
      // Fetch booking status for session limits
      await fetchBookingStatus();
      
      // Fetch make-up credits with the student data directly
      await fetchMakeupCreditsWithData(studentProfileData);
      
      // Fetch invoices with payment status
      await fetchInvoices(student.id);

      // Fetch available time slots with the student data directly
      await fetchAvailableTimeSlotsWithData(studentProfileData);
      
      // Learning mode change requests functionality has been removed

      // Fetch pending approval requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('student_id', student.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!requestsError && requestsData) {
        setPendingRequests(requestsData);
      }

      // Fetch notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 notifications

      if (!notificationsError && notificationsData) {
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.is_read).length);
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({ title: 'Error', description: 'Failed to load student data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Prevent tab switching when suspended (only allow dashboard, account, invoices, payments, notifications)
  useEffect(() => {
    if (isSuspended && activeTab && !['dashboard', 'account', 'invoices', 'payments', 'notifications'].includes(activeTab)) {
      setActiveTab('dashboard');
      toast({
        title: 'Access Restricted',
        description: 'This feature is not available while your account is suspended.',
        variant: 'destructive'
      });
    }
  }, [isSuspended, activeTab, toast]);

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
  // Conflicts are now handled by the database function
  const checkBookingConflict = async (timeSlot: AvailableTimeSlot) => {
    // This function is no longer needed as conflicts are handled server-side
    return false;
  };

  // Fetch available time slots with conflict checking
  const fetchAvailableTimeSlots = async () => {
    if (!studentProfile) {
      console.log('❌ No student profile, skipping time slot fetch');
      return;
    }

    try {
      console.log('🔄 Fetching available time slots for student:', studentProfile.id);
      
      // Use the new database function that handles everything server-side
      const { data, error } = await supabase
        .rpc('get_available_time_slots_for_student', { 
          student_id_param: studentProfile.id 
        });

      if (error) {
        console.error('❌ Error fetching time slots:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        return;
      }

      console.log('✅ Time slots fetched:', data?.length || 0, 'slots');
      console.log('📋 Time slots data:', data);

      if (data && data.length > 0) {
        // Transform the data to match the expected interface
        const transformedSlots = data.map((slot: any) => ({
            id: slot.id,
            teacher_id: slot.teacher_id,
          teacher_name: slot.teacher_name,
          teacher_email: slot.teacher_email,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            slot_type: slot.slot_type,
            max_students: slot.max_students,
            description: slot.description,
          current_bookings: 0, // Will be calculated if needed
          has_conflict: slot.has_conflict,
          next_available_date: slot.next_available_date
        }));

        // Sort by next available date/time ascending
        const sorted = transformedSlots.sort((a, b) => new Date(a.next_available_date || `${a.day_of_week}`).getTime() - new Date(b.next_available_date || `${b.day_of_week}`).getTime());
        console.log('✅ Processed time slots:', sorted);
        setAvailableTimeSlots(sorted);
        setTimeSlotsPage(1);
      } else {
        console.log('⚠️ No time slots found or data is empty');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchAvailableTimeSlots:', error);
    }
  };





  // Fetch available time slots with student data passed directly
  const fetchAvailableTimeSlotsWithData = async (studentData: StudentProfile) => {
    try {
      console.log('🔄 Fetching available time slots for student:', studentData.id);
      
      // Use the new database function that handles everything server-side
      const { data, error } = await supabase
        .rpc('get_available_time_slots_for_student', { 
          student_id_param: studentData.id 
        });

      if (error) {
        console.error('❌ Error fetching time slots:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        return;
      }

      console.log('✅ Time slots fetched:', data?.length || 0, 'slots');
      console.log('📋 Time slots data:', data);

      if (data && data.length > 0) {
        // Transform the data to match the expected interface
        const transformedSlots = data.map((slot: any) => ({
          id: slot.id,
          teacher_id: slot.teacher_id,
          teacher_name: slot.teacher_name,
          teacher_email: slot.teacher_email,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
          slot_type: slot.slot_type,
          max_students: slot.max_students,
          description: slot.description,
          current_bookings: 0, // Will be calculated if needed
          has_conflict: slot.has_conflict,
          next_available_date: slot.next_available_date
        }));

        const sorted = transformedSlots.sort((a, b) => new Date(a.next_available_date || `${a.day_of_week}`).getTime() - new Date(b.next_available_date || `${b.day_of_week}`).getTime());
        console.log('✅ Processed time slots:', sorted);
        setAvailableTimeSlots(sorted);
        setTimeSlotsPage(1);
      } else {
        console.log('⚠️ No time slots found or data is empty');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('❌ Error in fetchAvailableTimeSlotsWithData:', error);
    }
  };

  // Fetch all teachers
  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, user_id, name, email, phone, bio, experience, category, subjects, status')
        .not('user_id', 'is', null)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching teachers:', error);
        return;
      }

      if (data) {
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error in fetchTeachers:', error);
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

  // Fetch teacher auth profiles (role = 'teacher') to ensure all teachers are available as recipients
  const fetchTeacherAuthProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, profile_photo_url')
        .eq('role', 'teacher')
        .order('email', { ascending: true });
      if (error) {
        console.error('Error fetching teacher auth profiles:', error);
        return;
      }
      setTeacherAuthProfiles(data || []);
    } catch (err) {
      console.error('Error in fetchTeacherAuthProfiles:', err);
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
      console.log('[StudentDashboard] Fetching meeting rooms for student:', {
        studentId: studentProfile.id,
        userId: studentProfile.user_id
      });
      
      const rooms = await getUserMeetingRooms(studentProfile.id, 'student');
      setMeetingRooms(rooms);
      
      // Also fetch invited meetings
      console.log('[StudentDashboard] Fetching invited meetings for user:', studentProfile.user_id);
      const invited = await getUserInvitedMeetings(studentProfile.user_id);
      console.log('[StudentDashboard] Fetched invited meetings:', invited);
      console.log('[StudentDashboard] Invited meeting details:', invited.map(m => ({
        id: m.id,
        title: m.title,
        hostId: m.hostId,
        participants: m.participants,
        status: m.status,
        meetingUrl: m.meetingUrl
      })));
      setInvitedMeetings(invited);
    } catch (error) {
      console.error('Error fetching meeting rooms:', error);
    }
  };

  // Fetch booking status for session limits
  const fetchBookingStatus = async () => {
    if (!studentProfile) return;

    try {
      console.log('🚀 Fetching booking status with new function for:', studentProfile.id);
      
      // Use the updated function with booking_date_param for accurate current week calculation
      const { data, error } = await supabase
        .rpc('get_student_booking_status', { 
          student_id_param: studentProfile.id,
          booking_date_param: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error fetching booking status:', error);
        return;
      }

      console.log('📊 Booking status response:', data);
      
      if (data && data.length > 0) {
        setBookingStatus(data[0]);
        console.log('✅ Updated booking status:', data[0]);
      }
    } catch (error) {
      console.error('Error fetching booking status:', error);
    }
  };

  // Fetch make-up credits
  const fetchMakeupCredits = async () => {
    if (!studentProfile) return;
    
    try {
      console.log('🔄 Fetching make-up credits for student:', studentProfile.id);
      
      // Use the new database function for better performance and accuracy
      const { data, error } = await supabase
        .rpc('get_student_makeup_credits', { student_id_param: studentProfile.id });
      
      if (error) {
        console.error('❌ Error fetching makeup credits:', error);
        return;
      }
      
      console.log('✅ Make-up credits fetched:', data);
      
      // Filter to only show available credits (not used, not expired)
      const availableCredits = data?.filter(credit => 
        !credit.is_used && credit.days_until_expiry > 0
      ) || [];
      
      console.log('✅ Available make-up credits:', availableCredits);
      setMakeupCredits(availableCredits);
    } catch (error) {
      console.error('❌ Error in fetchMakeupCredits:', error);
    }
  };

  // Fetch make-up credits with student data passed directly
  const fetchMakeupCreditsWithData = async (studentData: StudentProfile) => {
    try {
      console.log('🔄 Fetching make-up credits for student:', studentData.id);
      
      // Use the new database function for better performance and accuracy
      const { data, error } = await supabase
        .rpc('get_student_makeup_credits', { student_id_param: studentData.id });
      
      if (error) {
        console.error('❌ Error fetching makeup credits:', error);
        return;
      }
      
      console.log('✅ Make-up credits fetched:', data);
      
      // Filter to only show available credits (not used, not expired)
      const availableCredits = data?.filter(credit => 
        !credit.is_used && credit.days_until_expiry > 0
      ) || [];
      
      console.log('✅ Available make-up credits:', availableCredits);
      setMakeupCredits(availableCredits);
    } catch (error) {
      console.error('❌ Error in fetchMakeupCreditsWithData:', error);
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

  // Handle joining meeting by code
  const handleJoinByCode = async () => {
    if (!joinMeetingCode.trim() || !studentProfile?.user_id) {
      toast({
        title: "Validation Error",
        description: "Please enter a meeting code",
        variant: "destructive",
      });
      return;
    }

    setIsJoiningMeeting(true);
    try {
      const meeting = await joinMeetingByCode(joinMeetingCode.trim(), studentProfile.user_id);
      if (meeting) {
        // Open the meeting in a new tab
        const meetingUrl = `https://meet.jit.si/${meeting.meeting_code}`;
        window.open(meetingUrl, '_blank');
        
        toast({
          title: "Joined Meeting",
          description: `Successfully joined meeting: ${meeting.title}`,
        });
        
        setJoinMeetingCode('');
      } else {
        toast({
          title: "Meeting Not Found",
          description: "No active meeting found with that code or you're not invited",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error",
        description: "Failed to join meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoiningMeeting(false);
    }
  };

  // Classroom helpers
  const fetchStudentClassrooms = async () => {
    if (!studentProfile) return;
    
    try {
      // Use a proper join to avoid ambiguous column references
      const { data, error } = await supabase
        .from('classroom_enrollments')
        .select(`
          classroom_id,
          classrooms!inner(
            id,
            name,
            description,
            status,
            class_code,
            teacher_id,
            teachers(name)
          )
        `)
        .eq('student_id', studentProfile.id);
        
      if (error) {
        console.error('Error fetching student classrooms:', error);
        return;
      }
      
      const classrooms = (data || []).map((enrollment: any) => ({
        id: enrollment.classrooms.id,
        name: enrollment.classrooms.name,
        description: enrollment.classrooms.description,
        status: enrollment.classrooms.status,
        class_code: enrollment.classrooms.class_code,
        teacher_id: enrollment.classrooms.teacher_id,
        teacher_name: enrollment.classrooms.teachers?.name || 'Teacher'
      }));
      
      setStudentClassrooms(classrooms);
    } catch (error) {
      console.error('Error in fetchStudentClassrooms:', error);
    }
  };

  const fetchClassroomFeed = async (classroomId: string) => {
    const { data, error } = await supabase.rpc('get_classroom_feed', { classroom_id_param: classroomId });
    if (!error) {
      setClassroomFeed(data || []);
      // Preload comments for each post
      const commentsMap: Record<string, any[]> = {};
      for (const post of data || []) {
        const { data: cm } = await supabase.rpc('get_post_comments', { post_id_param: post.post_id });
        commentsMap[post.post_id] = cm || [];
      }
      setPostComments(commentsMap);
    }
  };

  const handleJoinClassroom = async () => {
    if (!studentProfile || !classroomJoinCode) return;
    
    try {
      const { data, error } = await supabase.rpc('enroll_student_with_code', {
        student_id_param: studentProfile.id,
        class_code_param: classroomJoinCode.trim().toUpperCase()
      });
      
      if (error) {
        console.error('Classroom join error:', error);
        toast({ 
          title: 'Join Failed', 
          description: error.message || 'Invalid or inactive class code.', 
          variant: 'destructive' 
        });
        return;
      }
      
      toast({ 
        title: 'Success!', 
        description: 'You have successfully joined the classroom.' 
      });
      setClassroomJoinCode('');
      await fetchStudentClassrooms();
    } catch (error) {
      console.error('Error joining classroom:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to join classroom. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const selectClassroom = async (c: any) => {
    setSelectedClassroom(c);
    await fetchClassroomFeed(c.id);
  };

  const handleAddComment = async (postId: string) => {
    if (!studentProfile) return;
    const text = (newComment[postId] || '').trim();
    if (!text) return;
    const { error } = await supabase.rpc('add_classroom_comment', {
      post_id_param: postId,
      author_student_id_param: studentProfile.id,
      author_teacher_id_param: null,
      content_param: text
    });
    if (!error) {
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      // Refresh comments for this post
      const { data: cm } = await supabase.rpc('get_post_comments', { post_id_param: postId });
      setPostComments(prev => ({ ...prev, [postId]: cm || [] }));
    }
  };

  // Get next available date for a given day of the week
  const getNextAvailableDate = (dayOfWeek: string): string => {
    // Use database function for consistency
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

  // Get next available date as ISO string for booking (allow same-day if >6h before start)
  const getNextAvailableDateISO = (dayOfWeek: string, startTime?: string): string => {
    // Use database function for consistency
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayNames.indexOf(dayOfWeek);
    
    if (targetDayIndex === -1) return '';
    
    const currentDayIndex = today.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    
    // If the target day has passed this week, get next week's date
    if (daysToAdd < 0) {
      daysToAdd += 7;
    } else if (daysToAdd === 0 && startTime) {
      const [h, m] = startTime.split(':').map(Number);
      const start = new Date(today);
      start.setHours(h, m || 0, 0, 0);
      const diffHours = (start.getTime() - today.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 6) {
        daysToAdd = 7; // within 6 hours, push to next week
      }
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    
    return nextDate.toISOString().split('T')[0];
  };

  // Handle booking a time slot
  const handleBookTimeSlot = async () => {
    if (!selectedTimeSlot || !studentProfile) return;

    // CHECK BOOKING ELIGIBILITY FIRST - Block if suspended
    const isSuspended = studentProfile.account_suspended || studentProfile.is_access_suspended;
    if (isSuspended) {
      toast({
        title: '🚫 Booking Not Allowed',
        description: `Your account has been suspended. ${studentProfile.suspension_reason || 'Please contact administration.'}\n\nContact admin at info@damonmusicacademy.co.ke or call +254 701 195 460 or +254 713 490 535`,
        variant: 'destructive'
      });
      return; // BLOCK the booking
    }

    const validation = validateBookingAttempt({
      id: studentProfile.id,
      account_suspended: isSuspended,
      suspension_reason: studentProfile.suspension_reason,
      is_access_suspended: studentProfile.is_access_suspended
    });

    if (!validation.success) {
      toast({
        title: validation.title,
        description: validation.message,
        variant: validation.variant
      });
      return; // BLOCK the booking
    }

    try {
      // Automatically calculate the next available date for the selected day
      const bookingDate = getNextAvailableDateISO(selectedTimeSlot.day_of_week, selectedTimeSlot.start_time);
      
      // Check for time conflicts before proceeding with booking
      const hasConflict = await checkTimeSlotConflict(selectedTimeSlot);
      if (hasConflict) {
        toast({
          title: "Time Conflict Detected",
          description: "You already have a lesson scheduled during this time. Please choose a different time slot.",
          variant: "destructive",
        });
        return;
      }
      
      // Check booking capacity with enhanced validation (includes makeup credits)
      console.log('🚀 About to check booking capacity for:', {
        student_id: studentProfile.id,
        booking_date: bookingDate,
        student_name: studentProfile.student_name,
        sessions_per_week: studentProfile.sessions_per_week || 'not set'
      });
      
      const { data: bookingCapacity, error: capacityError } = await supabase
        .rpc('validate_student_booking_capacity', { 
          student_id_param: studentProfile.id,
          booking_date_param: bookingDate
        });

      console.log('📦 Raw booking capacity response:', {
        data: bookingCapacity,
        error: capacityError
      });

      if (capacityError) {
        console.error('Error checking booking capacity:', capacityError);
        toast({
          title: "Error",
          description: "Failed to check booking limits. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!bookingCapacity) {
        toast({
          title: "Error",
          description: "Unable to verify booking limits. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('📊 Booking capacity:', bookingCapacity);
      console.log('📅 Booking date:', bookingDate);
      console.log('📅 Week start:', bookingCapacity.week_start);
      console.log('📅 Week end:', bookingCapacity.week_end);
      
      // If student can't book more sessions, check if they have make-up credits
      if (!bookingCapacity.can_book) {
        const availableCredits = bookingCapacity.available_makeup_credits || 0;
        
        console.log('🚫 Cannot book regular session - limit reached');
        console.log('Current bookings this week:', bookingCapacity.current_bookings);
        console.log('Total capacity:', bookingCapacity.total_capacity);
        console.log('Available makeup credits:', availableCredits);
        
        if (availableCredits > 0) {
          // If booking with makeup credit is explicitly requested, proceed
          if (isBookingWithMakeupCredit) {
            console.log('✅ Booking with makeup credit as requested');
            setIsUsingMakeupCredit(true);
          } else {
            // Ask user if they want to use a make-up credit
            const useMakeupCredit = window.confirm(
              `You have reached your enrollment limit of ${bookingCapacity.regular_sessions} session${bookingCapacity.regular_sessions !== 1 ? 's' : ''} per week (${bookingCapacity.current_bookings}/${bookingCapacity.regular_sessions} used).\n\n` +
              `Week period: ${bookingCapacity.week_start} to ${bookingCapacity.week_end}\n\n` +
              `You have ${availableCredits} make-up credit(s) available.\n\n` +
              `Would you like to use a make-up credit for this booking?`
            );
            
            if (!useMakeupCredit) {
              toast({
                title: "Booking Cancelled",
                description: `You can book again next week (starting ${new Date(new Date(bookingCapacity.week_start).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}) or use a make-up credit.`,
                variant: "destructive",
              });
              return;
            }
            
            // Continue with booking using make-up credit
            console.log('✅ User chose to use make-up credit for booking');
            setIsUsingMakeupCredit(true);
          }
        } else {
          // Check if user is trying to book with makeup credit but has none available
          if (isBookingWithMakeupCredit) {
            toast({
              title: "No Make-up Credits Available",
              description: "You don't have any available make-up credits. Please book a regular session or wait until next week.",
              variant: "destructive",
            });
            return;
          }
          
          // Enhanced error message with week details
          const nextWeekStart = new Date(new Date(bookingCapacity.week_start).getTime() + 7 * 24 * 60 * 60 * 1000);
          
          toast({
            title: "Weekly Session Limit Reached",
            description: `You have booked ${bookingCapacity.current_bookings} out of ${bookingCapacity.regular_sessions} session${bookingCapacity.regular_sessions !== 1 ? 's' : ''} for this week (${bookingCapacity.week_start} to ${bookingCapacity.week_end}). Next week starts on ${nextWeekStart.toLocaleDateString()}.`,
            variant: "destructive",
          });
          return;
        }
      } else {
        console.log('✅ Can book regular session');
        console.log('Current bookings:', bookingCapacity.current_bookings);
        console.log('Remaining slots:', bookingCapacity.remaining_slots);
      }

      const isOnline = studentProfile.learning_mode === 'online';
      
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
      // This checks if the new booking overlaps with any existing bookings
      const { data: timeOverlapBookings, error: timeOverlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', studentProfile.id)
        .eq('booking_date', bookingDate)
        .eq('status', 'confirmed')
        .lt('start_time', selectedTimeSlot.end_time)
        .gt('end_time', selectedTimeSlot.start_time);

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
        console.log('Time conflict detected:', timeOverlapBookings);
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

      // If student used a make-up credit, mark it as used
      if (!bookingCapacity.can_book && bookingCapacity.available_makeup_credits > 0 && booking) {
        try {
          console.log('🎫 Using make-up credit for booking:', booking.id);
          
          const { data: creditUsage, error: creditError } = await supabase
            .rpc('use_makeup_credit_for_booking', { 
              student_id_param: studentProfile.id,
              booking_id_param: booking.id 
            });
          
          if (creditError) {
            console.error('❌ Error using make-up credit:', creditError);
            toast({
              title: "Warning",
              description: "Lesson booked successfully, but there was an issue with the make-up credit. Please contact support.",
              variant: "destructive",
            });
          } else if (creditUsage?.success) {
            console.log('✅ Make-up credit used successfully:', creditUsage);
            toast({
              title: "Make-up Credit Used",
              description: "A make-up credit has been used for this booking.",
            });
          }
        } catch (creditError) {
          console.error('❌ Error in make-up credit usage:', creditError);
        }
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
      await fetchMakeupCredits(); // Refresh make-up credits after booking

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

  // Handle canceling a booking with enhanced policy
  const handleCancelBooking = async (bookingId: string, bookingDate: string, startTime: string) => {
    try {
      // Find the booking to check if it's a make-up lesson
      const booking = myBookings.find(b => b.id === bookingId);
      
      if (booking?.lesson_type === 'makeup') {
        toast({
          title: "Cannot Cancel Make-up Lesson",
          description: "Make-up lessons cannot be cancelled or rescheduled once scheduled. Missing it will result in forfeiture.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if it's within 24 hours
      const lessonDateTime = new Date(`${bookingDate}T${startTime}`);
      const currentDateTime = new Date();
      const hoursDiff = (lessonDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60);
      
      // Get student's cancellation status to provide better feedback
      let cancellationStatus = null;
      if (studentProfile) {
        const { data: statusData } = await supabase.rpc('get_student_cancellation_status', {
          student_id_param: studentProfile.id
        });
        cancellationStatus = statusData;
      }
      
      let warningMessage = "";
      let shouldProceed = true;
      
      if (hoursDiff < 24) {
        // Late cancellation - show warning
        warningMessage = "This lesson is within the 24-hour window. As per our policy, cancelling now will forfeit the lesson and the full fee will be charged. Are you sure you want to cancel?";
      } else if (cancellationStatus && cancellationStatus.next_cancellation_will_be_charged) {
        // Beyond the 2-per-billing-period limit
        warningMessage = "You have already used your 2 make-up credits for this billing period. Cancelling this lesson will result in no make-up credit being issued, and you will be charged for the lesson as if it were a no-show. Are you sure you want to proceed?";
      }
      
      if (warningMessage) {
        const confirmed = window.confirm(warningMessage);
        if (!confirmed) {
          return;
        }
      }
      
      // Call the enhanced cancellation function
      const { data, error } = await supabase.rpc('cancel_booking_with_enhanced_policy', {
        booking_id_param: bookingId,
        cancellation_reason_param: hoursDiff < 24 ? 'Late cancellation' : 'Student cancellation'
      });
      
      if (error) {
        throw error;
      }
      
      // Send notification emails
      await sendCancellationNotifications(bookingId, hoursDiff < 24, data?.charged_as_no_show || false);
      
      await fetchMyBookings();
      await fetchAvailableTimeSlots();
      await fetchMakeupCredits(); // Refresh make-up credits
      
      console.log('🔄 After cancellation - refreshing all data');
      
      // Get the response message from the database function
      const responseMessage = data?.message || "Lesson cancelled successfully.";
      
      let finalMessage = responseMessage;
      
      if (hoursDiff < 24) {
        finalMessage = "Lesson cancelled. As this was within the 24-hour window, the lesson has been forfeited.";
      } else if (data?.charged_as_no_show) {
        finalMessage = "Lesson cancelled. No make-up credit issued as you have exceeded the 2-cancellation limit per billing period. You will be charged for this lesson as if it were a no-show.";
      }
      
      toast({
        title: "Booking Cancelled",
        description: finalMessage,
        variant: data?.charged_as_no_show ? "destructive" : "default",
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
  const sendCancellationNotifications = async (bookingId: string, isLateCancellation: boolean, chargedAsNoShow: boolean = false) => {
    try {
      const booking = myBookings.find(b => b.id === bookingId);
      if (!booking) return;
      
      let cancellationType = isLateCancellation ? 'Late' : 'Timely';
      let cancellationDetails = isLateCancellation 
        ? 'This was a late cancellation and the lesson is forfeited.' 
        : chargedAsNoShow 
          ? 'This was a timely cancellation but no make-up credit was issued as the student has exceeded the 2-cancellation limit per billing period. The student will be charged as if it were a no-show.'
          : 'This was a timely cancellation and a make-up credit was issued.';
      
      // Send notification to admin
      await supabase.rpc('send_booking_notification', {
        booking_id: bookingId,
        notification_type: 'cancellation',
        recipient_type: 'admin',
        recipient_email: 'admin@damonmusicacademy.co.ke',
        subject: `Lesson Cancellation - ${cancellationType}`,
        message: `Student ${studentProfile?.student_name} cancelled their lesson with ${booking.teacher_name} on ${formatDate(booking.booking_date)}. ${cancellationDetails}`
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

    // CHECK BOOKING ELIGIBILITY FIRST - Block if suspended
    const isSuspended = studentProfile.account_suspended || studentProfile.is_access_suspended;
    if (isSuspended) {
      toast({
        title: '🚫 Booking Not Allowed',
        description: `Your account has been suspended. ${studentProfile.suspension_reason || 'Please contact administration.'}\n\nContact admin at info@damonmusicacademy.co.ke or call +254 701 195 460 or +254 713 490 535`,
        variant: 'destructive'
      });
      return; // BLOCK the booking
    }

    const validation = validateBookingAttempt({
      id: studentProfile.id,
      account_suspended: isSuspended,
      suspension_reason: studentProfile.suspension_reason,
      is_access_suspended: studentProfile.is_access_suspended
    });

    if (!validation.success) {
      toast({
        title: validation.title,
        description: validation.message,
        variant: validation.variant
      });
      return; // BLOCK the booking
    }
    
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
      const startDate = getNextAvailableDateISO(selectedTimeSlot.day_of_week, selectedTimeSlot.start_time);
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

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (!error) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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

  const getEffectiveAmountDue = (invoice: any) => {
    if (!invoice) return 0;
    const manualRaw = invoice.manual_amount_due;
    const manual = manualRaw !== null && manualRaw !== undefined ? Number(manualRaw) : null;
    const base = invoice.amount_due !== null && invoice.amount_due !== undefined ? Number(invoice.amount_due) : 0;
    if (manual !== null && !Number.isNaN(manual)) {
      return manual;
    }
    return base;
  };

  const getOutstandingAmount = (invoice: any) => {
    if (!invoice) return 0;
    const due = getEffectiveAmountDue(invoice);
    const paidRaw = invoice.amount_paid !== null && invoice.amount_paid !== undefined ? Number(invoice.amount_paid) : 0;
    const paid = Number.isNaN(paidRaw) ? 0 : paidRaw;
    return Math.max(0, due - paid);
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

  // Enhanced invoice fetching with live status checking
  const fetchInvoices = async (studentId: string, showRefreshMessage = false) => {
    if (!studentId || studentId === 'undefined' || studentId === undefined || studentId === null) {
      console.error('Invalid or missing studentId for invoice query:', studentId);
      toast({ title: 'Error', description: 'Invalid or missing student ID for invoice query.', variant: 'destructive' });
      return;
    }
    
    try {
      // Fetch invoices with latest status from Supabase
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
      
    console.log('Fetched invoices data:', data);
    console.log('Invoice count:', data.length);
          data.forEach((inv, index) => {
        console.log(`Invoice ${index + 1}:`, {
          id: inv.id,
          status: inv.status,
          amount_due: inv.amount_due,
          amount_paid: inv.amount_paid,
          student_id: inv.student_id
        });
      });
    
    setInvoices(data);
      
      if (showRefreshMessage) {
        toast({
          title: "Status Updated",
          description: "Invoice statuses have been refreshed.",
        });
      }
    } catch (error) {
      console.error('Error in fetchInvoices:', error);
      toast({ title: 'Error', description: 'Failed to refresh invoice status.', variant: 'destructive' });
    }
  };

  // Function to refresh invoice status in real-time
  const refreshInvoiceStatus = async () => {
    if (studentProfile?.id) {
      console.log('Manual refresh triggered for student:', studentProfile.id);
      await fetchInvoices(studentProfile.id, true);
      
      // Force a re-render by updating state
      setTimeout(() => {
        setInvoices([...invoices]);
      }, 100);
    }
  };

  // Function to force refresh outstanding balance
  const forceRefreshBalance = async () => {
    if (studentProfile?.id) {
      console.log('Force refresh balance triggered');
      // Clear invoices first
      setInvoices([]);
      // Then fetch fresh data
      await fetchInvoices(studentProfile.id, true);
    }
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
      // First, check the current live status of the invoice
      const { data: currentInvoice, error: statusError } = await supabase
        .from('invoices')
        .select('status, amount_due, amount_paid')
        .eq('id', invoice.id)
        .single();

      if (statusError) {
        console.error('Error checking invoice status:', statusError);
        toast({
          title: "Error",
          description: "Failed to verify invoice status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Check if invoice is already paid
      if (currentInvoice.status === 'paid') {
        toast({
          title: "Already Paid",
          description: "This invoice has already been paid. Refreshing status...",
        });
        await refreshInvoiceStatus();
        return;
      }

      // Check if invoice is fully paid but status not updated
      if (currentInvoice.status === 'paid') {
        toast({
          title: "Payment Complete",
          description: "This invoice appears to be fully paid. Refreshing status...",
        });
        await refreshInvoiceStatus();
        return;
      }

      toast({
        title: "Payment Processing",
        description: "Redirecting to payment gateway...",
      });
      
      // TODO: Implement actual payment processing
      // This would typically redirect to a payment gateway like M-Pesa, PayPal, etc.
      console.log('Processing payment for invoice:', invoice.id);
      
      // For now, simulate payment processing
      setTimeout(async () => {
        // After payment is processed, refresh the invoice status
        await refreshInvoiceStatus();
        
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

  // Add real-time subscription for invoice updates
  useEffect(() => {
    if (!studentProfile?.id) return;

    console.log('Setting up invoice real-time subscription for student:', studentProfile.id);

    // Subscribe to all invoice changes (more reliable)
    const channel = supabase
      .channel('invoice-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        (payload) => {
          console.log('Invoice update received:', payload);
          console.log('Event type:', payload.eventType);
          console.log('New record:', payload.new);
          console.log('Old record:', payload.old);
          
          // Check if this change affects our student
          if (payload.new && typeof payload.new === 'object' && 'student_id' in payload.new && payload.new.student_id === studentProfile.id) {
            console.log('Change affects our student, refreshing invoices...');
            console.log('Status changed from:', (payload.old as any)?.status, 'to:', (payload.new as any)?.status);
            fetchInvoices(studentProfile.id);
          } else if (payload.old && typeof payload.old === 'object' && 'student_id' in payload.old && payload.old.student_id === studentProfile.id) {
            console.log('Change affects our student (old record), refreshing invoices...');
            console.log('Status changed from:', (payload.old as any)?.status, 'to:', (payload.new as any)?.status);
            fetchInvoices(studentProfile.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Invoice subscription status:', status);
      });

    return () => {
      console.log('Cleaning up invoice subscription');
      supabase.removeChannel(channel);
    };
  }, [studentProfile?.id]);

  // Add real-time subscription for payment updates
  useEffect(() => {
    if (!studentProfile?.id) return;

    const channel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `student_id=eq.${studentProfile.id}`
        },
        (payload) => {
          console.log('Payment update received:', payload);
          // Refresh invoices when there's a payment change
          fetchInvoices(studentProfile.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentProfile?.id]);

  // Add periodic refresh for invoices (every 5 minutes) as backup
  useEffect(() => {
    if (!studentProfile?.id) return;

    const interval = setInterval(() => {
      console.log('Periodic invoice refresh...');
      fetchInvoices(studentProfile.id);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [studentProfile?.id]);

  // Learning mode change request functionality has been removed

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
    
    console.log('✅ Auth successful, processing profile update...');
    
    // Update profile fields (excluding learning_mode which requires approval)
    try {
      const updateData: any = {
        phone: pendingProfileUpdate.phone,
        proficiency_level: pendingProfileUpdate.proficiency_level,
        experience: pendingProfileUpdate.experience,
        location: pendingProfileUpdate.location
      };

      // Check if learning mode or instrument is being changed
      const learningModeChanged = pendingProfileUpdate.learning_mode !== studentProfile.learning_mode;
      const instrumentChanged = pendingProfileUpdate.instrument !== studentProfile.instrument;
      
      // If learning mode is not changing, update it directly
      if (!learningModeChanged) {
        updateData.learning_mode = pendingProfileUpdate.learning_mode;
      }
      
      // If instrument is not changing, update it directly
      if (!instrumentChanged) {
        updateData.instrument = pendingProfileUpdate.instrument;
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentProfile.id)
        .select();
      
      console.log('🔍 Debug: Profile update result:', { data: updateResult, error: updateError });
      
      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        toast({ title: 'Error', description: 'Failed to update profile fields.', variant: 'destructive' });
        return;
      }

      // Create approval requests for changes that require admin approval
      const requestsCreated = [];
      
      // If learning mode is changing, create a change request
      if (learningModeChanged) {
        const { error: requestError } = await supabase
          .from('approval_requests')
          .insert({
            student_id: studentProfile.id,
            request_type: 'learning_mode_change',
            title: 'Learning Mode Change Request',
            description: `Student requested to change learning mode from ${studentProfile.learning_mode} to ${pendingProfileUpdate.learning_mode}`,
            current_value: studentProfile.learning_mode,
            requested_value: pendingProfileUpdate.learning_mode,
            reason: 'Student requested learning mode change through profile update'
          });

        if (requestError) {
          console.error('❌ Learning mode request error:', requestError);
          toast({ title: 'Error', description: 'Failed to submit learning mode change request.', variant: 'destructive' });
          return;
        }
        requestsCreated.push('learning mode');
      }
      
      // If instrument is changing, create a change request
      if (instrumentChanged) {
        const { error: requestError } = await supabase
          .from('approval_requests')
          .insert({
            student_id: studentProfile.id,
            request_type: 'profile_update',
            title: 'Instrument Change Request',
            description: `Student requested to change instrument from ${studentProfile.instrument} to ${pendingProfileUpdate.instrument}`,
            current_value: studentProfile.instrument,
            requested_value: pendingProfileUpdate.instrument,
            reason: 'Student requested instrument change through profile update'
          });

        if (requestError) {
          console.error('❌ Instrument change request error:', requestError);
          toast({ title: 'Error', description: 'Failed to submit instrument change request.', variant: 'destructive' });
          return;
        }
        requestsCreated.push('instrument');
      }

      // Show appropriate success message
      if (requestsCreated.length > 0) {
        toast({ 
          title: 'Success', 
          description: `Profile updated successfully. Your ${requestsCreated.join(' and ')} change request${requestsCreated.length > 1 ? 's have' : ' has'} been submitted for admin approval.` 
        });
      } else {
        toast({ title: 'Success', description: 'Profile updated successfully.' });
      }

      setEditMode(false);
      await fetchStudentData(); // Force refresh the data
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    }
    
    setShowPasswordModal(false);
    setPasswordInput('');
    setPendingProfileUpdate(null);
  };







  // Get booking count for a time slot
  const getBookingCount = (slotId: string) => {
    return myBookings.filter(booking => booking.time_slot_id === slotId).length;
  };

  // Determine slot status based on bookings and capacity
  const getSlotStatus = (slot: AvailableTimeSlot) => {
    const bookingCount = slot.current_bookings || 0;
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white/80 shadow-lg">
              <AvatarImage 
                src={studentProfile?.profile_photo_url} 
                alt={studentProfile?.student_name || 'Student'} 
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg">
                {studentProfile?.student_name?.charAt(0)?.toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="text-base sm:text-lg font-semibold text-white drop-shadow">Welcome, {studentProfile?.student_name || 'Student'}</span>
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-semibold shadow">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Student
            </span>
          </div>
          </div>
          <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-4 px-4">Your creative journey starts here. Access lessons, bookings, resources, and more!</p>
          
          {/* Sign Out Button */}
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

      {/* Account Status Banner */}
      <div className="w-full max-w-6xl px-2 sm:px-4 lg:px-8 mx-auto mt-6">
        {studentProfile && (
          <StudentAccountStatusBanner 
            student={{
              account_suspended: studentProfile.account_suspended || studentProfile.is_access_suspended,
              suspension_reason: studentProfile.suspension_reason,
              is_access_suspended: studentProfile.is_access_suspended
            }}
            unpaidInvoiceCount={unpaidInvoiceCount}
          />
        )}
      </div>

      <main className="w-full max-w-6xl px-2 sm:px-4 lg:px-8 py-4 sm:py-8 mx-auto">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-3 sm:p-4 lg:p-8 shadow-xl border border-primary/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            {/* Pending Requests Notification Banner */}
            {pendingRequests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Pending Approval Requests</h3>
                    <p className="text-sm text-blue-600">
                      You have {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''} pending admin approval:
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 space-y-1">
                      {pendingRequests.map((request) => (
                        <li key={request.id} className="flex items-center gap-2">
                          <span>•</span>
                          <span>{request.title}</span>
                          <span className="text-blue-500">({request.request_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
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
                  <SelectItem value="classroom">
                    <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                      <span>Classroom</span>
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
                  <SelectItem value="notifications">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
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
                    <div className="flex items-center gap-2 relative">
                      <Video className="w-4 h-4" />
                      <span>Video Conferencing</span>
                      {/* Live Meeting Notification Badge for mobile */}
                      {invitedMeetings.filter(m => m.status === 'active').length > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-4 rounded-full animate-pulse flex items-center justify-center">
                          {invitedMeetings.filter(m => m.status === 'active').length}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Responsive tabs: scroll on small, wrap on larger screens */}
            {/* Horizontal scroll hint: shows gradient and arrow on overflow */}
            <div className="relative">
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent hidden md:block" />
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hidden md:block select-none">→</div>
            </div>
            <TabsList className="flex w-full bg-white/80 shadow-sm rounded-lg gap-1 justify-start p-1 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent snap-x snap-mandatory mb-1" style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
              <TabsTrigger value="dashboard" className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-md transition-all scroll-snap-align-start">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="classroom" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Classroom</span>
              </TabsTrigger>
              <TabsTrigger value="practice" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-purple-700 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Practice</span>
              </TabsTrigger>
              <TabsTrigger value="progress" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-orange-700 data-[state=active]:bg-orange-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="messages" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-pink-600 data-[state=active]:bg-pink-100 data-[state=active]:shadow-md transition-all relative scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Messages</span>
                {messages.filter(m => !m.is_read).length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {messages.filter(m => !m.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-green-700 data-[state=active]:bg-green-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-purple-700 data-[state=active]:bg-purple-100 data-[state=active]:shadow-md transition-all relative">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="account" className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-secondary data-[state=active]:bg-secondary/10 data-[state=active]:shadow-md transition-all scroll-snap-align-start">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:shadow-md transition-all scroll-snap-align-start">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="video-conferencing" disabled={isSuspended} className={`flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-semibold text-indigo-700 data-[state=active]:bg-indigo-100 data-[state=active]:shadow-md transition-all relative scroll-snap-align-start ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Video Conferencing</span>
                {/* Live Meeting Notification Badge */}
                {invitedMeetings.filter(m => m.status === 'active').length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 rounded-full animate-pulse flex items-center justify-center">
                    {invitedMeetings.filter(m => m.status === 'active').length}
                  </Badge>
                )}
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
                    <div className="text-xl sm:text-2xl font-bold">0</div>
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
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshInvoiceStatus()}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        title="Refresh balance"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
                      const outstandingAmount = pendingInvoices.reduce((acc, inv) => acc + inv.amount_due, 0);
                      
                      console.log('Outstanding balance calculation:', {
                        totalInvoices: invoices.length,
                        pendingInvoices: pendingInvoices.length,
                        pendingInvoicesData: pendingInvoices.map(inv => ({
                          id: inv.id,
                          status: inv.status,
                          amount_due: inv.amount_due,
                          amount_paid: inv.amount_paid
                        })),
                        outstandingAmount
                      });
                      
                      return (
                        <>
                          <div className={`text-xl sm:text-2xl font-bold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {outstandingAmount > 0 ? formatCurrency(outstandingAmount) : 'All Paid!'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {outstandingAmount > 0 ? 'Due payments' : 'No outstanding balance'}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            Last updated: {new Date().toLocaleTimeString()}
                          </div>
                        </>
                      );
                    })()}
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
                    <p className="text-gray-500 text-center py-4">Practice tracking coming soon</p>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Available Time Slots</CardTitle>
                        <CardDescription>Book lessons with our teachers</CardDescription>
                      </div>
                      <Button 
                        onClick={() => {
                          console.log('🔄 Manually refreshing time slots...');
                          if (studentProfile) {
                            fetchAvailableTimeSlotsWithData(studentProfile);
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>

                    {/* Session Limit Display */}
                    {bookingStatus && (
                      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-800">Your Enrollment Session Limits</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              console.log('🔄 Refreshing booking status...');
                              fetchBookingStatus();
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          Based on your enrollment: {bookingStatus.sessions_per_week} session{bookingStatus.sessions_per_week !== 1 ? 's' : ''} per week
                        </p>
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
                        {makeupCredits.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700 font-medium">
                              💚 You have {makeupCredits.length} makeup credit{makeupCredits.length !== 1 ? 's' : ''} available
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Makeup credits can be used to book additional sessions beyond your weekly limit
                            </p>
                          </div>
                        )}
                        {!bookingStatus.can_book_more && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700 font-medium">
                              ⚠️ You have reached your weekly session limit
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              {makeupCredits.length > 0 
                                ? 'You can use your makeup credits to book additional sessions, or contact your teacher to reschedule.'
                                : 'Please contact your teacher to reschedule or wait until next week.'
                              }
                            </p>
                          </div>
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
                        .slice((timeSlotsPage - 1) * timeSlotsPerPage, timeSlotsPage * timeSlotsPerPage)
                        .map(slot => (
                          <div key={slot.id} className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                            slot.has_conflict ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{slot.teacher_name}</h4>
                              <div className="flex gap-2">
                                <Badge className={getSlotStatus(slot).color}>
                                  {getSlotStatus(slot).status}
                                </Badge>
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
                                disabled={isSuspended || (bookingStatus && !bookingStatus.can_book_more)}
                                className="w-full mt-2"
                              >
                                {isSuspended ? 'Account Suspended' :
                                 bookingStatus && !bookingStatus.can_book_more ? 'Limit Reached' : 'Book Recurring'}
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
                      {/* Pagination controls */}
                      {availableTimeSlots.filter(slot => (selectedTeacher === 'all' || slot.teacher_id === selectedTeacher) && slot.current_bookings < slot.max_students).length > timeSlotsPerPage && (
                        <div className="flex items-center justify-center gap-3 pt-4">
                          <Button variant="outline" size="sm" disabled={timeSlotsPage === 1} onClick={() => setTimeSlotsPage(p => Math.max(1, p - 1))}>Previous</Button>
                          <span className="text-sm text-gray-600">Page {timeSlotsPage} of {Math.ceil(availableTimeSlots.filter(slot => (selectedTeacher === 'all' || slot.teacher_id === selectedTeacher) && slot.current_bookings < slot.max_students).length / timeSlotsPerPage)}</span>
                          <Button variant="outline" size="sm" disabled={timeSlotsPage >= Math.ceil(availableTimeSlots.filter(slot => (selectedTeacher === 'all' || slot.teacher_id === selectedTeacher) && slot.current_bookings < slot.max_students).length / timeSlotsPerPage)} onClick={() => setTimeSlotsPage(p => p + 1)}>Next</Button>
                        </div>
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
                    {/* Cancellation Status Indicator */}
                    {studentProfile && (
                      <div className="mb-4 p-3 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-blue-800">Cancellation Status</h4>
                            <p className="text-sm text-blue-700">
                              You can cancel lessons at any time, but make-up credits are limited to 2 per billing period.
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-800">
                              {makeupCredits.filter(credit => !credit.is_used).length}/2
                            </div>
                            <div className="text-xs text-blue-600">Credits Used</div>
                          </div>
                        </div>
                        {makeupCredits.filter(credit => !credit.is_used).length >= 2 && (
                          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                            <p className="text-sm text-yellow-800">
                              ⚠️ You have used all 2 make-up credits for this billing period. 
                              Future cancellations will be charged as no-shows.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-4">
                      {makeupCredits.filter(credit => !credit.is_used).length > 0 ? (
                        makeupCredits
                          .filter(credit => !credit.is_used) // Only show unused credits
                          .map(credit => (
                            <div key={credit.id} className="p-4 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-green-800">
                                  Make-up Credit
                                </h4>
                              <Badge variant="secondary" className="bg-green-200 text-green-800">
                                  Available
                              </Badge>
                            </div>
                            <div className="text-sm text-green-700">
                              <p>Expires: {formatDate(credit.expires_at)}</p>
                              <p>Type: {credit.credit_type}</p>
                                <p>Days Left: {credit.days_until_expiry} days</p>
                            </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                                onClick={() => { 
                                  setIsBookingWithMakeupCredit(true);
                                  setShowBookingModal(true);
                                }}
                              >
                                Book Make-up Lesson
                              </Button>
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

            {/* Classroom Tab */}
            <TabsContent value="classroom" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Classroom</CardTitle>
                  <CardDescription>Join classes with a code, view posts, and participate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Join by Code */}
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Join Classroom</h4>
                      <div className="flex gap-2">
                        <Input placeholder="Enter class code" value={classroomJoinCode} onChange={(e) => setClassroomJoinCode(e.target.value)} />
                        <Button onClick={handleJoinClassroom} disabled={!classroomJoinCode}>Join</Button>
                              </div>
                            </div>

                    {/* My Classrooms */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">My Classrooms</h4>
                      {studentClassrooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {studentClassrooms.map(c => (
                            <Card key={c.id} className="cursor-pointer" onClick={() => navigate(`/classrooms/${c.id}`)}>
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold">{c.name}</div>
                                  <div className="text-xs text-gray-500">Teacher: {c.teacher_name}</div>
                                  {c.description && (
                                    <div className="text-xs text-gray-600 mt-1 truncate">
                                      {c.description}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="secondary" className="ml-2 flex-shrink-0">{c.status}</Badge>
                          </CardContent>
                        </Card>
                          ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">You haven't joined any classrooms yet.</p>
                      )}
                      </div>

                    {/* Selected Classroom Feed */}
                    {selectedClassroom && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{selectedClassroom.name} — Feed</h4>
                          {selectedClassroom.class_code && (
                            <Badge>Code: {selectedClassroom.class_code}</Badge>
                          )}
                        </div>

                        <div className="space-y-4">
                          {classroomFeed.length > 0 ? classroomFeed.map(post => (
                            <Card key={post.post_id}>
                              <CardHeader>
                                <CardTitle className="text-base">{post.author_name}</CardTitle>
                                <CardDescription>{new Date(post.created_at).toLocaleString()}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="whitespace-pre-wrap">{post.content}</p>
                                <div className="mt-3 text-sm text-gray-600">{post.comments_count} comment(s)</div>
                                {/* Comments */}
                                {postComments[post.post_id]?.map(cm => (
                                  <div key={cm.id} className="mt-3 p-3 border rounded">
                                    <div className="text-xs text-gray-500">{cm.author_name} ({cm.author_role}) • {new Date(cm.created_at).toLocaleString()}</div>
                                    <div>{cm.content}</div>
                                  </div>
                                ))}
                                <div className="mt-3 flex gap-2">
                                  <Input placeholder="Write a comment" value={newComment[post.post_id] || ''} onChange={(e) => setNewComment(prev => ({...prev, [post.post_id]: e.target.value}))} />
                                  <Button size="sm" onClick={() => handleAddComment(post.post_id)}>Comment</Button>
                                </div>
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

            {/* Practice Tab */}
            <TabsContent value="practice" className="space-y-6">
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Practice Log</h3>
                      <p className="text-gray-600 mb-4">Track your practice sessions and musical progress</p>
                      <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4 mr-2" />
                        Coming Soon
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 max-w-md">
                      We're developing a comprehensive practice tracking system that will help you log practice sessions, 
                      track your progress, set goals, and analyze your musical development over time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Progress & Attendance</h3>
                      <p className="text-gray-600 mb-4">Track your learning journey and attendance history</p>
                      <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4 mr-2" />
                        Coming Soon
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 max-w-md">
                      We're working on bringing you detailed progress tracking, attendance analytics, 
                      and performance insights. This feature will be available in a future update.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card className="h-[600px]">
                <CardContent className="p-0 h-full">
                  <MessagingUI
                    recipients={(() => {
                      // Teachers from teachers table, fallback to profile.id by email when user_id is missing
                      const teacherRecipients = teachers.map(teacher => ({
                        id: teacher.id,
                        user_id: teacher.user_id || (teacherAuthProfiles.find(tp => tp.email === teacher.email)?.id ?? ''),
                        name: teacher.name || teacher.email,
                        email: teacher.email,
                        type: 'teacher' as const,
                        profile_photo_url: teacherAuthProfiles.find(tp => tp.id === teacher.user_id)?.profile_photo_url || undefined
                      })).filter(t => t.user_id);
                      
                      // Include teacher auth profiles not already covered
                      const additionalTeacherRecipients = teacherAuthProfiles
                        .filter(tp => !teachers.some(t => (t.user_id || teacherAuthProfiles.find(ap => ap.email === t.email)?.id) === tp.id))
                        .map(tp => ({
                          id: tp.id,
                          user_id: tp.id,
                          name: tp.email,
                          email: tp.email,
                          type: 'teacher' as const,
                          profile_photo_url: tp.profile_photo_url
                        }));
                      
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
                        ...teacherRecipients,
                        ...additionalTeacherRecipients,
                        ...adminRecipients
                      ];



                      return allRecipients;
                    })()}
                    currentUserId={user?.id || ''}
                    currentUserName={studentProfile?.student_name || ''}
                    userType="student"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle>Payments & Invoices</CardTitle>
                  <CardDescription>View your payment history and manage outstanding balances</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshInvoiceStatus}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Status
                    </Button>
                  </div>
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
                                .filter(inv => inv.status === 'paid')
                                .reduce((acc, inv) => acc + inv.amount_due, 0)
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
                                .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
                                .reduce((acc, inv) => acc + inv.amount_due, 0)
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
                    {                (showAllInvoices ? invoices : invoices.filter(inv => inv.status !== 'paid')).length > 0 ? (
                  (showAllInvoices ? invoices : invoices.filter(inv => inv.status !== 'paid')).map(invoice => {
                    const isPaid = invoice.status === 'paid';
                        const isFullyPaid = invoice.amount_paid >= invoice.amount_due;
                        const remainingAmount = Math.max(0, invoice.amount_due - (invoice.amount_paid || 0));
                        
                        return (
                          <div key={invoice.id} className={`flex items-center justify-between p-4 border rounded-lg ${isPaid ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">Invoice #{invoice.id.slice(0, 8)}</h4>
                                {isPaid && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    ✓ PAID
                                  </Badge>
                                )}
                                {isFullyPaid && !isPaid && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    PAYMENT COMPLETE
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">Period: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}</p>
                              <p className="text-sm text-gray-600">Please note: Monthly fees are payable upfront at the beginning of the month. Late payments may affect lesson scheduling.</p>
                              {invoice.payment_status === 'partial' && (
                                <p className="text-sm text-amber-600 font-medium mt-1">
                                  Partial payment received
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-lg font-semibold">{formatCurrency(invoice.amount_due)}</div>
                                {invoice.amount_paid > 0 && (
                                  <div className="text-sm text-green-600">Paid: {formatCurrency(invoice.amount_paid)}</div>
                                )}
                                {remainingAmount > 0 && !isPaid && (
                                  <div className="text-sm text-red-600 font-medium">
                                    Remaining: {formatCurrency(remainingAmount)}
                            </div>
                                )}
                          </div>
                              <Badge className={getStatusColor(invoice.payment_status)}>{invoice.payment_status}</Badge>
                              {isPaid || isFullyPaid ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    ✓ Paid
                                  </Badge>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="text-xs"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handlePayment(invoice)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Pay {remainingAmount > 0 ? formatCurrency(remainingAmount) : 'Now'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="text-xs"
                                  >
                                    View Details
                                  </Button>
                                </div>
                      )}
                    </div>
                          </div>
                        );
                      })
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
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Stay updated with your latest notifications</CardDescription>
                    </div>
                    {unreadCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={markAllNotificationsAsRead}
                        className="text-xs"
                      >
                        Mark All Read
                      </Button>
                    )}
                  </div>
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
                                <h4 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-blue-800'}`}>
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-blue-700'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                <span>{new Date(notification.created_at).toLocaleTimeString()}</span>
                                <span className="capitalize">
                                  {notification.notification_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                            {notification.data && (
                              <div className="ml-4">
                                {notification.notification_type === 'approval_request_approved' && (
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 text-sm">✓</span>
                                  </div>
                                )}
                                {notification.notification_type === 'approval_request_rejected' && (
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 text-sm">✗</span>
                                  </div>
                                )}
                                {notification.notification_type === 'approval_request_submitted' && (
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-sm">⏳</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

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
                          {editMode ? (
                            <select 
                              value={editProfile.instrument} 
                              onChange={e => setEditProfile({ ...editProfile, instrument: e.target.value })}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="">Select Instrument</option>
                              {musicInstruments.map((instrument) => (
                                <option key={instrument} value={instrument}>
                                  {instrument}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={studentProfile.instrument} 
                              className="w-full p-2 border rounded-md bg-gray-50" 
                              readOnly 
                            />
                          )}
                          {editMode && editProfile.instrument !== studentProfile.instrument && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Changing your instrument requires admin approval. 
                                Your request will be reviewed and you'll be notified of the decision.
                              </p>
                            </div>
                          )}
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
                      
                      {/* Show pending learning mode requests */}
                      {pendingRequests.filter(req => req.request_type === 'learning_mode_change').length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-medium text-blue-800">
                              Learning Mode Change Pending Approval
                            </p>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Your request to change learning mode is being reviewed by admin.
                          </p>
                        </div>
                      )}
                      
                      {/* Show pending instrument change requests */}
                      {pendingRequests.filter(req => req.request_type === 'profile_update' && req.title.includes('Instrument')).length > 0 && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-medium text-green-800">
                              Instrument Change Pending Approval
                            </p>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Your request to change instrument is being reviewed by admin.
                          </p>
                        </div>
                      )}
                      
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
                              disabled={!editMode || pendingRequests.some(req => req.request_type === 'learning_mode_change') || pendingRequests.some(req => req.request_type === 'profile_update' && req.title.includes('Instrument'))}
                              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <label htmlFor={mode.value} className="text-sm font-medium text-gray-700">
                              {mode.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      {editMode && editProfile.learning_mode !== studentProfile.learning_mode && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Changing your learning mode requires admin approval. 
                            Your request will be reviewed and you'll be notified of the decision.
                          </p>
                        </div>
                      )}
                      
                      {(pendingRequests.some(req => req.request_type === 'learning_mode_change') || pendingRequests.some(req => req.request_type === 'profile_update' && req.title.includes('Instrument'))) && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Status:</strong> You have pending change request{pendingRequests.filter(req => req.request_type === 'learning_mode_change' || (req.request_type === 'profile_update' && req.title.includes('Instrument'))).length > 1 ? 's' : ''}. 
                            Please wait for admin approval before making another request.
                          </p>
                        </div>
                      )}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invoices</CardTitle>
                      <CardDescription>View your lesson invoices and download PDFs</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refreshInvoiceStatus()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices.length > 0 ? (
                      <>
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        <strong>Please note:</strong> Monthly fees are payable upfront at the beginning of the month. Late payments may affect lesson scheduling. Thank you for your cooperation.
                      </p>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left">Period</th>
                            <th className="text-right">Amount Due</th>
                            <th className="text-center">Status</th>
                            <th className="text-center">PDF</th>
                            <th className="text-center">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv.id} className="border-b">
                              <td>{inv.period_start} - {inv.period_end}</td>
                              <td className="text-right">KES {inv.amount_due.toLocaleString()}</td>
                              <td className="text-center">
                                <Badge 
                                  variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {inv.status === 'paid' ? 'Paid' : inv.status === 'overdue' ? 'Overdue' : 'Pending'}
                                </Badge>
                              </td>
                              <td className="text-center">{inv.pdf_url ? <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">Download</a> : '-'}</td>
                              <td className="text-center"><Button size="sm" variant="outline" onClick={() => handleViewInvoice(inv)}>View</Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </>
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
                  <CardDescription>Join your online lessons, practice sessions, and instant meetings</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Join by Code Section */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Join Meeting by Code
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Enter meeting code (e.g., ABC123)"
                        value={joinMeetingCode}
                        onChange={(e) => setJoinMeetingCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        maxLength={10}
                      />
                      <Button 
                        onClick={handleJoinByCode}
                        disabled={isJoiningMeeting || !joinMeetingCode.trim()}
                        className="flex items-center gap-2"
                      >
                        {isJoiningMeeting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        {isJoiningMeeting ? 'Joining...' : 'Join Meeting'}
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Enter the meeting code shared by your teacher to join instantly
                    </p>
                  </div>

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
                                onClick={() => window.open(meeting.meetingUrl, '_blank')}
                                className={`flex items-center gap-1 ${meeting.status === 'active' ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}`}
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

                  {/* Regular Meeting Rooms Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-indigo-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Scheduled Lessons ({meetingRooms.length})
                    </h3>
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
                      <div className="text-center py-8 text-gray-500">
                        <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No scheduled lesson rooms found</p>
                        <p className="text-sm mt-1">Lesson rooms will appear here when your teacher creates them</p>
                      </div>
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
      <Dialog open={showBookingModal} onOpenChange={(open) => {
        setShowBookingModal(open);
        if (open) {
          // Ensure time slots are loaded when modal opens
          if (availableTimeSlots.length === 0) {
            fetchAvailableTimeSlots();
          }
          // Check for conflicts when modal opens
          checkAllTimeSlotConflicts();
        } else {
          setIsUsingMakeupCredit(false);
          setIsBookingWithMakeupCredit(false);
          setSelectedTimeSlot(null);
          setTimeSlotConflicts({});
        }
      }}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">
              {isBookingWithMakeupCredit ? 'Book Make-up Lesson' : 'Book Time Slot'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6">
            {/* Time Slot Selection */}
            {!selectedTimeSlot && (
              <div className="mb-4">
                <Label className="text-sm font-medium">Select a Time Slot</Label>
                <div className="mt-2 max-h-80 overflow-y-auto space-y-2 p-2">
                  {availableTimeSlots
                    .filter(slot => slot.current_bookings < slot.max_students)
                    .map(slot => {
                      const hasConflict = timeSlotConflicts[slot.id] || false;
                      
                      return (
                        <div 
                          key={slot.id} 
                          className={`p-4 border rounded-lg transition-colors shadow-sm ${
                            hasConflict 
                              ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-60' 
                              : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                          onClick={() => !hasConflict && setSelectedTimeSlot(slot)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">{slot.teacher_name}</h4>
                              <p className="text-sm text-gray-600 mb-1">
                                {slot.day_of_week} • {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {slot.slot_type} • {slot.max_students - slot.current_bookings} spots available
                              </p>
                              {hasConflict && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                  ⚠️ Time conflict with existing booking
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className={`text-xs ml-2 ${
                              hasConflict ? 'bg-red-200 text-red-800' : ''
                            }`}>
                              {hasConflict ? 'Conflict' : getSlotStatus(slot).status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  {availableTimeSlots.filter(slot => slot.current_bookings < slot.max_students).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No available time slots found</p>
                  )}
                </div>
              </div>
            )}
            
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedTimeSlot(null)}
                  className="mt-2"
                >
                  Change Time Slot
                </Button>
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
            
            {/* Make-up Credit Indicator */}
            {(isUsingMakeupCredit || isBookingWithMakeupCredit) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">
                    🎫 Make-up Credit Will Be Used
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  This booking will use one of your available make-up credits.
                </p>
                {isBookingWithMakeupCredit && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-xs text-orange-700 font-medium">
                      ⚠️ Important: Once a make-up lesson is scheduled, it cannot be cancelled or rescheduled.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookTimeSlot}
              disabled={!selectedTimeSlot || isSuspended}
            >
              {isSuspended ? 'Account Suspended' :
               !selectedTimeSlot ? 'Select a Time Slot' : 
               isBookingWithMakeupCredit ? 'Book Make-up Lesson' : 'Book Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StudentDashboard;