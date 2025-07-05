import { useState, useEffect } from "react";
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
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

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

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsTeacher(false);
        setIsApproved(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        // First check if user is a teacher by email
        const { data: teacherProfile, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("email", user.email)
          .single();
        
        if (teacherProfile && !teacherError && teacherProfile.status === "approved") {
          setIsTeacher(true);
          setIsApproved(true);
          setProfile(teacherProfile);
          fetchTeacherData(teacherProfile.id);
          return; // Exit early if teacher is found and approved
        }

        // Check if user is a pending teacher
        const { data: pendingTeacher, error: pendingTeacherError } = await supabase
          .from("pending_teachers")
          .select("id")
          .eq("email", user.email)
          .single();
        
        if (pendingTeacher && !pendingTeacherError) {
          setIsTeacher(false);
          setIsApproved(false);
          navigate("/pending-teacher", { replace: true });
          return;
        }

        // If not a teacher, check if user is an admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile && !profileError && profile.role === 'admin') {
          navigate("/admin", { replace: true });
          return;
        }

        // If not admin or teacher, redirect to student dashboard
        navigate("/student", { replace: true });
        
      } catch (error) {
        console.error('Error checking user role:', error);
        // If there's an error, redirect to student dashboard as fallback
        navigate("/student", { replace: true });
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
        .eq('teacher_id', user?.id)
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

      // Mock time slots for now
      setTimeSlots([
        { id: '1', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', is_available: true },
        { id: '2', day_of_week: 'Monday', start_time: '10:00', end_time: '11:00', is_available: true },
        { id: '3', day_of_week: 'Tuesday', start_time: '14:00', end_time: '15:00', is_available: true },
        { id: '4', day_of_week: 'Wednesday', start_time: '16:00', end_time: '17:00', is_available: false },
      ]);

      // Mock materials
      setMaterials([
        { id: '1', title: 'Piano Fundamentals Guide', description: 'Basic hand positioning and technique', file_url: '/materials/piano-fundamentals.pdf' },
        { id: '2', title: 'Music Theory Basics', description: 'Introduction to reading music', file_url: '/materials/music-theory.pdf' },
        { id: '3', title: 'Practice Schedule Template', description: 'Weekly practice planning sheet', file_url: '/materials/practice-schedule.pdf' },
      ]);

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
          teacher_id: user.id,
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
    <main className="min-h-screen bg-gradient-to-br from-[#f8f6ff] via-[#f9f7fd] to-[#f6f8ff] py-0 px-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 pt-10 pb-20 px-2 md:px-8">
        {/* Sidebar/Profile */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/" className="group">
              <img src="/damon-logo.png" alt="Damon Music Academy Logo" className="h-12 w-12 rounded-lg shadow bg-white p-1 transition-transform duration-300 group-hover:scale-105 cursor-pointer" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent leading-tight">Teacher Portal</h1>
              <div className="flex items-center gap-2 mt-1">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Active</span>
              </div>
            </div>
          </div>
          <Card className="shadow-lg border-0 bg-white/95 p-0">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <UserCircle className="h-9 w-9 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold leading-tight">{profile?.name || user.email}</CardTitle>
                <CardDescription className="text-xs font-medium text-gray-500">{profile?.category}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="text-sm text-gray-700 mb-2">{profile?.bio}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">Experience: {profile?.experience || 'N/A'}</span>
                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs font-medium">Category: {profile?.category || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col gap-8">
          {/* Top Bar: Welcome + Sign Out */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex flex-col gap-1">
              <span className="text-base text-muted-foreground font-medium">Welcome,</span>
              <span className="text-2xl font-bold text-gray-900">{profile?.name || user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Active</span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10 ml-4"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="w-full flex justify-center mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-3xl">
              <TabsList className="w-full flex justify-between bg-white/90 shadow rounded-full p-1">
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
                    <div className="space-y-4">
                      {timeSlots.length > 0 ? (
                        timeSlots.map(slot => (
                          <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <ClockIcon className="w-5 h-5 text-blue-600" />
                              <div>
                                <h4 className="font-semibold">{slot.day_of_week}</h4>
                                <p className="text-sm text-gray-600">{slot.start_time} - {slot.end_time}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {slot.is_available ? 'Available' : 'Unavailable'}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
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
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TeacherDashboard; 