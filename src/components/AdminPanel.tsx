import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music, LogOut, Guitar, Piano, Mic, Clock, BookOpen, Star, Shield, UserCog, Eye, Newspaper, Palette, ChevronDown, ChevronUp, GraduationCap, Quote, MapPin, DollarSign, FileText, CheckCircle, ArrowRight, ArrowLeft, X, Image, MessageSquare, Settings } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import AdminEventsManager from "@/components/AdminEventsManager";
import AdminNewsManager from "@/components/AdminNewsManager";
import AdminGalleryManager from "@/components/AdminGalleryManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendAcceptedEmail, sendDeclinedEmail, sendTeacherAcceptedEmail, sendTeacherDeclinedEmail, sendTeacherRequestInfoEmail, sendQuoteEmail, sendInvoiceEmail, sendApplicationConfirmationEmail, sendPaymentConfirmationEmail } from "@/lib/emailService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import AdminFeesManager from './AdminFeesManager';
import { clearAuthCache, clearAndRedirect } from '@/lib/cacheUtils';
import { generateInvoiceForRegistration } from "@/lib/invoiceUtils";
import MessagingUI from './MessagingUI';
import LearningModeDebugTest from './LearningModeDebugTest';

interface Registration {
  id: string;
  receipt_number: string;
  student_name: string;
  age: number;
  email: string;
  phone: string;
  country_code: string;
  parent_name?: string;
  parent_phone?: string;
  course_category: string;
  instrument: string;
  production_type?: string;
  experience: string;
  proficiency_level: string;
  learning_mode: string;
  owns_instrument: boolean;
  location: string;
  medical_condition: string;
  medical_details?: string;
  goals?: string;
  preferred_schedule?: string;
  status: string;
  created_at: string;
  date_of_birth?: string;
  sessions_per_week?: number;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Quote {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string | null;
  service_category: string;
  project_type: string | null;
  event_date: string | null;
  location: string | null;
  budget_range: string | null;
  timeline: string | null;
  specific_requirements: string | null;
  reference_materials_url: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes: string | null;
  quote_amount: number | null;
  quote_sent_at: string | null;
  preferred_contact_method: string;
  additional_notes: string | null;
}

interface AdminProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface ClassSchedule {
  id: string;
  day: string;
  time: string;
  instrument: string;
  instructor: string;
  student: string;
  level: string;
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'registrations' | 'messages' | 'students' | 'schedule' | 'events' | 'admins' | 'teachers' | 'quotes' | 'gallery' | 'finances' | 'requests' | 'notifications' | 'debug'>('stats');
  const [searchTerm, setSearchTerm] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const [portalMessages, setPortalMessages] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('admin');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { user, signOut, clearAllData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [showRequestInfo, setShowRequestInfo] = useState(false);
  const [requestInfoTeacher, setRequestInfoTeacher] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState({
    lineItems: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentTerms: "50% deposit required to confirm booking",
    validUntil: "30 days from date of issue",
    serviceBreakdown: "",
    equipmentBreakdown: "",
    additionalInfo: ""
  });
  const [invoicePDFUrl, setInvoicePDFUrl] = useState<string | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<Record<string, any>>({});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState<Registration[]>([]);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  // 1. Add state for tracking invoice sending/loading
  const [sendingInvoiceIds, setSendingInvoiceIds] = useState<string[]>([]);
  const [studentsNeedingInvoice, setStudentsNeedingInvoice] = useState<string[]>([]);
  // Add state for invoice history modal
  const [showInvoiceHistoryModal, setShowInvoiceHistoryModal] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [invoiceHistoryStudent, setInvoiceHistoryStudent] = useState<any>(null);
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState<any>(null);

  // Portal messaging state
  const [showPortalMessageModal, setShowPortalMessageModal] = useState(false);
  const [newPortalMessage, setNewPortalMessage] = useState({
    subject: '',
    message: '',
    recipient_id: ''
  });
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  // Classroom approval state
  const [pendingClassrooms, setPendingClassrooms] = useState<any[]>([]);
  const [approvedClassrooms, setApprovedClassrooms] = useState<any[]>([]);
  const [showDeleteClassroomModal, setShowDeleteClassroomModal] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<any>(null);
  const [deleteClassroomPassword, setDeleteClassroomPassword] = useState('');
  const [deleteClassroomError, setDeleteClassroomError] = useState('');

  // Learning mode request functionality has been completely removed
  // These state variables are kept as empty placeholders to avoid breaking changes
  const [learningModeRequests] = useState<any[]>([]);
  const [showLearningModeModal] = useState(false);
  const [selectedLearningModeRequest] = useState<any>(null);
  const [adminNotesForRequest] = useState('');
  const [processingRequestId] = useState<string | null>(null);

  const fetchPendingClassrooms = async () => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, name, description, created_at, teacher_id, teachers(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (!error) setPendingClassrooms((data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      teacher_name: c.teachers?.name || 'Teacher'
    })));
  };

  const fetchApprovedClassrooms = async () => {
    const { data, error } = await supabase
      .from('classrooms')
      .select('id, name, description, class_code, approved_at, teacher_id, teachers(name)')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });
    if (!error) setApprovedClassrooms((data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      class_code: c.class_code,
      approved_at: c.approved_at,
      teacher_name: c.teachers?.name || 'Teacher'
    })));
  };

  useEffect(() => {
    fetchPendingClassrooms();
    fetchApprovedClassrooms();
    // Learning mode requests functionality has been removed
  }, []);

  // Learning mode requests functionality has been completely removed
  const fetchLearningModeRequests = async () => {
    // This function is kept as a placeholder but its functionality has been removed
    // We don't call setLearningModeRequests anymore since it's now a constant
    console.log('Learning mode requests functionality has been removed');
    return [];
  };

  // Learning mode requests functionality has been completely removed
  const handleProcessLearningModeRequest = async (requestId: string, action: 'approved' | 'rejected', adminNotes?: string) => {
    // This function is kept as a placeholder but its functionality has been removed
    // We don't modify state variables anymore since they're now constants
    console.log('Learning mode request processing has been removed');
    return;
  };

  // Learning mode requests functionality has been completely removed
  const handleReviewLearningModeRequest = (request: any) => {
    // This function is kept as a placeholder but its functionality has been removed
    console.log('Learning mode request review has been removed');
    return;
  };

  const handleApproveClassroom = async (classroomId: string) => {
    const { data, error } = await supabase.rpc('approve_classroom', {
      classroom_id_param: classroomId,
      approved_by_param: user?.id || null
    });
    if (!error) {
      toast({ title: 'Approved', description: 'Classroom approved and code generated.' });
      await fetchPendingClassrooms();
      await fetchApprovedClassrooms();
    } else {
      toast({ title: 'Error', description: 'Failed to approve classroom.', variant: 'destructive' });
    }
  };

  const handleRejectClassroom = async (classroomId: string, reason?: string) => {
    const { data, error } = await supabase.rpc('reject_classroom', {
      classroom_id_param: classroomId,
      rejected_by_param: user?.id || null,
      rejection_reason_param: reason || null
    });
    if (!error) {
      toast({ title: 'Rejected', description: 'Classroom application has been rejected.' });
      await fetchPendingClassrooms();
      await fetchApprovedClassrooms();
    } else {
      toast({ title: 'Error', description: 'Failed to reject classroom.', variant: 'destructive' });
    }
  };

  const handleDeleteClassroom = async (classroomId: string) => {
    try {
      // First, delete all related records
      // Delete classroom posts
      const { error: postsError } = await supabase
        .from('classroom_posts')
        .delete()
        .eq('classroom_id', classroomId);
      
      if (postsError) {
        console.error('Error deleting classroom posts:', postsError);
      }

      // Delete classroom comments
      const { error: commentsError } = await supabase
        .from('classroom_comments')
        .delete()
        .eq('classroom_id', classroomId);
      
      if (commentsError) {
        console.error('Error deleting classroom comments:', commentsError);
      }

      // Delete classroom enrollments
      const { error: enrollmentsError } = await supabase
        .from('classroom_enrollments')
        .delete()
        .eq('classroom_id', classroomId);
      
      if (enrollmentsError) {
        console.error('Error deleting classroom enrollments:', enrollmentsError);
      }

      // Finally, delete the classroom
      const { error: classroomError } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', classroomId);

      if (classroomError) {
        console.error('Error deleting classroom:', classroomError);
        toast({
          title: 'Error',
          description: 'Failed to delete classroom',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Classroom deleted successfully');
      
      // Refresh the lists
      await fetchPendingClassrooms();
      await fetchApprovedClassrooms();
      
      toast({
        title: 'Classroom Deleted',
        description: 'Classroom and all related data have been deleted successfully.',
      });
      
      // Close modal and reset state
      setShowDeleteClassroomModal(false);
      setClassroomToDelete(null);
      setDeleteClassroomPassword('');
      setDeleteClassroomError('');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the classroom',
        variant: 'destructive',
      });
    }
  };

  // Filter registrations based on search term
  const filteredRegistrations = useMemo(() => {
    if (!searchTerm.trim()) {
      return registrations;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return registrations.filter(registration => 
      registration.student_name.toLowerCase().includes(searchLower) ||
      registration.email.toLowerCase().includes(searchLower) ||
      registration.course_category.toLowerCase().includes(searchLower) ||
      registration.location.toLowerCase().includes(searchLower) ||
      registration.instrument?.toLowerCase().includes(searchLower) ||
      registration.production_type?.toLowerCase().includes(searchLower) ||
      registration.receipt_number.toLowerCase().includes(searchLower)
    );
  }, [registrations, searchTerm]);

  // Function to open quote dialog with existing data
  const openQuoteDialog = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuoteAmount(quote.quote_amount?.toString() || "");
    setAdminNotes(quote.admin_notes || "");
    setShowQuoteDialog(true);
  };

  // Function to open invoice dialog
  const openInvoiceDialog = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuoteAmount(quote.quote_amount?.toString() || "");
    setAdminNotes(quote.admin_notes || "");
    
    // Initialize invoice details
    const amount = quote.quote_amount || 0;
    setInvoiceDetails({
      lineItems: [{ description: quote.service_category, quantity: 1, unitPrice: amount, amount: amount }],
      subtotal: amount,
      tax: 0,
      total: amount,
      paymentTerms: "50% deposit required to confirm booking",
      validUntil: "30 days from date of issue",
      serviceBreakdown: "",
      equipmentBreakdown: "",
      additionalInfo: ""
    });
    setShowInvoiceDialog(true);
  };

  // Function to calculate invoice totals
  const calculateInvoiceTotals = () => {
    const subtotal = invoiceDetails.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal; // No tax calculation
    
    setInvoiceDetails(prev => ({
      ...prev,
      subtotal,
      total
    }));
  };

  // Function to add line item
  const addLineItem = () => {
    setInvoiceDetails(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]
    }));
  };

  // Function to remove line item
  const removeLineItem = (index: number) => {
    setInvoiceDetails(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  // Function to update line item
  const updateLineItem = (index: number, field: string, value: string | number) => {
    setInvoiceDetails(prev => {
      const newLineItems = [...prev.lineItems];
      newLineItems[index] = { ...newLineItems[index], [field]: value };
      
      // Calculate amount for this line item
      if (field === 'quantity' || field === 'unitPrice') {
        newLineItems[index].amount = newLineItems[index].quantity * newLineItems[index].unitPrice;
      }
      
      return { ...prev, lineItems: newLineItems };
    });
  };

  // Redirect non-admins away from admin panel
  useEffect(() => {
    if (userRole && userRole !== 'admin' && userRole !== 'super_admin') {
      if (userRole === 'student') {
        navigate('/student', { replace: true });
      } else if (userRole === 'teacher') {
        navigate('/teacher', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    console.log("AdminPanel: User authenticated, fetching data...");
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    console.log("AdminPanel: Starting data fetch...");
    
    try {
      // Get user's role - try profiles table first, fallback to user metadata
      console.log("AdminPanel: Fetching user profile...");
      let userRole = 'admin'; // Default role
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .single();

        if (profileError) {
          console.log("AdminPanel: Profile not found, checking user metadata...");
          // If profile doesn't exist, check user metadata
          if (user?.user_metadata?.role) {
            userRole = user.user_metadata.role;
            console.log("AdminPanel: User role from metadata:", userRole);
          }
        } else {
          userRole = profile?.role || 'admin';
          console.log("AdminPanel: User role from profile:", userRole);
        }
      } catch (error) {
        console.log("AdminPanel: Error fetching profile, using default role");
        // If there's any error, use default admin role
        userRole = 'admin';
      }

      setUserRole(userRole);

      console.log("AdminPanel: Fetching registrations...");
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (regError) {
        console.error("Error fetching registrations:", regError);
        toast({
          title: "Error",
          description: "Failed to load registrations: " + regError.message,
          variant: "destructive",
        });
      } else {
        console.log("AdminPanel: Registrations fetched successfully:", regData?.length || 0, "records");
        setRegistrations(regData || []);
      }

      console.log("AdminPanel: Fetching approval requests...");
      const { data: approvalRequestsData, error: approvalRequestsError } = await supabase
        .from('approval_requests')
        .select(`
          *,
          students!inner(student_name, email)
        `)
        .order('created_at', { ascending: false });

      if (approvalRequestsError) {
        console.error("Error fetching approval requests:", approvalRequestsError);
        toast({
          title: "Error",
          description: "Failed to load approval requests: " + approvalRequestsError.message,
          variant: "destructive",
        });
      } else {
        console.log("AdminPanel: Approval requests fetched successfully:", approvalRequestsData?.length || 0, "records");
        // Flatten the data to include student info
        const flattenedData = approvalRequestsData?.map(request => ({
          ...request,
          student_name: request.students?.student_name || 'Unknown',
          email: request.students?.email || 'Unknown'
        })) || [];
        setApprovalRequests(flattenedData);
      }

    console.log("AdminPanel: Fetching quotes...");
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.error("Error fetching quotes:", quotesError);
      toast({
        title: "Error",
        description: "Failed to load quotes: " + quotesError.message,
        variant: "destructive",
      });
    } else {
      console.log("AdminPanel: Quotes fetched successfully:", quotesData?.length || 0, "records");
      setQuotes(quotesData || []);
    }

      // Fetch admin profiles for messaging (both admin and super_admin)
      console.log("AdminPanel: Fetching admin profiles for messaging...");
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('id, email, role, created_at')
          .in('role', ['admin', 'super_admin'])
          .order('created_at', { ascending: false });

        if (adminError) {
          console.error("Error fetching admin profiles:", adminError);
        } else {
          console.log("AdminPanel: Admin profiles fetched successfully:", adminData?.length || 0, "records");
          setAdminProfiles(adminData || []);
        }
      } catch (error) {
        console.error("Error fetching admin profiles:", error);
      }

      // Fetch students data
      const { data: activeStudentsData, error: activeStudentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (!activeStudentsError && activeStudentsData) {
        setActiveStudents(activeStudentsData.map(s => ({
          ...s,
          receipt_number: s.receipt_number || '',
          phone: s.phone || '',
          country_code: s.country_code || '',
          parent_name: s.parent_name || '',
          parent_phone: s.parent_phone || '',
          course_category: s.course_category || '',
          production_type: s.production_type || '',
          proficiency_level: s.proficiency_level || '',
          learning_mode: s.learning_mode || '',
          owns_instrument: s.owns_instrument ?? false,
          medical_condition: s.medical_condition || '',
          medical_details: s.medical_details || '',
          goals: s.goals || '',
          preferred_schedule: s.preferred_schedule || '',
          date_of_birth: s.date_of_birth || '',
          // Remove profile_photo_url
        })));
      }

      // Fetch students and teachers for portal messaging
      console.log("AdminPanel: Fetching students for portal messaging...");
      const { data: portalStudentsData, error: portalStudentsError } = await supabase
        .from('students')
        .select('user_id, student_name, email')
        .not('user_id', 'is', null)
        .order('student_name', { ascending: true });

      if (portalStudentsError) {
        console.error("Error fetching students:", portalStudentsError);
      } else {
        console.log("AdminPanel: Students fetched successfully:", portalStudentsData?.length || 0, "records");
        setStudents(portalStudentsData || []);
      }

      console.log("AdminPanel: Fetching teachers for portal messaging...");
      const { data: portalTeachersData, error: portalTeachersError } = await supabase
        .from('teachers')
        .select('user_id, name, email')
        .not('user_id', 'is', null) // Removed status filter to include all teachers
        .order('name', { ascending: true });

      if (portalTeachersError) {
        console.error("Error fetching teachers:", portalTeachersError);
      } else {
        console.log("AdminPanel: Teachers fetched successfully:", portalTeachersData?.length || 0, "records");
        setTeachers(portalTeachersData || []);
      }

      // Fetch portal messages for unread badge
      console.log("AdminPanel: Fetching portal messages...");
      const { data: portalMsgData, error: portalMsgError } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false });

      if (portalMsgError) {
        console.error("Error fetching portal messages:", portalMsgError);
      } else {
        console.log("AdminPanel: Portal messages fetched successfully:", portalMsgData?.length || 0, "records");
        setPortalMessages(portalMsgData || []);
      }

    } catch (error) {
      console.error("AdminPanel: Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("AdminPanel: Data fetch completed");
    }
    
    // Fetch notifications after main data is loaded
    await fetchNotifications();
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Request approved'
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving request:', error);
        toast({
          title: 'Error',
          description: 'Failed to approve request',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Request approved successfully',
      });

      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Request rejected'
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        toast({
          title: 'Error',
          description: 'Failed to reject request',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Request rejected',
      });

      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const toggleRequestExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedRequestIds);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequestIds(newExpanded);
  };

  // Pagination logic for requests
  const getPaginatedRequests = () => {
    const startIndex = (requestsPage - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;
    return approvalRequests.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(approvalRequests.length / requestsPerPage);
  };

  const handlePageChange = (newPage: number) => {
    setRequestsPage(newPage);
    // Collapse all expanded requests when changing pages
    setExpandedRequestIds(new Set());
  };

  // Fetch notifications for admin
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

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
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (!error) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🔐 Attempting to sign out...');
      
      // First try to sign out using the auth hook
      const { error } = await signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        
        // If the first method fails, try direct supabase sign out
        try {
          const { error: directError } = await supabase.auth.signOut();
          if (directError) {
            console.error('❌ Direct sign out also failed:', directError);
          }
        } catch (directError) {
          console.error('❌ Direct sign out exception:', directError);
        }
      }
      
      // Clear all cached data using the new function
      clearAllData();
      
      // Clear any local state and redirect
      console.log('✅ Sign out successful, redirecting...');
      navigate("/auth");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out from Damon Music Academy.",
      });
      
    } catch (error) {
      console.error('❌ Unexpected sign out error:', error);
      
      // Force clear everything and redirect
      clearAllData();
      
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred during sign out. Please try refreshing the page.",
        variant: "destructive",
      });
      
      // Force redirect even if sign out fails
      navigate("/auth");
    }
  };

  const handleSendPortalMessage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          sender_id: user.id,
          recipient_id: newPortalMessage.recipient_id,
          subject: newPortalMessage.subject,
          message: newPortalMessage.message
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setShowPortalMessageModal(false);
      setNewPortalMessage({
        subject: '',
        message: '',
        recipient_id: ''
      });

      toast({
        title: "Success",
        description: "Portal message sent successfully!",
      });
    } catch (error) {
      console.error('Error sending portal message:', error);
      toast({
        title: "Error",
        description: "Failed to send portal message",
        variant: "destructive",
      });
    }
  };

  // Defensive check for .eq('id', ...) and .eq('student_id', ...) queries
  // Example for .eq('id', id):
  const isValidId = (id: any) => id && id !== 'undefined' && id !== undefined && id !== null;

  const updateRegistrationStatus = async (id: string, status: string) => {
    if (!isValidId(id)) {
      console.error('Invalid or missing ID for updateRegistrationStatus:', id);
      toast({ title: 'Error', description: 'Invalid or missing ID for update.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error("Error updating registration:", error);
        toast({
          title: "Error",
          description: "Failed to update registration status",
          variant: "destructive",
        });
        return;
      }

      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === id ? { ...reg, status } : reg
        )
      );

      toast({
        title: "Status Updated",
        description: `Registration has been ${status}`,
      });

      // If approved, send acceptance email with invoice
      if (status === 'approved') {
        // First, create Supabase Auth user for the student
        let tempPassword = null;
        try {
          console.log('🔧 Creating Supabase Auth user for student...');
          const { data: regData, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', id)
            .single();
          
          if (fetchError || !regData) {
            console.error('Error fetching registration for user creation:', fetchError);
            toast({
              title: "Warning",
              description: "Could not fetch registration details for user creation.",
              variant: "destructive",
            });
            return;
          }

          // Call the Edge Function to create the student user
          const { data: userData, error: userError } = await supabase.functions.invoke('create-student-user', {
            body: {
              email: regData.email,
              student_name: regData.student_name
            }
          });

          if (userError) {
            console.error('Error creating student user:', userError);
            toast({
              title: "Warning",
              description: "Student approved but could not create user account. Please contact support.",
              variant: "destructive",
            });
          } else if (userData && userData.tempPassword) {
            console.log('✅ Student user created successfully');
            tempPassword = userData.tempPassword;
            toast({
              title: "Student User Created",
              description: "Student account created with temporary password.",
            });
          }
        } catch (userCreationError) {
          console.error('Error in user creation process:', userCreationError);
          toast({
            title: "Warning",
            description: "Student approved but user creation failed. Please contact support.",
            variant: "destructive",
          });
        }

        // Generate invoice for the student
        try {
          console.log('💰 Generating invoice for approved student...');
          const invoiceResult = await generateInvoiceForRegistration(id);
          
          if (invoiceResult && !('existing' in invoiceResult)) {
            // Fetch student data for email
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('*')
              .eq('registration_id', id)
              .single();
            
            if (studentData && !studentError) {
              // Send invoice email (this is the first invoice)
              const invoiceEmailSent = await sendInvoiceEmail(invoiceResult, studentData, { isFirstInvoice: true });
              if (invoiceEmailSent) {
                toast({
                  title: "Invoice Sent",
                  description: "Invoice has been sent to the student with payment instructions.",
                });
              } else {
                toast({
                  title: "Invoice Email Failed",
                  description: "Could not send invoice email to student.",
                  variant: "destructive",
                });
              }
            }
          } else if (invoiceResult && 'existing' in invoiceResult) {
            toast({
              title: "Invoice Already Exists",
              description: "An invoice already exists for this student.",
            });
          }
        } catch (invoiceError) {
          console.error('Error generating invoice:', invoiceError);
          toast({
            title: "Invoice Generation Failed",
            description: "Could not generate invoice for the student.",
            variant: "destructive",
          });
        }

        // Then send acceptance email with login credentials
        try {
          const { data: regData, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', id)
            .single();
          if (fetchError || !regData) {
            console.error('Error fetching registration for email:', fetchError);
            toast({
              title: "Warning",
              description: "Could not fetch registration details for acceptance email.",
              variant: "destructive",
            });
            return;
          }
          const emailSent = await sendAcceptedEmail(regData, tempPassword);
          if (emailSent) {
            toast({
              title: "Acceptance Email Sent",
              description: "The applicant has been notified of their acceptance with login credentials.",
            });
          } else {
            toast({
              title: "Acceptance Email Failed",
              description: "Could not send acceptance email to applicant.",
              variant: "destructive",
            });
          }
        } catch (emailError) {
          console.error('Error sending acceptance email:', emailError);
          toast({
            title: "Acceptance Email Error",
            description: "An error occurred while sending the acceptance email.",
            variant: "destructive",
          });
        }
      }
      // If rejected, send declined email
      if (status === 'rejected') {
        const { data: regData, error: fetchError } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', id)
          .single();
        if (fetchError || !regData) {
          console.error('Error fetching registration for declined email:', fetchError);
          toast({
            title: "Warning",
            description: "Could not fetch registration details for declined email.",
            variant: "destructive",
          });
          return;
        }
        try {
          const emailSent = await sendDeclinedEmail(regData);
          if (emailSent) {
            toast({
              title: "Declined Email Sent",
              description: "The applicant has been notified of the decision.",
            });
          } else {
            toast({
              title: "Declined Email Failed",
              description: "Could not send declined email to applicant.",
              variant: "destructive",
            });
          }
        } catch (emailError) {
          console.error('Error sending declined email:', emailError);
          toast({
            title: "Declined Email Error",
            description: "An error occurred while sending the declined email.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const deleteRegistration = async (id: string, studentName: string) => {
    console.log('🗑️ Delete registration triggered for:', id, studentName);
    
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete the registration for ${studentName}? This action cannot be undone.`)) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    try {
      // First, check if there are any students linked to this registration
      console.log('🗑️ Checking for linked students...');
      const { data: linkedStudents, error: studentError } = await supabase
        .from('students')
        .select('id, student_name')
        .eq('registration_id', id);

      if (studentError) {
        console.error('Error checking linked students:', studentError);
      } else {
        console.log('🗑️ Linked students found:', linkedStudents?.length || 0);
        if (linkedStudents && linkedStudents.length > 0) {
          console.log('🗑️ Students to be unlinked:', linkedStudents);
        }
      }

      console.log('🗑️ Attempting to delete registration from database...');
      const { data, error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      console.log('🗑️ Delete response:', { data, error });

      if (error) {
        console.error("Error deleting registration:", error);
        toast({
          title: "Error",
          description: "Failed to delete registration",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Registration deleted from database successfully');

      // Remove from local state
      setRegistrations(prev => {
        const filtered = prev.filter(reg => reg.id !== id);
        console.log('🗑️ Updated local state, remaining registrations:', filtered.length);
        return filtered;
      });

      toast({
        title: "Registration Deleted",
        description: `Registration for ${studentName} has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the registration",
        variant: "destructive",
      });
    }
  };



  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInstrumentIcon = (instrument: string) => {
    const lower = instrument.toLowerCase();
    if (lower.includes('piano') || lower.includes('keyboard')) return Piano;
    if (lower.includes('guitar')) return Guitar;
    if (lower.includes('voice') || lower.includes('vocal')) return Mic;
    return Music;
  };

  const pendingCount = registrations.filter(reg => reg.status === 'pending').length;

  useEffect(() => {
    const fetchTeachers = async () => {
      setTeacherLoading(true);
      try {
        console.log('🔍 Fetching pending teachers...');
        const { data: pending, error: pendingError } = await supabase
          .from("pending_teachers")
          .select("*")
          .order("created_at", { ascending: false });
        
        console.log('📊 Pending teachers result:', { data: pending, error: pendingError });
        
        if (!pendingError) {
          setPendingTeachers(pending || []);
          console.log('✅ Set pending teachers:', pending?.length || 0);
        } else {
          console.error('❌ Error fetching pending teachers:', pendingError);
        }
        
        console.log('🔍 Fetching approved teachers...');
        const { data: approved, error: approvedError } = await supabase
          .from("teachers")
          .select("*")
          .order("created_at", { ascending: false });
        
        console.log('📊 Approved teachers result:', { data: approved, error: approvedError });
        
        if (!approvedError) {
          setApprovedTeachers(approved || []);
          console.log('✅ Set approved teachers:', approved?.length || 0);
        } else {
          console.error('❌ Error fetching approved teachers:', approvedError);
        }
      } catch (err) {
        console.error('❌ Exception in fetchTeachers:', err);
        toast({ title: "Error", description: "Failed to load teachers.", variant: "destructive" });
      } finally {
        setTeacherLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const approveTeacher = async (teacher) => {
    setTeacherLoading(true);
    try {
      // First, create a Supabase Auth user for the teacher using Edge Function
      console.log('🔧 Creating Supabase Auth user for teacher...');
      console.log('🔧 Teacher data being sent:', {
        email: teacher.email,
        name: teacher.name,
        password: teacher.password ? '***PROVIDED***' : '***MISSING***',
        hasPassword: !!teacher.password,
        teacherKeys: Object.keys(teacher)
      });
      
      const { data: userData, error: userError } = await supabase.functions.invoke('create-teacher-user', {
        body: {
          email: teacher.email,
          name: teacher.name,
          password: teacher.password // Pass the teacher's initially created password
        }
      });

      if (userError) {
        console.error('Error creating teacher user:', userError);
        toast({
          title: "Error",
          description: "Failed to create teacher account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Teacher Auth user created successfully');

      // Now create the teacher record with the user_id
      const teacherData = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        password: teacher.password, // Store hashed/encrypted in production
        bio: teacher.bio,
        experience: teacher.experience,
        category: teacher.category,
        subjects: teacher.subjects,
        status: "approved",
        user_id: userData.userId, // Set the user_id to link to auth.users
        created_at: teacher.created_at || new Date().toISOString(),
      };

      const { data, error } = await supabase.from("teachers").insert([teacherData]);
      if (error) throw error;

      // Remove from pending_teachers
      await supabase.from("pending_teachers").delete().eq("id", teacher.id);

      // Send acceptance email with login credentials (using the original password)
      const emailSent = await sendTeacherAcceptedEmail(teacher, teacher.password); // Pass original password
      if (!emailSent) {
        toast({ title: "Email Failed", description: "Could not send approval email to teacher.", variant: "destructive" });
      }

      toast({ title: "Teacher Approved", description: `${teacher.name} has been approved and notified.` });
      
      // Refresh lists
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setApprovedTeachers((prev) => [{ ...teacher, status: "approved" }, ...prev]);
    } catch (err) {
      console.error('Error approving teacher:', err);
      toast({ title: "Error", description: err.message || "Failed to approve teacher.", variant: "destructive" });
    } finally {
      setTeacherLoading(false);
    }
  };

  const rejectTeacher = async (teacher) => {
    setTeacherLoading(true);
    try {
      await supabase.from("pending_teachers").delete().eq("id", teacher.id);
      // Send rejection email
      const emailSent = await sendTeacherDeclinedEmail(teacher);
      if (!emailSent) {
        toast({ title: "Email Failed", description: "Could not send rejection email to teacher.", variant: "destructive" });
      }
      toast({ title: "Teacher Rejected", description: `${teacher.name} has been notified.` });
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to reject teacher.", variant: "destructive" });
    } finally {
      setTeacherLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    setTeacherLoading(true);
    try {
      // Send custom email
      const emailSent = await sendTeacherRequestInfoEmail(requestInfoTeacher, requestMessage);
      if (!emailSent) {
        toast({ title: "Email Failed", description: "Could not send request info email to teacher.", variant: "destructive" });
      }
      toast({ title: "Request Sent", description: `Message sent to ${requestInfoTeacher.name}.` });
      setShowRequestInfo(false);
      setRequestInfoTeacher(null);
      setRequestMessage("");
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to send request.", variant: "destructive" });
    } finally {
      setTeacherLoading(false);
    }
  };

  // Fetch latest invoice for each active student
  useEffect(() => {
    const fetchStudentInvoices = async () => {
      // Defensive check: filter out students with invalid IDs
      const validStudentIds = activeStudents.filter(s => isValidId(s.id)).map(s => s.id);
      if (validStudentIds.length === 0) {
        console.log('No valid student IDs found for invoice fetching');
        return;
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .in('student_id', validStudentIds)
        .order('period_end', { ascending: false });
      if (!error && data) {
        // Group by student_id, pick latest
        const latest: Record<string, any> = {};
        for (const inv of data) {
          if (!latest[inv.student_id] || new Date(inv.period_end) > new Date(latest[inv.student_id].period_end)) {
            latest[inv.student_id] = inv;
          }
        }
        setStudentInvoices(latest);
      }
    };
    fetchStudentInvoices();
  }, [activeStudents]);

  // Handler to view invoice details
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  // Handler to mark invoice as paid
  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error marking invoice as paid:', error);
        toast({
          title: "Error",
          description: "Failed to mark invoice as paid",
          variant: "destructive",
        });
        return;
      }

      // Fetch invoice and student data for email
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, students(*)')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error('Error fetching invoice for payment confirmation:', invoiceError);
        toast({
          title: "Warning",
          description: "Invoice marked as paid but could not send confirmation email.",
          variant: "destructive",
        });
        return;
      }

      // Fetch registration data for email
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', invoice.students?.registration_id)
        .single();

      if (registration && !regError) {
        // Get the student's user data to retrieve tempPassword
        let tempPassword = null;
        try {
          // Call the Edge Function to get or regenerate the student's tempPassword
          const { data: userData, error: userError } = await supabase.functions.invoke('create-student-user', {
            body: {
              email: registration.email,
              student_name: registration.student_name,
              action: 'get_password' // This will retrieve existing password or generate new one
            }
          });

          if (!userError && userData && userData.tempPassword) {
            console.log('✅ Retrieved student tempPassword for payment confirmation');
            tempPassword = userData.tempPassword;
          } else {
            console.log('⚠️ Could not retrieve tempPassword, proceeding without login credentials');
          }
        } catch (passwordError) {
          console.error('Error retrieving tempPassword:', passwordError);
          // Continue without tempPassword - the email will be sent without login credentials
        }

        // Send payment confirmation email with tempPassword
        const emailSent = await sendPaymentConfirmationEmail(registration, tempPassword);
        if (emailSent) {
          toast({
            title: "Payment Confirmed",
            description: "Invoice marked as paid and confirmation email sent to student.",
          });
        } else {
          toast({
            title: "Payment Confirmed",
            description: "Invoice marked as paid but could not send confirmation email.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Payment Confirmed",
          description: "Invoice marked as paid.",
        });
      }

      // Refresh invoice data
      fetchData();
    } catch (error) {
      console.error('Error in handleMarkInvoicePaid:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing payment",
        variant: "destructive",
      });
    }
  };

  // Handler: Resend Invoice
  const handleResendInvoice = async (inv: any) => {
    // Defensive check for invoice and student_id
    if (!inv || !isValidId(inv.student_id)) {
      console.error('Invalid invoice or student_id for resend:', inv);
      toast({ title: 'Error', description: 'Invalid invoice data for resend.', variant: 'destructive' });
      return;
    }
    
    // Fetch student info
    const { data: student, error } = await supabase.from('students').select('*').eq('id', inv.student_id).single();
    if (error || !student) {
      toast({ title: 'Error', description: 'Could not fetch student info.', variant: 'destructive' });
      return;
    }
    const sent = await sendInvoiceEmail(inv, student, { isReminder: false, isFirstInvoice: false });
    if (sent) {
      toast({ title: 'Invoice Resent', description: 'Invoice resent to student via email.' });
    } else {
      toast({ title: 'Email Error', description: 'Failed to send invoice email.', variant: 'destructive' });
    }
  };

  // Handler: Send Reminder
  const handleSendReminder = async (inv: any) => {
    // Defensive check for invoice and student_id
    if (!inv || !isValidId(inv.student_id)) {
      console.error('Invalid invoice or student_id for reminder:', inv);
      toast({ title: 'Error', description: 'Invalid invoice data for reminder.', variant: 'destructive' });
      return;
    }
    
    // Fetch student info
    const { data: student, error } = await supabase.from('students').select('*').eq('id', inv.student_id).single();
    if (error || !student) {
      toast({ title: 'Error', description: 'Could not fetch student info.', variant: 'destructive' });
      return;
    }
    const sent = await sendInvoiceEmail(inv, student, { isReminder: true, isFirstInvoice: false });
    if (sent) {
      toast({ title: 'Reminder Sent', description: 'Payment reminder sent to student via email.' });
    } else {
      toast({ title: 'Email Error', description: 'Failed to send reminder email.', variant: 'destructive' });
    }
  };

  // Handler: Excuse Period
  const handleExcusePeriod = (inv: any) => {
    setSelectedInvoice(inv);
    setShowExcuseModal(true);
  };
  const submitExcuse = async () => {
    if (!selectedInvoice) return;
    await supabase.from('invoices').update({ status: 'excused', excuse_reason: excuseReason }).eq('id', selectedInvoice.id);
    toast({ title: 'Period Excused', description: 'Student excused for this period.' });
    setShowExcuseModal(false);
    setExcuseReason('');
  };
  // Handler: Edit Invoice
  const handleEditInvoice = (inv: any) => {
    setEditInvoice({ ...inv });
    setShowEditModal(true);
  };
  const submitEdit = async () => {
    if (!editInvoice) return;
    await supabase.from('invoices').update({
      amount_due: editInvoice.amount_due,
      due_date: editInvoice.due_date,
      status: editInvoice.status
    }).eq('id', editInvoice.id);
    toast({ title: 'Invoice Updated', description: 'Invoice details updated.' });
    setShowEditModal(false);
    setEditInvoice(null);
  };

  const toggleStudentExpand = (id: string) => {
    setExpandedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  // Separate function to fetch students
  const fetchStudents = async () => {
    try {
      const { data: activeStudentsData, error: activeStudentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!activeStudentsError && activeStudentsData) {
        setActiveStudents(activeStudentsData.map((s: any) => ({
          ...s,
          receipt_number: s.receipt_number || '',
          phone: s.phone || '',
          country_code: s.country_code || '',
          parent_name: s.parent_name || '',
          parent_phone: s.parent_phone || '',
          course_category: s.course_category || '',
          production_type: s.production_type || '',
          proficiency_level: s.proficiency_level || '',
          learning_mode: s.learning_mode || '',
          owns_instrument: s.owns_instrument ?? false,
          medical_condition: s.medical_condition || '',
          medical_details: s.medical_details || '',
          goals: s.goals || '',
          preferred_schedule: s.preferred_schedule || '',
          date_of_birth: s.date_of_birth || '',
        })));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting student:", error);
        toast({
          title: "Error",
          description: "Failed to delete student",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Student deleted from database successfully');

      // Refetch students data to ensure UI is in sync
      await fetchStudents();
      
      toast({
        title: "Student Deleted",
        description: `Student has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the student",
        variant: "destructive",
      });
    }
  };

  // Replace verifyAdminPassword with secure Supabase Auth check
  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    if (!user?.email) return false;
    // Use Supabase Auth to re-authenticate
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    return !error;
  };

  // 2. Helper to get current period (month)
  const getCurrentPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  };

  // 3. Compute students needing invoice for current period
  useEffect(() => {
    const { start, end } = getCurrentPeriod();
    const needing = activeStudents.filter(student => {
      const inv = Object.values(studentInvoices).find(
        (inv: any) => inv.student_id === student.id && inv.period_start === start && inv.period_end === end
      );
      return !inv;
    }).map(s => s.id);
    setStudentsNeedingInvoice(needing);
  }, [activeStudents, studentInvoices]);

  // 4. Handler to send invoice for a student
  const handleSendInvoice = async (student: any) => {
    // Defensive check for student object and ID
    if (!student || !isValidId(student.id)) {
      console.error('Invalid student object or ID for invoice sending:', student);
      toast({ title: 'Error', description: 'Invalid student data for invoice sending.', variant: 'destructive' });
      return;
    }

    setSendingInvoiceIds(ids => [...ids, student.id]);
    try {
      console.log('Send Invoice: student object', student);
      let regId = student.registration_id;
      let reg = null;
      
      // Defensive check for registration_id
      if (!regId || regId === 'undefined' || regId === undefined || regId === null) {
        // Fallback: lookup registration by name/email
        console.log('Send Invoice: registration_id missing, attempting lookup by name/email');
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .eq('student_name', student.student_name)
          .eq('email', student.email)
          .eq('status', 'approved')
          .single();
        console.log('Send Invoice: registration lookup result', { data, error });
        if (error || !data) {
          toast({ title: 'Error', description: 'Could not find registration for student. ' + (error?.message || ''), variant: 'destructive' });
          setSendingInvoiceIds(ids => ids.filter(id => id !== student.id));
          return;
        }
        reg = data;
        regId = data.id;
      }
      
      // Final defensive check for registration ID
      if (!regId || regId === 'undefined' || regId === undefined || regId === null) {
        toast({ title: 'Error', description: 'Student is missing registration_id or it is invalid. Cannot send invoice.', variant: 'destructive' });
        setSendingInvoiceIds(ids => ids.filter(id => id !== student.id));
        return;
      }
      
      // Generate invoice
      const { generateInvoiceForRegistration } = await import('@/lib/invoiceUtils');
      const result = await generateInvoiceForRegistration(regId);
      if (result && !('existing' in result)) {
        // Send email for the newly created invoice
        const invoice = result as any;
        const sent = await sendInvoiceEmail(invoice, student, { isReminder: false, isFirstInvoice: false });
        if (sent) {
          toast({ title: 'Invoice Sent', description: `Invoice sent to ${student.student_name}` });
        } else {
          toast({ title: 'Invoice Created', description: `Invoice created but email failed to send.` });
        }
      } else {
        toast({ title: 'Invoice Exists', description: `Invoice already exists for this period.` });
      }
      
      // Refresh invoices with defensive check for student IDs
      const validStudentIds = activeStudents.filter(s => isValidId(s.id)).map(s => s.id);
      if (validStudentIds.length > 0) {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .in('student_id', validStudentIds)
          .order('period_end', { ascending: false });
        if (!error && data) {
          const latest: Record<string, any> = {};
          for (const inv of data) {
            if (!latest[inv.student_id] || new Date(inv.period_end) > new Date(latest[inv.student_id].period_end)) {
              latest[inv.student_id] = inv;
            }
          }
          setStudentInvoices(latest);
        }
      }
    } catch (err: any) {
      console.error('Send Invoice error:', { student, err });
      toast({ title: 'Error', description: (err.message || 'Failed to send invoice') + (err.stack ? '\n' + err.stack : ''), variant: 'destructive' });
    } finally {
      setSendingInvoiceIds(ids => ids.filter(id => id !== student.id));
    }
  };

  // Function to fetch all invoices for a student
  const fetchInvoiceHistory = async (studentId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('period_start', { ascending: false });
    if (!error && data) setInvoiceHistory(data);
  };

  // Handler to open invoice history modal
  const handleOpenInvoiceHistory = async (student: any) => {
    setInvoiceHistoryStudent(student);
    await fetchInvoiceHistory(student.id);
    setShowInvoiceHistoryModal(true);
  };

  // Handler to view invoice from history
  const handleViewHistoryInvoice = (inv: any) => {
    setSelectedHistoryInvoice(inv);
  };

  // Handler to download invoice PDF
  const handleDownloadInvoicePDF = (inv: any) => {
    if (inv && inv.pdf_url) {
      window.open(inv.pdf_url, '_blank');
    } else {
      toast({ title: 'No PDF', description: 'No PDF available for this invoice.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="text-center">
          <Music className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <div className="text-lg text-muted-foreground">Loading Damon Music Academy dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <section id="admin" className="py-8 sm:py-12 lg:py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Mobile-friendly header layout */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 lg:mb-16 gap-4">
          <div className="text-center lg:text-left flex-1">
            <div className="flex items-center justify-center lg:justify-start mb-4 lg:mb-6">
              <Link to="/" className="group">
                <img 
                  alt="Damon Music Academy Logo" 
                  src="/damon-logo.png" 
                  className="h-12 sm:h-16 lg:h-20 object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer" 
                />
              </Link>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Damon Music Academy Dashboard
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
              {userRole === 'super_admin' ? 'Super Admin Panel - Full System Access' : 'Orchestrating student success and managing musical journeys'}
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
              {userRole === 'super_admin' ? (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs sm:text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs sm:text-sm">
                  <UserCog className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:justify-center lg:items-end gap-2">
            <div className="flex items-center gap-2">
              {/* Notifications Bell */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
                  onClick={() => setActiveTab('notifications')}
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadNotificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </Badge>
                  )}
                </Button>
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary/20">
                <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                  <UserCog className="w-3 h-3 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => handleSignOut()}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile-optimized tab navigation */}
        <div className="mb-6 lg:mb-8">
          {/* Mobile dropdown for tabs */}
          <div className="lg:hidden">
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <SelectTrigger className="w-full bg-white/90 backdrop-blur-sm border border-primary/20 rounded-xl">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stats">
                  <div className="flex items-center gap-2">
                    <Piano className="h-4 w-4" />
                    <span>Overview</span>
                  </div>
                </SelectItem>
                <SelectItem value="students">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Students ({activeStudents.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="registrations">
                  <div className="flex items-center gap-2">
                    <Guitar className="h-4 w-4" />
                    <span>Applications ({registrations.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="events">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Events</span>
                  </div>
                </SelectItem>
                <SelectItem value="messages">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Messages</span>
                  </div>
                </SelectItem>
                <SelectItem value="schedule">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Schedule</span>
                  </div>
                </SelectItem>
                {userRole === 'super_admin' && (
                  <SelectItem value="admins">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Admins ({adminProfiles.length})</span>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="teachers">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>Teachers</span>
                  </div>
                </SelectItem>
                <SelectItem value="quotes">
                  <div className="flex items-center gap-2">
                    <Quote className="h-4 w-4" />
                    <span>Quotes ({quotes.length})</span>
                  </div>
                </SelectItem>
                <SelectItem value="gallery">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span>Gallery</span>
                  </div>
                </SelectItem>
                <SelectItem value="finances">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Finances</span>
                  </div>
                </SelectItem>
                {/* Learning Mode Requests tab removed */}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop horizontal tabs */}
          <div className="hidden lg:flex justify-start overflow-x-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-primary/10 flex gap-2 min-w-max" style={{ minWidth: 'fit-content' }}>
              <Button
                variant={activeTab === 'stats' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('stats')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Piano className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'students' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('students')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Users className="h-4 w-4 mr-2" />
                Students ({activeStudents.length})
              </Button>
              <Button
                variant={activeTab === 'registrations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('registrations')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Guitar className="h-4 w-4 mr-2" />
                Applications ({registrations.length})
              </Button>
              <Button
                variant={activeTab === 'events' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('events')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>

              <Button
                variant={activeTab === 'messages' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('messages')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start relative"
                style={{ minWidth: 120 }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {portalMessages && portalMessages.filter(m => !m.is_read).length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {portalMessages.filter(m => !m.is_read).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === 'schedule' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('schedule')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              {userRole === 'super_admin' && (
                <Button
                  variant={activeTab === 'admins' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('admins')}
                  className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                  style={{ minWidth: 120 }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admins ({adminProfiles.length})
                </Button>
              )}
              <Button
                variant={activeTab === 'teachers' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('teachers')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <UserCog className="h-4 w-4 mr-2" />
                Teachers
              </Button>
              <Button
                variant={activeTab === 'requests' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('requests')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Requests & Approvals ({approvalRequests.filter(req => req.status === 'pending').length})
              </Button>
              <Button
                variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('notifications')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Notifications ({unreadNotificationCount})
              </Button>
              <Button
                variant={activeTab === 'quotes' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('quotes')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Quote className="h-4 w-4 mr-2" />
                Quotes ({quotes.length})
              </Button>
              <Button
                variant={activeTab === 'gallery' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('gallery')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Image className="h-4 w-4 mr-2" />
                Gallery
              </Button>
              <Button
                variant={activeTab === 'finances' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('finances')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Finances
              </Button>
              {/* Learning Mode Requests Button - Removed */}
              <Button
                variant={activeTab === 'debug' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('debug')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start bg-red-100 text-red-700 border-red-300"
                style={{ minWidth: 120 }}
              >
                🐛 DEBUG
              </Button>

            </div>
          </div>
        </div>

        {/* Stats Overview - Mobile responsive grid */}
        <div style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Students</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{activeStudents.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently enrolled</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-primary/20 rounded-full">
                    <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Applications</p>
                    <p className="text-2xl sm:text-3xl font-bold text-accent">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-accent/20 rounded-full">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">New Messages</p>
                    <p className="text-2xl sm:text-3xl font-bold text-secondary">{portalMessages.filter(m => !m.is_read).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Unread inquiries</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-secondary/20 rounded-full">
                    <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-green-100 to-green-50 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Registrations</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{registrations.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All applications</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Events Tab */}
        <div style={{ display: activeTab === 'events' ? 'block' : 'none' }}>
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="events">
                <Calendar className="mr-2 h-4 w-4" />
                Events Manager
              </TabsTrigger>
              <TabsTrigger value="news">
                <Newspaper className="mr-2 h-4 w-4" />
                News Manager
              </TabsTrigger>
            </TabsList>
            <TabsContent value="events" className="mt-6">
              <AdminEventsManager />
            </TabsContent>
            <TabsContent value="news" className="mt-6">
              <AdminNewsManager />
            </TabsContent>
          </Tabs>
        </div>



        {/* Schedule Tab */}
        <div style={{ display: activeTab === 'schedule' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Class Schedule Management
            </h3>
            
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-muted-foreground mb-2">Schedule Management Coming Soon</h4>
                  <p className="text-muted-foreground">
                    Real-time class scheduling and timetable management will be available in the next update.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Currently managing schedules manually. Contact system administrator for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Management Tab (Super Admin Only) */}
        <div style={{ display: activeTab === 'admins' && userRole === 'super_admin' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Management
            </h3>
            
            <div className="grid gap-4">
              {adminProfiles.map((admin) => (
                <Card key={admin.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                          {admin.role === 'super_admin' ? (
                            <Shield className="h-6 w-6 text-purple-600" />
                          ) : (
                            <UserCog className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-primary">{admin.email}</h4>
                          <p className="text-muted-foreground">
                            {admin.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {admin.role === 'super_admin' ? (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Super Admin</Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white">Admin</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-muted-foreground">
                      Account created: {new Date(admin.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Active Students Tab */}
        <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Active Students Orchestra
              </h3>
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
              />
            </div>
            
            <div className="grid gap-4">
              {activeStudents.filter(student => 
                student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.instrument.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((student) => {
                const InstrumentIcon = getInstrumentIcon(student.instrument);
                const isExpanded = expandedStudentIds.has(student.id);
                return (
                  <Card key={student.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => toggleStudentExpand(student.id)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserCog className="w-6 h-6 text-gray-400" />
                            </div>
                          <div>
                            <h4 className="text-xl font-bold text-primary">{student.student_name}</h4>
                            <p className="text-muted-foreground">Age: {student.age} • {student.instrument}</p>
                            {student.date_of_birth && (
                              <p className="text-xs text-gray-500">DOB: {new Date(student.date_of_birth).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); setStudentToDelete(student); setShowDeleteModal(true); }}>Delete</Button>
                        </div>
                      {isExpanded && (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{student.email}</span></div>
                          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{student.phone}</span></div>
                          {student.date_of_birth && (<div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">DOB: {new Date(student.date_of_birth).toLocaleDateString()}</span></div>)}
                          {student.parent_name && (<div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Parent: {student.parent_name}</span></div>)}
                          {student.parent_phone && (<div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Parent Phone: {student.parent_phone}</span></div>)}
                          <div className="flex items-center gap-2"><span className="text-sm">Course Category: {student.course_category}</span></div>
                          <div className="flex items-center gap-2"><span className="text-sm">Instrument: {student.instrument}</span></div>
                          {student.production_type && (<div className="flex items-center gap-2"><span className="text-sm">Production Type: {student.production_type}</span></div>)}
                          {student.proficiency_level && (<div className="flex items-center gap-2"><span className="text-sm">Proficiency: {student.proficiency_level}</span></div>)}
                          {student.learning_mode && (<div className="flex items-center gap-2"><span className="text-sm">Learning Mode: {student.learning_mode}</span></div>)}
                          {student.owns_instrument !== undefined && (<div className="flex items-center gap-2"><span className="text-sm">Owns Instrument: {student.owns_instrument ? 'Yes' : 'No'}</span></div>)}
                          {student.location && (<div className="flex items-center gap-2"><span className="text-sm">Location: {student.location}</span></div>)}
                          {student.medical_condition && (<div className="flex items-center gap-2"><span className="text-sm">Medical Condition: {student.medical_condition}</span></div>)}
                          {student.medical_details && (<div className="flex items-center gap-2"><span className="text-sm">Medical Details: {student.medical_details}</span></div>)}
                          {student.preferred_schedule && (<div className="flex items-center gap-2"><span className="text-sm">Preferred Schedule: {student.preferred_schedule}</span></div>)}
                          {student.goals && (<div className="p-3 bg-primary/5 rounded-lg border border-primary/10"><p className="text-sm font-medium text-primary mb-1">Learning Goals:</p><p className="text-sm text-muted-foreground">{student.goals}</p></div>)}
                          <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Enrolled: {new Date(student.created_at).toLocaleDateString()}</span></div>
                          <div className="flex items-center gap-2"><span className="text-sm font-medium text-primary">Experience: {student.experience}</span></div>
                          {student.sessions_per_week && (
                            <div className="flex items-center gap-2"><span className="font-medium text-gray-600">Classes per Week:</span> <span className="text-gray-800">{student.sessions_per_week}</span></div>
                          )}
                          </div>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Registrations Tab */}
        <div style={{ display: activeTab === 'registrations' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Student Registration Applications
              </h3>
              <Input
                placeholder="Search by name, course, location, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
              />
            </div>
            
            {filteredRegistrations.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 text-lg">No results found.</div>
            ) : (
              <div className="grid gap-6">
                {filteredRegistrations.map((registration) => {
                  const isExpanded = expandedCards.has(registration.id);
                  return (
                    <Card key={registration.id} className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                      <CardContent className="p-6">
                        {/* Header Section - Always Visible */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                              {registration.course_category === 'Music' && <Music className="h-6 w-6 text-primary" />}
                              {registration.course_category === 'Production' && <Mic className="h-6 w-6 text-accent" />}
                              {registration.course_category === 'Art' && <Palette className="h-6 w-6 text-secondary" />}
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-primary">{registration.student_name}</h4>
                              <p className="text-muted-foreground flex items-center gap-2">
                                Age: {registration.age} • {registration.course_category} • {registration.location}
                              </p>
                              <p className="text-sm font-medium text-primary/80 mt-1">
                                Receipt: {registration.receipt_number}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${getStatusColor(registration.status)} text-white font-semibold px-3 py-1`}>
                              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(registration.id)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Essential Info - Always Visible */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-gray-700">{registration.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-gray-700">{registration.country_code} {registration.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-gray-700">
                              {registration.course_category === 'Music' ? registration.instrument : 
                               registration.course_category === 'Production' ? registration.production_type : 
                               'Art Course'}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Detailed Information */}
                        {isExpanded && (
                          <div className="space-y-6 border-t border-gray-200 pt-6 animate-in slide-in-from-top duration-300">
                            {/* Contact Information */}
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h5 className="font-semibold text-primary flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  Contact Information
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Receipt Number:</span>
                                    <span className="text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">{registration.receipt_number}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Email:</span>
                                    <span className="text-gray-800">{registration.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Phone:</span>
                                    <span className="text-gray-800">{registration.country_code} {registration.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Location:</span>
                                    <span className="text-gray-800">{registration.location}</span>
                                  </div>
                                  {registration.date_of_birth && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Date of Birth:</span>
                                      <span className="text-gray-800">{new Date(registration.date_of_birth).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {registration.parent_name && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Parent Name:</span>
                                      <span className="text-gray-800">{registration.parent_name}</span>
                                    </div>
                                  )}
                                  {registration.parent_phone && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Parent Phone:</span>
                                      <span className="text-gray-800">{registration.parent_phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Course Details */}
                              <div className="space-y-3">
                                <h5 className="font-semibold text-primary flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Course Details
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Category:</span>
                                    <Badge variant="outline" className="text-xs">{registration.course_category}</Badge>
                                  </div>
                                  {registration.course_category === 'Music' && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Instrument:</span>
                                      <span className="text-gray-800">{registration.instrument}</span>
                                    </div>
                                  )}
                                  {registration.course_category === 'Production' && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Production Type:</span>
                                      <span className="text-gray-800">{registration.production_type}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Proficiency:</span>
                                    <Badge variant="outline" className="text-xs">{registration.proficiency_level}</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Learning Preferences */}
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h5 className="font-semibold text-primary flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Learning Preferences
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Mode:</span>
                                    <Badge variant="outline" className="text-xs">{registration.learning_mode}</Badge>
                                  </div>
                                  {registration.course_category === 'Music' && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Owns Instrument:</span>
                                      <Badge variant={registration.owns_instrument ? "default" : "secondary"} className="text-xs">
                                        {registration.owns_instrument ? "Yes" : "No"}
                                      </Badge>
                                    </div>
                                  )}
                                  {registration.preferred_schedule && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Preferred Schedule:</span>
                                      <span className="text-gray-800">{registration.preferred_schedule}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Classes per Week:</span>
                                    <Select
                                      value={String(registration.sessions_per_week || 1)}
                                      onValueChange={async (value) => {
                                        // Update in both registrations and students tables
                                        const newVal = parseInt(value);
                                        await supabase.from('registrations').update({ sessions_per_week: newVal }).eq('id', registration.id);
                                        await supabase.from('students').update({ sessions_per_week: newVal }).eq('registration_id', registration.id);
                                        
                                        // Update local state for both tables
                                        setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, sessions_per_week: newVal } : r));
                                        setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, sessions_per_week: newVal } : s));
                                        
                                        toast({ title: 'Updated', description: 'Classes per week updated.' });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-24 border-gray-300">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[1,2,3,4,5].map(num => (
                                          <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Learning Mode:</span>
                                    <Select
                                      value={registration.learning_mode || 'in-person'}
                                      onValueChange={async (value) => {
                                        // Update in both registrations and students tables
                                        await supabase.from('registrations').update({ learning_mode: value }).eq('id', registration.id);
                                        await supabase.from('students').update({ learning_mode: value }).eq('registration_id', registration.id);
                                        
                                        // Update local state for both tables
                                        setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, learning_mode: value } : r));
                                        setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, learning_mode: value } : s));
                                        
                                        toast({ title: 'Updated', description: 'Learning mode updated.' });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-32 border-gray-300">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in-person">In-Person</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                        <SelectItem value="home-lessons">Home Lessons</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Instrument:</span>
                                    <Select
                                      value={registration.instrument || ''}
                                      onValueChange={async (value) => {
                                        // Update in both registrations and students tables
                                        await supabase.from('registrations').update({ instrument: value }).eq('id', registration.id);
                                        await supabase.from('students').update({ instrument: value }).eq('registration_id', registration.id);
                                        
                                        // Update local state for both tables
                                        setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, instrument: value } : r));
                                        setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, instrument: value } : s));
                                        
                                        toast({ title: 'Updated', description: 'Instrument updated.' });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-36 border-gray-300">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Piano">Piano</SelectItem>
                                        <SelectItem value="Drums">Drums</SelectItem>
                                        <SelectItem value="Violin">Violin</SelectItem>
                                        <SelectItem value="Saxophone">Saxophone</SelectItem>
                                        <SelectItem value="Bass Guitar">Bass Guitar</SelectItem>
                                        <SelectItem value="Acoustic Guitar">Acoustic Guitar</SelectItem>
                                        <SelectItem value="Electric Guitar">Electric Guitar</SelectItem>
                                        <SelectItem value="Flute">Flute</SelectItem>
                                        <SelectItem value="Clarinet">Clarinet</SelectItem>
                                        <SelectItem value="Cello">Cello</SelectItem>
                                        <SelectItem value="Voice">Voice</SelectItem>
                                        <SelectItem value="Music Theory">Music Theory</SelectItem>
                                        <SelectItem value="Trumpet">Trumpet</SelectItem>
                                        <SelectItem value="Trombone">Trombone</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              {/* Medical Information */}
                              <div className="space-y-3">
                                <h5 className="font-semibold text-primary flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Medical Information
                                </h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Medical Conditions:</span>
                                    <Badge variant={registration.medical_condition === 'yes' ? "destructive" : "default"} className="text-xs">
                                      {registration.medical_condition === 'yes' ? "Yes" : "No"}
                                    </Badge>
                                  </div>
                                  {registration.medical_condition === 'yes' && registration.medical_details && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                      <p className="text-sm text-red-800">{registration.medical_details}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Parent Information (for minors) */}
                            {registration.parent_name && (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h5 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
                                  <Users className="h-4 w-4" />
                                  Parent/Guardian Information
                                </h5>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-blue-700">Name:</span>
                                    <span className="text-blue-800">{registration.parent_name}</span>
                                  </div>
                                  {registration.parent_phone && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-blue-700">Phone:</span>
                                      <span className="text-blue-800">{registration.parent_phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Goals and Additional Information */}
                            {registration.goals && (
                              <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                                <h5 className="font-semibold text-primary mb-2">Learning Goals</h5>
                                <p className="text-sm text-gray-700">{registration.goals}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer with Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Registered:</span> {new Date(registration.created_at).toLocaleDateString()} at {new Date(registration.created_at).toLocaleTimeString()}
                          </div>
                          <div className="space-x-2">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => updateRegistrationStatus(registration.id, 'approved')}
                              disabled={registration.status === 'approved'}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            >
                              Accept Student
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => updateRegistrationStatus(registration.id, 'rejected')}
                              disabled={registration.status === 'rejected'}
                            >
                              Decline
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteRegistration(registration.id, registration.student_name)}
                              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>



        {/* Messages Tab */}
        <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Messaging System
            </h3>
            
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm h-[600px]">
              <CardContent className="p-0 h-full">
                <MessagingUI
                  recipients={(() => {
                    // Students
                    const studentRecipients = students.map(student => ({
                      id: student.id || student.user_id,
                      user_id: student.user_id,
                      name: student.student_name,
                      email: student.email,
                      type: 'student' as const,
                      profile_photo_url: undefined // Students table doesn't have profile_photo_url
                    })).filter(s => s.user_id); // Ensure user_id exists

                    // Teachers
                    const teacherRecipients = teachers.map(teacher => ({
                      id: teacher.id || teacher.user_id,
                      user_id: teacher.user_id,
                      name: teacher.name,
                      email: teacher.email,
                      type: 'teacher' as const,
                      profile_photo_url: undefined // Teachers table doesn't have profile_photo_url
                    })).filter(t => t.user_id); // Ensure user_id exists

                    // Admins (exclude current user)
                    const adminRecipients = adminProfiles
                      .filter(admin => admin.id !== user?.id) // Don't include current admin user
                      .map(admin => ({
                        id: admin.id,
                        user_id: admin.id,
                        name: `Admin (${admin.email})`,
                        email: admin.email,
                        type: 'admin' as const,
                        profile_photo_url: undefined
                      }));

                    const allRecipients = [
                      ...studentRecipients,
                      ...teacherRecipients,
                      ...adminRecipients
                    ];



                    return allRecipients;
                  })()}
                  currentUserId={user?.id || ''}
                  currentUserName="Admin"
                  userType="admin"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="mt-8">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
                <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3">Pending Teachers</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm px-2 sm:px-3">Approved Teachers</TabsTrigger>
                <TabsTrigger value="classrooms" className="text-xs sm:text-sm px-2 sm:px-3">Classroom Approvals</TabsTrigger>
                <TabsTrigger value="approved-classrooms" className="text-xs sm:text-sm px-2 sm:px-3">Current Classrooms</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-6">
                {teacherLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : pendingTeachers.length === 0 ? (
                  <div className="text-center text-muted-foreground">No pending teacher applications.</div>
                ) : (
                  <div className="grid gap-4">
                    {pendingTeachers.map((teacher) => (
                      <Card key={teacher.id} className="shadow border-0 bg-white/90">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <span className="font-bold text-lg">{teacher.name}</span>
                                <Badge className="ml-2">{teacher.category}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mb-1">{teacher.email} • {teacher.phone}</div>
                              <div className="text-sm mb-1">Experience: {teacher.experience}</div>
                              <div className="text-sm mb-1">Subjects: {teacher.subjects?.join(", ")}</div>
                              <div className="text-sm mb-1">Bio: {teacher.bio}</div>
                              {teacher.cv_file_path && (
                                <div className="text-sm mb-1">
                                  <a
                                    href={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/teacher-cvs/${teacher.cv_file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline font-medium"
                                  >
                                    Download CV
                                  </a>
                                </div>
                              )}
                              <div className="text-xs text-gray-400">Applied: {new Date(teacher.created_at).toLocaleString()}</div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              <Button size="sm" onClick={() => approveTeacher(teacher)} disabled={teacherLoading}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectTeacher(teacher)} disabled={teacherLoading}>Reject</Button>
                              <Button size="sm" variant="outline" onClick={() => { setShowRequestInfo(true); setRequestInfoTeacher(teacher); }} disabled={teacherLoading}>Request More Info</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <Dialog open={showRequestInfo} onOpenChange={setShowRequestInfo}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request More Information</DialogTitle>
                      <DialogDescription>Send a message to the teacher applicant for more documents or clarification.</DialogDescription>
                    </DialogHeader>
                    <Textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder="Type your message here..." rows={4} />
                    <DialogFooter>
                      <Button onClick={handleRequestInfo} disabled={teacherLoading}>Send Request</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
              <TabsContent value="approved" className="mt-6">
                {teacherLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : approvedTeachers.length === 0 ? (
                  <div className="text-center text-muted-foreground">No approved teachers yet.</div>
                ) : (
                  <div className="grid gap-4">
                    {approvedTeachers.map((teacher) => (
                      <Card key={teacher.id} className="shadow border-0 bg-white/90">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="h-5 w-5 text-primary" />
                                <span className="font-bold text-lg">{teacher.name}</span>
                                <Badge className="ml-2">{teacher.category}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mb-1">{teacher.email} • {teacher.phone}</div>
                              <div className="text-sm mb-1">Experience: {teacher.experience}</div>
                              <div className="text-sm mb-1">Subjects: {teacher.subjects?.join(", ")}</div>
                              <div className="text-sm mb-1">Bio: {teacher.bio}</div>
                              {teacher.cv_file_path && (
                                <div className="text-sm mb-1">
                                  <a
                                    href={`https://xtjarscgxhbyktwriahu.supabase.co/storage/v1/object/public/teacher-cvs/${teacher.cv_file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline font-medium"
                                  >
                                    Download CV
                                  </a>
                                </div>
                              )}
                              <div className="text-xs text-gray-400">Approved: {new Date(teacher.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="classrooms" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Pending Classrooms</CardTitle>
                    <CardDescription>Approve teacher-created classrooms to generate class codes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingClassrooms.length > 0 ? (
                      <div className="space-y-3">
                        {pendingClassrooms.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-semibold">{c.name}</div>
                              <div className="text-xs text-gray-500">Teacher: {c.teacher_name}</div>
                              {c.description && (
                                <div className="text-xs text-gray-600 mt-1 max-w-md truncate">
                                  {c.description}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveClassroom(c.id)}>Approve</Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                  const reason = prompt('Enter rejection reason (optional):');
                                  if (reason !== null) {
                                    handleRejectClassroom(c.id, reason);
                                  }
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No classrooms pending approval.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approved-classrooms" className="mt-6">
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Current Classrooms</CardTitle>
                    <CardDescription>All approved classrooms and their codes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {approvedClassrooms.length > 0 ? (
                      <div className="space-y-3">
                        {approvedClassrooms.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-semibold">{c.name}</div>
                              <div className="text-xs text-gray-500">Teacher: {c.teacher_name}</div>
                              {c.description && (
                                <div className="text-xs text-gray-600 mt-1 max-w-md truncate">
                                  {c.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">Code: {c.class_code}</div>
                              <div className="text-xs text-gray-400">Approved: {c.approved_at ? new Date(c.approved_at).toLocaleString() : '-'}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(c.class_code || '')}>Copy Code</Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => {
                                  setClassroomToDelete(c);
                                  setShowDeleteClassroomModal(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No approved classrooms yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Requests & Approvals Tab */}
        {activeTab === 'requests' && (
          <div className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Requests & Approvals
                </h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="px-3 py-1">
                    Total: {approvalRequests.length}
                  </Badge>
                  <Badge variant="default" className="px-3 py-1 bg-orange-500">
                    Pending: {approvalRequests.filter(req => req.status === 'pending').length}
                  </Badge>
                  {getTotalPages() > 1 && (
                    <Badge variant="outline" className="px-3 py-1 text-blue-600">
                      Page {requestsPage} of {getTotalPages()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {approvalRequests.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h3>
                      <p className="text-gray-500">No students have submitted approval requests yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {getPaginatedRequests().map((request) => {
                    const isExpanded = expandedRequestIds.has(request.id);
                    const getTypeIcon = () => {
                      switch (request.request_type) {
                        case 'learning_mode_change': return <BookOpen className="h-4 w-4" />;
                        case 'profile_update': return <UserCog className="h-4 w-4" />;
                        case 'schedule_change': return <Calendar className="h-4 w-4" />;
                        default: return <Settings className="h-4 w-4" />;
                      }
                    };
                    
                    const getTypeColor = () => {
                      switch (request.request_type) {
                        case 'learning_mode_change': return 'text-blue-600 bg-blue-50 border-blue-200';
                        case 'profile_update': return 'text-green-600 bg-green-50 border-green-200';
                        case 'schedule_change': return 'text-purple-600 bg-purple-50 border-purple-200';
                        default: return 'text-orange-600 bg-orange-50 border-orange-200';
                      }
                    };

                    return (
                      <Card key={request.id} className={`transition-all duration-200 hover:shadow-md ${
                        request.status === 'pending' ? 'border-l-4 border-l-orange-500' :
                        request.status === 'approved' ? 'border-l-4 border-l-green-500' :
                        'border-l-4 border-l-red-500'
                      }`}>
                        <CardContent className="p-4">
                          {/* Compact Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg ${getTypeColor()}`}>
                                {getTypeIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 truncate">{request.title}</h4>
                                  <Badge variant="outline" className={`text-xs ${getTypeColor()}`}>
                                    {request.request_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="truncate">{request.student_name}</span>
                                  <span>•</span>
                                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                  {request.current_value && request.requested_value && (
                                    <>
                                      <span>•</span>
                                      <span className="text-primary font-medium">
                                        {request.current_value} → {request.requested_value}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                request.status === 'pending' ? 'default' : 
                                request.status === 'approved' ? 'default' : 
                                'destructive'
                              } className="text-xs">
                                {request.status}
                              </Badge>
                              
                              {request.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="h-8 px-3 text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRequestExpansion(request.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                              {request.description && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600 mb-2">Description:</p>
                                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{request.description}</p>
                                </div>
                              )}
                              
                              {request.reason && (
                                <div>
                                  <p className="text-sm font-medium text-gray-600 mb-2">Reason:</p>
                                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                                </div>
                              )}
                              
                              {(request.current_value || request.requested_value) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {request.current_value && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Current:</p>
                                      <p className="text-sm bg-gray-50 p-2 rounded">{request.current_value}</p>
                                    </div>
                                  )}
                                  {request.requested_value && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Requested:</p>
                                      <p className="text-sm bg-blue-50 p-2 rounded font-semibold text-primary">{request.requested_value}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Requested: {new Date(request.created_at).toLocaleString()}</span>
                                {request.reviewed_at && (
                                  <span>Reviewed: {new Date(request.reviewed_at).toLocaleString()}</span>
                                )}
                              </div>
                              
                              {request.admin_notes && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm font-medium text-blue-800 mb-1">Admin Notes:</p>
                                  <p className="text-sm text-blue-700">{request.admin_notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Pagination Controls */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>
                          Showing {((requestsPage - 1) * requestsPerPage) + 1} to {Math.min(requestsPage * requestsPerPage, approvalRequests.length)} of {approvalRequests.length} requests
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(requestsPage - 1)}
                          disabled={requestsPage === 1}
                          className="flex items-center gap-1"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={page === requestsPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-8 h-8 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(requestsPage + 1)}
                          disabled={requestsPage === getTotalPages()}
                          className="flex items-center gap-1"
                        >
                          Next
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="mt-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Notifications
                </h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="px-3 py-1">
                    Total: {notifications.length}
                  </Badge>
                  <Badge variant="default" className="px-3 py-1 bg-orange-500">
                    Unread: {unreadNotificationCount}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Notifications</h3>
                      <p className="text-gray-500">You don't have any notifications yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  notifications.map((notification) => (
                    <Card key={notification.id} className={`transition-all duration-200 hover:shadow-md ${
                      !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : 'border-l-4 border-l-gray-200'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <Badge variant="default" className="text-xs bg-blue-500">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(notification.created_at).toLocaleString()}</span>
                              {notification.type === 'classroom_approval_request' && (
                                <Badge variant="outline" className="text-xs">
                                  Classroom Request
                                </Badge>
                              )}
                              {notification.type === 'classroom_rejected' && (
                                <Badge variant="outline" className="text-xs">
                                  Classroom Rejected
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="text-xs"
                              >
                                Mark Read
                              </Button>
                            )}
                            {notification.type === 'classroom_approval_request' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setActiveTab('requests')}
                                className="text-xs"
                              >
                                View Requests
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quotes Tab */}
        <div style={{ display: activeTab === 'quotes' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Quote Management
            </h3>
            
            <div className="grid gap-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-primary">{quote.name}</h4>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {quote.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{new Date(quote.created_at).toLocaleDateString()}</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 mb-4">
                      <h5 className="font-semibold text-accent mb-2">Service: {quote.service_category}</h5>
                      <p className="text-muted-foreground">
                        Project Type: {quote.project_type || 'N/A'}, Event Date: {quote.event_date || 'N/A'}, Location: {quote.location || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">Budget: {quote.budget_range || 'N/A'}, Timeline: {quote.timeline || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Preferred Contact: {quote.preferred_contact_method}</p>
                      {quote.additional_notes && (
                        <p className="text-sm text-muted-foreground mt-2">Additional Notes: {quote.additional_notes}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">Status: {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}</Badge>
                      <div className="space-x-2">
                        {quote.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => openQuoteDialog(quote)}>Accept Quote</Button>
                            <Button size="sm" variant="destructive" onClick={() => openQuoteDialog(quote)}>Reject Quote</Button>
                          </>
                        )}
                        {quote.status === 'in_progress' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openQuoteDialog(quote)}>Mark as Completed</Button>
                            <Button size="sm" variant="destructive" onClick={() => openQuoteDialog(quote)}>Cancel Quote</Button>
                          </>
                        )}
                        {(quote.status === 'completed' || quote.status === 'cancelled') && (
                          <Button size="sm" variant="outline" onClick={() => openQuoteDialog(quote)}>View/Edit</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openInvoiceDialog(quote)}>Generate Invoice</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Quote Dialog */}
        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Quote</DialogTitle>
              <DialogDescription>Update the status and notes for this quote.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <label htmlFor="quoteStatus" className="font-semibold text-primary">Status:</label>
                <Select onValueChange={(value) => {
                  if (selectedQuote) {
                    setSelectedQuote(prev => ({ ...prev!, status: value as 'pending' | 'in_progress' | 'completed' | 'cancelled' }));
                  }
                }} value={selectedQuote?.status}>
                  <SelectTrigger id="quoteStatus" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="quoteAmount" className="font-semibold text-primary">Quote Amount:</label>
                <Input
                  id="quoteAmount"
                  type="number"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="Enter quote amount"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="adminNotes" className="font-semibold text-primary">Admin Notes:</label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter admin notes for this quote"
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (selectedQuote) {
                  try {
                    const { data: updatedQuote, error: updateError } = await supabase
                      .from('quotes')
                      .update({
                        status: selectedQuote.status,
                        quote_amount: quoteAmount ? parseFloat(quoteAmount) : null,
                        admin_notes: adminNotes,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', selectedQuote.id)
                      .select()
                      .single();

                    if (updateError) {
                      console.error("Error updating quote:", updateError);
                      toast({
                        title: "Error",
                        description: "Failed to update quote status.",
                        variant: "destructive",
                      });
                    } else if (updatedQuote) {
                      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? updatedQuote : q));
                      toast({
                        title: "Quote Updated",
                        description: `Quote status updated to ${selectedQuote.status}.`,
                      });
                      
                      // Send email if quote amount is provided
                      if (quoteAmount && parseFloat(quoteAmount) > 0) {
                        try {
                          const emailSent = await sendQuoteEmail(updatedQuote, parseFloat(quoteAmount), adminNotes);
                          if (emailSent) {
                            toast({
                              title: "Quote Email Sent",
                              description: "Quote has been sent to the customer via email.",
                            });
                          } else {
                            toast({
                              title: "Email Error",
                              description: "Quote updated but email could not be sent.",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          console.error("Error sending quote email:", error);
                          toast({
                            title: "Email Error",
                            description: "Quote updated but email could not be sent.",
                            variant: "destructive",
                          });
                        }
                      }
                    }
                  } catch (err) {
                    console.error("Error updating quote:", err);
                    toast({
                      title: "Error",
                      description: "Failed to update quote status.",
                      variant: "destructive",
                    });
                  }
                  setShowQuoteDialog(false);
                  setSelectedQuote(null);
                  setQuoteAmount("");
                  setAdminNotes("");
                }
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invoice Dialog */}
        <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Detailed Invoice</DialogTitle>
              <DialogDescription>Configure and generate a detailed invoice for this quote.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="invoiceSubtotal" className="font-semibold text-primary">Subtotal:</label>
                  <Input
                    id="invoiceSubtotal"
                    type="number"
                    value={invoiceDetails.subtotal}
                    onChange={(e) => updateLineItem(0, 'unitPrice', parseFloat(e.target.value))}
                    placeholder="Enter subtotal"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="invoiceTotal" className="font-semibold text-primary">Total:</label>
                  <Input
                    id="invoiceTotal"
                    type="number"
                    value={invoiceDetails.total}
                    onChange={(e) => updateLineItem(0, 'unitPrice', parseFloat(e.target.value))}
                    placeholder="Enter total amount"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="serviceBreakdown" className="font-semibold text-primary">Service Breakdown Details:</label>
                <Textarea
                  id="serviceBreakdown"
                  value={invoiceDetails.serviceBreakdown}
                  onChange={(e) => setInvoiceDetails(prev => ({ ...prev, serviceBreakdown: e.target.value }))}
                  placeholder="Describe the services included in this invoice..."
                  rows={3}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="equipmentBreakdown" className="font-semibold text-primary">Equipment Breakdown Details:</label>
                <Textarea
                  id="equipmentBreakdown"
                  value={invoiceDetails.equipmentBreakdown}
                  onChange={(e) => setInvoiceDetails(prev => ({ ...prev, equipmentBreakdown: e.target.value }))}
                  placeholder="List equipment and technical details included..."
                  rows={3}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="additionalInfo" className="font-semibold text-primary">Additional Information:</label>
                <Textarea
                  id="additionalInfo"
                  value={invoiceDetails.additionalInfo}
                  onChange={(e) => setInvoiceDetails(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Any additional notes, special requirements, or important information..."
                  rows={3}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="paymentTerms" className="font-semibold text-primary">Payment Terms:</label>
                  <Textarea
                    id="paymentTerms"
                    value={invoiceDetails.paymentTerms}
                    onChange={(e) => setInvoiceDetails(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="Enter payment terms"
                    rows={2}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="validUntil" className="font-semibold text-primary">Valid Until:</label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={invoiceDetails.validUntil}
                    onChange={(e) => setInvoiceDetails(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="font-semibold text-primary">Line Items:</label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                  {invoiceDetails.lineItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md mb-2">
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="flex-1 min-w-0"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                        placeholder="Qty"
                        className="w-20"
                      />
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value))}
                        placeholder="Price"
                        className="w-24"
                      />
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateLineItem(index, 'amount', parseFloat(e.target.value))}
                        placeholder="Amount"
                        className="w-24"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={addLineItem} className="w-full">Add Line Item</Button>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={calculateInvoiceTotals}>Calculate Totals</Button>
              <Button onClick={async () => {
                if (selectedQuote) {
                  try {
                    // Calculate periodStart from selectedQuote.created_at
                    let periodStart = '';
                    let periodEnd = '';
                    if (selectedQuote?.created_at) {
                      periodStart = selectedQuote.created_at.slice(0, 10);
                      const startDate = new Date(periodStart);
                      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                      periodEnd = endDate.toISOString().slice(0, 10);
                    }
                    // Calculate dueDate as 7th of the next month after periodEnd
                    let dueDate = '';
                    if (periodEnd) {
                      const periodEndDate = new Date(periodEnd);
                      const dueDateObj = new Date(Date.UTC(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 7));
                      dueDate = dueDateObj.toISOString().slice(0, 10);
                    }
                    const invoiceMeta = {
                      invoiceNumber: selectedQuote.id || '',
                      periodStart,
                      periodEnd,
                      dueDate,
                      paymentStatus: 'PENDING',
                      studentId: '',
                    };
                    const pdfBlob = await generateQuotePDF(selectedQuote, Number(quoteAmount), adminNotes, invoiceDetails, invoiceMeta);
                    const url = URL.createObjectURL(pdfBlob);
                    setInvoicePDFUrl(url);
                    // Send email with invoice PDF
                    const emailSent = await sendQuoteEmail(selectedQuote, Number(quoteAmount), adminNotes, invoiceDetails);
                    if (emailSent) {
                      toast({
                        title: "Invoice Generated & Sent",
                        description: `Invoice has been generated and sent to ${selectedQuote.email}`,
                      });
                    } else {
                      toast({
                        title: "Email Error",
                        description: "Invoice generated but email could not be sent.",
                        variant: "destructive",
                      });
                    }
                  } catch (err) {
                    console.error("Error generating or sending invoice:", err);
                    toast({
                      title: "Error",
                      description: "Failed to generate or send invoice.",
                      variant: "destructive",
                    });
                  }
                  setShowInvoiceDialog(false);
                  setSelectedQuote(null);
                  setQuoteAmount("");
                  setAdminNotes("");
                }
              }}>
                Generate & Send Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {invoicePDFUrl && (
          <a href={invoicePDFUrl} download={`invoice-${selectedQuote?.id}.pdf`} className="mt-2 inline-block text-blue-600 underline">Download Invoice PDF</a>
        )}

        {/* Gallery Tab */}
        <div style={{ display: activeTab === 'gallery' ? 'block' : 'none' }}>
          <AdminGalleryManager />
        </div>

        {/* Finances Tab */}
        <div style={{ display: activeTab === 'finances' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Financial Management
              </h3>
            </div>
            
            <Tabs defaultValue="invoices" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="fees">Fees & Pricing</TabsTrigger>
              </TabsList>
              <TabsContent value="invoices">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold">Invoice Management</h4>
                    {studentsNeedingInvoice.length > 0 && (
                      <Badge className="bg-red-500 text-white">{studentsNeedingInvoice.length} need invoice</Badge>
                    )}
                  </div>
                  <table className="min-w-full text-sm mb-6">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStudents.map(student => {
                        const { start, end } = getCurrentPeriod();
                        const inv = Object.values(studentInvoices).find(
                          (inv: any) => inv.student_id === student.id && inv.period_start === start && inv.period_end === end
                        );
                        return (
                          <tr key={student.id}>
                            <td>
                              <span
                                className="text-blue-700 underline cursor-pointer"
                                onClick={() => handleOpenInvoiceHistory(student)}
                                title="View all invoices for this student"
                              >
                                {student.student_name}
                              </span>
                            </td>
                            <td>{student.instrument || student.course_category}</td>
                            <td>{inv ? inv.status : <span className="text-red-500">Not Sent</span>}</td>
                            <td>{inv ? inv.due_date : '-'}</td>
                            <td className="flex gap-2">
                              {!inv ? (
                                <Button size="sm" variant="default" disabled={sendingInvoiceIds.includes(student.id)} onClick={() => handleSendInvoice(student)}>
                                  {sendingInvoiceIds.includes(student.id) ? 'Sending...' : 'Send Invoice'}
                                </Button>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleViewInvoice(inv)}>View</Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleOpenInvoiceHistory(student)}>
                                    View All Invoices
                                  </Button>
                                  {inv.pdf_url && (
                                    <Button size="sm" variant="outline" onClick={() => handleDownloadInvoicePDF(inv)}>
                                      Download PDF
                                    </Button>
                                  )}
                                  {inv.status !== 'paid' && (
                                    <Button 
                                      size="sm" 
                                      variant="default" 
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleMarkInvoicePaid(inv.id)}
                                    >
                                      Mark as Paid
                                    </Button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="fees">
                <div className="space-y-6">
                  <h4 className="text-xl font-semibold">Fees & Pricing Management</h4>
                  <AdminFeesManager />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Learning Mode Requests Tab - Removed */}

        {/* Learning Mode Request Review Modal - Removed */}

        {/* Debug Tab - REMOVE IN PRODUCTION */}
        <div style={{ display: activeTab === 'debug' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    🚨 <strong>DEBUG MODE:</strong> This tab is for testing only. Remove before production deployment.
                  </p>
                </div>
              </div>
            </div>
            <LearningModeDebugTest />
          </div>
        </div>

        <Dialog open={showExcuseModal} onOpenChange={setShowExcuseModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Excuse Period</DialogTitle></DialogHeader>
            <Textarea value={excuseReason} onChange={e => setExcuseReason(e.target.value)} placeholder="Reason for excusing this period..." />
            <DialogFooter>
              <Button onClick={submitExcuse}>Excuse</Button>
              <Button variant="outline" onClick={() => setShowExcuseModal(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input type="number" value={editInvoice?.amount_due || ''} onChange={e => setEditInvoice({ ...editInvoice, amount_due: parseFloat(e.target.value) })} placeholder="Amount Due" />
              <Input type="date" value={editInvoice?.due_date || ''} onChange={e => setEditInvoice({ ...editInvoice, due_date: e.target.value })} placeholder="Due Date" />
              <Select value={editInvoice?.status || ''} onValueChange={status => setEditInvoice({ ...editInvoice, status })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={submitEdit}>Save</Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Student Deletion</DialogTitle>
              <DialogDescription>Enter your password to confirm deletion of {studentToDelete?.student_name}.</DialogDescription>
            </DialogHeader>
            <Input type="password" placeholder="Admin Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
            {deleteError && <p className="text-red-500 text-sm mt-2">{deleteError}</p>}
            <DialogFooter>
              <Button variant="destructive" onClick={async () => {
                setDeleteError('');
                // Call a verify password endpoint or function (implement as needed)
                const isValid = await verifyAdminPassword(adminPassword); // You need to implement this
                if (!isValid) {
                  setDeleteError('Incorrect password.');
                  return;
                }
                // Proceed to delete student
                await deleteStudent(studentToDelete.id);
                setShowDeleteModal(false);
                setAdminPassword('');
                setStudentToDelete(null);
              }}>Delete</Button>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showInvoiceHistoryModal} onOpenChange={setShowInvoiceHistoryModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice History for {invoiceHistoryStudent?.student_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <table className="min-w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>PDF</th>
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceHistory.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.period_start} - {inv.period_end}</td>
                      <td>{inv.status}</td>
                      <td>KES {inv.amount_due?.toLocaleString()}</td>
                      <td>{inv.due_date}</td>
                      <td>
                        {inv.pdf_url ? (
                          <Button size="sm" variant="outline" onClick={() => handleDownloadInvoicePDF(inv)}>Download PDF</Button>
                        ) : (
                          <span className="text-gray-400">No PDF</span>
                        )}
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => handleViewHistoryInvoice(inv)}>View</Button>
                      </td>
                      <td>
                        {inv.status !== 'paid' && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleMarkInvoicePaid(inv.id)}
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedHistoryInvoice && (
                <div className="p-4 border rounded bg-gray-50">
                  <h4 className="font-semibold mb-2">Invoice Details</h4>
                  <div><b>Period:</b> {selectedHistoryInvoice.period_start} - {selectedHistoryInvoice.period_end}</div>
                  <div><b>Status:</b> {selectedHistoryInvoice.status}</div>
                  <div><b>Amount:</b> KES {selectedHistoryInvoice.amount_due?.toLocaleString()}</div>
                  <div><b>Due Date:</b> {selectedHistoryInvoice.due_date}</div>
                  <div><b>Notes:</b> {selectedHistoryInvoice.notes || '-'}</div>
                  <div className="mt-2">
                    {selectedHistoryInvoice.pdf_url && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadInvoicePDF(selectedHistoryInvoice)}>Download PDF</Button>
                    )}
                    {selectedHistoryInvoice.status !== 'paid' && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 text-white ml-2"
                        onClick={() => handleMarkInvoicePaid(selectedHistoryInvoice.id)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Classroom Modal */}
        <Dialog open={showDeleteClassroomModal} onOpenChange={setShowDeleteClassroomModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Classroom</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the classroom "{classroomToDelete?.name}"? This action cannot be undone and will remove:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>All classroom posts and comments</li>
                  <li>All student enrollments</li>
                  <li>The classroom itself</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delete-classroom-password">Admin Password</Label>
                <Input
                  id="delete-classroom-password"
                  type="password"
                  value={deleteClassroomPassword}
                  onChange={(e) => setDeleteClassroomPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="mt-1"
                />
              </div>
              {deleteClassroomError && <p className="text-red-500 text-sm">{deleteClassroomError}</p>}
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={async () => {
                setDeleteClassroomError('');
                // Verify admin password
                const isValid = await verifyAdminPassword(deleteClassroomPassword);
                if (!isValid) {
                  setDeleteClassroomError('Incorrect password.');
                  return;
                }
                // Proceed to delete classroom
                await handleDeleteClassroom(classroomToDelete.id);
              }}>Delete Classroom</Button>
              <Button variant="outline" onClick={() => {
                setShowDeleteClassroomModal(false);
                setClassroomToDelete(null);
                setDeleteClassroomPassword('');
                setDeleteClassroomError('');
              }}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default AdminPanel;