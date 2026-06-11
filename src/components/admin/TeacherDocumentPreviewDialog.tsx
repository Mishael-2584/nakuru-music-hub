import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import {
  downloadTeacherDocument,
  getTeacherDocKind,
  getTeacherDocumentSignedUrl,
  type TeacherApplicationDocument,
} from '@/lib/teacherDocuments';

interface TeacherDocumentPreviewDialogProps {
  document: TeacherApplicationDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeacherDocumentPreviewDialog = ({
  document,
  open,
  onOpenChange,
}: TeacherDocumentPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      setPreviewUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = await getTeacherDocumentSignedUrl(document.filePath);
        if (!cancelled) setPreviewUrl(url);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, document]);

  if (!document) return null;

  const kind = getTeacherDocKind(document.fileName || document.filePath);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.label}
          </DialogTitle>
          <DialogDescription className="truncate">{document.fileName}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap">
          {previewUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in new tab
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void downloadTeacherDocument(document.filePath, document.fileName)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>

        <div className="flex-1 min-h-[50vh] rounded-lg border bg-muted/30 overflow-hidden">
          {loading && (
            <div className="flex h-full min-h-[50vh] items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading preview…
            </div>
          )}
          {!loading && error && (
            <div className="flex h-full min-h-[40vh] items-center justify-center p-6 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          {!loading && !error && previewUrl && kind === 'pdf' && (
            <iframe
              title={document.label}
              src={previewUrl}
              className="w-full h-[min(70vh,720px)] border-0 bg-white"
            />
          )}
          {!loading && !error && previewUrl && kind === 'image' && (
            <div className="flex h-full min-h-[40vh] items-center justify-center p-4 bg-black/5">
              <img
                src={previewUrl}
                alt={document.label}
                className="max-h-[min(70vh,720px)] max-w-full object-contain rounded shadow-sm"
              />
            </div>
          )}
          {!loading && !error && previewUrl && kind === 'other' && (
            <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <FileText className="h-10 w-10 opacity-50" />
              <p>Inline preview is not available for this file type.</p>
              <p>Use Download or Open in new tab to view the document.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherDocumentPreviewDialog;
