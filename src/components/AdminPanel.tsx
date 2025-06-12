
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music, LogOut } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'registrations' | 'messages' | 'stats'>('registrations');
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
      // Fetch registrations
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

      // Fetch contact messages
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

  const filteredRegistrations = registrations.filter(reg =>
    reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.instrument.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = registrations.filter(reg => reg.status === 'pending').length;
  const unreadMessages = contactMessages.filter(msg => !msg.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <section id="admin" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-16">
          <div className="text-center flex-1">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-xl text-muted-foreground">
              Manage registrations and messages from students and parents
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg border">
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('stats')}
              className="rounded-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'registrations' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('registrations')}
              className="rounded-md"
            >
              <Music className="h-4 w-4 mr-2" />
              Registrations ({registrations.length})
            </Button>
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('messages')}
              className="rounded-md"
            >
              <Mail className="h-4 w-4 mr-2" />
              Messages ({contactMessages.length})
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                    <p className="text-3xl font-bold text-primary">{registrations.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-gradient-to-br from-accent/10 to-accent/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                    <p className="text-3xl font-bold text-accent">{pendingCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-gradient-to-br from-secondary/10 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">New Messages</p>
                    <p className="text-3xl font-bold text-secondary">{unreadMessages}</p>
                  </div>
                  <Mail className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-100 to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                    <p className="text-3xl font-bold text-green-600">{contactMessages.length}</p>
                  </div>
                  <Music className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Student Registrations</h3>
              <Input
                placeholder="Search by name or instrument..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="grid gap-4">
              {filteredRegistrations.map((registration) => (
                <Card key={registration.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold">{registration.student_name}</h4>
                        <p className="text-muted-foreground">Age: {registration.age} • {registration.instrument}</p>
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
                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground">Goals:</p>
                        <p className="text-sm">{registration.goals}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Submitted: {new Date(registration.created_at).toLocaleDateString()}
                      </span>
                      <div className="space-x-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateRegistrationStatus(registration.id, 'approved')}
                          disabled={registration.status === 'approved'}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateRegistrationStatus(registration.id, 'rejected')}
                          disabled={registration.status === 'rejected'}
                        >
                          Reject
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
            <h3 className="text-2xl font-bold">Contact Messages</h3>
            
            <div className="grid gap-4">
              {contactMessages.map((message) => (
                <Card key={message.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold">{message.name}</h4>
                        <p className="text-muted-foreground">{message.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!message.is_read && (
                          <Badge variant="destructive">New</Badge>
                        )}
                        <Badge variant="outline">{new Date(message.created_at).toLocaleDateString()}</Badge>
                      </div>
                    </div>
                    
                    <h5 className="font-semibold mb-2">{message.subject}</h5>
                    <p className="text-muted-foreground mb-4">{message.message}</p>
                    
                    <div className="flex space-x-2">
                      {!message.is_read && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => markMessageAsRead(message.id)}
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
