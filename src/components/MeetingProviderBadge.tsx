import { Badge } from './ui/badge';
import { Video } from 'lucide-react';
import type { MeetingProvider } from '../lib/videoConferencing';

interface MeetingProviderBadgeProps {
  provider?: MeetingProvider | null;
  className?: string;
}

const MeetingProviderBadge = ({ provider = 'zoom', className }: MeetingProviderBadgeProps) => {
  if (provider === 'google_meet') {
    return (
      <Badge
        variant="outline"
        className={`border-green-600 text-green-700 bg-green-50 ${className ?? ''}`}
      >
        <Video className="w-3 h-3 mr-1" />
        Google Meet
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`border-blue-600 text-blue-700 bg-blue-50 ${className ?? ''}`}
    >
      <Video className="w-3 h-3 mr-1" />
      Zoom
    </Badge>
  );
};

export default MeetingProviderBadge;
