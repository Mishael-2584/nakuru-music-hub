import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  Video, 
  Users, 
  Calendar, 
  Clock, 
  ExternalLink,
  Copy,
  Play,
  Phone,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { 
  getInstantMeeting,
  joinInstantMeetingRoom,
  canUserJoinInstantMeeting,
  InstantMeeting
} from '../lib/videoConferencing';
import { formatMeetingTime } from '../lib/videoConferencing';

interface MeetingInvitationCardProps {
  meetingId: string;
  subject: string;
  message: string;
  senderName: string;
  sentAt: string;
  currentUserId: string;
  currentUserName: string;
  isRead: boolean;
  onMarkAsRead?: () => void;
}

const MeetingInvitationCard = ({
  meetingId,
  subject,
  message,
  senderName,
  sentAt,
  currentUserId,
  currentUserName,
  isRead,
  onMarkAsRead
}) => {
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<InstantMeeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [canJoin, setCanJoin] = useState<{ canJoin: boolean; reason?: string }>({ canJoin: true });

  useEffect(() => {
    loadMeetingDetails();

    const channel = supabase
      .channel(`meeting-invite-${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'instant_meetings',
          filter: `id=eq.${meetingId}`,
        },
        () => {
          loadMeetingDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, currentUserId]);

  const loadMeetingDetails = async () => {
    try {
      const meetingData = await getInstantMeeting(meetingId);
      if (meetingData) {
        setMeeting(meetingData);
        setCanJoin(canUserJoinInstantMeeting(meetingData, currentUserId));
      } else {
        setMeeting(null);
        setCanJoin({ canJoin: false, reason: 'Meeting not found' });
      }
    } catch (error) {
      console.error('Error loading meeting details:', error);
      toast({
        title: "Error",
        description: "Failed to load meeting details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!meeting || !canJoin.canJoin) {
      toast({
        title: "Cannot Join",
        description: canJoin.reason || "Unable to join meeting",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);
    try {
      if (!isRead && onMarkAsRead) {
        onMarkAsRead();
      }

      await joinInstantMeetingRoom(meeting, currentUserId, currentUserName);

      toast({
        title: "Joining Meeting",
        description: "Opening Zoom in a new tab...",
        duration: 3000
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join meeting",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyMeetingCode = async () => {
    if (!meeting) return;
    
    try {
      await navigator.clipboard.writeText(meeting.meetingCode);
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

  const copyMeetingLink = async () => {
    if (!meeting) return;
    
    try {
      await navigator.clipboard.writeText(meeting.meetingUrl);
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

  const getStatusBadge = () => {
    if (!meeting) return null;
    
    switch (meeting.status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-purple-700">📅 Scheduled</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-blue-700">📅 Ready</Badge>;
      case 'active':
        return <Badge className="bg-green-500 text-white animate-pulse shadow-lg">🔴 LIVE NOW</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-gray-600">✅ Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-red-700">❌ Cancelled</Badge>;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric', 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            <span className="text-sm">Loading meeting invitation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meeting) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-800">Meeting not found or has been deleted</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-md hover:shadow-lg transition-all duration-200 ${!isRead ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-800 text-lg">🎬 Meeting Invitation</span>
                  {!isRead && <Badge variant="destructive" className="text-xs animate-pulse">NEW</Badge>}
                </div>
                <p className="text-sm text-blue-600 font-medium">You've been invited by {senderName}</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meeting Info Card */}
          <Card className="bg-white/90 border-blue-200 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-800 mb-1">{meeting.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      👨‍🏫 Hosted by {meeting.hostName}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 border-blue-300 text-blue-700 font-mono text-sm px-3 py-1"
                  onClick={copyMeetingCode}
                >
                  <Copy className="w-3 h-3" />
                  {meeting.meetingCode}
                </Badge>
              </div>
              
              {meeting.description && (
                <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-l-blue-400">
                  <p className="text-sm text-gray-700 italic">"{meeting.description}"</p>
                </div>
              )}
              
              {/* Meeting Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-700">{meeting.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-700">Max {meeting.maxParticipants} people</span>
                </div>
                {meeting.scheduledStartTime && (
                  <>
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700">
                        Scheduled: {formatDateTime(meeting.scheduledStartTime)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Call-to-Action Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <Play className="w-5 h-5" />
                <span className="font-bold text-lg">
                  {meeting.status === 'active' ? '🔴 MEETING IS LIVE - Ready to Join!' : '🎉 One-Click Join - No Downloads Required!'}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={handleJoinMeeting}
                  disabled={!canJoin.canJoin || isJoining}
                  className={`flex items-center gap-2 text-lg px-8 py-4 font-bold shadow-lg transition-all duration-200 ${
                    meeting.status === 'active' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse shadow-red-200' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200'
                  }`}
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      {meeting.status === 'active' ? (
                        <>
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <Video className="w-5 h-5" />
                          <span>🔴 JOIN LIVE MEETING</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>🚀 Join Meeting</span>
                        </>
                      )}
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={copyMeetingLink} className="flex items-center gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>
                
                <Button variant="outline" onClick={() => setShowDetails(true)} className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  More Info
                </Button>
              </div>
            </div>
          </div>
          
          {!canJoin.canJoin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <p className="text-sm font-medium text-amber-800">
                  ⚠️ <strong>Notice:</strong> {canJoin.reason}
                </p>
              </div>
            </div>
          )}
          
          {/* Meeting Meta Info */}
          <div className="text-xs text-gray-500 border-t pt-3 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span>📨 Invitation sent: {formatDateTime(sentAt)}</span>
              <div className="flex gap-4">
                <span>🎯 Meeting created: {formatDateTime(meeting.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Meeting Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Meeting Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Meeting Title</label>
                <p className="text-sm">{meeting.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Host</label>
                <p className="text-sm">{meeting.hostName} ({meeting.hostRole})</p>
              </div>
              <div>
                <label className="text-sm font-medium">Meeting Code</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{meeting.meetingCode}</Badge>
                  <Button size="sm" variant="ghost" onClick={copyMeetingCode}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div>{getStatusBadge()}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                <p className="text-sm">{meeting.duration} minutes</p>
              </div>
              <div>
                <label className="text-sm font-medium">Max Participants</label>
                <p className="text-sm">{meeting.maxParticipants} people</p>
              </div>
            </div>
            
            {meeting.description && (
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Badge variant={meeting.isPublic ? "default" : "secondary"}>
                {meeting.isPublic ? 'Public Meeting' : 'Private Meeting'}
              </Badge>
              {meeting.allowRecording && (
                <Badge variant="outline">Recording Allowed</Badge>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Meeting Link</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white p-2 rounded border">
                  {meeting.meetingUrl}
                </code>
                <Button size="sm" onClick={copyMeetingLink}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleJoinMeeting()}
                  disabled={!canJoin.canJoin || isJoining}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button 
                onClick={handleJoinMeeting}
                disabled={!canJoin.canJoin || isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Meeting'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MeetingInvitationCard;