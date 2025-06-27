import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music, LogOut, Guitar, Piano, Mic, Clock, BookOpen, Star, Shield, UserCog, Eye, Newspaper, Palette, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import AdminEventsManager from "@/components/AdminEventsManager";
import AdminNewsManager from "@/components/AdminNewsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sendAcceptedEmail, sendDeclinedEmail } from "@/lib/emailService";

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
  const [activeTab, setActiveTab] = useState<'stats' | 'registrations' | 'messages' | 'students' | 'schedule' | 'events' | 'admins'>('stats');
  const [searchTerm, setSearchTerm] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('admin');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

      console.log("AdminPanel: Fetching contact messages...");
      const { data: msgData, error: msgError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (msgError) {
        console.error("Error fetching messages:", msgError);
        toast({
          title: "Error",
          description: "Failed to load messages: " + msgError.message,
          variant: "destructive",
        });
      } else {
        console.log("AdminPanel: Messages fetched successfully:", msgData?.length || 0, "records");
        setContactMessages(msgData || []);
      }

      // Fetch admin profiles for super admin
      if (userRole === 'super_admin') {
        console.log("AdminPanel: Fetching admin profiles...");
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
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/auth");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out from Damon Music Academy.",
      });
    }
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
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

      // If approved, send acceptance email with login credentials
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
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete the registration for ${studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting registration:", error);
        toast({
          title: "Error",
          description: "Failed to delete registration",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setRegistrations(prev => prev.filter(reg => reg.id !== id));

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

  const markMessageAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error("Error marking message as read:", error);
        return;
      }

      setContactMessages(prev => 
        prev.map(msg => 
          msg.id === id ? { ...msg, is_read: true } : msg
        )
      );

      toast({
        title: "Message marked as read",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
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

  const activeStudents = registrations.filter(reg => reg.status === 'approved');
  const filteredRegistrations = registrations.filter(reg => {
    const term = searchTerm.trim().toLowerCase();
    return (
      (reg.student_name || '').toLowerCase().includes(term) ||
      (reg.instrument || '').toLowerCase().includes(term) ||
      (reg.course_category || '').toLowerCase().includes(term) ||
      (reg.location || '').toLowerCase().includes(term) ||
      (reg.email || '').toLowerCase().includes(term) ||
      (reg.production_type || '').toLowerCase().includes(term)
    );
  });

  const pendingCount = registrations.filter(reg => reg.status === 'pending').length;
  const unreadMessages = contactMessages.filter(msg => !msg.is_read).length;

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
    <section id="admin" className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-16">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-6">
              <Link to="/" className="group">
                <img 
                  alt="Damon Music Academy Logo" 
                  src="/damon-logo.png" 
                  className="h-16 sm:h-20 object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer" 
                />
              </Link>
            </div>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Damon Music Academy Dashboard
            </h2>
            <p className="text-xl text-muted-foreground">
              {userRole === 'super_admin' ? 'Super Admin Panel - Full System Access' : 'Orchestrating student success and managing musical journeys'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {userRole === 'super_admin' ? (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                  <UserCog className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-primary/10 flex gap-2">
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('stats')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <Piano className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'students' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('students')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-2" />
              Students ({activeStudents.length})
            </Button>
            <Button
              variant={activeTab === 'registrations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('registrations')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <Guitar className="h-4 w-4 mr-2" />
              Applications ({registrations.length})
            </Button>
            <Button
              variant={activeTab === 'events' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('events')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </Button>
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('messages')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <Mic className="h-4 w-4 mr-2" />
              Messages ({contactMessages.length})
            </Button>
            <Button
              variant={activeTab === 'schedule' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('schedule')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            {userRole === 'super_admin' && (
              <Button
                variant={activeTab === 'admins' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('admins')}
                className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admins ({adminProfiles.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                    <p className="text-3xl font-bold text-primary">{activeStudents.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently enrolled</p>
                  </div>
                  <div className="p-3 bg-primary/20 rounded-full">
                    <Star className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                    <p className="text-3xl font-bold text-accent">{pendingCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                  </div>
                  <div className="p-3 bg-accent/20 rounded-full">
                    <Calendar className="h-8 w-8 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-secondary/10 to-secondary/5 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">New Messages</p>
                    <p className="text-3xl font-bold text-secondary">{unreadMessages}</p>
                    <p className="text-xs text-muted-foreground mt-1">Unread inquiries</p>
                  </div>
                  <div className="p-3 bg-secondary/20 rounded-full">
                    <Mail className="h-8 w-8 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-green-100 to-green-50 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                    <p className="text-3xl font-bold text-green-600">{registrations.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All applications</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <BookOpen className="h-8 w-8 text-green-600" />
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
                return (
                  <Card key={student.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full">
                            <InstrumentIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-primary">{student.student_name}</h4>
                            <p className="text-muted-foreground">Age: {student.age} • {student.instrument}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{student.phone}</span>
                        </div>
                      </div>

                      {student.goals && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-sm font-medium text-primary mb-1">Learning Goals:</p>
                          <p className="text-sm text-muted-foreground">{student.goals}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">
                          Enrolled: {new Date(student.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-medium text-primary">Experience: {student.experience}</span>
                      </div>
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
              Musical Conversations
            </h3>
            
            <div className="grid gap-4">
              {contactMessages.map((message) => (
                <Card key={message.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-primary">{message.name}</h4>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {message.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!message.is_read && (
                          <Badge variant="destructive">New Melody</Badge>
                        )}
                        <Badge variant="outline">{new Date(message.created_at).toLocaleDateString()}</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 mb-4">
                      <h5 className="font-semibold text-accent mb-2">{message.subject}</h5>
                      <p className="text-muted-foreground">{message.message}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!message.is_read && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markMessageAsRead(message.id)}
                          className="bg-white/80 border-primary/20 hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;