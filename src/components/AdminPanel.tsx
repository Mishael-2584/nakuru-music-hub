import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music, LogOut, Guitar, Piano, Mic, Clock, BookOpen, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'registrations' | 'messages' | 'students' | 'timetable'>('stats');
  const [searchTerm, setSearchTerm] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (regError) {
        console.error("Error fetching registrations:", regError);
        toast({
          title: "Error",
          description: "Failed to load registrations",
          variant: "destructive",
        });
      } else {
        setRegistrations(regData || []);
      }

      const { data: msgData, error: msgError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (msgError) {
        console.error("Error fetching messages:", msgError);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } else {
        setContactMessages(msgData || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/auth");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
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

  // Mock timetable data (in real app, this would come from database)
  const timetableSlots = [
    { time: '7:00 AM', monday: 'Piano - Sarah', tuesday: 'Guitar - John', wednesday: 'Voice - Emma', thursday: 'Piano - Mike', friday: 'Guitar - Lisa' },
    { time: '8:00 AM', monday: 'Voice - Tom', tuesday: 'Piano - Anna', wednesday: 'Guitar - Sam', thursday: 'Voice - Kate', friday: 'Piano - David' },
    { time: '9:00 AM', monday: 'Guitar - Ben', tuesday: 'Voice - Lucy', wednesday: 'Piano - Alex', thursday: 'Guitar - Nina', friday: 'Voice - Paul' },
    { time: '10:00 AM', monday: 'Piano - Grace', tuesday: 'Guitar - Mark', wednesday: 'Voice - Zoe', thursday: 'Piano - Jack', friday: 'Guitar - Sophie' },
    { time: '11:00 AM', monday: 'Voice - Oliver', tuesday: 'Piano - Mia', wednesday: 'Guitar - Ryan', thursday: 'Voice - Chloe', friday: 'Piano - Ethan' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="text-center">
          <Music className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <div className="text-lg text-muted-foreground">Loading your music academy dashboard...</div>
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
              Music Academy Dashboard
            </h2>
            <p className="text-xl text-muted-foreground">
              Orchestrating student success and managing musical journeys
            </p>
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

        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-primary/10">
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('stats')}
              className="rounded-xl px-6 py-3 transition-all duration-200"
            >
              <Piano className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'students' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('students')}
              className="rounded-xl px-6 py-3 transition-all duration-200"
            >
              <Users className="h-4 w-4 mr-2" />
              Active Students ({activeStudents.length})
            </Button>
            <Button
              variant={activeTab === 'timetable' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('timetable')}
              className="rounded-xl px-6 py-3 transition-all duration-200"
            >
              <Clock className="h-4 w-4 mr-2" />
              Timetable
            </Button>
            <Button
              variant={activeTab === 'registrations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('registrations')}
              className="rounded-xl px-6 py-3 transition-all duration-200"
            >
              <Guitar className="h-4 w-4 mr-2" />
              Registrations ({registrations.length})
            </Button>
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('messages')}
              className="rounded-xl px-6 py-3 transition-all duration-200"
            >
              <Mic className="h-4 w-4 mr-2" />
              Messages ({contactMessages.length})
            </Button>
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

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-center">
              Weekly Class Schedule Symphony
            </h3>
            
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/20">
                        <th className="text-left p-3 font-bold text-primary">Time</th>
                        <th className="text-left p-3 font-bold text-primary">Monday</th>
                        <th className="text-left p-3 font-bold text-primary">Tuesday</th>
                        <th className="text-left p-3 font-bold text-primary">Wednesday</th>
                        <th className="text-left p-3 font-bold text-primary">Thursday</th>
                        <th className="text-left p-3 font-bold text-primary">Friday</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetableSlots.map((slot, index) => (
                        <tr key={index} className="border-b border-primary/10 hover:bg-primary/5">
                          <td className="p-3 font-medium text-primary">{slot.time}</td>
                          <td className="p-3">
                            <div className="p-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded text-sm">
                              {slot.monday}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="p-2 bg-gradient-to-r from-accent/10 to-secondary/10 rounded text-sm">
                              {slot.tuesday}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="p-2 bg-gradient-to-r from-secondary/10 to-primary/10 rounded text-sm">
                              {slot.wednesday}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="p-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded text-sm">
                              {slot.thursday}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="p-2 bg-gradient-to-r from-accent/10 to-secondary/10 rounded text-sm">
                              {slot.friday}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
