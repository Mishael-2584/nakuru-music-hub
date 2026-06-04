import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Video,
  Plus,
  Users,
  Clock,
  Play,
  Square,
  Eye,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import {
  getUserInstantMeetings,
  getInstantMeeting,
  joinInstantMeetingRoom,
  openMeetingLink,
  startInstantMeeting,
  endInstantMeeting,
  cancelInstantMeeting,
  deleteInstantMeeting,
  cleanupExpiredMeetings,
  getActiveParticipants,
  InstantMeeting,
  MeetingParticipantLog
} from '../lib/videoConferencing';
import InstantMeetModal from './InstantMeetModal';

interface InstantMeetManagerProps {
  userId: string;
  userName: string;
  userRole: 'teacher' | 'admin';
  className?: string;
  onMeetingCreated?: () => void;
}

const InstantMeetManager = ({
  userId,
  userName,
  userRole,
  className = '',
  onMeetingCreated
}) => {
  const { toast } = useToast();

  // State
  const [meetings, setMeetings] = useState<InstantMeeting[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<InstantMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<InstantMeeting | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'my-meetings' | 'invited'>('my-meetings');

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [meetings, statusFilter, searchTerm, activeTab]);

  // Auto-refresh every 30 seconds for active meetings and cleanup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      const hasActiveMeetings = meetings.some(m => m.status === 'active' || m.status === 'pending');
      if (hasActiveMeetings) {
        // Cleanup expired meetings and refresh
        try {
          await cleanupExpiredMeetings();
          await fetchMeetings();
        } catch (error) {
          console.error('Error during auto-cleanup:', error);
          // Still try to fetch meetings even if cleanup fails
          fetchMeetings();
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, meetings]);

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings for user:', userId);
      console.log('User role:', userRole);
      
      // First cleanup expired meetings
      await cleanupExpiredMeetings();
      
      const allMeetings = await getUserInstantMeetings(userId);
      console.log('Fetched meetings:', allMeetings);
      console.log('Meeting details:', allMeetings.map(m => ({
        id: m.id,
        title: m.title,
        hostId: m.hostId,
        participants: m.participants,
        status: m.status,
        meetingUrl: m.meetingUrl
      })));
      setMeetings(allMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = meetings;
    console.log('Applying filters to meetings:', { 
      totalMeetings: meetings.length, 
      activeTab, 
      statusFilter, 
      searchTerm,
      userId,
      userRole
    });

    // Filter by tab (hosted vs invited)
    if (activeTab === 'my-meetings') {
      console.log('Filtering for hosted meetings. User ID:', userId);
      console.log('Meetings before host filter:', meetings.map(m => ({ id: m.id, title: m.title, hostId: m.hostId })));
      filtered = filtered.filter(m => m.hostId === userId);
      console.log('Filtered by hosted meetings:', filtered.length);
      console.log('Hosted meetings:', filtered.map(m => ({ id: m.id, title: m.title, hostId: m.hostId })));
    } else {
      console.log('Filtering for invited meetings. User ID:', userId);
      console.log('Meetings before participant filter:', meetings.map(m => ({ 
        id: m.id, 
        title: m.title, 
        hostId: m.hostId, 
        participants: m.participants 
      })));
      filtered = filtered.filter(m => m.hostId !== userId && m.participants.includes(userId));
      console.log('Filtered by invited meetings:', filtered.length);
      console.log('Invited meetings:', filtered.map(m => ({ id: m.id, title: m.title, hostId: m.hostId, participants: m.participants })));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
      console.log('Filtered by status:', statusFilter, filtered.length);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.hostName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('Filtered by search term:', searchTerm, filtered.length);
    }

    console.log('Final filtered meetings:', filtered);
    setFilteredMeetings(filtered);
  };

  const handleMeetingCreated = (meeting: InstantMeeting) => {
    setMeetings([meeting, ...meetings]);
    toast({
      title: "Success",
      description: `Meeting "${meeting.title}" created successfully!`
    });
    
    // Call the callback to refresh instant meetings in video conferencing tab
    if (onMeetingCreated) {
      onMeetingCreated();
    }
  };

  const handleJoinMeeting = async (meeting: InstantMeeting) => {
    try {
      await joinInstantMeetingRoom(meeting, userId, userName);
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to join meeting",
        variant: "destructive"
      });
    }
  };

  const handleStartMeeting = async (meetingId: string) => {
    try {
      await startInstantMeeting(meetingId);
      const meeting = await getInstantMeeting(meetingId);
      if (meeting) {
        await handleJoinMeeting(meeting);
      }
      await fetchMeetings();
      toast({
        title: "Meeting Started",
        description: "Opening Zoom as host..."
      });
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast({
        title: "Error",
        description: "Failed to start meeting",
        variant: "destructive"
      });
    }
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      await endInstantMeeting(meetingId);
      await fetchMeetings();
      toast({
        title: "Meeting Ended",
        description: "Meeting has been completed"
      });
    } catch (error) {
      console.error('Error ending meeting:', error);
      toast({
        title: "Error",
        description: "Failed to end meeting",
        variant: "destructive"
      });
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    try {
      await cancelInstantMeeting(meetingId);
      await fetchMeetings();
      toast({
        title: "Meeting Cancelled",
        description: "Meeting has been cancelled"
      });
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast({
        title: "Error",
        description: "Failed to cancel meeting",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // Show confirmation dialog
    const confirmMessage = meeting.status === 'cancelled' || meeting.status === 'completed' 
      ? `Are you sure you want to delete "${meeting.title}" from your meeting history? This action cannot be undone.`
      : `Are you sure you want to delete "${meeting.title}"? This will permanently remove the meeting and cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteInstantMeeting(meetingId, userId);
      await fetchMeetings();
      toast({
        title: "Meeting Deleted",
        description: meeting.status === 'cancelled' || meeting.status === 'completed' 
          ? "Meeting has been removed from your history"
          : "Meeting has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive"
      });
    }
  };

  const copyMeetingCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: "Meeting code copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy meeting code",
        variant: "destructive"
      });
    }
  };

  const copyMeetingLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied",
        description: "Meeting link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy meeting link",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800 animate-pulse">Live</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMeetingCard = (meeting: InstantMeeting) => {
    const activeParticipants = getActiveParticipants(meeting);
    const isHost = meeting.hostId === userId;
    const isUserInMeeting = activeParticipants.some((p) => p.userId === userId);
    const canJoin =
      (meeting.status === 'pending' || meeting.status === 'active') &&
      !(isHost && meeting.status === 'pending');
    // Host is auto-joined when they start — no join button while already in the room.
    // Others who are in can re-open Zoom; those not in yet see Join Now.
    const showReturnToMeeting =
      meeting.status === 'active' && isUserInMeeting && !isHost;
    const canManage = isHost && (meeting.status === 'scheduled' || meeting.status === 'pending' || meeting.status === 'active');
    const canDelete = isHost; // Teachers can always delete their own meetings

    return (
      <Card key={meeting.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{meeting.title}</h3>
                {getStatusBadge(meeting.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {isHost ? 'Hosted by you' : `Hosted by ${meeting.hostName}`}
              </p>
              {meeting.description && (
                <p className="text-sm text-gray-600 mt-1">{meeting.description}</p>
              )}
            </div>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => copyMeetingCode(meeting.meetingCode)}
            >
              <Copy className="w-3 h-3 mr-1" />
              {meeting.meetingCode}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meeting Info */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{meeting.duration}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{activeParticipants.length}/{meeting.maxParticipants}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDateTime(meeting.createdAt)}</span>
            </div>
          </div>

          {/* Active Participants */}
          {activeParticipants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Currently in meeting:</p>
              <div className="flex -space-x-2">
                {activeParticipants.slice(0, 5).map((participant, index) => (
                  <Avatar key={index} className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {participant.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {activeParticipants.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs font-medium">+{activeParticipants.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {showReturnToMeeting && (
              <Button
                variant="outline"
                onClick={() => handleJoinMeeting(meeting)}
                className="flex items-center gap-1"
                size="sm"
              >
                <Play className="w-4 h-4" />
                Return to meeting
              </Button>
            )}
            {canJoin && !showReturnToMeeting && (
              <Button
                onClick={() => handleJoinMeeting(meeting)}
                className="flex items-center gap-1"
                size="sm"
              >
                <Play className="w-4 h-4" />
                {meeting.status === 'active' ? 'Join Now' : 'Join Meeting'}
              </Button>
            )}

            {canManage && (
              <>
                {meeting.status === 'pending' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleStartMeeting(meeting.id)}
                    size="sm"
                  >
                    Start Meeting
                  </Button>
                )}
                {meeting.status === 'active' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleEndMeeting(meeting.id)}
                    size="sm"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    End Meeting
                  </Button>
                )}
                {(meeting.status === 'pending' || meeting.status === 'active' || meeting.status === 'scheduled') && (
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelMeeting(meeting.id)}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
            
            {canDelete && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleDeleteMeeting(meeting.id)}
                className={`border-red-200 text-red-600 hover:bg-red-50 ${
                  meeting.status === 'cancelled' || meeting.status === 'completed' 
                    ? 'bg-red-50/50' : ''
                }`}
                title={meeting.status === 'cancelled' || meeting.status === 'completed' 
                  ? 'Remove meeting from history' 
                  : 'Delete meeting permanently'
                }
              >
                <Trash2 className="w-4 h-4" />
                {(meeting.status === 'cancelled' || meeting.status === 'completed') && (
                  <span className="ml-1 text-xs">Clean up</span>
                )}
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyMeetingLink(meeting.meetingUrl)}
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedMeeting(meeting);
                setShowDetailsModal(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const activeMeetings = filteredMeetings.filter(m => m.status === 'active').length;
  const scheduledMeetings = filteredMeetings.filter(m => m.status === 'scheduled' || m.status === 'pending').length;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading meetings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Instant Meetings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and manage instant video meetings
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Meeting
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-2xl font-bold">{activeMeetings}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{scheduledMeetings}</div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{meetings.filter(m => m.hostId === userId).length}</div>
                <div className="text-sm text-gray-600">Hosted</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{meetings.filter(m => m.participants.includes(userId) && m.hostId !== userId).length}</div>
                <div className="text-sm text-gray-600">Invited</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchMeetings}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList>
              <TabsTrigger value="my-meetings">My Meetings ({meetings.filter(m => m.hostId === userId).length})</TabsTrigger>
              <TabsTrigger value="invited">Invited ({meetings.filter(m => m.participants.includes(userId) && m.hostId !== userId).length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-meetings" className="mt-4">
              {filteredMeetings.length > 0 ? (
                <div className="grid gap-4">
                  {filteredMeetings.map(renderMeetingCard)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No meetings found</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4"
                  >
                    Create Your First Meeting
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="invited" className="mt-4">
              {filteredMeetings.length > 0 ? (
                <div className="grid gap-4">
                  {filteredMeetings.map(renderMeetingCard)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No meeting invitations</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Meeting Modal */}
      <InstantMeetModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        hostId={userId}
        hostName={userName}
        hostRole={userRole}
        onMeetingCreated={handleMeetingCreated}
      />

      {/* Meeting Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Meeting Details
            </DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <p className="text-sm">{selectedMeeting.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>{getStatusBadge(selectedMeeting.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Host</label>
                  <p className="text-sm">{selectedMeeting.hostName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Meeting Code</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedMeeting.meetingCode}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyMeetingCode(selectedMeeting.meetingCode)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm">{selectedMeeting.duration} minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Participants</label>
                  <p className="text-sm">{getActiveParticipants(selectedMeeting).length}/{selectedMeeting.maxParticipants}</p>
                </div>
              </div>
              
              {selectedMeeting.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground">{selectedMeeting.description}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Badge variant={selectedMeeting.isPublic ? "default" : "secondary"}>
                  {selectedMeeting.isPublic ? 'Public Meeting' : 'Private Meeting'}
                </Badge>
                {selectedMeeting.allowRecording && (
                  <Badge variant="outline">Recording Allowed</Badge>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Meeting Link</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border">
                    {selectedMeeting.meetingUrl}
                  </code>
                  <Button size="sm" onClick={() => copyMeetingLink(selectedMeeting.meetingUrl)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      openMeetingLink(selectedMeeting.meetingUrl, {
                        isHost: selectedMeeting.hostId === userId,
                        hostUrl: selectedMeeting.meetingHostUrl,
                      })
                    }
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
                {(selectedMeeting.status === 'pending' || selectedMeeting.status === 'active') && (
                  <Button onClick={() => handleJoinMeeting(selectedMeeting)}>
                    Join Meeting
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstantMeetManager;