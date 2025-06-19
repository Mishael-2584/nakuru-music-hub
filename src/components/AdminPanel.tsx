import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music, LogOut, Guitar, Piano, Mic, Clock, BookOpen, Star, Shield, UserCog, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AdminEventsManager from "./AdminEventsManager";
import AdminNewsManager from "./AdminNewsManager";

interface Registration {
  id: string;
  student_name: string;
  age: number;
  email: string;
  phone: string;
  parent_name?: string;
  parent_phone?: string;
  instrument: string;
  experience: string;
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
  const [activeTab, setActiveTab] = useState<'stats' | 'registrations' | 'messages' | 'students' | 'schedule' | 'events' | 'news' | 'admins'>('stats');
  const [searchTerm, setSearchTerm] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('admin');
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      // Get user's role
      console.log("AdminPanel: Fetching user profile...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
      } else {
        console.log("AdminPanel: User role:", profile?.role);
        setUserRole(profile?.role || 'admin');
      }

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
      if (profile?.role === 'super_admin') {
        console.log("AdminPanel: Fetching admin profiles...");
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
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
  const filteredRegistrations = registrations.filter(reg =>
    reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.instrument.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full shadow-2xl">
                <Music className="h-12 w-12 text-white" />
              </div>
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
              variant={activeTab === 'news' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('news')}
              className="rounded-xl px-4 py-3 transition-all duration-200 whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              News
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
        {activeTab === 'stats' && (
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
        )}

        {/* Events Tab */}
        {activeTab === 'events' && <AdminEventsManager />}

        {/* News Tab */}
        {activeTab === 'news' && <AdminNewsManager />}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
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
        )}

        {/* Admin Management Tab (Super Admin Only) */}
        {activeTab === 'admins' && userRole === 'super_admin' && (
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
        )}

        {/* Active Students Tab */}
        {activeTab === 'students' && (
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
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Student Registration Symphony
              </h3>
              <Input
                placeholder="Search by name or instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm bg-white/80 backdrop-blur-sm border-primary/20"
              />
            </div>
            
            <div className="grid gap-4">
              {filteredRegistrations.map((registration) => (
                <Card key={registration.id} className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-primary">{registration.student_name}</h4>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Age: {registration.age} • Instrument: {registration.instrument}
                        </p>
                      </div>
                      <Badge className={getStatusColor(registration.status)}>
                        {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{registration.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{registration.phone}</span>
                      </div>
                    </div>

                    {registration.goals && (
                      <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm font-medium text-primary mb-1">Musical Goals:</p>
                        <p className="text-sm text-muted-foreground">{registration.goals}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Registered: {new Date(registration.created_at).toLocaleDateString()}
                      </span>
                      <div className="space-x-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateRegistrationStatus(registration.id, 'approved')}
                          disabled={registration.status === 'approved'}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
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
        )}
      </div>
    </section>
  );
};

export default AdminPanel;