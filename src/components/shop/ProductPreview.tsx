import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, FileText, Music, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ProductPreviewProps {
  previewAudioUrl?: string;
  scorePreviewUrl?: string;
  productName: string;
  partName?: string;
}

export default function ProductPreview({
  previewAudioUrl,
  scorePreviewUrl,
  productName,
  partName
}: ProductPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScorePreview, setShowScorePreview] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!previewAudioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(previewAudioUrl);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(progress);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      });
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setAudioProgress(0);
    }
  };

  const hasPreview = previewAudioUrl || scorePreviewUrl;

  if (!hasPreview) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Preview Audio Player */}
      {previewAudioUrl && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Audio Preview</span>
            <Badge variant="outline" className="text-xs">Preview</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlayPause}
              className="flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-100"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            {isPlaying && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStop}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Click play to preview</p>
        </div>
      )}

      {/* Score Preview Button */}
      {scorePreviewUrl && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowScorePreview(true)}
          className="w-full"
        >
          <FileText className="h-4 w-4 mr-2" />
          Preview Score
        </Button>
      )}

      {/* Score Preview Dialog */}
      <Dialog open={showScorePreview} onOpenChange={setShowScorePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Score Preview - {productName}
              {partName && <span className="text-gray-500"> ({partName})</span>}
            </DialogTitle>
          </DialogHeader>
          {scorePreviewUrl && (
            <div className="w-full">
              <iframe
                src={`${scorePreviewUrl}#page=1`}
                className="w-full h-[70vh] border rounded-lg"
                title="Score Preview"
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                This is a preview of the first page. Purchase to download the full score.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
