import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Video, 
  Users, 
  Clock, 
  Plus, 
  X, 
  Search, 
  Send,
  Copy,
  ExternalLink,
  Settings,
  UserPlus,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  createInstantMeeting, 
  sendMeetingInvitations,
  InstantMeeting 
} from '../lib/videoConferencing';
import { supabase } from '../integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'student' | 'teacher' | 'admin';
  profile_photo_url?: string;
}

interface InstantMeetModalProps {
  open: boolean;
  onClose: () => void;
  hostId: string;
  hostName: string;
  hostRole: 'teacher' | 'admin';
  onMeetingCreated?: (meeting: InstantMeeting) => void;
}

const InstantMeetModal = ({
  open,
  onClose,
  hostId,
  hostName,
  hostRole,
  onMeetingCreated
}) => {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    maxParticipants: 50,
    isPublic: false,
    allowRecording: false,
    isScheduled: false,
    scheduledDate: '',
    scheduledTime: ''
  });
  
  // Participant management
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'participants' | 'review'>('details');
  
  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        duration: 60,
        maxParticipants: 50,
        isPublic: false,
        allowRecording: false,
        isScheduled: false,
        scheduledDate: '',
        scheduledTime: ''
      });
      setSelectedParticipants([]);
      setSearchTerm('');
      setCurrentStep('details');
    }
  }, [open]);
  
  // Fetch available users when modal opens
  useEffect(() => {
    if (open && currentStep === 'participants') {
      fetchAvailableUsers();
    }
  }, [open, currentStep]);
  
  const fetchAvailableUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Fetch students and teachers
      const [studentsResponse, teachersResponse] = await Promise.all([
        supabase.from('students').select('id, student_name, email, user_id').eq('status', 'active'),
        supabase.from('teachers').select('id, name, email, user_id').eq('status', 'approved')
      ]);
      
      const users: User[] = [];
      
      // Add students
      if (studentsResponse.data) {
        users.push(...studentsResponse.data
          .filter((s: any) => s.user_id && s.user_id !== hostId)
          .map((s: any) => ({
            id: s.user_id,
            name: s.student_name,
            email: s.email,
            role: 'student' as const
          }))
        );
      }
      
      // Add teachers
      if (teachersResponse.data) {
        users.push(...teachersResponse.data
          .filter((t: any) => t.user_id && t.user_id !== hostId)
          .map((t: any) => ({
            id: t.user_id,
            name: t.name,
            email: t.email,
            role: 'teacher' as const
          }))
        );
      }
      
      // Add admin users if host is admin
      if (hostRole === 'admin') {
        const adminResponse = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .in('role', ['admin', 'super_admin'])
          .neq('id', hostId);
          
        if (adminResponse.data) {
          users.push(...adminResponse.data.map((a: any) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            role: 'admin' as const
          })));
        }
      }
      
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleAddParticipant = (user: User) => {
    if (!selectedParticipants.find(p => p.id === user.id)) {
      setSelectedParticipants([...selectedParticipants, user]);
    }
  };
  
  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== userId));
  };
  
  const handleCreateMeeting = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing Meeting Title",
        description: "Please provide a title for your meeting to help participants identify it.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.isPublic && selectedParticipants.length === 0) {
      toast({
        title: "No Participants Selected", 
        description: "Please select at least one participant or enable 'Public Meeting' to allow anyone to join with the meeting code.",
        variant: "destructive"
      });
      return;
    }

    // Validate scheduled time if meeting is scheduled
    let scheduledStartTime;
    if (formData.isScheduled) {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        toast({
          title: "Incomplete Schedule Information",
          description: "Please select both date and time for your scheduled meeting.",
          variant: "destructive"
        });
        return;
      }
      
      scheduledStartTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();
      const now = new Date();
      const scheduledDateTime = new Date(scheduledStartTime);
      
      if (scheduledDateTime <= now) {
        const minFutureTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        toast({
          title: "Invalid Schedule Time",
          description: `Scheduled time must be at least 5 minutes in the future. Current time: ${now.toLocaleTimeString()}`,
          variant: "destructive"
        });
        return;
      }
      
      // Check if scheduled time is too far in the future (optional validation)
      const maxFutureTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      if (scheduledDateTime > maxFutureTime) {
        toast({
          title: "Schedule Too Far Ahead",
          description: "Meeting can only be scheduled up to 30 days in advance.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsCreating(true);
    try {
      // Create the meeting
      const meeting = await createInstantMeeting({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        hostId,
        hostName,
        hostRole,
        participants: selectedParticipants.map(p => p.id),
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        isPublic: formData.isPublic,
        allowRecording: formData.allowRecording,
        scheduledStartTime
      });

      // Send invitations if there are participants
      if (selectedParticipants.length > 0) {
        await sendMeetingInvitations(
          meeting.id,
          hostId,
          hostName,
          selectedParticipants.map(p => p.id),
          meeting.title,
          meeting.meetingUrl,
          meeting.meetingCode,
          scheduledStartTime
        );
      }

      const zoomNote = meeting.alternativeHostEmail
        ? ` You will join as co-host (${meeting.alternativeHostEmail}).`
        : meeting.zoomHostEmail
          ? ` Academy Zoom: ${meeting.zoomHostEmail}.`
          : '';
      toast({
        title: formData.isScheduled ? "Meeting Scheduled!" : "Meeting Created!",
        description: formData.isScheduled 
          ? `Meeting "${meeting.title}" has been scheduled.${zoomNote}`
          : `Meeting "${meeting.title}" has been created.${zoomNote}`,
      });

      onMeetingCreated?.(meeting);
      onClose();
    } catch (error) {
      console.error('Error creating meeting:', error);
      
      // Provide specific error messages based on error content
      let errorTitle = "Meeting Creation Failed";
      let errorDescription = "Unable to create meeting. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('scheduled_start_time')) {
          errorTitle = "Database Error";
          errorDescription = "There was an issue with the scheduling feature. Please try creating an instant meeting instead.";
        } else if (error.message.includes('participants')) {
          errorTitle = "Participant Error";
          errorDescription = "There was an issue adding participants. Please check if all selected users are valid.";
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorTitle = "Permission Denied";
          errorDescription = "You don't have permission to create meetings. Please contact your administrator.";
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorTitle = "Connection Error";
          errorDescription = "Please check your internet connection and try again.";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title" className="text-sm font-medium">Meeting Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Enter meeting title"
          maxLength={100}
          className="mt-1.5"
        />
      </div>
      
      <div>
        <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Brief description of the meeting"
          rows={3}
          maxLength={500}
          className="mt-1.5 resize-none"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
          <Select
            value={formData.duration.toString()}
            onValueChange={(value) => setFormData({...formData, duration: parseInt(value)})}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="maxParticipants" className="text-sm font-medium">Max Participants</Label>
          <Select
            value={formData.maxParticipants.toString()}
            onValueChange={(value) => setFormData({...formData, maxParticipants: parseInt(value)})}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 participants</SelectItem>
              <SelectItem value="25">25 participants</SelectItem>
              <SelectItem value="50">50 participants</SelectItem>
              <SelectItem value="100">100 participants</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-1 rounded-lg">
          <h3 className="text-sm font-semibold mb-3 px-2 text-gray-800">Meeting Options</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/20 transition-colors">
              <div className="flex-1">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Schedule for Later
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.isScheduled ? 'Set a specific start time' : 'Start the meeting immediately'}
                </p>
              </div>
              <Switch
                checked={formData.isScheduled}
                onCheckedChange={(checked) => setFormData({...formData, isScheduled: checked})}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            
            {formData.isScheduled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50/80 rounded-lg border border-blue-200">
                <div>
                  <Label htmlFor="scheduledDate" className="text-sm font-semibold text-blue-900">Date *</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1.5 bg-white border-blue-300 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime" className="text-sm font-semibold text-blue-900">Time *</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                    className="mt-1.5 bg-white border-blue-300 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/20 transition-colors">
              <div className="flex-1">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  {formData.isPublic ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                  Public Meeting
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Anyone with the meeting code can join
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/20 transition-colors">
              <div className="flex-1">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-600" />
                  Allow Recording
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Participants can record the meeting
                </p>
              </div>
              <Switch
                checked={formData.allowRecording}
                onCheckedChange={(checked) => setFormData({...formData, allowRecording: checked})}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderParticipantsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>
      
      {formData.isPublic && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Public Meeting: Anyone with the code can join
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedParticipants.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Selected Participants ({selectedParticipants.length})</Label>
          <ScrollArea className="max-h-24 mt-2">
            <div className="flex flex-wrap gap-2 pr-2">
              {selectedParticipants.map(participant => (
                <Badge 
                  key={participant.id} 
                  variant="secondary" 
                  className="flex items-center gap-1 text-xs max-w-full"
                >
                  <Avatar className="w-3 h-3 flex-shrink-0">
                    <AvatarImage src={participant.profile_photo_url} />
                    <AvatarFallback className="text-xs">
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-20">{participant.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveParticipant(participant.id);
                    }}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-sm p-0.5 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      <div>
        <Label className="text-sm font-medium">Available Users</Label>
        <ScrollArea className="h-40 sm:h-48 mt-2 border rounded-md">
          <div className="p-2">
            {isLoadingUsers ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mx-auto mb-2"></div>
                Loading users...
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-1">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer"
                    onClick={() => handleAddParticipant(user)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={user.profile_photo_url} />
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.role} • {user.email}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      disabled={selectedParticipants.some(p => p.id === user.id)}
                      className="flex-shrink-0 min-w-[60px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!selectedParticipants.some(p => p.id === user.id)) {
                          handleAddParticipant(user);
                        }
                      }}
                    >
                      {selectedParticipants.some(p => p.id === user.id) ? (
                        <span className="text-xs">Added</span>
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? 'No users found' : 'No available users'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
  
  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Meeting Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Title</Label>
              <p className="text-sm">{formData.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Host</Label>
              <p className="text-sm">{hostName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Duration</Label>
              <p className="text-sm">{formData.duration} minutes</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Max Participants</Label>
              <p className="text-sm">{formData.maxParticipants} people</p>
            </div>
            {formData.isScheduled && (
              <>
                <div>
                  <Label className="text-sm font-medium">Scheduled Date</Label>
                  <p className="text-sm">{new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Scheduled Time</Label>
                  <p className="text-sm">{new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleTimeString()}</p>
                </div>
              </>
            )}
          </div>
          
          {formData.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">{formData.description}</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Badge variant={formData.isPublic ? "default" : "secondary"}>
              {formData.isPublic ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 w-3 mr-1" />}
              {formData.isPublic ? 'Public' : 'Private'}
            </Badge>
            {formData.allowRecording && (
              <Badge variant="outline">
                Recording Enabled
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {!formData.isPublic && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({selectedParticipants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedParticipants.length > 0 ? (
              <div className="space-y-2">
                {selectedParticipants.map(participant => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={participant.profile_photo_url} />
                      <AvatarFallback className="text-xs">
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{participant.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {participant.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No participants selected
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  const getStepButtons = () => {
    switch (currentStep) {
      case 'details':
        return (
          <Button 
            onClick={() => setCurrentStep('participants')}
            disabled={!formData.title.trim()}
            className="w-full sm:w-auto min-h-[44px] text-sm"
          >
            Next: Add Participants
          </Button>
        );
      case 'participants':
        return (
          <>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('details')}
              className="w-full sm:w-auto min-h-[44px] text-sm"
            >
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep('review')}
              className="w-full sm:w-auto min-h-[44px] text-sm"
            >
              Review Meeting
            </Button>
          </>
        );
      case 'review':
        return (
          <>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('participants')}
              className="w-full sm:w-auto min-h-[44px] text-sm"
            >
              Back
            </Button>
            <Button 
              onClick={handleCreateMeeting}
              disabled={isCreating}
              className="w-full sm:w-auto min-h-[44px] text-sm"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {formData.isScheduled ? 'Schedule Meeting' : 'Create Meeting'}
                </div>
              )}
            </Button>
          </>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl h-[90vh] sm:h-[95vh] max-h-[90vh] sm:max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Video className="w-5 h-5" />
            {formData.isScheduled ? 'Schedule Meeting' : 'Create Instant Meeting'}
          </DialogTitle>
          <div className="flex flex-wrap gap-1 mt-2">
            {['details', 'participants', 'review'].map((step, index) => (
              <Badge 
                key={step}
                variant={currentStep === step ? "default" : "secondary"}
                className="text-xs px-2 py-1"
              >
                {index + 1}. {step.charAt(0).toUpperCase() + step.slice(1)}
              </Badge>
            ))}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-4 sm:px-6">
          <ScrollArea className="h-full w-full">
            <div className="space-y-6 pb-6 pr-4">
              {currentStep === 'details' && renderDetailsStep()}
              {currentStep === 'participants' && renderParticipantsStep()}
              {currentStep === 'review' && renderReviewStep()}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter className="flex-shrink-0 p-4 sm:p-6 border-t bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between w-full">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] text-sm"
            >
              Cancel
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto">
              {getStepButtons()}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstantMeetModal;