import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Users, 
  Clock, 
  Calendar,
  ExternalLink,
  Copy,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  MeetingRoom, 
  joinMeetingRoom, 
  isMeetingActive, 
  formatMeetingTime, 
  getMeetingDuration,
  getMeetingStatus,
  isMeetingLinkAvailable
} from '../lib/videoConferencing';

interface VideoConferenceModalProps {
  open: boolean;
  onClose: () => void;
  meetingRoom: MeetingRoom | null;
  userName: string;
  userRole: 'teacher' | 'student';
}

const VideoConferenceModal: React.FC<VideoConferenceModalProps> = ({
  open,
  onClose,
  meetingRoom,
  userName,
  userRole
}) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState<'scheduled' | 'active' | 'completed' | 'cancelled'>('scheduled');
  const [isLinkAvailable, setIsLinkAvailable] = useState(false);

  useEffect(() => {
    if (meetingRoom) {
      const active = isMeetingActive(meetingRoom.startTime, meetingRoom.endTime);
      const status = getMeetingStatus(meetingRoom.startTime, meetingRoom.endTime);
      const linkAvailable = isMeetingLinkAvailable(meetingRoom.startTime);
      setIsActive(active);
      setMeetingStatus(status);
      setIsLinkAvailable(linkAvailable);
    }
  }, [meetingRoom]);

  const handleJoinMeeting = async () => {
    if (!meetingRoom) return;

    setIsJoining(true);
    try {
      // Update meeting status to active if it's time
      if (isActive && meetingStatus === 'scheduled') {
        // You could update the meeting status in the database here
        setMeetingStatus('active');
      }

      // Join the meeting
      joinMeetingRoom(meetingRoom.meetingUrl, userName);
      
      toast({
        title: "Joining Meeting",
        description: "Opening video conference in a new tab...",
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Error",
        description: "Failed to join meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyMeetingLink = async () => {
    if (!meetingRoom) return;

    try {
      await navigator.clipboard.writeText(meetingRoom.meetingUrl);
      toast({
        title: "Link Copied",
        description: "Meeting link copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Error",
        description: "Failed to copy meeting link",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <Square className="w-4 h-4" />;
      case 'cancelled': return <PhoneOff className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!meetingRoom) {
    return null;
  }

  const duration = getMeetingDuration(meetingRoom.startTime, meetingRoom.endTime);
  const canJoin = (isActive || meetingStatus === 'scheduled') && isLinkAvailable;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Conference Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{meetingRoom.roomName}</CardTitle>
                <Badge className={getStatusColor(meetingStatus)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(meetingStatus)}
                    {meetingStatus.charAt(0).toUpperCase() + meetingStatus.slice(1)}
                  </div>
                </Badge>
              </div>
              <CardDescription>
                {meetingRoom.lessonType.charAt(0).toUpperCase() + meetingRoom.lessonType.slice(1)} Session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {new Date(meetingRoom.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatMeetingTime(meetingRoom.startTime, meetingRoom.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {userRole === 'teacher' ? 'Student' : 'Teacher'} Session
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {duration} minutes
                  </span>
                </div>
              </div>

              {meetingRoom.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{meetingRoom.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Controls</CardTitle>
              <CardDescription>
                Manage your video conference session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleJoinMeeting}
                  disabled={!canJoin || isJoining}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  {isJoining ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  {isJoining ? 'Joining...' : 'Join Meeting'}
                </Button>

                <Button
                  variant="outline"
                  onClick={copyMeetingLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open(meetingRoom.meetingUrl, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </Button>
              </div>

              {/* Meeting Link Availability Information */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Meeting Link Availability</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {isLinkAvailable ? (
                    <p>✅ Meeting link is now available (24 hours before start time)</p>
                  ) : (
                    <p>⏰ Meeting link will be available 24 hours before the lesson starts</p>
                  )}
                  {isActive ? (
                    <p>🎥 Meeting is currently active (15 minutes before start time)</p>
                  ) : meetingStatus === 'scheduled' ? (
                    <p>📅 Meeting is scheduled and will be active 15 minutes before start time</p>
                  ) : meetingStatus === 'completed' ? (
                    <p>✅ Meeting has ended</p>
                  ) : null}
                </div>
              </div>

              {!canJoin && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {meetingStatus === 'completed' 
                      ? 'This meeting has ended.' 
                      : meetingStatus === 'cancelled'
                      ? 'This meeting has been cancelled.'
                      : !isLinkAvailable
                      ? 'Meeting link will be available 24 hours before the lesson starts.'
                      : 'Meeting will be available 15 minutes before start time.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Features</CardTitle>
              <CardDescription>
                Available features in your video conference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-green-600" />
                  <span className="text-sm">HD Video</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-600" />
                  <span className="text-sm">High-Quality Audio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Screen Sharing</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Chat</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Music-Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Up to 4 Participants</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VideoConferenceModal;