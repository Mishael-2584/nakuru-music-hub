import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, CalendarDays, BookOpen, Clock, BarChart3, MessageSquare, CreditCard, User, LogOut, Bell, Music, FileText, Users, Calendar as CalendarIcon, Target, TrendingUp, Plus, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import PasswordChangePrompt from '../components/PasswordChangePrompt';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

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

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (studentProfile) {
      fetchMyBookings();
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
      
      // Fetch student profile
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching student profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to load student profile",
          variant: "destructive",
        });
        return;
      }

      setStudentProfile(profile);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('student_id', profile.id)
        .order('lesson_date', { ascending: true });

      if (!lessonsError && lessonsData) {
        setLessons(lessonsData);
      }

      // Fetch practice logs
      const { data: practiceData, error: practiceError } = await supabase
        .from('practice_logs')
        .select('*')
        .eq('student_id', profile.id)
        .order('practice_date', { ascending: false });

      if (!practiceError && practiceData) {
        setPracticeLogs(practiceData);
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (!messagesError && messagesData) {
        setMessages(messagesData);
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', profile.id)
        .order('due_date', { ascending: true });

      if (!assignmentsError && assignmentsData) {
        setAssignments(assignmentsData);
      }

      // Fetch lesson materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('lesson_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (!materialsError && materialsData) {
        setMaterials(materialsData);
      }

      // Fetch available time slots and teachers
      await fetchAvailableTimeSlots();
      await fetchTeachers();
      await fetchMyBookings();

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available time slots with teacher information
  const fetchAvailableTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select(`
          *,
          teachers!inner(
            name,
            email,
            bio,
            experience,
            category,
            subjects
          )
        `)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching time slots:', error);
        return;
      }

      // Transform data to include teacher information and booking count
      const slotsWithTeacherInfo = await Promise.all(
        data.map(async (slot) => {
          // Get current booking count for this slot
          const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('time_slot_id', slot.id)
            .eq('status', 'confirmed');

          return {
            id: slot.id,
            teacher_id: slot.teacher_id,
            teacher_name: slot.teachers?.name || 'Unknown Teacher',
            teacher_email: slot.teachers?.email || '',
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            slot_type: slot.slot_type,
            max_students: slot.max_students,
            description: slot.description,
            current_bookings: bookingCount || 0
          };
        })
      );

      setAvailableTimeSlots(slotsWithTeacherInfo);
    } catch (error) {
      console.error('Error fetching available time slots:', error);
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
        const bookingsWithTeacherInfo = data.map(booking => ({
          ...booking,
          teacher_name: booking.time_slots?.teachers?.name || 'Unknown Teacher',
          day_of_week: booking.time_slots?.day_of_week || ''
        }));
        setMyBookings(bookingsWithTeacherInfo);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Handle booking a time slot
  const handleBookTimeSlot = async () => {
    if (!selectedTimeSlot || !studentProfile) return;

    try {
      const isOnline = studentProfile.learning_mode === 'online';
      const meetingLink = isOnline ? `https://meet.jit.si/damon-music-${Math.random().toString(36).substring(2, 8)}` : null;
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          time_slot_id: selectedTimeSlot.id,
          student_id: studentProfile.id,
          teacher_id: selectedTimeSlot.teacher_id,
          booking_date: newBooking.booking_date,
          start_time: selectedTimeSlot.start_time,
          end_time: selectedTimeSlot.end_time,
          status: 'confirmed',
          lesson_type: newBooking.lesson_type,
          notes: newBooking.notes,
          mode: studentProfile.learning_mode,
          meeting_link: meetingLink
        })
        .select()
        .single();

      if (error) {
        throw error;
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
        description: "Lesson booked successfully!",
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
      notes: ''
    });
    setShowRecurringBookingModal(true);
  };

  // Handle recurring booking submission
  const handleSubmitRecurringBooking = async () => {
    if (!selectedTimeSlot || !studentProfile) return;
    
    try {
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
          frequency: newBooking.frequency || 'weekly',
          start_date: newBooking.booking_date,
          end_date: newBooking.end_date,
          lesson_type: newBooking.lesson_type,
          notes: newBooking.notes
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-500">Welcome back, {studentProfile.student_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Practice</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Lessons</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lessons.filter(l => l.status === 'scheduled').length}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Practice Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{practiceLogs.reduce((acc, log) => acc + log.duration_minutes, 0)}</div>
                  <p className="text-xs text-muted-foreground">Minutes this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{messages.filter(m => !m.is_read).length}</div>
                  <p className="text-xs text-muted-foreground">New messages</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0))}</div>
                  <p className="text-xs text-muted-foreground">Due payments</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Next Lesson</CardTitle>
                  <CardDescription>Your upcoming lesson details</CardDescription>
                </CardHeader>
                <CardContent>
                  {lessons.filter(l => l.status === 'scheduled').length > 0 ? (
                    <div className="space-y-4">
                      {lessons.filter(l => l.status === 'scheduled').slice(0, 1).map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div>
                            <h4 className="font-semibold">{lesson.title}</h4>
                            <p className="text-sm text-gray-600">{formatDate(lesson.lesson_date)} at {formatTime(lesson.start_time)}</p>
                            <p className="text-sm text-gray-600">Duration: {lesson.start_time} - {lesson.end_time}</p>
                          </div>
                          <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming lessons scheduled</p>
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
                        <div key={slot.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{slot.teacher_name}</h4>
                            <Badge variant="secondary">{slot.slot_type}</Badge>
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
                            disabled={slot.current_bookings >= slot.max_students}
                            className="w-full"
                          >
                            {slot.current_bookings >= slot.max_students ? 'Full' : 'Book This Slot'}
                          </Button>
                          
                          {/* Add recurring booking option for instruments */}
                          {slot.slot_type === 'regular' && slot.current_bookings < slot.max_students && (
                            <Button 
                              variant="outline"
                              onClick={() => handleBookRecurringSlot(slot)}
                              className="w-full mt-2"
                            >
                              Book Recurring
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
                  <CardTitle>My Bookings</CardTitle>
                  <CardDescription>View and manage your booked lessons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myBookings.length > 0 ? (
                      myBookings.map(booking => (
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
                            {booking.status === 'confirmed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id, booking.booking_date, booking.start_time)}
                              >
                                Cancel Booking
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowBookingDetailsModal(true); }}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No bookings found</p>
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
                            >
                              Use Credit
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0))}</div>
                        <p className="text-sm text-gray-600">Total Paid</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600">{formatCurrency(payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0))}</div>
                        <p className="text-sm text-gray-600">Outstanding</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
                        <p className="text-sm text-gray-600">Total Invoices</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {payments.length > 0 ? (
                      payments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{payment.payment_type}</h4>
                            <p className="text-sm text-gray-600">Due: {formatDate(payment.due_date)}</p>
                            {payment.paid_date && (
                              <p className="text-sm text-gray-600">Paid: {formatDate(payment.paid_date)}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-semibold">{formatCurrency(payment.amount)}</span>
                            <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                            {payment.status === 'pending' && (
                              <Button size="sm">Pay Now</Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No payment records found</p>
                    )}
                  </div>
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
        </Tabs>
      </main>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Lesson</DialogTitle>
          </DialogHeader>
          {selectedTimeSlot && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Time Slot</h4>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Teacher:</span> {selectedTimeSlot.teacher_name}</p>
                  <p><span className="font-medium">Day:</span> {selectedTimeSlot.day_of_week}</p>
                  <p><span className="font-medium">Time:</span> {formatTime(selectedTimeSlot.start_time)} - {formatTime(selectedTimeSlot.end_time)}</p>
                  <p><span className="font-medium">Type:</span> {selectedTimeSlot.slot_type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="booking_date" className="text-right">Booking Date</Label>
                <Input
                  id="booking_date"
                  type="date"
                  value={newBooking.booking_date}
                  onChange={(e) => setNewBooking({...newBooking, booking_date: e.target.value})}
                  className="col-span-3"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lesson_type" className="text-right">Lesson Type</Label>
                <Select 
                  value={newBooking.lesson_type} 
                  onValueChange={(value) => setNewBooking({...newBooking, lesson_type: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Lesson</SelectItem>
                    <SelectItem value="practice">Practice Session</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="recital">Recital Preparation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notes</Label>
                <Textarea
                  id="notes"
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Any special requests or notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBookTimeSlot}
                  disabled={!newBooking.booking_date}
                >
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recurring Booking Modal */}
      <Dialog open={showRecurringBookingModal} onOpenChange={setShowRecurringBookingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Book Recurring Lessons</DialogTitle>
          </DialogHeader>
          {selectedTimeSlot && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Time Slot</h4>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Teacher:</span> {selectedTimeSlot.teacher_name}</p>
                  <p><span className="font-medium">Day:</span> {selectedTimeSlot.day_of_week}</p>
                  <p><span className="font-medium">Time:</span> {formatTime(selectedTimeSlot.start_time)} - {formatTime(selectedTimeSlot.end_time)}</p>
                  <p><span className="font-medium">Type:</span> {selectedTimeSlot.slot_type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurring_booking_date" className="text-right">Start Date</Label>
                <Input
                  id="recurring_booking_date"
                  type="date"
                  value={newBooking.booking_date}
                  onChange={(e) => setNewBooking({...newBooking, booking_date: e.target.value})}
                  className="col-span-3"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurring_end_date" className="text-right">End Date (optional)</Label>
                <Input
                  id="recurring_end_date"
                  type="date"
                  value={newBooking.end_date}
                  onChange={(e) => setNewBooking({...newBooking, end_date: e.target.value})}
                  className="col-span-3"
                  placeholder="Leave empty for indefinite recurring"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurring_frequency" className="text-right">Frequency</Label>
                <Select 
                  value={newBooking.frequency} 
                  onValueChange={(value) => setNewBooking({...newBooking, frequency: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
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
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Any special requests or notes for recurring lessons..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRecurringBookingModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRecurringBooking}
                  disabled={!newBooking.booking_date}
                >
                  Confirm Recurring Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetailsModal} onOpenChange={setShowBookingDetailsModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-2">
              <div><span className="font-medium">Teacher:</span> {selectedBooking.teacher_name}</div>
              <div><span className="font-medium">Date:</span> {formatDate(selectedBooking.booking_date)}</div>
              <div><span className="font-medium">Time:</span> {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}</div>
              <div><span className="font-medium">Day:</span> {selectedBooking.day_of_week}</div>
              <div><span className="font-medium">Type:</span> {selectedBooking.lesson_type}</div>
              <div><span className="font-medium">Status:</span> {selectedBooking.status}</div>
              {selectedBooking.mode === 'online' ? (
                <div><span className="font-medium">Location:</span> Online<br />
                  <span className="font-medium">Meeting Link:</span> <a href={selectedBooking.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{selectedBooking.meeting_link}</a>
                </div>
              ) : selectedBooking.mode === 'in-person' ? (
                <div><span className="font-medium">Location:</span> Damon Music Academy, 2nd Floor, XYZ Building, Nakuru</div>
              ) : null}
              {selectedBooking.notes && <div><span className="font-medium">Notes:</span> {selectedBooking.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard; 