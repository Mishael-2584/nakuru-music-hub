import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Music, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Filter,
  Search,
  Star,
  Award,
  BookOpen,
  Users,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TrialBooking {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  age: string;
  instrument: string;
  skillLevel: string;
  preferredLocation: string;
  preferredTime: string;
  preferredDate?: string;
  experience: string;
  goals: string;
  specialRequirements: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'converted';
  assignedTeacher?: string;
  scheduledDateTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  instruments: string[];
  availability: string[];
}

const TrialClassManager = () => {
  const { toast } = useToast();
  const [trialBookings, setTrialBookings] = useState<TrialBooking[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<TrialBooking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockTrialBookings: TrialBooking[] = [
      {
        id: '1',
        studentName: 'Sarah Mwangi',
        parentName: 'John Mwangi',
        email: 'john.mwangi@email.com',
        phone: '+254 700 123 456',
        age: '12',
        instrument: 'Piano',
        skillLevel: 'Complete Beginner',
        preferredLocation: 'At the Academy',
        preferredTime: 'Afternoon (12:00 PM - 4:00 PM)',
        preferredDate: '2024-01-15',
        experience: 'No previous experience',
        goals: 'Learn to play classical music',
        specialRequirements: 'Left-handed student',
        status: 'pending',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z'
      },
      {
        id: '2',
        studentName: 'David Kimani',
        parentName: 'Mary Kimani',
        email: 'mary.kimani@email.com',
        phone: '+254 700 234 567',
        age: '15',
        instrument: 'Guitar',
        skillLevel: 'Beginner (some basics)',
        preferredLocation: 'Home Lesson (Nakuru CBD)',
        preferredTime: 'Evening (4:00 PM - 8:00 PM)',
        preferredDate: '2024-01-16',
        experience: 'Played guitar for 6 months',
        goals: 'Learn rock and pop songs',
        specialRequirements: '',
        status: 'scheduled',
        assignedTeacher: 'teacher-1',
        scheduledDateTime: '2024-01-16T16:00:00Z',
        createdAt: '2024-01-11T14:30:00Z',
        updatedAt: '2024-01-12T09:15:00Z'
      },
      {
        id: '3',
        studentName: 'Grace Wanjiku',
        parentName: 'Peter Wanjiku',
        email: 'peter.wanjiku@email.com',
        phone: '+254 700 345 678',
        age: '8',
        instrument: 'Violin',
        skillLevel: 'Complete Beginner',
        preferredLocation: 'At the Academy',
        preferredTime: 'Weekend Morning (8:00 AM - 12:00 PM)',
        preferredDate: '2024-01-20',
        experience: 'No previous experience',
        goals: 'Learn classical violin',
        specialRequirements: '',
        status: 'completed',
        assignedTeacher: 'teacher-2',
        scheduledDateTime: '2024-01-20T10:00:00Z',
        notes: 'Student showed great potential. Recommended for beginner violin course.',
        createdAt: '2024-01-12T16:45:00Z',
        updatedAt: '2024-01-20T11:30:00Z'
      }
    ];

    const mockTeachers: Teacher[] = [
      {
        id: 'teacher-1',
        name: 'James Mwangi',
        email: 'james@damonmusicacademy.com',
        instruments: ['Guitar', 'Bass Guitar', 'Music Theory'],
        availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      {
        id: 'teacher-2',
        name: 'Sarah Njeri',
        email: 'sarah@damonmusicacademy.com',
        instruments: ['Violin', 'Piano', 'Music Theory'],
        availability: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday']
      },
      {
        id: 'teacher-3',
        name: 'Peter Kiprop',
        email: 'peter@damonmusicacademy.com',
        instruments: ['Piano', 'Drums', 'Music Production'],
        availability: ['Tuesday', 'Thursday', 'Saturday', 'Sunday']
      }
    ];

    setTrialBookings(mockTrialBookings);
    setTeachers(mockTeachers);
    setIsLoading(false);
  }, []);

  const filteredBookings = trialBookings.filter(booking => {
    const matchesSearch = 
      booking.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.instrument.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'scheduled': return Calendar;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'converted': return Star;
      default: return AlertCircle;
    }
  };

  const handleScheduleTrial = (booking: TrialBooking) => {
    setSelectedBooking(booking);
    setShowScheduleModal(true);
  };

  const handleAddNotes = (booking: TrialBooking) => {
    setSelectedBooking(booking);
    setShowNotesModal(true);
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setTrialBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any, updatedAt: new Date().toISOString() }
          : booking
      )
    );
    
    toast({
      title: "Status Updated",
      description: `Trial booking status updated to ${newStatus}`,
    });
  };

  const stats = {
    total: trialBookings.length,
    pending: trialBookings.filter(b => b.status === 'pending').length,
    scheduled: trialBookings.filter(b => b.status === 'scheduled').length,
    completed: trialBookings.filter(b => b.status === 'completed').length,
    converted: trialBookings.filter(b => b.status === 'converted').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trial Class Management</h1>
          <p className="text-muted-foreground">Manage trial class bookings and conversions</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Trial Booking
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.converted}</div>
                <div className="text-sm text-muted-foreground">Converted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by student name, parent, email, or instrument..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
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

      {/* Trial Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => {
          const StatusIcon = getStatusIcon(booking.status);
          return (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{booking.studentName}</h3>
                      <Badge className={getStatusColor(booking.status)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{booking.parentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span>{booking.instrument} • {booking.skillLevel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.preferredLocation}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{booking.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{booking.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{booking.preferredTime}</span>
                      </div>
                    </div>
                    
                    {booking.scheduledDateTime && (
                      <div className="mt-2 text-sm text-blue-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Scheduled: {format(new Date(booking.scheduledDateTime), 'PPP p')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {booking.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduleTrial(booking)}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddNotes(booking)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Select
                      value={booking.status}
                      onValueChange={(value) => handleStatusChange(booking.id, value)}
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
          );
        })}
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trial Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student Name</Label>
                  <p className="font-medium">{selectedBooking.studentName}</p>
                </div>
                <div>
                  <Label>Age</Label>
                  <p className="font-medium">{selectedBooking.age} years old</p>
                </div>
                <div>
                  <Label>Parent/Guardian</Label>
                  <p className="font-medium">{selectedBooking.parentName}</p>
                </div>
                <div>
                  <Label>Instrument</Label>
                  <p className="font-medium">{selectedBooking.instrument}</p>
                </div>
                <div>
                  <Label>Skill Level</Label>
                  <p className="font-medium">{selectedBooking.skillLevel}</p>
                </div>
                <div>
                  <Label>Preferred Location</Label>
                  <p className="font-medium">{selectedBooking.preferredLocation}</p>
                </div>
              </div>
              
              <div>
                <Label>Previous Experience</Label>
                <p className="text-muted-foreground">{selectedBooking.experience}</p>
              </div>
              
              <div>
                <Label>Learning Goals</Label>
                <p className="text-muted-foreground">{selectedBooking.goals}</p>
              </div>
              
              {selectedBooking.specialRequirements && (
                <div>
                  <Label>Special Requirements</Label>
                  <p className="text-muted-foreground">{selectedBooking.specialRequirements}</p>
                </div>
              )}
              
              {selectedBooking.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-muted-foreground">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Trial Class</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <p className="font-medium">{selectedBooking.studentName}</p>
              </div>
              <div>
                <Label>Instrument</Label>
                <p className="font-medium">{selectedBooking.instrument}</p>
              </div>
              <div>
                <Label>Assign Teacher</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter(teacher => teacher.instruments.includes(selectedBooking.instrument))
                      .map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule Date & Time</Label>
                <Input type="datetime-local" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleStatusChange(selectedBooking.id, 'scheduled');
                  setShowScheduleModal(false);
                }}>
                  Schedule Trial
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <p className="font-medium">{selectedBooking.studentName}</p>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Add notes about the trial class, student progress, recommendations..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNotesModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowNotesModal(false)}>
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrialClassManager;


