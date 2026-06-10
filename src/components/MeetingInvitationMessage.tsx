import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Video } from 'lucide-react';
import MeetingInvitationCard from './MeetingInvitationCard';
import { resolveMeetingIdFromInvitationMessage } from '../lib/videoConferencing';

interface MeetingInvitationMessageProps {
  meetingId?: string | null;
  subject: string;
  message: string;
  senderName: string;
  sentAt: string;
  currentUserId: string;
  currentUserName: string;
  isRead: boolean;
  onMarkAsRead?: () => void;
}

/** Renders a meeting invite using live Zoom data from instant_meetings (not static alert text). */
const MeetingInvitationMessage = ({
  meetingId,
  subject,
  message,
  senderName,
  sentAt,
  currentUserId,
  currentUserName,
  isRead,
  onMarkAsRead,
}: MeetingInvitationMessageProps) => {
  const [resolvedMeetingId, setResolvedMeetingId] = useState<string | null>(meetingId ?? null);
  const [resolving, setResolving] = useState(!meetingId);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      if (meetingId) {
        setResolvedMeetingId(meetingId);
        setResolving(false);
        return;
      }
      setResolving(true);
      const id = await resolveMeetingIdFromInvitationMessage(null, message);
      if (!cancelled) {
        setResolvedMeetingId(id);
        setResolving(false);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [meetingId, message]);

  if (resolving) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-sm text-blue-800">Loading meeting from Zoom...</span>
        </CardContent>
      </Card>
    );
  }

  if (!resolvedMeetingId) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-900">
          <p className="font-medium">Meeting invitation could not be linked to Zoom.</p>
          <p className="mt-1 text-xs">
            Ask your teacher to resend the invite, or join from the Video Conferencing tab using your meeting code.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MeetingInvitationCard
      meetingId={resolvedMeetingId}
      subject={subject}
      message={message}
      senderName={senderName}
      sentAt={sentAt}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      isRead={isRead}
      onMarkAsRead={onMarkAsRead}
    />
  );
};

export default MeetingInvitationMessage;
