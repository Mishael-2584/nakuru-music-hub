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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
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

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

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
        .in('lesson_id', lessonsData?.map(l => l.id) || [])
        .order('created_at', { ascending: false });

      if (!materialsError && materialsData) {
        setMaterials(materialsData);
      }

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
          <TabsList className="grid w-full grid-cols-8 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
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
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Log New Practice Session
                      </Button>
                    </DialogTrigger>
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
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send New Message
                      </Button>
                    </DialogTrigger>
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
                        <input
                          type="text"
                          value={studentProfile.student_name}
                          className="w-full p-2 border rounded-md"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={studentProfile.email}
                          className="w-full p-2 border rounded-md"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={studentProfile.phone}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
                        <input
                          type="text"
                          value={studentProfile.instrument}
                          className="w-full p-2 border rounded-md"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4">Course Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                        <input
                          type="text"
                          value={studentProfile.experience}
                          className="w-full p-2 border rounded-md"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                        <input
                          type="text"
                          value={studentProfile.proficiency_level}
                          className="w-full p-2 border rounded-md"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button>Update Profile</Button>
                    <Button variant="outline">Change Password</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard; 