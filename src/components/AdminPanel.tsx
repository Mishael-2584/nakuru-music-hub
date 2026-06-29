import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music, LogOut, Guitar, Piano, Mic, Clock, BookOpen, Star, Shield, UserCog, Eye, Newspaper, Palette, ChevronDown, ChevronUp, GraduationCap, Quote, MapPin, DollarSign, FileText, CheckCircle, ArrowRight, ArrowLeft, X, Image, MessageSquare, Settings, Gift, Globe, RefreshCw, Lock, Unlock, Ban } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import AdminEventsManager from "@/components/AdminEventsManager";
import AdminNewsManager from "@/components/AdminNewsManager";
import AdminGalleryManager from "@/components/AdminGalleryManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendAcceptedEmail, sendDeclinedEmail, sendTeacherAcceptedEmail, sendTeacherDeclinedEmail, sendTeacherRequestInfoEmail, sendQuoteEmail, sendInvoiceEmail, sendApplicationConfirmationEmail, sendPaymentConfirmationEmail, sendPartialPaymentConfirmationEmail } from "@/lib/emailService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import AdminFeesManager from './AdminFeesManager';
import { clearAuthCache, clearAndRedirect } from '@/lib/cacheUtils';
import { generateInvoiceForRegistration, generateInvoicePDFBlob, ensureInvoicePDF, openInvoicePdfWithName, openInvoicePdfPreview, getCalendarMonthPeriod, findInvoiceForFinancePeriod, findInvoiceForCalendarMonth, resolveFinanceInvoiceForStudent, getEffectiveAmountDue, getInvoiceAmountPaid, getInvoiceBalanceRemaining, isInvoiceFullyPaid, fetchInvoicePayments, filterInvoicesUpToCurrentMonth, filterInvoicesForAdminHistory, isHiddenBillingPeriod, isInvoiceNotDue, resolveInvoiceAfterGeneration, previewFutureInvoices, voidFutureInvoices, fetchStudentInvoiceForPreview, getLatestBillableInvoiceForStudent, canSendInvoiceEmail, studentNeedsCurrentMonthInvoice, formatInvoiceBillingMonth, ADMIN_BILLING_VISIBILITY, isWithinNextMonthBillingPreviewWindow, getNextCalendarMonthReference, generateUpcomingPeriodInvoices, studentEligibleForUpcomingInvoiceGeneration, formatNextBillingMonthLabel, type BulkUpcomingInvoiceGenerationResult, type FutureInvoicePreviewRow, type RecordInvoicePaymentResult } from "@/lib/invoiceUtils";
import MessagingUI from './MessagingUI';
import { getLanguagePathwayLabel, getLanguagePackageLabel, formatLanguageMonthlyPrice } from '@/lib/languageCourseUtils';
import { isTermlyCourseCategory } from '@/lib/termlyFeeUtils';
import FeeDebug from './FeeDebug';
import ShopProductManager from './admin/ShopProductManager';
import ShopOrderManager from './admin/ShopOrderManager';
import ManualInvoiceManager from './admin/ManualInvoiceManager';
import RecordInvoicePaymentDialog from './admin/RecordInvoicePaymentDialog';
import { InvoicePaymentsPanel } from './admin/InvoicePaymentsPanel';
import { InvoicePaymentsDialog } from './admin/InvoicePaymentsDialog';
import { downloadPaymentReceiptPDF } from '@/lib/paymentReceiptUtils';
import StudentAccountControl from './admin/StudentAccountControl';
import PendingTeacherApplicationCard from './admin/PendingTeacherApplicationCard';
import ApprovedTeacherCard from './admin/ApprovedTeacherCard';
import { recoverTeacherDocumentsFromStorage } from '@/lib/teacherDocuments';
import { Checkbox } from "@/components/ui/checkbox";

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
  technology_type?: string;
  language_type?: string;
  language_pathway?: string;
  language_package?: string;
  experience: string;
  proficiency_level: string;
  learning_mode: string;
  home_lesson_duration?: string | null;
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
  term_period?: string;
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
  const [activeTab, setActiveTab] = useState<'stats' | 'registrations' | 'messages' | 'students' | 'schedule' | 'events' | 'admins' | 'teachers' | 'quotes' | 'gallery' | 'finances' | 'shop' | 'requests' | 'notifications' | 'debug' | 'trials'>('stats');
  const [teachersSubTab, setTeachersSubTab] = useState<'pending' | 'approved' | 'classrooms' | 'approved-classrooms'>('pending');
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
  const [pendingTeacherDocuments, setPendingTeacherDocuments] = useState<any[]>([]);
  const [teacherDocuments, setTeacherDocuments] = useState<any[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [recoveringTeacherId, setRecoveringTeacherId] = useState<string | null>(null);
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
  const [allStudentInvoices, setAllStudentInvoices] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [teacherChangeRequests, setTeacherChangeRequests] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState<Registration[]>([]);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showBulkSuspendDialog, setShowBulkSuspendDialog] = useState(false);
  const [bulkSuspensionReason, setBulkSuspensionReason] = useState('');
  const [bulkStudentActionLoading, setBulkStudentActionLoading] = useState(false);
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [financesSearchTerm, setFinancesSearchTerm] = useState("");
  const [financesPage, setFinancesPage] = useState(1);
  const [financesPerPage] = useState(15);

  // Exchange rate override (USD -> KES) for invoices involving online/global ($)
  const [usdToKesRateDraft, setUsdToKesRateDraft] = useState<string>("");
  const [usdToKesRateLoading, setUsdToKesRateLoading] = useState(false);
  const [usdToKesRateSaving, setUsdToKesRateSaving] = useState(false);
  const [quotesSearchTerm, setQuotesSearchTerm] = useState("");
  const [quotesPage, setQuotesPage] = useState(1);
  const [quotesPerPage] = useState(10);
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const [registrationsPerPage] = useState(10);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsPerPage] = useState(15);
  const [trialsSearchTerm, setTrialsSearchTerm] = useState("");
  const [trialsPage, setTrialsPage] = useState(1);
  const [trialsPerPage] = useState(10);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [trialBookings, setTrialBookings] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // Trial booking management state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedTrialBooking, setSelectedTrialBooking] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    teacherId: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: ''
  });
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  // 1. Add state for tracking invoice sending/loading
  const [sendingInvoiceIds, setSendingInvoiceIds] = useState<string[]>([]);
  const [studentsNeedingInvoice, setStudentsNeedingInvoice] = useState<string[]>([]);
  // Add state for invoice history modal
  const [showInvoiceHistoryModal, setShowInvoiceHistoryModal] = useState(false);
  const [paymentDialogInvoice, setPaymentDialogInvoice] = useState<any>(null);
  const [paymentDialogStudent, setPaymentDialogStudent] = useState<any>(null);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [hiddenHistoryInvoiceCount, setHiddenHistoryInvoiceCount] = useState(0);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [showInvoicePaymentsDialog, setShowInvoicePaymentsDialog] = useState(false);
  const [paymentsDialogInvoice, setPaymentsDialogInvoice] = useState<any>(null);
  const [paymentsDialogStudent, setPaymentsDialogStudent] = useState<any>(null);
  const [invoicePaymentsRefreshKey, setInvoicePaymentsRefreshKey] = useState(0);
  const [futureInvoicePreview, setFutureInvoicePreview] = useState<FutureInvoicePreviewRow[]>([]);
  const [futureInvoiceCleanupLoading, setFutureInvoiceCleanupLoading] = useState(false);
  const [invoiceHistoryStudent, setInvoiceHistoryStudent] = useState<any>(null);
  const [generatingPdfInvoiceId, setGeneratingPdfInvoiceId] = useState<string | null>(null);
  const [generatingAllPdfs, setGeneratingAllPdfs] = useState(false);
  const [bulkGeneratingUpcomingInvoices, setBulkGeneratingUpcomingInvoices] = useState(false);
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState<any>(null);

  // Portal messaging state
  const [showPortalMessageModal, setShowPortalMessageModal] = useState(false);
  const [newPortalMessage, setNewPortalMessage] = useState({
    subject: '',
    message: '',
    recipient_ids: [] as string[]
  });
  const [selectedMessageRecipients, setSelectedMessageRecipients] = useState<any[]>([]);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
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

  // Finances: filter and paginate activeStudents
  const filteredFinancesStudents = useMemo(() => {
    if (!financesSearchTerm.trim()) return activeStudents;
    const q = financesSearchTerm.toLowerCase();
    return activeStudents.filter(
      (s) =>
        (s.student_name && s.student_name.toLowerCase().includes(q)) ||
        (s.instrument && s.instrument.toLowerCase().includes(q)) ||
        (s.course_category && s.course_category.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [activeStudents, financesSearchTerm]);
  const financesTotalPages = Math.max(1, Math.ceil(filteredFinancesStudents.length / financesPerPage));
  const paginatedFinancesStudents = useMemo(() => {
    const start = (financesPage - 1) * financesPerPage;
    return filteredFinancesStudents.slice(start, start + financesPerPage);
  }, [filteredFinancesStudents, financesPage, financesPerPage]);

  // Quotes: filter and paginate
  const filteredQuotes = useMemo(() => {
    if (!quotesSearchTerm.trim()) return quotes;
    const q = quotesSearchTerm.toLowerCase();
    return quotes.filter(
      (quote) =>
        (quote.name && quote.name.toLowerCase().includes(q)) ||
        (quote.email && quote.email.toLowerCase().includes(q)) ||
        (quote.service_category && quote.service_category.toLowerCase().includes(q)) ||
        (quote.status && quote.status.toLowerCase().includes(q)) ||
        (quote.project_type && quote.project_type.toLowerCase().includes(q))
    );
  }, [quotes, quotesSearchTerm]);
  const quotesTotalPages = Math.max(1, Math.ceil(filteredQuotes.length / quotesPerPage));
  const paginatedQuotes = useMemo(() => {
    const start = (quotesPage - 1) * quotesPerPage;
    return filteredQuotes.slice(start, start + quotesPerPage);
  }, [filteredQuotes, quotesPage, quotesPerPage]);

  // Registrations: paginate (search already in filteredRegistrations)
  const registrationsTotalPages = Math.max(1, Math.ceil(filteredRegistrations.length / registrationsPerPage));
  const paginatedRegistrations = useMemo(() => {
    const start = (registrationsPage - 1) * registrationsPerPage;
    return filteredRegistrations.slice(start, start + registrationsPerPage);
  }, [filteredRegistrations, registrationsPage, registrationsPerPage]);

  // Students: filter (existing) then paginate
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return activeStudents;
    const q = searchTerm.toLowerCase();
    return activeStudents.filter(
      (s) =>
        (s.student_name && s.student_name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.instrument && s.instrument.toLowerCase().includes(q))
    );
  }, [activeStudents, searchTerm]);
  const studentsTotalPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (studentsPage - 1) * studentsPerPage;
    return filteredStudents.slice(start, start + studentsPerPage);
  }, [filteredStudents, studentsPage, studentsPerPage]);

  const allStudentsOnPageSelected =
    paginatedStudents.length > 0 &&
    paginatedStudents.every((student) => selectedStudentIds.has(student.id));

  const selectedStudents = useMemo(
    () => activeStudents.filter((student) => selectedStudentIds.has(student.id)),
    [activeStudents, selectedStudentIds]
  );

  // Trials: filter and paginate
  const filteredTrials = useMemo(() => {
    if (!trialsSearchTerm.trim()) return trialBookings;
    const q = trialsSearchTerm.toLowerCase();
    return trialBookings.filter(
      (t) =>
        (t.student_name && t.student_name.toLowerCase().includes(q)) ||
        (t.parent_name && t.parent_name.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q)) ||
        (t.instrument && t.instrument.toLowerCase().includes(q)) ||
        (t.status && t.status.toLowerCase().includes(q))
    );
  }, [trialBookings, trialsSearchTerm]);
  const trialsTotalPages = Math.max(1, Math.ceil(filteredTrials.length / trialsPerPage));
  const paginatedTrials = useMemo(() => {
    const start = (trialsPage - 1) * trialsPerPage;
    return filteredTrials.slice(start, start + trialsPerPage);
  }, [filteredTrials, trialsPage, trialsPerPage]);

  // Reset page to 1 when search term changes (per-tab)
  useEffect(() => {
    setFinancesPage(1);
  }, [financesSearchTerm]);
  useEffect(() => {
    setQuotesPage(1);
  }, [quotesSearchTerm]);
  useEffect(() => {
    setRegistrationsPage(1);
  }, [searchTerm]);
  useEffect(() => {
    setStudentsPage(1);
  }, [searchTerm]);
  useEffect(() => {
    setTrialsPage(1);
  }, [trialsSearchTerm]);

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

  // Load the admin-configured USD -> KES exchange rate when opening Finances
  useEffect(() => {
    if (!user) return;
    if (activeTab !== 'finances') return;

    (async () => {
      setUsdToKesRateLoading(true);
      try {
        const { data, error } = await supabase
          .from('exchange_rate_settings')
          .select('rate')
          .eq('from_currency', 'USD')
          .eq('to_currency', 'KES')
          .maybeSingle();

        if (error) throw error;
        const rate = data?.rate;
        if (rate != null) setUsdToKesRateDraft(String(rate));
      } catch (e) {
        console.error('Failed to load USD->KES rate:', e);
        toast({ title: 'Error', description: 'Failed to load exchange rate.', variant: 'destructive' });
      } finally {
        setUsdToKesRateLoading(false);
      }
    })();
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== 'finances') return;
    void (async () => {
      try {
        const rows = await previewFutureInvoices();
        setFutureInvoicePreview(rows);
      } catch (error) {
        console.error('Failed to preview future invoices:', error);
        setFutureInvoicePreview([]);
      }
    })();
  }, [activeTab, allStudentInvoices]);

  const handleVoidFutureInvoices = async () => {
    const voidable = futureInvoicePreview.filter((row) => row.can_void);
    if (voidable.length === 0) {
      toast({
        title: 'Nothing to clean up',
        description: 'No voidable future-month invoices were found.',
      });
      return;
    }

    const confirmed = window.confirm(
      `Void ${voidable.length} future-month invoice${voidable.length === 1 ? '' : 's'}?\n\n` +
        'Paid invoices or invoices with recorded payments will be skipped.\n' +
        'This cannot be undone from the UI.'
    );
    if (!confirmed) return;

    setFutureInvoiceCleanupLoading(true);
    try {
      const result = await voidFutureInvoices({ dryRun: false });
      const voided = result.voided_count ?? 0;
      const skipped = result.skipped_count ?? 0;
      toast({
        title: 'Future invoices voided',
        description: `Voided ${voided} invoice${voided === 1 ? '' : 's'}` +
          (skipped > 0 ? ` · skipped ${skipped} (paid or has payments)` : ''),
      });
      const rows = await previewFutureInvoices();
      setFutureInvoicePreview(rows);
      await refreshStudentInvoices();
    } catch (error: any) {
      console.error('Failed to void future invoices:', error);
      toast({
        title: 'Cleanup failed',
        description: error?.message || 'Could not void future invoices.',
        variant: 'destructive',
      });
    } finally {
      setFutureInvoiceCleanupLoading(false);
    }
  };

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
        
        // Sort by status (pending first), then by created_at (newest first)
        const sortedData = flattenedData.sort((a, b) => {
          // First sort by status: pending comes first
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          
          // If both have same status, sort by created_at (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setApprovalRequests(sortedData);
      }

      // Fetch teacher profile change requests
      console.log("AdminPanel: Fetching teacher change requests...");
      const { data: teacherChangeRequestsData, error: teacherChangeRequestsError } = await supabase
        .from('teacher_profile_change_requests')
        .select(`
          *,
          teachers!inner(name, email)
        `)
        .order('created_at', { ascending: false });

      if (teacherChangeRequestsError) {
        console.error("Error fetching teacher change requests:", teacherChangeRequestsError);
        toast({
          title: "Error",
          description: "Failed to load teacher change requests: " + teacherChangeRequestsError.message,
          variant: "destructive",
        });
      } else {
        console.log("AdminPanel: Teacher change requests fetched successfully:", teacherChangeRequestsData?.length || 0, "records");
        // Flatten the data to include teacher info
        const flattenedTeacherData = teacherChangeRequestsData?.map(request => ({
          ...request,
          teacher_name: request.teachers?.name || 'Unknown',
          email: request.teachers?.email || 'Unknown'
        })) || [];
        
        // Sort by status (pending first), then by created_at (newest first)
        const sortedTeacherData = flattenedTeacherData.sort((a, b) => {
          // First sort by status: pending comes first
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          
          // If both have same status, sort by created_at (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setTeacherChangeRequests(sortedTeacherData);
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
    
    // Fetch notifications, trial bookings, and teachers after main data is loaded
    await fetchNotifications();
    await fetchTrialBookings();
    await fetchAvailableTeachers();
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // First, get the request details to see what type of request it is
      const { data: request, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        toast({
          title: 'Error',
          description: 'Failed to fetch request details',
          variant: 'destructive',
        });
        return;
      }

      // Handle different request types
      if (request.request_type === 'profile_update') {
        // Update the student's profile with the requested changes
        const updateData: any = {};
        if (request.requested_value) {
          // Parse the requested value (it might be JSON for complex updates)
          try {
            const requestedValue = JSON.parse(request.requested_value);
            if (requestedValue.instrument) updateData.instrument = requestedValue.instrument;
            if (requestedValue.name) updateData.student_name = requestedValue.name;
            // Add other fields as needed
          } catch (e) {
            // If it's not JSON, treat it as a simple string value
            if (request.title.includes('instrument')) {
              updateData.instrument = request.requested_value;
            } else if (request.title.includes('name')) {
              updateData.student_name = request.requested_value;
            }
          }
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('students')
            .update(updateData)
            .eq('id', request.student_id);

          if (updateError) {
            console.error('Error updating student profile:', updateError);
            toast({
              title: 'Error',
              description: 'Failed to update student profile',
              variant: 'destructive',
            });
            return;
          }
        }
      } else if (request.request_type === 'learning_mode_change') {
        // Update the student's learning mode
        const { error: updateError } = await supabase
          .from('students')
          .update({ learning_mode: request.requested_value })
          .eq('id', request.student_id);

        if (updateError) {
          console.error('Error updating learning mode:', updateError);
          toast({
            title: 'Error',
            description: 'Failed to update learning mode',
            variant: 'destructive',
          });
          return;
        }
      }

      // Mark the request as approved
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
        description: 'Request approved and changes applied successfully',
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

  const handleApproveTeacherChange = async (requestId: string) => {
    try {
      // Get the change request details
      const { data: request, error: fetchError } = await supabase
        .from('teacher_profile_change_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        toast({
          title: 'Error',
          description: 'Failed to fetch request details',
          variant: 'destructive',
        });
        return;
      }

      // Update the teacher's profile with the proposed changes
      const updateData: any = {};
      if (request.proposed_name) updateData.name = request.proposed_name;
      if (request.proposed_phone) updateData.phone = request.proposed_phone;
      if (request.proposed_bio) updateData.bio = request.proposed_bio;
      if (request.proposed_experience) updateData.experience = request.proposed_experience;

      console.log('Updating teacher profile with data:', updateData);
      console.log('Teacher ID:', request.teacher_id);

      const { error: updateError } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', request.teacher_id);

      if (updateError) {
        console.error('Error updating teacher profile:', updateError);
        toast({
          title: 'Error',
          description: 'Failed to update teacher profile',
          variant: 'destructive',
        });
        return;
      }

      // Mark the request as approved
      const { error: approveError } = await supabase
        .from('teacher_profile_change_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: 'Profile changes approved'
        })
        .eq('id', requestId);

      if (approveError) {
        console.error('Error approving teacher change request:', approveError);
        toast({
          title: 'Error',
          description: 'Failed to approve request',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Teacher profile changes approved and applied',
      });

      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error approving teacher change request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectTeacherChange = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('teacher_profile_change_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: 'Profile changes rejected'
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting teacher change request:', error);
        toast({
          title: 'Error',
          description: 'Failed to reject request',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Teacher profile change request rejected',
      });

      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error rejecting teacher change request:', error);
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
  const getAllRequests = () => {
    // Combine student approval requests and teacher change requests
    const studentRequests = approvalRequests.map(req => ({
      ...req,
      request_source: 'student',
      requester_name: req.student_name,
      requester_email: req.email
    }));
    
    const teacherRequests = teacherChangeRequests.map(req => ({
      ...req,
      request_source: 'teacher',
      requester_name: req.teacher_name,
      requester_email: req.email,
      request_type: 'profile_update',
      title: 'Teacher Profile Update',
      description: 'Profile information change request'
    }));
    
    // Combine and sort by status (pending first), then by created_at (newest first)
    const allRequests = [...studentRequests, ...teacherRequests].sort((a, b) => {
      // First sort by status: pending comes first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      // If both have same status, sort by created_at (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return allRequests;
  };

  const getPaginatedRequests = () => {
    const startIndex = (requestsPage - 1) * requestsPerPage;
    const endIndex = startIndex + requestsPerPage;
    return getAllRequests().slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getAllRequests().length / requestsPerPage);
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

  // Fetch trial bookings
  const fetchTrialBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('trial_bookings')
        .select(`
          *,
          teachers:assigned_teacher_id (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trial bookings:', error);
        return;
      }

      setTrialBookings(data || []);
    } catch (error) {
      console.error('Error fetching trial bookings:', error);
    }
  };

  // Fetch available teachers for trial booking assignment
  const fetchAvailableTeachers = async () => {
    try {
      console.log('🔍 Fetching available teachers for trial booking...');
      
      // First try to get approved teachers
      let { data, error } = await supabase
        .from('teachers')
        .select('id, name, email, subjects, user_id, status')
        .eq('status', 'approved')
        .order('name');

      // If no approved teachers found, get all teachers for debugging
      if (!error && (!data || data.length === 0)) {
        console.log('⚠️ No approved teachers found, fetching all teachers...');
        const { data: allTeachers, error: allError } = await supabase
          .from('teachers')
          .select('id, name, email, subjects, user_id, status')
          .order('name');
        
        if (!allError) {
          data = allTeachers;
          console.log('📊 All teachers found:', data);
        }
      }

      if (error) {
        console.error('❌ Error fetching teachers:', error);
        toast({
          title: "Error",
          description: "Failed to load teachers for trial booking.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Fetched teachers for trial booking:', data);
      console.log('📊 Number of teachers found:', data?.length || 0);
      setAvailableTeachers(data || []);
    } catch (error) {
      console.error('❌ Exception fetching teachers:', error);
      toast({
        title: "Error",
        description: "Failed to load teachers for trial booking.",
        variant: "destructive",
      });
    }
  };

  // Schedule trial booking with teacher
  const scheduleTrialBooking = async () => {
    if (!selectedTrialBooking || !scheduleData.teacherId || !scheduleData.scheduledDate || !scheduleData.scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const scheduledDateTime = new Date(`${scheduleData.scheduledDate}T${scheduleData.scheduledTime}`);
      const teacher = availableTeachers.find(t => t.id === scheduleData.teacherId);
      
      if (!teacher) {
        toast({
          title: "Teacher Not Found",
          description: "Selected teacher not found.",
          variant: "destructive",
        });
        return;
      }

      // Create public instant meeting for the trial class (or simple URL if teacher has no user_id)
      console.log('🎥 Creating instant meeting for trial class...');
      console.log('👨‍🏫 Teacher details:', { id: teacher.id, name: teacher.name, user_id: teacher.user_id });
      
      const { createInstantMeeting, createSimpleTrialMeeting } = await import('@/lib/videoConferencing');
      const meetingTitle = `Trial Class: ${selectedTrialBooking.instrument} with ${teacher.name}`;

      let trialParticipantIds: string[] = [];
      const trialEmail = selectedTrialBooking.email?.trim();
      if (trialEmail) {
        const { data: trialStudentProfile } = await supabase
          .from('profiles')
          .select('id')
          .ilike('email', trialEmail)
          .maybeSingle();
        if (trialStudentProfile?.id) {
          trialParticipantIds = [trialStudentProfile.id];
        }
      }
      
      let meeting: {
        meetingUrl: string;
        meetingCode: string;
        meetingHostUrl?: string;
        zoomMeetingId?: string;
      };

      if (teacher.user_id) {
        const meetingData = {
          title: meetingTitle,
          description: `Trial class for ${selectedTrialBooking.student_name} - ${selectedTrialBooking.instrument}`,
          hostId: teacher.user_id,
          hostName: teacher.name,
          hostRole: 'teacher' as const,
          participants: trialParticipantIds,
          duration: 60,
          maxParticipants: 20,
          isPublic: false,
          allowRecording: false,
          scheduledStartTime: scheduledDateTime.toISOString()
        };
        const created = await createInstantMeeting(meetingData);
        meeting = {
          meetingUrl: created.meetingUrl,
          meetingCode: created.meetingCode,
          meetingHostUrl: created.meetingHostUrl,
          zoomMeetingId: created.zoomMeetingId,
        };
      } else {
        meeting = await createSimpleTrialMeeting(
          teacher.name,
          meetingTitle,
          scheduledDateTime.toISOString()
        );
        console.log('✅ Simple trial Zoom meeting created (teacher has no user_id)');
      }
      
      console.log('✅ Meeting created successfully:', meeting);

      // Update trial booking with meeting details
      const { error: updateError } = await supabase
        .from('trial_bookings')
        .update({
          assigned_teacher_id: scheduleData.teacherId,
          scheduled_datetime: scheduledDateTime.toISOString(),
          notes: scheduleData.notes,
          status: 'scheduled',
          meeting_url: meeting.meetingUrl,
          meeting_code: meeting.meetingCode,
          meeting_host_url: meeting.meetingHostUrl ?? null,
          zoom_meeting_id: meeting.zoomMeetingId ?? null,
        })
        .eq('id', selectedTrialBooking.id);

      if (updateError) {
        console.error('Error updating trial booking:', updateError);
        throw updateError;
      }

      // Send notification to assigned teacher (only if teacher has user_id)
      if (teacher.user_id) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: teacher.user_id,
            title: 'New Trial Class Assignment',
            message: `You have been assigned a trial class with ${selectedTrialBooking.student_name} for ${selectedTrialBooking.instrument} on ${scheduledDateTime.toLocaleDateString()} at ${scheduledDateTime.toLocaleTimeString()}`,
            notification_type: 'trial_assignment',
            data: {
              trial_booking_id: selectedTrialBooking.id,
              student_name: selectedTrialBooking.student_name,
              instrument: selectedTrialBooking.instrument,
              scheduled_datetime: scheduledDateTime.toISOString(),
              meeting_url: meeting.meetingUrl,
              meeting_code: meeting.meetingCode,
              meeting_host_url: meeting.meetingHostUrl,
            },
            is_read: false
          });

        if (notificationError) {
          console.error('Error creating teacher notification:', notificationError);
        }
      }

      // Send email to student with meeting details (best-effort; scheduling succeeds either way)
      const emailSent = await sendTrialClassEmail(selectedTrialBooking, teacher, scheduledDateTime, meeting);

      toast({
        title: "Trial Class Scheduled Successfully! 🎉",
        description: emailSent
          ? `Trial class scheduled with ${teacher.name} for ${scheduledDateTime.toLocaleDateString()}. Meeting link sent to student.`
          : `Trial class scheduled with ${teacher.name} for ${scheduledDateTime.toLocaleDateString()}. Confirmation email could not be sent—please share the meeting link with the student manually.`,
        duration: 5000,
      });

      // Reset form and close modal
      setScheduleData({
        teacherId: '',
        scheduledDate: '',
        scheduledTime: '',
        notes: ''
      });
      setShowScheduleModal(false);
      setSelectedTrialBooking(null);

      // Refresh trial bookings
      await fetchTrialBookings();

    } catch (error) {
      console.error('Error scheduling trial booking:', error);
      toast({
        title: "Scheduling Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Update trial booking status
  const updateTrialBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('trial_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating trial booking status:', error);
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Trial booking status updated to ${newStatus}`,
      });

      // Refresh trial bookings
      await fetchTrialBookings();

    } catch (error) {
      console.error('Error updating trial booking status:', error);
      toast({
        title: "Update Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add notes to trial booking
  const addNotesToTrialBooking = async () => {
    if (!selectedTrialBooking || !scheduleData.notes) {
      toast({
        title: "Missing Notes",
        description: "Please enter some notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('trial_bookings')
        .update({ notes: scheduleData.notes })
        .eq('id', selectedTrialBooking.id);

      if (error) {
        console.error('Error adding notes:', error);
        throw error;
      }

      toast({
        title: "Notes Added",
        description: "Notes have been added to the trial booking.",
      });

      // Reset form and close modal
      setScheduleData(prev => ({ ...prev, notes: '' }));
      setShowNotesModal(false);
      setSelectedTrialBooking(null);

      // Refresh trial bookings
      await fetchTrialBookings();

    } catch (error) {
      console.error('Error adding notes:', error);
      toast({
        title: "Failed to Add Notes",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Send trial class email to student
  const sendTrialClassEmail = async (booking: any, teacher: any, scheduledDateTime: Date, meeting: any) => {
    try {
      const siteUrl = 'https://damonmusicacademy.co.ke';
      const logoUrl = `${siteUrl}/damon-logo.png`;

      const emailHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Trial Class Scheduled - Damon Music Academy</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .meeting-card {
              background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
              padding: 25px;
              border-radius: 10px;
              margin: 25px 0;
              border-left: 4px solid #28a745;
            }
            .meeting-link {
              background: #007bff;
              color: white;
              padding: 15px 30px;
              border-radius: 8px;
              text-decoration: none;
              display: inline-block;
              margin: 15px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .meeting-code {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border: 2px dashed #007bff;
              text-align: center;
              margin: 15px 0;
            }
            .teacher-info {
              background: #e3f2fd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #2196f3;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
            <h1>🎵 Damon Music Academy</h1>
            <h2>Your Trial Class is Scheduled!</h2>
          </div>
          
          <div class="content">
            <h3>Hello ${booking.student_name}!</h3>
            <p>Great news! Your trial class has been scheduled and we're excited to meet you.</p>
            
            <div class="meeting-card">
              <h3>📅 Trial Class Details</h3>
              <p><strong>Subject:</strong> ${booking.instrument}</p>
              <p><strong>Date:</strong> ${scheduledDateTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Time:</strong> ${scheduledDateTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
              <p><strong>Duration:</strong> 60 minutes</p>
            </div>

            <div class="teacher-info">
              <h3>👨‍🏫 Your Teacher</h3>
              <p><strong>Name:</strong> ${teacher.name}</p>
              <p><strong>Email:</strong> ${teacher.email}</p>
            </div>

            <div class="meeting-card">
              <h3>🎥 Join Your Trial Class</h3>
              <p>Click the button below to join your trial class. No login required!</p>
              <a href="${meeting.meetingUrl}" class="meeting-link">
                🚀 Join Trial Class Now
              </a>
              
              <div class="meeting-code">
                <p><strong>Meeting Code:</strong></p>
                <p style="font-size: 24px; font-weight: bold; color: #007bff; margin: 10px 0;">${meeting.meetingCode}</p>
                <p style="font-size: 12px; color: #666;">Use this code if you have trouble with the link above</p>
              </div>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>📋 What to Expect</h3>
              <ul>
                <li>Introduction to your chosen instrument/subject</li>
                <li>Assessment of your current skill level</li>
                <li>Discussion of your learning goals</li>
                <li>Overview of our teaching methods</li>
                <li>Q&A about our programs and pricing</li>
              </ul>
            </div>

            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3>⚠️ Important Notes</h3>
              <ul>
                <li>Please join 5 minutes before the scheduled time</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Use headphones for better audio quality</li>
                <li>Have your instrument ready if applicable</li>
                <li>If you need to reschedule, contact us at least 24 hours in advance</li>
              </ul>
            </div>

            <div class="footer">
              <p>We're excited to help you start your musical journey!</p>
              <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
              <p>📱 +254 701 195 460 | 📧 info@damonmusicacademy.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          to: booking.email,
          subject: `Your Trial Class is Scheduled - ${booking.instrument} | Damon Music Academy`,
          html: emailHTML
        }
      });

      if (error) {
        console.error('Error sending trial class email:', error);
        return false;
      }

      console.log('Trial class email sent successfully');
      return true;

    } catch (error) {
      console.error('Error sending trial class email:', error);
      return false;
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

    if (!newPortalMessage.subject || !newPortalMessage.message || newPortalMessage.recipient_ids.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send message to each recipient
      const messagePromises = newPortalMessage.recipient_ids.map(async (recipientId) => {
        // First insert the message
        const { data: messageData, error: messageError } = await supabase
          .from('portal_messages')
          .insert({
            sender_id: user.id,
            recipient_id: recipientId,
            subject: newPortalMessage.subject,
            message: newPortalMessage.message
          })
          .select()
          .single();

        if (messageError) throw messageError;

        // Then insert into message_recipients junction table
        const { error: recipientError } = await supabase
          .from('message_recipients')
          .insert({
            message_id: messageData.id,
            recipient_id: recipientId,
            is_read: false
          });

        if (recipientError) throw recipientError;

        return messageData;
      });

      await Promise.all(messagePromises);

      setShowPortalMessageModal(false);
      setNewPortalMessage({
        subject: '',
        message: '',
        recipient_ids: []
      });
      setSelectedMessageRecipients([]);
      setRecipientSearchTerm('');

      toast({
        title: "Success",
        description: `Portal message sent successfully to ${newPortalMessage.recipient_ids.length} recipient${newPortalMessage.recipient_ids.length > 1 ? 's' : ''}!`,
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
          description: error.message || "Failed to update registration status",
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
          
          if (isInvoiceNotDue(invoiceResult)) {
            toast({
              title: "Invoice Not Due",
              description: invoiceResult.message,
            });
          } else if (invoiceResult && !('existing' in invoiceResult)) {
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

        const { data: docs, error: docsError } = await supabase
          .from('pending_teacher_documents')
          .select('*')
          .order('uploaded_at', { ascending: false });
        if (!docsError) setPendingTeacherDocuments(docs || []);

        const { data: approvedDocs, error: approvedDocsError } = await supabase
          .from('teacher_documents')
          .select('*')
          .order('uploaded_at', { ascending: false });

        console.log('🔍 Fetching approved teachers...');
        const { data: approved, error: approvedError } = await supabase
          .from("teachers")
          .select("*")
          .order("created_at", { ascending: false });

        let resolvedDocs = approvedDocsError ? [] : (approvedDocs || []);
        let resolvedApproved = approvedError ? [] : (approved || []);

        const needsDocumentRecovery =
          !approvedError &&
          resolvedApproved.some((teacher) => {
            const hasLinkedDocs = resolvedDocs.some((doc) => doc.teacher_id === teacher.id);
            return !hasLinkedDocs && !teacher.cv_file_path;
          });

        if (needsDocumentRecovery) {
          try {
            const result = await recoverTeacherDocumentsFromStorage();
            if (result.inserted > 0 || result.cv_updated > 0) {
              const [{ data: refreshedDocs }, { data: refreshedTeachers }] = await Promise.all([
                supabase.from('teacher_documents').select('*').order('uploaded_at', { ascending: false }),
                supabase.from('teachers').select('*').order('created_at', { ascending: false }),
              ]);
              if (refreshedDocs) resolvedDocs = refreshedDocs;
              if (refreshedTeachers) resolvedApproved = refreshedTeachers;
            }
          } catch (recoverErr) {
            console.warn('Teacher document auto-recovery skipped:', recoverErr);
          }
        }

        if (!approvedDocsError) setTeacherDocuments(resolvedDocs);
        
        console.log('📊 Approved teachers result:', { data: resolvedApproved, error: approvedError });
        
        if (!approvedError) {
          setApprovedTeachers(resolvedApproved);
          console.log('✅ Set approved teachers:', resolvedApproved?.length || 0);
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
        cv_file_path: teacher.cv_file_path || null,
        created_at: teacher.created_at || new Date().toISOString(),
      };

      const { data, error } = await supabase.from("teachers").insert([teacherData]);
      if (error) throw error;

      const pendingDocs = pendingTeacherDocuments.filter(
        (doc) => doc.pending_teacher_id === teacher.id
      );
      const docsToInsert: {
        teacher_id: string;
        doc_type: string;
        file_path: string;
        file_name: string | null;
        status: string;
      }[] = [];

      if (teacher.cv_file_path) {
        docsToInsert.push({
          teacher_id: teacher.id,
          doc_type: 'cv',
          file_path: teacher.cv_file_path,
          file_name: teacher.cv_file_path.split('/').pop() || 'cv.pdf',
          status: 'approved',
        });
      }

      for (const doc of pendingDocs) {
        if (
          doc.doc_type === 'cv' &&
          teacher.cv_file_path &&
          doc.file_path === teacher.cv_file_path
        ) {
          continue;
        }
        docsToInsert.push({
          teacher_id: teacher.id,
          doc_type: doc.doc_type,
          file_path: doc.file_path,
          file_name: doc.file_name || doc.file_path.split('/').pop() || doc.doc_type,
          status: 'approved',
        });
      }

      if (docsToInsert.length > 0) {
        const { data: migratedDocs, error: migrateError } = await supabase
          .from('teacher_documents')
          .insert(docsToInsert)
          .select('*');
        if (migrateError) {
          console.error('Failed to migrate teacher documents:', migrateError);
        } else if (migratedDocs?.length) {
          setTeacherDocuments((prev) => [...migratedDocs, ...prev]);
        }
      }

      // Remove from pending_teachers
      await supabase.from("pending_teachers").delete().eq("id", teacher.id);

      // Send acceptance email with login credentials (using the original password)
      const emailSent = await sendTeacherAcceptedEmail(teacher, teacher.password);

      toast({
        title: "Teacher Approved",
        description: emailSent
          ? `${teacher.name} was approved and a welcome email was sent to ${teacher.email}.`
          : `${teacher.name} was approved, but the welcome email could not be sent — share login details manually.`,
        variant: emailSent ? "default" : "destructive",
      });
      
      // Refresh lists
      setPendingTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setPendingTeacherDocuments((prev) =>
        prev.filter((doc) => doc.pending_teacher_id !== teacher.id)
      );
      setApprovedTeachers((prev) => [
        { ...teacher, status: "approved", cv_file_path: teacher.cv_file_path || null },
        ...prev,
      ]);
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

  const handleRequestInfo = async (teacher: { name: string; email: string }, message: string) => {
    setTeacherLoading(true);
    try {
      const emailSent = await sendTeacherRequestInfoEmail(teacher, message);
      if (!emailSent) {
        toast({ title: "Email Failed", description: "Could not send request info email to teacher.", variant: "destructive" });
        return;
      }
      toast({ title: "Request Sent", description: `Message emailed to ${teacher.name}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send request.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setTeacherLoading(false);
    }
  };

  const reloadTeacherDocuments = async () => {
    const [{ data: approvedDocs }, { data: approved }] = await Promise.all([
      supabase.from('teacher_documents').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('teachers').select('*').order('created_at', { ascending: false }),
    ]);
    if (approvedDocs) setTeacherDocuments(approvedDocs);
    if (approved) setApprovedTeachers(approved);
  };

  const handleRecoverTeacherDocuments = async (teacherId?: string) => {
    setRecoveringTeacherId(teacherId ?? 'all');
    try {
      const result = await recoverTeacherDocumentsFromStorage(teacherId);
      await reloadTeacherDocuments();
      toast({
        title: result.inserted > 0 || result.cv_updated > 0 ? 'Documents linked' : 'No files found',
        description:
          result.inserted > 0 || result.cv_updated > 0
            ? `Linked ${result.inserted} file(s) from storage${result.cv_updated > 0 ? ` and restored ${result.cv_updated} CV path(s).` : '.'}`
            : 'No matching files were found in storage for this teacher.',
        variant: result.inserted > 0 || result.cv_updated > 0 ? 'default' : 'destructive',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not recover documents from storage.';
      toast({ title: 'Recovery failed', description: msg, variant: 'destructive' });
    } finally {
      setRecoveringTeacherId(null);
    }
  };

  // Fetch invoices for finance tab (all rows + current-period map per student)
  useEffect(() => {
    const fetchStudentInvoices = async () => {
      const validStudentIds = activeStudents.filter(s => isValidId(s.id)).map(s => s.id);
      if (validStudentIds.length === 0) {
        setAllStudentInvoices([]);
        setStudentInvoices({});
        return;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .in('student_id', validStudentIds)
        .order('period_end', { ascending: false });
      if (error || !data) return;

      const billableInvoices = filterInvoicesUpToCurrentMonth(data, undefined, ADMIN_BILLING_VISIBILITY);
      setAllStudentInvoices(billableInvoices);
      const period = getCalendarMonthPeriod();
      const currentPeriod: Record<string, any> = {};
      for (const studentId of validStudentIds) {
        const match = findInvoiceForFinancePeriod(billableInvoices, studentId, period);
        if (match) currentPeriod[studentId] = match;
      }
      setStudentInvoices(currentPeriod);
    };
    fetchStudentInvoices();
  }, [activeStudents]);

  // Refresh invoice lists after payment or manual edit
  const refreshStudentInvoices = async () => {
    const validStudentIds = activeStudents.filter((s) => isValidId(s.id)).map((s) => s.id);
    if (validStudentIds.length === 0) return;
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .in('student_id', validStudentIds)
      .order('period_end', { ascending: false });
    if (!data) return;
    const billableInvoices = filterInvoicesUpToCurrentMonth(data, undefined, ADMIN_BILLING_VISIBILITY);
    setAllStudentInvoices(billableInvoices);
    const period = getCalendarMonthPeriod();
    const currentPeriod: Record<string, any> = {};
    for (const studentId of validStudentIds) {
      const match = findInvoiceForFinancePeriod(billableInvoices, studentId, period);
      if (match) currentPeriod[studentId] = match;
    }
    setStudentInvoices(currentPeriod);
  };

  const handleOpenRecordPayment = (invoice: any, student?: any) => {
    setPaymentDialogInvoice(invoice);
    setPaymentDialogStudent(student ?? invoiceHistoryStudent ?? paymentsDialogStudent ?? null);
    setShowRecordPaymentDialog(true);
  };

  const handleOpenInvoicePayments = (invoice: any, student: any) => {
    setPaymentsDialogInvoice(invoice);
    setPaymentsDialogStudent(student);
    setShowInvoicePaymentsDialog(true);
  };

  const handlePaymentRecorded = async (result: RecordInvoicePaymentResult) => {
    try {
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*, students(*)')
        .eq('id', result.invoice_id)
        .single();

      const studentRow = invoiceData?.students;
      let isFirstInvoice = false;
      if (studentRow?.id) {
        const { data: allInvs } = await supabase
          .from('invoices')
          .select('id, created_at')
          .eq('student_id', studentRow.id)
          .order('created_at', { ascending: true });
        isFirstInvoice = !!allInvs?.length && allInvs[0].id === result.invoice_id;
      }

      let paymentMethod = 'cash';
      let mpesaRef: string | undefined;
      let paidDate: string | undefined;
      let paymentRow: any = null;
      if (result.payment_id) {
        const { data: paymentData } = await supabase
          .from('payments')
          .select('id, invoice_id, amount, cash_amount, credit_amount, payment_method, status, paid_date, mpesa_transaction_id, notes, created_at')
          .eq('id', result.payment_id)
          .maybeSingle();
        if (paymentData) {
          paymentRow = paymentData;
          paymentMethod = paymentData.payment_method || 'cash';
          mpesaRef = paymentData.mpesa_transaction_id || undefined;
          paidDate = paymentData.paid_date || undefined;
        }
      }

      const invoicePaymentsForReceipt = result.invoice_id
        ? await fetchInvoicePayments(result.invoice_id)
        : [];

      if (studentRow?.registration_id) {
        const { data: registration } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', studentRow.registration_id)
          .single();

        if (registration) {
          const periodLabel = invoiceData ? formatInvoiceBillingMonth(invoiceData) || undefined : undefined;

          const paidInvoiceContext = invoiceData && studentRow
            ? { invoice: invoiceData, student: studentRow, isFirstInvoice }
            : undefined;

          if (result.became_paid) {
            let tempPassword: string | null = null;
            if (isFirstInvoice) {
              try {
                const { data: userData } = await supabase.functions.invoke('create-student-user', {
                  body: {
                    email: registration.email,
                    student_name: registration.student_name,
                    action: 'get_password',
                  },
                });
                if (userData?.tempPassword) tempPassword = userData.tempPassword;
              } catch {
                /* optional */
              }
            }
            await sendPaymentConfirmationEmail(
              registration,
              tempPassword,
              isFirstInvoice,
              paidInvoiceContext
            );
          } else if (result.applied_to_invoice > 0) {
            await sendPartialPaymentConfirmationEmail(
              registration,
              result.applied_to_invoice,
              result.balance_remaining,
              periodLabel,
              paidInvoiceContext
                ? {
                    ...paidInvoiceContext,
                    paymentMethod,
                    mpesaRef,
                    paidDate,
                    payment: paymentRow ?? undefined,
                    allPayments: invoicePaymentsForReceipt,
                  }
                : undefined
            );
          }
        }
      }

      if (result.payment_id && paymentRow && invoiceData && studentRow) {
        try {
          await downloadPaymentReceiptPDF({
            payment: paymentRow,
            invoice: invoiceData,
            student: studentRow,
            allPayments: invoicePaymentsForReceipt,
            isFirstInvoice,
          });
        } catch (receiptErr) {
          console.error('Auto-download payment receipt failed:', receiptErr);
        }
      }

      const parts = [
        `KES ${result.applied_to_invoice.toLocaleString()} applied`,
        result.balance_remaining > 0 ? `Balance: KES ${result.balance_remaining.toLocaleString()}` : 'Invoice fully paid',
      ];
      toast({ title: 'Payment recorded', description: parts.join(' · ') });

      await refreshStudentInvoices();
      setInvoicePaymentsRefreshKey((k) => k + 1);
      if (invoiceData) {
        if (paymentsDialogInvoice?.id === result.invoice_id) {
          setPaymentsDialogInvoice(invoiceData);
        }
        if (selectedHistoryInvoice?.id === result.invoice_id) {
          setSelectedHistoryInvoice(invoiceData);
        }
      }
      if (invoiceHistoryStudent) {
        await fetchInvoiceHistory(invoiceHistoryStudent.id);
      }
      if (paymentDialogInvoice?.id === result.invoice_id) {
        const { data: updated } = await supabase.from('invoices').select('*').eq('id', result.invoice_id).single();
        if (updated) setPaymentDialogInvoice(updated);
      }
      fetchData();
    } catch (error) {
      console.error('handlePaymentRecorded:', error);
      toast({
        title: 'Payment saved',
        description: 'Payment was recorded but follow-up steps may have failed. Refresh the page.',
        variant: 'destructive',
      });
      await refreshStudentInvoices();
    }
  };

  // Handler to view invoice details
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
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

  const toggleStudentSelection = (id: string, checked: boolean) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllStudentsOnPage = (checked: boolean) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      paginatedStudents.forEach((student) => {
        if (checked) next.add(student.id);
        else next.delete(student.id);
      });
      return next;
    });
  };

  const clearStudentSelection = () => setSelectedStudentIds(new Set());

  const isStudentSuspended = (student: Registration) =>
    Boolean(student.account_suspended || student.is_access_suspended);

  const handleBulkActivateStudents = async () => {
    const toActivate = selectedStudents.filter((student) => isStudentSuspended(student));
    if (toActivate.length === 0) {
      toast({
        title: 'No suspended students selected',
        description: 'Select one or more suspended students to activate.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Activate ${toActivate.length} selected student account(s)?`)) return;

    setBulkStudentActionLoading(true);
    try {
      const results = await Promise.allSettled(
        toActivate.map((student) =>
          supabase.rpc('activate_student_account', { p_student_id: student.id })
        )
      );
      const failed = results.filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error));
      toast({
        title: failed.length ? 'Some activations failed' : 'Accounts activated',
        description:
          failed.length > 0
            ? `${toActivate.length - failed.length} activated, ${failed.length} failed.`
            : `${toActivate.length} student account(s) reactivated.`,
        variant: failed.length ? 'destructive' : 'default',
      });
      clearStudentSelection();
      await fetchData();
    } finally {
      setBulkStudentActionLoading(false);
    }
  };

  const handleBulkSuspendStudents = async () => {
    const reason = bulkSuspensionReason.trim();
    if (!reason) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for suspending the selected accounts.',
        variant: 'destructive',
      });
      return;
    }

    const toSuspend = selectedStudents.filter((student) => !isStudentSuspended(student));
    if (toSuspend.length === 0) {
      toast({
        title: 'No active students selected',
        description: 'Select one or more active students to suspend.',
        variant: 'destructive',
      });
      return;
    }

    setBulkStudentActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const results = await Promise.allSettled(
        toSuspend.map((student) =>
          supabase.rpc('suspend_student_account', {
            p_student_id: student.id,
            p_reason: reason,
            p_suspended_by: user.id,
          })
        )
      );
      const failed = results.filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error));
      toast({
        title: failed.length ? 'Some suspensions failed' : 'Accounts suspended',
        description:
          failed.length > 0
            ? `${toSuspend.length - failed.length} suspended, ${failed.length} failed.`
            : `${toSuspend.length} student account(s) suspended.`,
        variant: failed.length ? 'destructive' : 'default',
      });
      setShowBulkSuspendDialog(false);
      setBulkSuspensionReason('');
      clearStudentSelection();
      await fetchData();
    } catch (err: unknown) {
      toast({
        title: 'Bulk suspend failed',
        description: err instanceof Error ? err.message : 'Could not suspend selected students.',
        variant: 'destructive',
      });
    } finally {
      setBulkStudentActionLoading(false);
    }
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

  // 2. Current finance period (local calendar month)
  const getCurrentPeriod = () => getCalendarMonthPeriod();

  // 3. Students still needing an invoice for the current calendar month
  useEffect(() => {
    const needing = activeStudents
      .filter((student) => studentNeedsCurrentMonthInvoice(allStudentInvoices, student.id, undefined, ADMIN_BILLING_VISIBILITY))
      .map((s) => s.id);
    setStudentsNeedingInvoice(needing);
  }, [activeStudents, allStudentInvoices]);

  const inUpcomingBillingPreview = isWithinNextMonthBillingPreviewWindow();
  const upcomingBillingMonthLabel = formatNextBillingMonthLabel();
  const studentsEligibleForUpcomingGeneration = useMemo(
    () =>
      activeStudents.filter((student) =>
        studentEligibleForUpcomingInvoiceGeneration(allStudentInvoices, student.id)
      ),
    [activeStudents, allStudentInvoices]
  );

  const handleGenerateAllUpcomingInvoices = async () => {
    if (studentsEligibleForUpcomingGeneration.length === 0) {
      toast({
        title: 'Nothing to generate',
        description: `Every eligible student already has a ${upcomingBillingMonthLabel} invoice, or still has an outstanding current-month balance.`,
      });
      return;
    }

    setBulkGeneratingUpcomingInvoices(true);
    try {
      const result: BulkUpcomingInvoiceGenerationResult = await generateUpcomingPeriodInvoices(
        activeStudents,
        allStudentInvoices
      );
      await refreshStudentInvoices();
      toast({
        title: 'Upcoming invoices generated',
        description: `Created ${result.created} for ${upcomingBillingMonthLabel}. Skipped ${result.skipped}, failed ${result.failed}. Review amounts, then use Send Invoice when ready — no emails were sent.`,
      });
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error?.message || 'Could not generate upcoming invoices.',
        variant: 'destructive',
      });
    } finally {
      setBulkGeneratingUpcomingInvoices(false);
    }
  };

  // 4. Handler to send invoice for a student (optional existingInvoice = send existing without creating)
  const handleSendInvoice = async (student: any, existingInvoice?: any) => {
    // Defensive check for student object and ID
    if (!student || !isValidId(student.id)) {
      console.error('Invalid student object or ID for invoice sending:', student);
      toast({ title: 'Error', description: 'Invalid student data for invoice sending.', variant: 'destructive' });
      return;
    }

    if (!canSendInvoiceEmail(allStudentInvoices, student.id, undefined, ADMIN_BILLING_VISIBILITY)) {
      toast({
        title: 'Already paid',
        description: 'This student has paid for the current billing month. Send Invoice is not available until the next period.',
      });
      return;
    }

    setSendingInvoiceIds(ids => [...ids, student.id]);
    try {
      let invoiceToSend: any = null;
      let isFirstInvoice = false;

      const billableForStudent = filterInvoicesUpToCurrentMonth(
        allStudentInvoices,
        undefined,
        ADMIN_BILLING_VISIBILITY
      ).filter((row) => row.student_id === student.id);
      const currentMonthInvoice = findInvoiceForCalendarMonth(billableForStudent, student.id);
      const inPreviewWindow = isWithinNextMonthBillingPreviewWindow();
      const nextMonthInvoice = inPreviewWindow
        ? findInvoiceForCalendarMonth(billableForStudent, student.id, getNextCalendarMonthReference())
        : undefined;
      const latestInvoice = getLatestBillableInvoiceForStudent(
        allStudentInvoices,
        student.id,
        undefined,
        ADMIN_BILLING_VISIBILITY
      );

      if (existingInvoice) {
        if (isInvoiceFullyPaid(existingInvoice)) {
          toast({
            title: 'Already paid',
            description: 'This invoice is fully paid. Nothing to send.',
          });
          return;
        }
        invoiceToSend = existingInvoice;
        const { data: allStudentInvoicesRows } = await supabase
          .from('invoices')
          .select('id')
          .eq('student_id', student.id)
          .order('period_start', { ascending: true });
        isFirstInvoice =
          !!allStudentInvoicesRows?.length && allStudentInvoicesRows[0].id === existingInvoice.id;
      } else if (currentMonthInvoice && !isInvoiceFullyPaid(currentMonthInvoice)) {
        invoiceToSend = currentMonthInvoice;
        const { data: earlier } = await supabase
          .from('invoices')
          .select('id')
          .eq('student_id', student.id)
          .lt('period_start', currentMonthInvoice.period_start)
          .limit(1);
        isFirstInvoice = !earlier?.length;
      } else if (nextMonthInvoice && !isInvoiceFullyPaid(nextMonthInvoice)) {
        invoiceToSend = nextMonthInvoice;
        const { data: earlier } = await supabase
          .from('invoices')
          .select('id')
          .eq('student_id', student.id)
          .lt('period_start', nextMonthInvoice.period_start)
          .limit(1);
        isFirstInvoice = !earlier?.length;
      } else if (latestInvoice && !isInvoiceFullyPaid(latestInvoice)) {
        invoiceToSend = latestInvoice;
        const { data: earlier } = await supabase
          .from('invoices')
          .select('id')
          .eq('student_id', student.id)
          .lt('period_start', latestInvoice.period_start)
          .limit(1);
        isFirstInvoice = !earlier?.length;
      } else {
        let regId = student.registration_id;

        if (!regId || regId === 'undefined' || regId === undefined || regId === null) {
          const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('student_name', student.student_name)
            .eq('email', student.email)
            .eq('status', 'approved')
            .single();
          if (error || !data) {
            toast({
              title: 'Error',
              description: 'Could not find registration for student. ' + (error?.message || ''),
              variant: 'destructive',
            });
            return;
          }
          regId = data.id;
        }

        if (!regId) {
          toast({
            title: 'Error',
            description: 'Student is missing registration_id. Cannot create invoice.',
            variant: 'destructive',
          });
          return;
        }

        const result = await generateInvoiceForRegistration(regId);
        if (isInvoiceNotDue(result)) {
          toast({ title: 'Invoice not due yet', description: result.message });
          return;
        }
        const resolved = await resolveInvoiceAfterGeneration(student.id, result);
        if (resolved.invoice) {
          invoiceToSend = resolved.invoice;
          isFirstInvoice = resolved.isFirstInvoice;
        }
      }

      if (invoiceToSend) {
        const sent = await sendInvoiceEmail(invoiceToSend, student, { isReminder: false, isFirstInvoice });
        if (sent) {
          toast({ title: 'Invoice Sent', description: `Invoice sent to ${student.student_name}` });
        } else {
          toast({ title: 'Invoice Created', description: `Invoice saved but email failed to send.` });
        }

        // Update UI immediately so status shows amount + Edit (not stuck on "Not Sent")
        setAllStudentInvoices((prev) => {
          const without = prev.filter((i) => i.id !== invoiceToSend.id);
          return [invoiceToSend, ...without];
        });
        setStudentInvoices((prev) => ({ ...prev, [student.id]: invoiceToSend }));
      } else if (!existingInvoice) {
        toast({ title: 'No Invoice', description: 'No invoice available to send.' });
      }

      // Refresh full invoice list from server
      const validStudentIds = activeStudents.filter(s => isValidId(s.id)).map(s => s.id);
      if (validStudentIds.length > 0) {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .in('student_id', validStudentIds)
          .order('period_end', { ascending: false });
        if (!error && data) {
          const billableInvoices = filterInvoicesUpToCurrentMonth(data, undefined, ADMIN_BILLING_VISIBILITY);
          setAllStudentInvoices(billableInvoices);
          const period = getCalendarMonthPeriod();
          const currentPeriod: Record<string, any> = {};
          for (const studentId of validStudentIds) {
            const match = findInvoiceForFinancePeriod(billableInvoices, studentId, period);
            if (match) currentPeriod[studentId] = match;
          }
          setStudentInvoices(currentPeriod);
        }
      }
    } catch (err: any) {
      console.error('Send Invoice error:', { student, err });
      toast({ title: 'Error', description: (err.message || 'Failed to send invoice') + (err.stack ? '\n' + err.stack : ''), variant: 'destructive' });
    } finally {
      setSendingInvoiceIds(ids => ids.filter(id => id !== student.id));
    }
  };

  // Preview invoice (read-only PDF — never creates a new billing row)
  const [previewInvoiceLoading, setPreviewInvoiceLoading] = useState<string | null>(null);
  const handlePreviewInvoice = async (student: any, existingInvoice?: any) => {
    if (!student || !isValidId(student.id)) {
      toast({ title: 'Error', description: 'Invalid student for preview.', variant: 'destructive' });
      return;
    }
    setPreviewInvoiceLoading(student.id);
    try {
      const invoice = existingInvoice ?? (await fetchStudentInvoiceForPreview(student.id));
      if (!invoice) {
        toast({
          title: 'No current invoice',
          description:
            'There is no invoice for the current billing month. Use Send Invoice only when a new period is due.',
        });
        return;
      }

      const { data: earlier } = await supabase
        .from('invoices')
        .select('id')
        .eq('student_id', student.id)
        .lt('period_start', invoice.period_start)
        .limit(1);
      const isFirstInvoice = !earlier || earlier.length === 0;
      const blob = await generateInvoicePDFBlob(invoice, student, !!isFirstInvoice);
      openInvoicePdfPreview(blob, student, invoice);
      toast({
        title: 'Preview opened',
        description: invoice.status === 'paid'
          ? 'Showing the paid invoice for the current billing period.'
          : 'When you save from the preview tab, use the suggested filename (student name + period).',
      });
    } catch (err: any) {
      console.error('Preview invoice error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to preview invoice.', variant: 'destructive' });
    } finally {
      setPreviewInvoiceLoading(null);
    }
  };

  // Function to fetch all invoices for a student
  const fetchInvoiceHistory = async (studentId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', studentId)
      .order('period_start', { ascending: false });
    if (!error && data) {
      const visible = filterInvoicesForAdminHistory(data);
      setInvoiceHistory(visible);
      const hiddenFuture = data.filter(
        (inv) =>
          inv.status !== 'cancelled' &&
          inv.period_start &&
          isHiddenBillingPeriod(inv.period_start, undefined, ADMIN_BILLING_VISIBILITY)
      ).length;
      setHiddenHistoryInvoiceCount(hiddenFuture);
    }
  };

  // Handler to open invoice history modal
  const handleOpenInvoiceHistory = async (student: any) => {
    setInvoiceHistoryStudent(student);
    setSelectedHistoryInvoice(null);
    setHiddenHistoryInvoiceCount(0);
    await fetchInvoiceHistory(student.id);
    setShowInvoiceHistoryModal(true);
  };

  // Handler to view invoice from history
  const handleViewHistoryInvoice = async (inv: any) => {
    setSelectedHistoryInvoice(inv);
  };

  const patchInvoicePdfUrl = (invoiceId: string, pdfUrl: string) => {
    setInvoiceHistory((prev) =>
      prev.map((row) => (row.id === invoiceId ? { ...row, pdf_url: pdfUrl } : row))
    );
    if (selectedHistoryInvoice?.id === invoiceId) {
      setSelectedHistoryInvoice({ ...selectedHistoryInvoice, pdf_url: pdfUrl });
    }
  };

  const handleDownloadInvoicePDF = async (inv: any, student?: any) => {
    if (!inv?.id) return;

    const studentRecord = student || invoiceHistoryStudent || paymentsDialogStudent;
    if (!studentRecord?.id) {
      toast({
        title: 'Cannot generate PDF',
        description: 'Student record not found.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingPdfInvoiceId(inv.id);
    try {
      const { data: freshInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', inv.id)
        .single();
      const invoiceRow = freshInvoice || inv;
      const pdfUrl = await ensureInvoicePDF(invoiceRow, studentRecord, { forceRegenerate: true });
      patchInvoicePdfUrl(inv.id, pdfUrl);
      if (paymentsDialogInvoice?.id === inv.id) {
        setPaymentsDialogInvoice({ ...invoiceRow, pdf_url: pdfUrl });
      }
      await openInvoicePdfWithName(pdfUrl, studentRecord, invoiceRow);
      toast({ title: 'PDF ready', description: 'Invoice PDF generated with current payment totals.' });
    } catch (err: unknown) {
      console.error('Generate invoice PDF error:', err);
      toast({
        title: 'PDF generation failed',
        description: err instanceof Error ? err.message : 'Could not create PDF for this invoice.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdfInvoiceId(null);
    }
  };

  const handleGenerateAllMissingPdfs = async () => {
    if (!invoiceHistoryStudent) return;
    const missing = invoiceHistory.filter((inv) => !inv.pdf_url);
    if (missing.length === 0) {
      toast({ title: 'All set', description: 'Every invoice in this list already has a PDF.' });
      return;
    }

    setGeneratingAllPdfs(true);
    let success = 0;
    let failed = 0;

    for (const inv of missing) {
      try {
        const pdfUrl = await ensureInvoicePDF(inv, invoiceHistoryStudent);
        patchInvoicePdfUrl(inv.id, pdfUrl);
        success++;
      } catch (err) {
        console.error('Bulk PDF generation failed for invoice', inv.id, err);
        failed++;
      }
    }

    setGeneratingAllPdfs(false);
    toast({
      title: 'PDF generation complete',
      description: `${success} created${failed ? `, ${failed} failed` : ''}.`,
      variant: failed && !success ? 'destructive' : 'default',
    });
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
                <SelectItem value="trials">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    <span>Trial Classes ({trialBookings.length})</span>
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
                    <span>Teachers{pendingTeachers.length > 0 ? ` (${pendingTeachers.length} pending)` : ''}</span>
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
                <SelectItem value="requests">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Requests & Approvals ({approvalRequests.filter(req => req.status === 'pending').length + teacherChangeRequests.filter(req => req.status === 'pending').length})</span>
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
              variant={activeTab === 'trials' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('trials')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start relative"
              style={{ minWidth: 120 }}
            >
              <Gift className="h-4 w-4 mr-2" />
              Trial Classes ({trialBookings.length})
              {trialBookings.filter(t => t.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {trialBookings.filter(t => t.status === 'pending').length}
                </Badge>
              )}
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
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start relative"
              style={{ minWidth: 120 }}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Teachers
              {pendingTeachers.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-5">
                  {pendingTeachers.length}
                </Badge>
              )}
            </Button>
              <Button
                variant={activeTab === 'requests' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('requests')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
                style={{ minWidth: 120 }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Requests & Approvals ({approvalRequests.filter(req => req.status === 'pending').length + teacherChangeRequests.filter(req => req.status === 'pending').length})
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
            <Button
              variant={activeTab === 'shop' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('shop')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap scroll-snap-align-start"
              style={{ minWidth: 120 }}
            >
              <Gift className="h-4 w-4 mr-2" />
              Shop Manager
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
        {activeTab === 'events' && (
        <div>
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
        )}



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

        {/* Trial Bookings Tab */}
        <div style={{ display: activeTab === 'trials' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Trial Class Bookings
                </h3>
                {trialsTotalPages > 1 && (
                  <Badge variant="outline" className="text-blue-600">Page {trialsPage} of {trialsTotalPages}</Badge>
                )}
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pending: {trialBookings.filter(t => t.status === 'pending').length}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Scheduled: {trialBookings.filter(t => t.status === 'scheduled').length}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Completed: {trialBookings.filter(t => t.status === 'completed').length}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Converted: {trialBookings.filter(t => t.status === 'converted').length}
                </Badge>
              </div>
              <Input
                placeholder="Search by student, parent, email, instrument, status..."
                value={trialsSearchTerm}
                onChange={(e) => setTrialsSearchTerm(e.target.value)}
                className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
              />
            </div>
            
            {trialBookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 text-lg">
                No trial bookings yet. They will appear here when students book trial classes.
              </div>
            ) : filteredTrials.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 text-lg">No results found.</div>
            ) : (
              <>
              <div className="grid gap-4">
                {paginatedTrials.map((booking) => (
                  <Card key={booking.id} className="shadow-xl border-0 bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                            <Gift className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-primary">{booking.student_name}</h4>
                            <p className="text-muted-foreground flex items-center gap-2">
                              Age: {booking.student_age} • {booking.instrument} • {booking.preferred_location}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Parent: {booking.parent_name} • {booking.email} • {booking.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'converted' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          } text-white font-semibold px-3 py-1`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="font-semibold text-sm text-gray-700 mb-2">Student Details</h5>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Skill Level:</span> {booking.skill_level}</p>
                            <p><span className="font-medium">Experience:</span> {booking.previous_experience || 'None'}</p>
                            <p><span className="font-medium">Goals:</span> {booking.learning_goals || 'Not specified'}</p>
                          </div>
                        </div>
                     <div>
                       <h5 className="font-semibold text-sm text-gray-700 mb-2">Scheduling</h5>
                       <div className="space-y-1 text-sm">
                         <p><span className="font-medium">Preferred Time:</span> {booking.preferred_time}</p>
                         <p><span className="font-medium">Preferred Date:</span> {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Not specified'}</p>
                         {booking.scheduled_datetime && (
                           <p><span className="font-medium">Scheduled:</span> {new Date(booking.scheduled_datetime).toLocaleString()}</p>
                         )}
                         {booking.meeting_url && (
                           <div className="mt-2">
                             <p><span className="font-medium">Meeting Link:</span></p>
                             <a 
                               href={booking.meeting_url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                             >
                               {booking.meeting_url}
                             </a>
                             {booking.meeting_code && (
                               <p className="mt-1"><span className="font-medium">Meeting Code:</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{booking.meeting_code}</span></p>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                      </div>
                      
                      {booking.special_requirements && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-sm text-gray-700 mb-2">Special Requirements</h5>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{booking.special_requirements}</p>
                        </div>
                      )}
                      
                      {booking.notes && (
                        <div className="mb-4">
                          <h5 className="font-semibold text-sm text-gray-700 mb-2">Notes</h5>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{booking.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-xs text-gray-500">
                          Created: {new Date(booking.created_at).toLocaleString()}
                        </div>
                       <div className="flex gap-2">
                         {booking.status === 'pending' && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={async () => {
                               setSelectedTrialBooking(booking);
                               // Fetch teachers when opening the modal
                               await fetchAvailableTeachers();
                               setShowScheduleModal(true);
                             }}
                           >
                             <Calendar className="h-4 w-4 mr-1" />
                             Schedule
                           </Button>
                         )}
                         <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => {
                             setSelectedTrialBooking(booking);
                             setShowNotesModal(true);
                           }}
                         >
                           <FileText className="h-4 w-4 mr-1" />
                           Add Notes
                         </Button>
                         <Select 
                           value={booking.status} 
                           onValueChange={(value) => updateTrialBookingStatus(booking.id, value)}
                         >
                           <SelectTrigger className="w-32">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="pending">Pending</SelectItem>
                             <SelectItem value="scheduled">Scheduled</SelectItem>
                             <SelectItem value="completed">Completed</SelectItem>
                             <SelectItem value="cancelled">Cancelled</SelectItem>
                             <SelectItem value="converted">Converted</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {trialsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((trialsPage - 1) * trialsPerPage) + 1} to {Math.min(trialsPage * trialsPerPage, filteredTrials.length)} of {filteredTrials.length} bookings
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setTrialsPage((p) => Math.max(1, p - 1))} disabled={trialsPage === 1} className="flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: trialsTotalPages }, (_, i) => i + 1).map((page) => (
                        <Button key={page} variant={page === trialsPage ? "default" : "outline"} size="sm" onClick={() => setTrialsPage(page)} className="w-8 h-8 p-0 text-xs">{page}</Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setTrialsPage((p) => Math.min(trialsTotalPages, p + 1))} disabled={trialsPage === trialsTotalPages} className="flex items-center gap-1">
                      Next <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
            )}
          </div>
        </div>

        {/* Active Students Tab */}
        <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Active Students Orchestra
                </h3>
                {studentsTotalPages > 1 && (
                  <Badge variant="outline" className="text-blue-600">Page {studentsPage} of {studentsTotalPages}</Badge>
                )}
              </div>
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
              />
            </div>

            {selectedStudentIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <span className="text-sm font-medium">
                  {selectedStudentIds.size} student{selectedStudentIds.size === 1 ? '' : 's'} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkStudentActionLoading}
                  onClick={() => void handleBulkActivateStudents()}
                  className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                >
                  <Unlock className="h-4 w-4 mr-1" />
                  Activate selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkStudentActionLoading}
                  onClick={() => setShowBulkSuspendDialog(true)}
                  className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Suspend selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={bulkStudentActionLoading}
                  onClick={clearStudentSelection}
                >
                  Clear selection
                </Button>
              </div>
            )}

            {paginatedStudents.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  checked={allStudentsOnPageSelected}
                  onCheckedChange={(checked) => toggleSelectAllStudentsOnPage(checked === true)}
                  aria-label="Select all students on this page"
                />
                <span className="text-sm text-muted-foreground">Select all on this page</span>
              </div>
            )}
            
            <div className="grid gap-2">
              {paginatedStudents.map((student) => {
                const isExpanded = expandedStudentIds.has(student.id);
                const isSelected = selectedStudentIds.has(student.id);
                const suspended = isStudentSuspended(student);
                return (
                  <Card key={student.id} className="shadow border-0 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleStudentSelection(student.id, checked === true)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${student.student_name}`}
                        />
                        <button
                          type="button"
                          className="flex flex-1 items-center justify-between gap-3 text-left min-w-0"
                          onClick={() => toggleStudentExpand(student.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold text-base truncate">{student.student_name}</h4>
                            {suspended && (
                              <Badge variant="destructive" className="shrink-0">
                                Suspended
                              </Badge>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{student.email}</span></div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{student.phone}</span></div>
                            <div className="flex items-center gap-2"><span className="text-sm">Age: {student.age}</span></div>
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
                          </div>

                          <StudentAccountControl
                            student={{
                              id: student.id,
                              student_name: student.student_name,
                              email: student.email,
                              account_suspended: suspended,
                              suspension_reason: student.suspension_reason,
                              suspended_at: student.suspended_at,
                              account_notes: student.account_notes
                            }}
                            onUpdate={() => {
                              void fetchData();
                            }}
                          />

                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setStudentToDelete(student);
                                setShowDeleteModal(true);
                              }}
                            >
                              Delete student
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {studentsTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((studentsPage - 1) * studentsPerPage) + 1} to {Math.min(studentsPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStudentsPage((p) => Math.max(1, p - 1))} disabled={studentsPage === 1} className="flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: studentsTotalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={page === studentsPage ? "default" : "outline"} size="sm" onClick={() => setStudentsPage(page)} className="w-8 h-8 p-0 text-xs">{page}</Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStudentsPage((p) => Math.min(studentsTotalPages, p + 1))} disabled={studentsPage === studentsTotalPages} className="flex items-center gap-1">
                    Next <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Registrations Tab */}
        <div style={{ display: activeTab === 'registrations' ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Student Registration Applications
                </h3>
                {registrationsTotalPages > 1 && (
                  <Badge variant="outline" className="text-blue-600">Page {registrationsPage} of {registrationsTotalPages}</Badge>
                )}
              </div>
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
              <>
              <div className="grid gap-6">
                {paginatedRegistrations.map((registration) => {
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
                              {registration.course_category === 'Languages' && <Globe className="h-6 w-6 text-teal-600" />}
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
                               registration.course_category === 'Technology' ? registration.technology_type : 
                               registration.course_category === 'Languages' ? registration.language_type :
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
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Production Type:</span>
                                        <span className="text-gray-800">{registration.production_type}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Term:</span>
                                        <Select
                                          value={registration.term_period === 'final_term' ? 'final_term' : '1st_term'}
                                          onValueChange={async (value) => {
                                            await supabase.from('registrations').update({ term_period: value }).eq('id', registration.id);
                                            await supabase.from('students').update({ term_period: value }).eq('registration_id', registration.id);
                                            setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, term_period: value } : r));
                                            setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, term_period: value } : s));
                                            toast({ title: 'Updated', description: 'Term updated.' });
                                          }}
                                        >
                                          <SelectTrigger className="h-8 w-36 border-gray-300">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="1st_term">1st Term</SelectItem>
                                            <SelectItem value="final_term">Final Term</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </>
                                  )}
                                  {registration.course_category === 'Photography' && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Term:</span>
                                      <Select
                                        value={registration.term_period === 'final_term' ? 'final_term' : '1st_term'}
                                        onValueChange={async (value) => {
                                          await supabase.from('registrations').update({ term_period: value }).eq('id', registration.id);
                                          await supabase.from('students').update({ term_period: value }).eq('registration_id', registration.id);
                                          setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, term_period: value } : r));
                                          toast({ title: 'Updated', description: 'Term updated.' });
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-36 border-gray-300">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1st_term">1st Term</SelectItem>
                                          <SelectItem value="final_term">Final Term</SelectItem>
                                        </SelectContent>
                                      </Select>
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
                                    {registration.course_category === 'Languages' ? (
                                      <Badge variant="outline" className="text-xs">Fully online (remote only)</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">{registration.learning_mode}</Badge>
                                    )}
                                  </div>
                                  {registration.course_category === 'Languages' && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Pathway:</span>
                                        <Badge variant="outline" className="text-xs">{getLanguagePathwayLabel(registration.language_pathway)}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Package:</span>
                                        <Badge variant="outline" className="text-xs">{getLanguagePackageLabel(registration.language_package)}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-600">Monthly tuition:</span>
                                        <span className="text-gray-800">{formatLanguageMonthlyPrice(registration.language_package, registration.sessions_per_week)}</span>
                                      </div>
                                    </>
                                  )}
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
                                  {!isTermlyCourseCategory(registration.course_category) && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Classes per Week:</span>
                                      <Select
                                        value={String(registration.sessions_per_week || 1)}
                                        onValueChange={async (value) => {
                                          const newVal = parseInt(value);
                                          await supabase.from('registrations').update({ sessions_per_week: newVal }).eq('id', registration.id);
                                          await supabase.from('students').update({ sessions_per_week: newVal }).eq('registration_id', registration.id);
                                          setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, sessions_per_week: newVal } : r));
                                          setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, sessions_per_week: newVal } : s));
                                          toast({ title: 'Updated', description: 'Classes per week updated.' });
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-24 border-gray-300">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(registration.course_category === 'Languages' ? [1, 2] : [1, 2, 3, 4, 5]).map((num) => (
                                            <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  {registration.course_category !== 'Languages' && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-600">Learning Mode:</span>
                                    <Select
                                      value={
                                        isTermlyCourseCategory(registration.course_category)
                                          ? (registration.learning_mode === 'online' ? 'online' : 'in-person')
                                          : (registration.learning_mode || 'in-person')
                                      }
                                      onValueChange={async (value) => {
                                        await supabase.from('registrations').update({ learning_mode: value }).eq('id', registration.id);
                                        await supabase.from('students').update({ learning_mode: value }).eq('registration_id', registration.id);
                                        setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, learning_mode: value } : r));
                                        setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, learning_mode: value } : s));
                                        toast({ title: 'Updated', description: 'Learning mode updated.' });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-32 border-gray-300">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {isTermlyCourseCategory(registration.course_category) ? (
                                          <>
                                            <SelectItem value="in-person">Physical</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                          </>
                                        ) : (
                                          <>
                                            <SelectItem value="in-person">In-Person</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                            <SelectItem value="home">Home Lessons</SelectItem>
                                            <SelectItem value="home-lessons">Home Lessons</SelectItem>
                                          </>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  )}
                                  {(registration.course_category === 'Music' && (registration.learning_mode === 'home' || registration.learning_mode === 'home-lessons')) && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Home duration:</span>
                                      <Select
                                        value={registration.home_lesson_duration || ''}
                                        onValueChange={async (value) => {
                                          await supabase.from('registrations').update({ home_lesson_duration: value || null }).eq('id', registration.id);
                                          setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, home_lesson_duration: value || null } : r));
                                          toast({ title: 'Updated', description: 'Home lesson duration updated.' });
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-40 border-gray-300">
                                          <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="30_min">30 min (KSh 6,000)</SelectItem>
                                          <SelectItem value="1_hour">1 hour (KSh 12,000)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                  {!isTermlyCourseCategory(registration.course_category) && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-600">Instrument:</span>
                                      <Select
                                        value={registration.instrument || ''}
                                        onValueChange={async (value) => {
                                          await supabase.from('registrations').update({ instrument: value }).eq('id', registration.id);
                                          await supabase.from('students').update({ instrument: value }).eq('registration_id', registration.id);
                                          setRegistrations((prev) => prev.map((r) => r.id === registration.id ? { ...r, instrument: value } : r));
                                          setActiveStudents((prev) => prev.map((s) => s.registration_id === registration.id ? { ...s, instrument: value } : s));
                                          toast({ title: 'Updated', description: 'Instrument updated.' });
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-36 border-gray-300">
                                          <SelectValue placeholder="Select instrument" />
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
                                  )}
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
              {registrationsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((registrationsPage - 1) * registrationsPerPage) + 1} to {Math.min(registrationsPage * registrationsPerPage, filteredRegistrations.length)} of {filteredRegistrations.length} applications
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setRegistrationsPage((p) => Math.max(1, p - 1))} disabled={registrationsPage === 1} className="flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: registrationsTotalPages }, (_, i) => i + 1).map((page) => (
                        <Button key={page} variant={page === registrationsPage ? "default" : "outline"} size="sm" onClick={() => setRegistrationsPage(page)} className="w-8 h-8 p-0 text-xs">{page}</Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setRegistrationsPage((p) => Math.min(registrationsTotalPages, p + 1))} disabled={registrationsPage === registrationsTotalPages} className="flex items-center gap-1">
                      Next <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
            )}
          </div>
        </div>



        {/* Messages Tab */}
        {activeTab === 'messages' && (
        <div>
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
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="mt-8">
            <Tabs value={teachersSubTab} onValueChange={(value) => setTeachersSubTab(value as 'pending' | 'approved' | 'classrooms' | 'approved-classrooms')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
                <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 sm:px-3 relative">
                  Pending Teachers
                  {pendingTeachers.length > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 rounded-full px-1.5 text-xs">
                      {pendingTeachers.length}
                    </Badge>
                  )}
                </TabsTrigger>
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
                      <PendingTeacherApplicationCard
                        key={teacher.id}
                        teacher={teacher}
                        documents={pendingTeacherDocuments}
                        loading={teacherLoading}
                        onApprove={approveTeacher}
                        onReject={rejectTeacher}
                        onRequestInfo={handleRequestInfo}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="approved" className="mt-6">
                {teacherLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : approvedTeachers.length === 0 ? (
                  <div className="text-center text-muted-foreground">No approved teachers yet.</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Missing application documents? Link files still stored from signup.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={recoveringTeacherId === 'all'}
                        onClick={() => void handleRecoverTeacherDocuments()}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${recoveringTeacherId === 'all' ? 'animate-spin' : ''}`} />
                        {recoveringTeacherId === 'all' ? 'Searching storage…' : 'Link all from storage'}
                      </Button>
                    </div>
                    <div className="grid gap-4">
                    {approvedTeachers.map((teacher) => (
                      <ApprovedTeacherCard
                        key={teacher.id}
                        teacher={teacher}
                        documents={teacherDocuments}
                        onRecoverDocuments={handleRecoverTeacherDocuments}
                        recovering={recoveringTeacherId === teacher.id}
                      />
                    ))}
                    </div>
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
                    Total: {approvalRequests.length + teacherChangeRequests.length}
                  </Badge>
                  <Badge variant="default" className="px-3 py-1 bg-orange-500">
                    Pending: {approvalRequests.filter(req => req.status === 'pending').length + teacherChangeRequests.filter(req => req.status === 'pending').length}
                  </Badge>
                  {getTotalPages() > 1 && (
                    <Badge variant="outline" className="px-3 py-1 text-blue-600">
                      Page {requestsPage} of {getTotalPages()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {getAllRequests().length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Requests</h3>
                      <p className="text-gray-500">No approval requests have been submitted yet.</p>
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
                                  <span className="truncate">{request.requester_name}</span>
                                  <span>•</span>
                                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                  {request.request_source === 'teacher' && request.proposed_name && (
                                    <>
                                      <span>•</span>
                                      <span className="text-primary font-medium">
                                        Name: {request.proposed_name}
                                      </span>
                                    </>
                                  )}
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
                                    onClick={() => {
                                      if (request.request_source === 'teacher') {
                                        handleApproveTeacherChange(request.id);
                                      } else {
                                        handleApproveRequest(request.id);
                                      }
                                    }}
                                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (request.request_source === 'teacher') {
                                        handleRejectTeacherChange(request.id);
                                      } else {
                                        handleRejectRequest(request.id);
                                      }
                                    }}
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
                              
                              {/* Teacher Profile Changes */}
                              {request.request_source === 'teacher' && (
                                <div className="space-y-3">
                                  {request.proposed_name && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Proposed Name:</p>
                                      <p className="text-sm bg-blue-50 p-2 rounded font-semibold text-primary">{request.proposed_name}</p>
                                    </div>
                                  )}
                                  {request.proposed_phone && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Proposed Phone:</p>
                                      <p className="text-sm bg-blue-50 p-2 rounded font-semibold text-primary">{request.proposed_phone}</p>
                                    </div>
                                  )}
                                  {request.proposed_bio && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Proposed Bio:</p>
                                      <p className="text-sm bg-blue-50 p-2 rounded font-semibold text-primary">{request.proposed_bio}</p>
                                    </div>
                                  )}
                                  {request.proposed_experience && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-1">Proposed Experience:</p>
                                      <p className="text-sm bg-blue-50 p-2 rounded font-semibold text-primary">{request.proposed_experience}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Student Requests */}
                              {(request.current_value || request.requested_value) && request.request_source === 'student' && (
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
                          Showing {((requestsPage - 1) * requestsPerPage) + 1} to {Math.min(requestsPage * requestsPerPage, getAllRequests().length)} of {getAllRequests().length} requests
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
                              {notification.notification_type === 'classroom_approval_request' && (
                                <Badge variant="outline" className="text-xs">
                                  Classroom Request
                                </Badge>
                              )}
                              {notification.notification_type === 'classroom_rejected' && (
                                <Badge variant="outline" className="text-xs">
                                  Classroom Rejected
                                </Badge>
                              )}
                              {notification.notification_type === 'trial_booking' && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Trial Booking
                                </Badge>
                              )}
                              {notification.notification_type === 'trial_assignment' && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Trial Assignment
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
                            {(notification.notification_type === 'classroom_approval_request' || 
                              (notification.notification_type === 'announcement' && 
                               notification.title?.includes('Classroom Approval Request'))) && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setActiveTab('teachers');
                                  setTeachersSubTab('classrooms');
                                }}
                                className="text-xs"
                              >
                                View Classroom Requests
                              </Button>
                            )}
                            {notification.notification_type === 'trial_booking' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setActiveTab('trials')}
                                className="text-xs bg-green-600 hover:bg-green-700"
                              >
                                View Trial Bookings
                              </Button>
                            )}
                            {notification.notification_type === 'trial_assignment' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setActiveTab('trials')}
                                className="text-xs bg-blue-600 hover:bg-blue-700"
                              >
                                View Trial Bookings
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Quote Management
                </h3>
                {quotesTotalPages > 1 && (
                  <Badge variant="outline" className="text-blue-600">Page {quotesPage} of {quotesTotalPages}</Badge>
                )}
              </div>
              <Input
                placeholder="Search by name, email, service, status..."
                value={quotesSearchTerm}
                onChange={(e) => setQuotesSearchTerm(e.target.value)}
                className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
              />
            </div>
            
            <div className="grid gap-4">
              {paginatedQuotes.map((quote) => (
                <Card key={quote.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-primary">{quote.name}</h4>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {quote.email}
                        </p>
                        {quote.phone != null && quote.phone !== '' && (
                          <p className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {quote.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{new Date(quote.created_at).toLocaleDateString()}</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 mb-4 space-y-2">
                      <h5 className="font-semibold text-accent mb-2">Service: {quote.service_category}</h5>
                      <p className="text-muted-foreground text-sm">
                        Project Type: {quote.project_type || 'N/A'}, Event Date: {quote.event_date || 'N/A'}, Location: {quote.location || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">Budget: {quote.budget_range || 'N/A'}, Timeline: {quote.timeline || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Preferred Contact: {quote.preferred_contact_method}</p>
                      {quote.specific_requirements && (
                        <p className="text-sm text-muted-foreground mt-2"><span className="font-medium">Specific requirements:</span> {quote.specific_requirements}</p>
                      )}
                      {quote.reference_materials_url && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Reference:</span>{' '}
                          <a href={quote.reference_materials_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{quote.reference_materials_url}</a>
                        </p>
                      )}
                      {quote.additional_notes && (
                        <p className="text-sm text-muted-foreground mt-2"><span className="font-medium">Additional Notes:</span> {quote.additional_notes}</p>
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
                        <Button size="sm" variant="outline" onClick={() => openQuoteDialog(quote)} title="Download quote PDF before sending to client">
                          <FileText className="h-4 w-4 mr-1" />
                          Download Quote
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openInvoiceDialog(quote)}>Generate Invoice</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {quotesTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((quotesPage - 1) * quotesPerPage) + 1} to {Math.min(quotesPage * quotesPerPage, filteredQuotes.length)} of {filteredQuotes.length} quotes
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuotesPage((p) => Math.max(1, p - 1))} disabled={quotesPage === 1} className="flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: quotesTotalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={page === quotesPage ? "default" : "outline"} size="sm" onClick={() => setQuotesPage(page)} className="w-8 h-8 p-0 text-xs">{page}</Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setQuotesPage((p) => Math.min(quotesTotalPages, p + 1))} disabled={quotesPage === quotesTotalPages} className="flex items-center gap-1">
                    Next <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
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
            <DialogFooter className="flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!selectedQuote) return;
                  const amount = parseFloat(quoteAmount) || 0;
                  const normalizedQuote = {
                    name: selectedQuote.name ?? '',
                    email: selectedQuote.email ?? '',
                    phone: selectedQuote.phone ?? null,
                    service_category: selectedQuote.service_category ?? '',
                    project_type: selectedQuote.project_type ?? null,
                    event_date: selectedQuote.event_date ?? null,
                    location: selectedQuote.location ?? null,
                    budget_range: selectedQuote.budget_range ?? null,
                    timeline: selectedQuote.timeline ?? null,
                    specific_requirements: selectedQuote.specific_requirements ?? null,
                    preferred_contact_method: selectedQuote.preferred_contact_method ?? 'email',
                    additional_notes: selectedQuote.additional_notes ?? null,
                    reference_materials_url: selectedQuote.reference_materials_url ?? null,
                  };
                  try {
                    const pdfBlob = await generateQuotePDF(normalizedQuote, amount, adminNotes, undefined, undefined);
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `quote-${selectedQuote.service_category?.replace(/\s+/g, '-') || 'quote'}-${selectedQuote.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast({
                      title: "Quote Downloaded",
                      description: "Quote PDF has been downloaded. You can review it before sending to the client.",
                    });
                  } catch (err) {
                    console.error("Error generating quote PDF:", err);
                    toast({
                      title: "Download Failed",
                      description: "Could not generate quote PDF. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Quote PDF
              </Button>
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

        {activeTab === 'gallery' && (
        <div>
          <AdminGalleryManager />
        </div>
        )}

        {activeTab === 'shop' && (
        <div>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Shop Management
              </h3>
            </div>
            
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <ShopProductManager />
              </TabsContent>
              <TabsContent value="orders">
                <ShopOrderManager />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        )}

        {activeTab === 'finances' && (
        <div>
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
                  <div className="bg-white/80 backdrop-blur-sm border border-primary/20 rounded-lg p-4 space-y-3">
                    <h4 className="text-lg font-semibold">Currency Conversion (Admin FX)</h4>
                    <p className="text-sm text-gray-600">
                      Use this rate for converting online/global ($) fees into KSh for invoices.
                    </p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex-1 min-w-[220px]">
                        <Label htmlFor="usdToKesRate" className="text-sm font-medium text-gray-700">1 USD =</Label>
                        <Input
                          id="usdToKesRate"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={usdToKesRateDraft}
                          onChange={(e) => setUsdToKesRateDraft(e.target.value)}
                          className="mt-1"
                          placeholder="e.g., 150.50"
                        />
                      </div>
                      <div className="pb-1 text-sm font-medium text-gray-700">KES</div>
                      <Button
                        onClick={async () => {
                          const rate = parseFloat(usdToKesRateDraft);
                          if (!rate || rate <= 0) {
                            toast({ title: 'Invalid Rate', description: 'Please enter a valid USD->KES rate.', variant: 'destructive' });
                            return;
                          }
                          setUsdToKesRateSaving(true);
                          try {
                            const { data: updated, error: updateError } = await (supabase as any)
                              .from('exchange_rate_settings')
                              .update({ rate } as any)
                              .eq('from_currency', 'USD')
                              .eq('to_currency', 'KES')
                              .select('id');

                            if (updateError) throw updateError;

                            if (!updated || updated.length === 0) {
                              const { error: insertError } = await (supabase as any)
                                .from('exchange_rate_settings')
                                .insert({ from_currency: 'USD', to_currency: 'KES', rate } as any);
                              if (insertError) throw insertError;
                            }

                            toast({ title: 'Saved', description: 'USD->KES exchange rate updated.' });
                          } catch (e) {
                            console.error('Failed to save USD->KES rate:', e);
                            toast({ title: 'Error', description: 'Failed to save exchange rate.', variant: 'destructive' });
                          } finally {
                            setUsdToKesRateSaving(false);
                          }
                        }}
                        disabled={usdToKesRateLoading || usdToKesRateSaving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {usdToKesRateSaving ? 'Saving...' : 'Save rate'}
                      </Button>
                    </div>
                  </div>

                  {futureInvoicePreview.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold text-amber-900">Future invoice cleanup</h4>
                          <p className="text-sm text-amber-800 mt-1">
                            {futureInvoicePreview.length} future-month invoice
                            {futureInvoicePreview.length === 1 ? '' : 's'} found
                            ({futureInvoicePreview.filter((row) => row.can_void).length} can be voided).
                            These were created by mistake and should not be billed yet.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          disabled={futureInvoiceCleanupLoading || futureInvoicePreview.every((row) => !row.can_void)}
                          onClick={() => void handleVoidFutureInvoices()}
                        >
                          {futureInvoiceCleanupLoading ? 'Cleaning up...' : 'Void future invoices'}
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-amber-100 rounded-md bg-white">
                        <table className="min-w-full text-xs">
                          <thead className="bg-amber-100/60">
                            <tr>
                              <th className="text-left p-2">Student</th>
                              <th className="text-left p-2">Billing period</th>
                              <th className="text-left p-2">Amount</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {futureInvoicePreview.slice(0, 20).map((row) => (
                              <tr key={row.invoice_id} className="border-t border-amber-50">
                                <td className="p-2">{row.student_name || row.student_id}</td>
                                <td className="p-2">{formatInvoiceBillingMonth(row) || '—'}</td>
                                <td className="p-2">KES {Number(row.amount_due).toLocaleString()}</td>
                                <td className="p-2">
                                  {row.can_void ? row.status : `${row.status} (skipped)`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {futureInvoicePreview.length > 20 && (
                          <p className="text-xs text-amber-700 p-2">
                            Showing 20 of {futureInvoicePreview.length} future invoices.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xl font-semibold">Invoice Management</h4>
                      {studentsNeedingInvoice.length > 0 && (
                        <Badge className="bg-red-500 text-white">{studentsNeedingInvoice.length} need invoice</Badge>
                      )}
                      {inUpcomingBillingPreview && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={bulkGeneratingUpcomingInvoices || studentsEligibleForUpcomingGeneration.length === 0}
                          onClick={() => void handleGenerateAllUpcomingInvoices()}
                        >
                          {bulkGeneratingUpcomingInvoices
                            ? 'Generating...'
                            : `Generate all ${upcomingBillingMonthLabel} invoices (${studentsEligibleForUpcomingGeneration.length})`}
                        </Button>
                      )}
                      {financesTotalPages > 1 && (
                        <Badge variant="outline" className="text-blue-600">Page {financesPage} of {financesTotalPages}</Badge>
                      )}
                    </div>
                    <Input
                      placeholder="Search by student name, course, email..."
                      value={financesSearchTerm}
                      onChange={(e) => setFinancesSearchTerm(e.target.value)}
                      className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
                    />
                  </div>
                  <div className="overflow-x-auto -mx-1 px-1">
                  <table className="min-w-full text-sm mb-6">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Invoice</th>
                        <th>Due</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Due Date</th>
                        <th className="whitespace-nowrap min-w-[26rem]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFinancesStudents.map(student => {
                        const period = getCalendarMonthPeriod();
                        const { invoice: inv } = resolveFinanceInvoiceForStudent(
                          allStudentInvoices,
                          student.id,
                          period
                        );
                        const sendAllowed = canSendInvoiceEmail(
                          allStudentInvoices,
                          student.id,
                          undefined,
                          ADMIN_BILLING_VISIBILITY
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
                            <td>
                              {inv ? (
                                <ManualInvoiceManager
                                  invoice={{ 
                                    ...inv, 
                                    students: { 
                                      student_name: student.student_name, 
                                      email: student.email,
                                      registration_id: student.registration_id,
                                      sessions_per_week: student.sessions_per_week
                                    } 
                                  }}
                                  onUpdate={() => {
                                    void (async () => {
                                      const validStudentIds = activeStudents.filter((s) => isValidId(s.id)).map((s) => s.id);
                                      if (validStudentIds.length === 0) return;
                                      const { data } = await supabase
                                        .from('invoices')
                                        .select('*')
                                        .in('student_id', validStudentIds)
                                        .order('period_end', { ascending: false });
                                      if (data) {
                                        const billableInvoices = filterInvoicesUpToCurrentMonth(data, undefined, ADMIN_BILLING_VISIBILITY);
                                        setAllStudentInvoices(billableInvoices);
                                        const p = getCalendarMonthPeriod();
                                        const currentPeriod: Record<string, any> = {};
                                        for (const studentId of validStudentIds) {
                                          const match = findInvoiceForFinancePeriod(billableInvoices, studentId, p);
                                          if (match) currentPeriod[studentId] = match;
                                        }
                                        setStudentInvoices(currentPeriod);
                                      }
                                    })();
                                  }}
                                />
                              ) : (
                                <span className="text-red-500">Not Sent</span>
                              )}
                            </td>
                            <td>{inv ? `KES ${getEffectiveAmountDue(inv).toLocaleString()}` : '-'}</td>
                            <td>{inv ? `KES ${getInvoiceAmountPaid(inv).toLocaleString()}` : '-'}</td>
                            <td>
                              {inv ? (
                                <span className={getInvoiceBalanceRemaining(inv) > 0 ? 'text-amber-700 font-medium' : 'text-green-700'}>
                                  KES {getInvoiceBalanceRemaining(inv).toLocaleString()}
                                  {inv.payment_status === 'partial' && (
                                    <Badge className="ml-1 bg-amber-100 text-amber-800 text-xs">partial</Badge>
                                  )}
                                  {inv.payment_status === 'paid' && (
                                    <Badge className="ml-1 bg-green-100 text-green-800 text-xs">paid</Badge>
                                  )}
                                </span>
                              ) : '-'}
                            </td>
                            <td>{inv ? inv.due_date : '-'}</td>
                            <td className="align-middle">
                              <div className="inline-flex flex-nowrap items-center gap-1.5">
                              {!inv ? (
                                <>
                                  <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap" disabled={!!previewInvoiceLoading} onClick={() => handlePreviewInvoice(student)}>
                                    {previewInvoiceLoading === student.id ? 'Opening...' : 'Preview'}
                                  </Button>
                                  <Button size="sm" variant="default" className="shrink-0 whitespace-nowrap" disabled={!sendAllowed || sendingInvoiceIds.includes(student.id)} onClick={() => handleSendInvoice(student)}>
                                    {sendingInvoiceIds.includes(student.id) ? 'Sending...' : 'Send Invoice'}
                                  </Button>
                                </>
                              ) : (
                                <>
                                <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap" onClick={() => handleViewInvoice(inv)}>View</Button>
                                <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap" disabled={!!previewInvoiceLoading} onClick={() => handlePreviewInvoice(student, inv)}>Preview</Button>
                                  {!isInvoiceFullyPaid(inv) && sendAllowed && (
                                    <Button size="sm" variant="default" className="shrink-0 whitespace-nowrap" disabled={sendingInvoiceIds.includes(student.id)} onClick={() => handleSendInvoice(student, inv)}>
                                      {sendingInvoiceIds.includes(student.id) ? 'Sending...' : 'Send Invoice'}
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="shrink-0 whitespace-nowrap px-2" onClick={() => handleOpenInvoiceHistory(student)}>
                                    All invoices
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="shrink-0 whitespace-nowrap"
                                    onClick={() => handleOpenInvoicePayments(inv, student)}
                                    title="Payments, receipts, record payment, download invoice PDF"
                                  >
                                    Payments
                                  </Button>
                                </>
                              )}
                              </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  {financesTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {((financesPage - 1) * financesPerPage) + 1} to {Math.min(financesPage * financesPerPage, filteredFinancesStudents.length)} of {filteredFinancesStudents.length} students
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setFinancesPage((p) => Math.max(1, p - 1))} disabled={financesPage === 1} className="flex items-center gap-1">
                          <ArrowLeft className="h-3 w-3" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: financesTotalPages }, (_, i) => i + 1).map((page) => (
                            <Button key={page} variant={page === financesPage ? "default" : "outline"} size="sm" onClick={() => setFinancesPage(page)} className="w-8 h-8 p-0 text-xs">{page}</Button>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setFinancesPage((p) => Math.min(financesTotalPages, p + 1))} disabled={financesPage === financesTotalPages} className="flex items-center gap-1">
                          Next <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
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
        )}

        {/* Learning Mode Requests Tab - Removed */}

        {/* Learning Mode Request Review Modal - Removed */}

        {activeTab === 'debug' && (
        <div>
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
            <FeeDebug />
          </div>
        </div>
        )}

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
        <Dialog open={showBulkSuspendDialog} onOpenChange={setShowBulkSuspendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Ban className="h-5 w-5" />
                Suspend {selectedStudentIds.size} selected student{selectedStudentIds.size === 1 ? '' : 's'}
              </DialogTitle>
              <DialogDescription>
                This will suspend all selected active accounts. Already suspended students will be skipped.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <p className="font-semibold mb-1">Warning</p>
                <p>Suspended students cannot access the portal or book classes until reactivated.</p>
              </div>
              <div>
                <Label htmlFor="bulk-suspension-reason" className="text-sm font-semibold">
                  Reason for suspension *
                </Label>
                <Textarea
                  id="bulk-suspension-reason"
                  value={bulkSuspensionReason}
                  onChange={(e) => setBulkSuspensionReason(e.target.value)}
                  placeholder="E.g., Non-payment of fees, violation of terms, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBulkSuspendDialog(false)}
                disabled={bulkStudentActionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleBulkSuspendStudents()}
                disabled={bulkStudentActionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkStudentActionLoading ? 'Suspending…' : 'Suspend selected'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={showInvoiceHistoryModal} onOpenChange={setShowInvoiceHistoryModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice History for {invoiceHistoryStudent?.student_name}</DialogTitle>
              {hiddenHistoryInvoiceCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {hiddenHistoryInvoiceCount} future-month invoice{hiddenHistoryInvoiceCount === 1 ? '' : 's'} hidden
                  (use Finances → Future invoices to review).
                </p>
              )}
            </DialogHeader>
            <div className="flex flex-wrap gap-2 justify-end">
              {invoiceHistory.some((inv) => !inv.pdf_url) && (
                <Button
                  size="sm"
                  variant="default"
                  disabled={generatingAllPdfs}
                  onClick={() => void handleGenerateAllMissingPdfs()}
                >
                  {generatingAllPdfs ? 'Generating PDFs...' : 'Generate all missing PDFs'}
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <table className="min-w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th>Billing period</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>PDF</th>
                    <th>Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceHistory.map(inv => (
                    <tr key={inv.id}>
                      <td>{formatInvoiceBillingMonth(inv)}</td>
                      <td>
                        {inv.payment_status || inv.status}
                        {inv.payment_status === 'partial' && (
                          <Badge className="ml-1 bg-amber-100 text-amber-800 text-xs">partial</Badge>
                        )}
                      </td>
                      <td>KES {getEffectiveAmountDue(inv).toLocaleString()}</td>
                      <td>KES {getInvoiceAmountPaid(inv).toLocaleString()}</td>
                      <td>KES {getInvoiceBalanceRemaining(inv).toLocaleString()}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generatingPdfInvoiceId === inv.id || generatingAllPdfs}
                          onClick={() => void handleDownloadInvoicePDF(inv)}
                        >
                          {generatingPdfInvoiceId === inv.id
                            ? 'Generating...'
                            : 'Download invoice PDF'}
                        </Button>
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => handleViewHistoryInvoice(inv)}>View</Button>
                        {invoiceHistoryStudent && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="ml-1"
                            onClick={() => handleOpenInvoicePayments(inv, invoiceHistoryStudent)}
                          >
                            Payments
                          </Button>
                        )}
                      </td>
                      <td>
                        {!isInvoiceFullyPaid(inv) && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleOpenRecordPayment(inv, invoiceHistoryStudent ?? undefined)}
                          >
                            Record Payment
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
                  <div><b>Billing period:</b> {formatInvoiceBillingMonth(selectedHistoryInvoice)}</div>
                  <div><b>Status:</b> {selectedHistoryInvoice.payment_status || selectedHistoryInvoice.status}</div>
                  <div><b>Amount due:</b> KES {getEffectiveAmountDue(selectedHistoryInvoice).toLocaleString()}</div>
                  <div><b>Paid:</b> KES {getInvoiceAmountPaid(selectedHistoryInvoice).toLocaleString()}</div>
                  <div><b>Balance:</b> KES {getInvoiceBalanceRemaining(selectedHistoryInvoice).toLocaleString()}</div>
                  <div><b>Notes:</b> {selectedHistoryInvoice.notes || '-'}</div>
                  {invoiceHistoryStudent && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-semibold mb-2">Invoice amount</p>
                      <ManualInvoiceManager
                        invoice={{
                          ...selectedHistoryInvoice,
                          students: {
                            student_name: invoiceHistoryStudent.student_name,
                            email: invoiceHistoryStudent.email,
                          },
                        }}
                        onUpdate={() => {
                          void (async () => {
                            if (!invoiceHistoryStudent?.id || !selectedHistoryInvoice?.id) return;
                            await fetchInvoiceHistory(invoiceHistoryStudent.id);
                            const { data: refreshed } = await supabase
                              .from('invoices')
                              .select('*')
                              .eq('id', selectedHistoryInvoice.id)
                              .single();
                            if (refreshed) setSelectedHistoryInvoice(refreshed);
                            const validStudentIds = activeStudents
                              .filter((s) => isValidId(s.id))
                              .map((s) => s.id);
                            if (validStudentIds.length > 0) {
                              const { data: allInv } = await supabase
                                .from('invoices')
                                .select('*')
                                .in('student_id', validStudentIds)
                                .order('period_end', { ascending: false });
                              if (allInv) {
                                const billableInvoices = filterInvoicesUpToCurrentMonth(
                                  allInv,
                                  undefined,
                                  ADMIN_BILLING_VISIBILITY
                                );
                                setAllStudentInvoices(billableInvoices);
                                const p = getCalendarMonthPeriod();
                                const currentPeriod: Record<string, any> = {};
                                for (const studentId of validStudentIds) {
                                  const match = findInvoiceForFinancePeriod(billableInvoices, studentId, p);
                                  if (match) currentPeriod[studentId] = match;
                                }
                                setStudentInvoices(currentPeriod);
                              }
                            }
                          })();
                        }}
                      />
                    </div>
                  )}
                  {invoiceHistoryStudent && (
                    <div className="mt-3 pt-3 border-t">
                      <InvoicePaymentsPanel
                        invoice={selectedHistoryInvoice}
                        student={invoiceHistoryStudent}
                        refreshKey={`${invoicePaymentsRefreshKey}-${selectedHistoryInvoice.id}`}
                      />
                    </div>
                  )}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={generatingPdfInvoiceId === selectedHistoryInvoice.id}
                      onClick={() => void handleDownloadInvoicePDF(selectedHistoryInvoice)}
                    >
                      {generatingPdfInvoiceId === selectedHistoryInvoice.id
                        ? 'Generating...'
                        : 'Download invoice PDF'}
                    </Button>
                    {!isInvoiceFullyPaid(selectedHistoryInvoice) && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 text-white ml-2"
                        onClick={() =>
                          handleOpenRecordPayment(selectedHistoryInvoice, invoiceHistoryStudent ?? undefined)
                        }
                      >
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <InvoicePaymentsDialog
          open={showInvoicePaymentsDialog}
          onOpenChange={(open) => {
            setShowInvoicePaymentsDialog(open);
            if (!open) {
              setPaymentsDialogInvoice(null);
              setPaymentsDialogStudent(null);
            }
          }}
          invoice={paymentsDialogInvoice}
          student={paymentsDialogStudent}
          refreshKey={invoicePaymentsRefreshKey}
          downloadingInvoicePdf={!!paymentsDialogInvoice && generatingPdfInvoiceId === paymentsDialogInvoice.id}
          onDownloadInvoicePdf={() => {
            if (paymentsDialogInvoice && paymentsDialogStudent) {
              void handleDownloadInvoicePDF(paymentsDialogInvoice, paymentsDialogStudent);
            }
          }}
          onRecordPayment={() => {
            if (paymentsDialogInvoice) {
              handleOpenRecordPayment(paymentsDialogInvoice, paymentsDialogStudent ?? undefined);
            }
          }}
        />
        <RecordInvoicePaymentDialog
          open={showRecordPaymentDialog}
          onOpenChange={(open) => {
            setShowRecordPaymentDialog(open);
            if (!open) {
              setPaymentDialogInvoice(null);
              setPaymentDialogStudent(null);
            }
          }}
          invoice={paymentDialogInvoice}
          studentName={paymentDialogStudent?.student_name}
          recordedBy={user?.id ?? undefined}
          onSuccess={handlePaymentRecorded}
        />

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

        {/* Schedule Trial Booking Modal */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Trial Class</DialogTitle>
              <DialogDescription>
                Schedule a trial class for {selectedTrialBooking?.student_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="teacher">Select Teacher *</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchAvailableTeachers}
                    className="text-xs"
                  >
                    Refresh Teachers
                  </Button>
                </div>
                <Select value={scheduleData.teacherId} onValueChange={(value) => setScheduleData(prev => ({ ...prev, teacherId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.length > 0 ? (
                      availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} - {teacher.email} ({teacher.status || 'no-status'})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-teachers" disabled>
                        No teachers available ({availableTeachers.length})
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Scheduled Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleData.scheduledDate}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="time">Scheduled Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleData.scheduledTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes..."
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={scheduleTrialBooking}>
                Schedule Trial Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Notes Modal */}
        <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Notes</DialogTitle>
              <DialogDescription>
                Add notes for {selectedTrialBooking?.student_name}'s trial booking
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this trial booking..."
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotesModal(false)}>
                Cancel
              </Button>
              <Button onClick={addNotesToTrialBooking}>
                Add Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default AdminPanel;