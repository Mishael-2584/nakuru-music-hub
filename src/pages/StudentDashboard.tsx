import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar, CalendarDays, BookOpen, Clock, BarChart3, MessageSquare, CreditCard, User, LogOut, Bell, Music, FileText, Users, Calendar as CalendarIcon, Target, TrendingUp } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import PasswordChangePrompt from '../components/PasswordChangePrompt';
import { useNavigate } from 'react-router-dom';

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
  date: string;
  time: string;
  duration: number;
  instructor: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface PracticeLog {
  id: string;
  date: string;
  duration: number;
  piece: string;
  notes: string;
  created_at: string;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_date?: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordChecked, setPasswordChecked] = useState(false);

  useEffect(() => {
    if (user) {
      checkPasswordStatus();
    }
  }, [user]);

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
    // Update user metadata to set password_changed: true
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

      // Mock data for now - in production, these would come from your database
      setLessons([
        {
          id: '1',
          title: 'Piano Fundamentals',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          instructor: 'Ms. Sarah Johnson',
          status: 'scheduled',
          notes: 'Focus on hand positioning and basic scales'
        },
        {
          id: '2',
          title: 'Music Theory',
          date: '2024-01-17',
          time: '15:30',
          duration: 45,
          instructor: 'Mr. David Chen',
          status: 'scheduled'
        }
      ]);

      setPracticeLogs([
        {
          id: '1',
          date: '2024-01-14',
          duration: 45,
          piece: 'Minuet in G Major',
          notes: 'Practiced scales and worked on dynamics',
          created_at: '2024-01-14T10:00:00Z'
        }
      ]);

      setMessages([
        {
          id: '1',
          from: 'Ms. Sarah Johnson',
          subject: 'Great progress this week!',
          message: 'Your technique has improved significantly. Keep up the good work!',
          is_read: false,
          created_at: '2024-01-13T09:00:00Z'
        }
      ]);

      setPayments([
        {
          id: '1',
          amount: 15000,
          description: 'January 2024 Tuition',
          status: 'paid',
          due_date: '2024-01-05',
          paid_date: '2024-01-03'
        },
        {
          id: '2',
          amount: 15000,
          description: 'February 2024 Tuition',
          status: 'pending',
          due_date: '2024-02-05'
        }
      ]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
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

  // Show password change prompt if needed
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
                  <div className="text-2xl font-bold">{practiceLogs.reduce((acc, log) => acc + log.duration, 0)}</div>
                  <p className="text-xs text-muted-foreground">Hours this month</p>
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
                            <p className="text-sm text-gray-600">{formatDate(lesson.date)} at {formatTime(lesson.time)}</p>
                            <p className="text-sm text-gray-600">with {lesson.instructor}</p>
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
                            <h4 className="font-semibold">{log.piece}</h4>
                            <p className="text-sm text-gray-600">{log.duration} minutes</p>
                            <p className="text-sm text-gray-600">{formatDate(log.date)}</p>
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
                  {lessons.map(lesson => (
                    <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">{lesson.title}</h4>
                          <p className="text-sm text-gray-600">{formatDate(lesson.date)} at {formatTime(lesson.time)}</p>
                          <p className="text-sm text-gray-600">Duration: {lesson.duration} minutes</p>
                          <p className="text-sm text-gray-600">Instructor: {lesson.instructor}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                        {lesson.notes && (
                          <Button variant="outline" size="sm">View Notes</Button>
                        )}
                      </div>
                    </div>
                  ))}
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
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold">Piano Fundamentals</h4>
                          <p className="text-sm text-gray-600">Basic hand positioning guide</p>
                          <p className="text-xs text-gray-500">Updated 2 days ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Music className="w-8 h-8 text-green-600" />
                        <div>
                          <h4 className="font-semibold">Scales Practice</h4>
                          <p className="text-sm text-gray-600">C major scale exercises</p>
                          <p className="text-xs text-gray-500">Updated 1 week ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Target className="w-8 h-8 text-purple-600" />
                        <div>
                          <h4 className="font-semibold">Theory Assignment</h4>
                          <p className="text-sm text-gray-600">Week 3 homework</p>
                          <p className="text-xs text-gray-500">Due in 3 days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  <Button className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Log New Practice Session
                  </Button>
                  
                  <div className="space-y-4">
                    {practiceLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{log.piece}</h4>
                          <p className="text-sm text-gray-600">{log.duration} minutes</p>
                          <p className="text-sm text-gray-600">{formatDate(log.date)}</p>
                          <p className="text-sm text-gray-600">{log.notes}</p>
                        </div>
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                    ))}
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
                        <span className="font-semibold">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attended</span>
                        <span className="font-semibold text-green-600">22</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attendance Rate</span>
                        <span className="font-semibold text-blue-600">91.7%</span>
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
                        <span>Pieces Mastered</span>
                        <span className="font-semibold">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Practice Hours</span>
                        <span className="font-semibold">45</span>
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
                  <Button className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send New Message
                  </Button>
                  
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className={`p-4 border rounded-lg ${!message.is_read ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{message.subject}</h4>
                          <div className="flex items-center space-x-2">
                            {!message.is_read && <Badge variant="secondary">New</Badge>}
                            <span className="text-sm text-gray-500">{formatDate(message.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">From: {message.from}</p>
                        <p className="text-gray-700">{message.message}</p>
                      </div>
                    ))}
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
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0))}</div>
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
                    {payments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{payment.description}</h4>
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
                    ))}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Category</label>
                        <input
                          type="text"
                          value={studentProfile.course_category}
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