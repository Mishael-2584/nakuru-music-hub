
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Phone, Calendar, Music } from "lucide-react";
import { useState } from "react";

// Mock data for demonstration
const mockRegistrations = [
  {
    id: 1,
    studentName: "Sarah Johnson",
    age: 12,
    email: "sarah.j@email.com",
    phone: "0701 234 567",
    instrument: "Piano",
    experience: "Beginner",
    status: "pending",
    submittedAt: "2024-06-10"
  },
  {
    id: 2,
    studentName: "Michael Chen",
    age: 8,
    email: "m.chen@email.com",
    phone: "0735 456 789",
    instrument: "Guitar",
    experience: "Some Experience",
    status: "approved",
    submittedAt: "2024-06-09"
  },
  {
    id: 3,
    studentName: "Emma Wilson",
    age: 15,
    email: "emma.w@email.com",
    phone: "0721 678 901",
    instrument: "Voice Training",
    experience: "Intermediate",
    status: "pending",
    submittedAt: "2024-06-11"
  }
];

const mockContactMessages = [
  {
    id: 1,
    name: "John Doe",
    email: "john@email.com",
    subject: "Group lessons inquiry",
    message: "Hi, I'm interested in group piano lessons for my family...",
    submittedAt: "2024-06-11"
  },
  {
    id: 2,
    name: "Mary Smith",
    email: "mary@email.com",
    subject: "Pricing information",
    message: "Could you please send me information about your pricing...",
    submittedAt: "2024-06-10"
  }
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'registrations' | 'messages' | 'stats'>('registrations');
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRegistrations = mockRegistrations.filter(reg =>
    reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.instrument.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="admin" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Panel
          </h2>
          <p className="text-xl text-muted-foreground">
            Manage registrations and messages from students and parents
          </p>
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
              Registrations
            </Button>
            <Button
              variant={activeTab === 'messages' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('messages')}
              className="rounded-md"
            >
              <Mail className="h-4 w-4 mr-2" />
              Messages
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
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-3xl font-bold text-primary">127</p>
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
                    <p className="text-3xl font-bold text-accent">12</p>
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
                    <p className="text-3xl font-bold text-secondary">8</p>
                  </div>
                  <Mail className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-100 to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
                    <p className="text-3xl font-bold text-green-600">15</p>
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
                        <h4 className="text-xl font-bold">{registration.studentName}</h4>
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
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Submitted: {registration.submittedAt}
                      </span>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">View Details</Button>
                        <Button variant="default" size="sm">Approve</Button>
                        <Button variant="destructive" size="sm">Reject</Button>
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
              {mockContactMessages.map((message) => (
                <Card key={message.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold">{message.name}</h4>
                        <p className="text-muted-foreground">{message.email}</p>
                      </div>
                      <Badge variant="outline">{message.submittedAt}</Badge>
                    </div>
                    
                    <h5 className="font-semibold mb-2">{message.subject}</h5>
                    <p className="text-muted-foreground mb-4">{message.message}</p>
                    
                    <div className="flex space-x-2">
                      <Button variant="default" size="sm">Reply</Button>
                      <Button variant="outline" size="sm">Mark as Read</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
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
