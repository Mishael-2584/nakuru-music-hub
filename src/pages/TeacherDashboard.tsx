import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, MessageSquare, BookOpen, Clock, Bell, UserCircle, BadgeCheck, LogOut, Plus, Edit, Trash2, Eye, Download, Upload, CheckCircle, XCircle, Clock as ClockIcon, Calendar as CalendarIcon, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LessonCalendar, LessonEvent } from '../components/LessonCalendar';
import { calculateStudentInvoice } from '../lib/invoiceUtils';

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
          <div><b>Type:</b> {event.lesson_type}</div>
          <div><b>Date:</b> {event.lesson_date ? new Date(`${event.lesson_date}T${event.start_time}`).toLocaleDateString() : ''}</div>
          <div><b>Time:</b> {event.start && event.end ? `${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
          {event.student_name && <div><b>Student:</b> {event.student_name}</div>}
          {event.notes && <div><b>Notes:</b> {event.notes}</div>}
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
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
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
  // Filter state
  const [calendarStudent, setCalendarStudent] = useState('all');
  const [calendarLessonType, setCalendarLessonType] = useState('all');
  const [calendarStatus, setCalendarStatus] = useState('all');

  // Time slot management functions
  const handleAddTimeSlot = async () => {
    if (!user) return;

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
    const dayMap = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    const payload = {
      teacher_id: profile?.id,
      day_of_week: dayMap[newTimeSlot.day_of_week] || 1,
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

  // Helper to map day_of_week integer to day name
  const getDayName = (dayNum: number | string) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    // Accept both string and number
    const idx = typeof dayNum === 'string' ? parseInt(dayNum, 10) : dayNum;
    return days[(idx || 1) - 1] || "Monday";
  };

  const fetchInvoices = async () => {
    // Fetch all invoices (for all students)
    const { data, error } = await supabase
      .from('invoices')
      .select('*, students(student_name)')
      .order('period_start', { ascending: false });
    if (!error && data) setInvoices(data);
  };

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        // 1. Check profiles table for role
        console.log('[TeacherDashboard] Checking profiles table for user:', user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile && !profileError) {
          console.log('[TeacherDashboard] User role from profiles:', profile.role);
          if (profile.role === 'teacher') {
            // Fetch teacher profile by email
            const { data: teacherProfile, error: teacherError } = await supabase
              .from('teachers')
              .select('*')
              .eq('email', user.email)
              .single();
            console.log('[TeacherDashboard] teacherProfile:', teacherProfile, 'teacherError:', teacherError);
            if (teacherProfile && !teacherError && (teacherProfile.status === 'approved' || teacherProfile.status === 'active')) {
              setIsTeacher(true);
              setIsApproved(true);
              setProfile(teacherProfile);
              fetchTeacherData(teacherProfile.id);
              return;
            } else {
              // If not found in teachers table, treat as teacher anyway (profile is source of truth)
              setIsTeacher(true);
              setIsApproved(true);
              setProfile({
                id: 'not-found',
                email: user.email,
                name: user.user_metadata?.name || user.email,
                phone: '',
                bio: '',
                experience: '',
                category: '',
                subjects: [],
                status: 'approved',
                created_at: '',
                notFound: true
              });
              return;
            }
          } else if (profile.role === 'admin') {
            navigate('/admin', { replace: true });
            return;
          } else if (profile.role === 'student') {
            navigate('/student', { replace: true });
            return;
          }
        } else {
          console.log('[TeacherDashboard] No profile found or error:', profileError);
        }

        // 2. Only check teachers table if no profile role found
        console.log('[TeacherDashboard] Checking teachers table...');
        const { data: teacherProfile, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .single();
        if (teacherProfile && !teacherError && (teacherProfile.status === 'approved' || teacherProfile.status === 'active')) {
          setIsTeacher(true);
          setIsApproved(true);
          setProfile(teacherProfile);
          fetchTeacherData(teacherProfile.id);
          return;
        }

        // 3. Only check pending_teachers if not found in teachers table
        try {
          const { data: pendingTeacher, error: pendingTeacherError } = await supabase
            .from('pending_teachers')
            .select('id')
            .eq('email', user.email)
            .single();
          if (pendingTeacher && !pendingTeacherError) {
            setIsTeacher(false);
            setIsApproved(false);
            navigate('/pending-teacher', { replace: true });
            return;
          }
        } catch (err) {
          console.warn('[TeacherDashboard] Skipping pending_teachers check due to error:', err);
        }

        // 4. If not admin or teacher, redirect to student dashboard
        navigate('/student', { replace: true });
      } catch (error) {
        console.error('[TeacherDashboard] Error checking user role:', error);
        // If there's an error, redirect to student dashboard as fallback
        navigate('/student', { replace: true });
      } finally {
        setChecking(false);
      }
    };
    checkUserRole();
  }, [user, navigate]);

  const fetchTeacherData = async (teacherId: string) => {
    try {
      // Fetch students assigned to this teacher
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active');

      if (!studentsError && studentsData) {
        setStudents(studentsData);
      }

      // Fetch lessons for this teacher
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          students!inner(student_name)
        `)
        .eq('teacher_id', teacherId)
        .order('lesson_date', { ascending: true });

      if (!lessonsError && lessonsData) {
        setLessons(lessonsData.map(lesson => ({
          ...lesson,
          student_name: lesson.students?.student_name
        })));
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('portal_messages')
        .select(`
          *,
          students!inner(student_name)
        `)
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (!messagesError && messagesData) {
        setMessages(messagesData.map(message => ({
          ...message,
          recipient_name: message.students?.student_name
        })));
      }

      // Fetch real time slots from database
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (!timeSlotsError && timeSlotsData) {
        setTimeSlots(timeSlotsData);
      } else {
        console.log('No time slots found, using default slots');
        // Set default time slots if none exist
        setTimeSlots([
          { id: '1', teacher_id: user?.id, day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', is_available: true, slot_type: 'regular', max_students: 1, description: 'Morning slot' },
          { id: '2', teacher_id: user?.id, day_of_week: 'Monday', start_time: '10:00', end_time: '11:00', is_available: true, slot_type: 'regular', max_students: 1, description: 'Late morning slot' },
          { id: '3', teacher_id: user?.id, day_of_week: 'Tuesday', start_time: '14:00', end_time: '15:00', is_available: true, slot_type: 'regular', max_students: 1, description: 'Afternoon slot' },
          { id: '4', teacher_id: user?.id, day_of_week: 'Wednesday', start_time: '16:00', end_time: '17:00', is_available: false, slot_type: 'regular', max_students: 1, description: 'Evening slot' },
        ]);
      }

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('uploaded_by', user?.id)
        .order('created_at', { ascending: false });

      if (!materialsError && materialsData) {
        setMaterials(materialsData);
      } else {
        // Set default materials if none exist
        setMaterials([
          { id: '1', title: 'Piano Fundamentals Guide', description: 'Basic hand positioning and technique', file_url: '/materials/piano-fundamentals.pdf' },
          { id: '2', title: 'Music Theory Basics', description: 'Introduction to reading music', file_url: '/materials/music-theory.pdf' },
          { id: '3', title: 'Practice Schedule Template', description: 'Weekly practice planning sheet', file_url: '/materials/practice-schedule.pdf' },
        ]);
      }

      // In fetchTeacherData, fetch make-up credits for this teacher
      const { data: creditsData, error: creditsError } = await supabase
        .from('makeup_credits')
        .select('*, students(student_name, email)')
        .eq('teacher_id', teacherId)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString());
      if (!creditsError && creditsData) {
        setMakeupCredits(creditsData);
      }

    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast({
        title: "Error",
        description: "Failed to load teacher data",
        variant: "destructive",
      });
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

  // Map lessons to calendar events
  const calendarEvents: LessonEvent[] = lessons.map(lesson => ({
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
    ...lesson,
  }));

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

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setInvoiceDetails(invoice.lessons_summary || null);
    setShowInvoiceModal(true);
  };

  const handleGenerateInvoice = async (studentId: string, periodStart: string, periodEnd: string) => {
    const result = await calculateStudentInvoice(studentId, periodStart, periodEnd);
    // Store in Supabase
    await supabase.from('invoices').insert({
      student_id: studentId,
      period_start: periodStart,
      period_end: periodEnd,
      lessons_summary: result,
      amount_due: result.total,
      status: 'pending',
      due_date: periodEnd,
    });
    await fetchInvoices();
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
      {/* Hero/Header Section */}
      <section className="py-12 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 shadow-lg">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">
          <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-20 w-20 mb-4 rounded-full shadow-lg border-4 border-white/80 bg-white/80 object-contain" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-lg">
            Damon Music Academy
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Teacher Panel
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg font-semibold text-white drop-shadow">Welcome, {profile?.name || 'Teacher'}</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold ml-2 shadow">
              <UserCircle className="h-4 w-4 mr-1" /> Teacher
            </span>
          </div>
          <p className="text-white/90 text-base sm:text-lg mb-4">Empowering music education and managing your teaching journey</p>
          <div className="flex justify-end w-full max-w-4xl mx-auto mt-2">
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 mr-2">
              <Bell className="w-4 h-4 mr-2 text-blue-700" />
              Notifications
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10">
              <LogOut className="w-4 h-4 mr-2 text-blue-700" />
              Sign Out
            </Button>
          </div>
        </div>
      </section>
      <main className="w-full max-w-6xl px-2 sm:px-4 lg:px-8 py-8 mx-auto">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 sm:p-8 shadow-xl border border-primary/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap w-full bg-white/80 shadow-sm rounded-lg overflow-x-auto gap-1 justify-center">
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
                <BadgeCheck className="w-5 h-5" />
                <span>Make-up Credits</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-gray-700 data-[state=active]:bg-gray-100 data-[state=active]:shadow-md transition-all">
                <CalendarIcon className="w-5 h-5" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-1 flex items-center justify-center gap-2 px-0 py-2 rounded-full font-semibold text-orange-700 data-[state=active]:bg-orange-100 data-[state=active]:shadow-md transition-all">
                <FileText className="w-5 h-5" />
                <span>Invoices</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">Active students</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Lessons</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lessons.filter(l => l.status === 'scheduled').length}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{messages.filter(m => !m.is_read).length}</div>
                    <p className="text-xs text-muted-foreground">New messages</p>
                  </CardContent>
                </Card>
                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{timeSlots.filter(s => s.is_available).length}</div>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white/95">
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
                              <p className="text-sm text-gray-600">Student: {lesson.student_name}</p>
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

                <Card className="shadow-lg border-0 bg-white/95">
                  <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                    <CardDescription>Latest communications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.slice(0, 3).map(message => (
                          <div key={message.id} className={`p-3 rounded-lg ${!message.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                            <h4 className="font-semibold">{message.subject}</h4>
                            <p className="text-sm text-gray-600">{message.message.substring(0, 50)}...</p>
                            <p className="text-xs text-gray-500">{formatDate(message.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No recent messages</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Teaching Schedule</CardTitle>
                    <CardDescription>Manage your available time slots and view bookings.</CardDescription>
                  </div>
                  <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Lesson
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Schedule New Lesson</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="title" className="text-right">Title</Label>
                          <Input
                            id="title"
                            value={newLesson.title}
                            onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="student" className="text-right">Student</Label>
                          <Select value={newLesson.student_id} onValueChange={(value) => setNewLesson({...newLesson, student_id: value})}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select student" />
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
                          <Label htmlFor="date" className="text-right">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newLesson.lesson_date}
                            onChange={(e) => setNewLesson({...newLesson, lesson_date: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="start_time" className="text-right">Start Time</Label>
                          <Input
                            id="start_time"
                            type="time"
                            value={newLesson.start_time}
                            onChange={(e) => setNewLesson({...newLesson, start_time: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="end_time" className="text-right">End Time</Label>
                          <Input
                            id="end_time"
                            type="time"
                            value={newLesson.end_time}
                            onChange={(e) => setNewLesson({...newLesson, end_time: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="notes" className="text-right">Notes</Label>
                          <Textarea
                            id="notes"
                            value={newLesson.notes}
                            onChange={(e) => setNewLesson({...newLesson, notes: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowLessonModal(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddLesson}>
                          Schedule Lesson
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                              <p className="text-sm text-gray-600">Student: {lesson.student_name}</p>
                              <p className="text-sm text-gray-600">Duration: {lesson.start_time} - {lesson.end_time}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No lessons scheduled</p>
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
                            <UserCircle className="w-10 h-10 text-blue-600" />
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
                            <ClockIcon className="w-5 h-5 text-blue-600" />
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
                        {[...new Set(lessons.map(l => l.student_name).filter(Boolean))].map(name => (
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
                        {[...new Set(lessons.map(l => l.lesson_type).filter(Boolean))].map(type => (
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
                        {[...new Set(lessons.map(l => l.status).filter(Boolean))].map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <LessonCalendar
                  events={filteredCalendarEvents}
                  onSelectEvent={handleSelectEvent}
                  defaultView="week"
                />
                <EventDetailsModal open={eventModalOpen} onClose={() => setEventModalOpen(false)} event={selectedEvent} />
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-8">
              <Card className="shadow-lg border-0 bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">All Student Invoices</CardTitle>
                    <CardDescription>View and generate invoices for students</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Period</th>
                          <th>Amount Due</th>
                          <th>Status</th>
                          <th>Due Date</th>
                          <th>PDF</th>
                          <th>Details</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv.id}>
                            <td>{inv.students?.student_name || '-'}</td>
                            <td>{inv.period_start} - {inv.period_end}</td>
                            <td>KES {inv.amount_due.toLocaleString()}</td>
                            <td>{inv.status}</td>
                            <td>{inv.due_date}</td>
                            <td>{inv.pdf_url ? <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">Download</a> : '-'}</td>
                            <td><Button size="sm" variant="outline" onClick={() => handleViewInvoice(inv)}>View</Button></td>
                            <td>
                              <Button size="sm" variant="outline" onClick={() => handleGenerateInvoice(inv.student_id, inv.period_start, inv.period_end)}>Regenerate</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                </DialogContent>
              </Dialog>
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
    </div>
  );
};

export default TeacherDashboard; 