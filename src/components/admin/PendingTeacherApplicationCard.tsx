import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Eye, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { collectTeacherApplicationDocuments } from '@/lib/teacherDocuments';
import TeacherDocumentPreviewDialog from './TeacherDocumentPreviewDialog';
import type { TeacherApplicationDocument } from '@/lib/teacherDocuments';

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subjects?: string[];
  experience?: string;
  bio?: string;
  created_at: string;
  cv_file_path?: string | null;
}

interface PendingTeacherApplicationCardProps {
  teacher: PendingTeacher;
  documents: {
    id: string;
    pending_teacher_id: string;
    doc_type: string;
    file_path: string;
    file_name?: string | null;
  }[];
  loading?: boolean;
  onApprove: (teacher: PendingTeacher) => Promise<void>;
  onReject: (teacher: PendingTeacher) => Promise<void>;
  onRequestInfo: (teacher: PendingTeacher, message: string) => Promise<void>;
}

const PendingTeacherApplicationCard = ({
  teacher,
  documents,
  loading = false,
  onApprove,
  onReject,
  onRequestInfo,
}: PendingTeacherApplicationCardProps) => {
  const applicationDocs = useMemo(
    () => collectTeacherApplicationDocuments(teacher, documents),
    [teacher, documents]
  );

  const [previewDoc, setPreviewDoc] = useState<TeacherApplicationDocument | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const handleApprove = async () => {
    await onApprove(teacher);
    setShowApproveDialog(false);
  };

  const handleReject = async () => {
    await onReject(teacher);
    setShowRejectDialog(false);
  };

  const handleRequestInfo = async () => {
    if (!requestMessage.trim()) return;
    await onRequestInfo(teacher, requestMessage.trim());
    setShowRequestDialog(false);
    setRequestMessage('');
  };

  return (
    <>
      <Card className="shadow border-0 bg-white/90">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">{teacher.name}</span>
                <Badge>{teacher.category}</Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                {teacher.email} • {teacher.phone}
              </div>
              <div className="text-sm">
                <span className="font-medium">Experience:</span> {teacher.experience || '—'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Subjects:</span>{' '}
                {teacher.subjects?.length ? teacher.subjects.join(', ') : '—'}
              </div>
              {teacher.bio && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border-l-4 border-primary/40">
                  {teacher.bio}
                </p>
              )}

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Application documents
                </p>
                {applicationDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {applicationDocs.map((doc) => (
                      <Button
                        key={doc.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Preview {doc.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Applied: {new Date(teacher.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button
                size="sm"
                onClick={() => setShowApproveDialog(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve & email
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
              >
                Reject & notify
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRequestDialog(true)}
                disabled={loading}
              >
                <Mail className="h-4 w-4 mr-1" />
                Request more info
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TeacherDocumentPreviewDialog
        document={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      />

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {teacher.name}?</DialogTitle>
            <DialogDescription>
              This will create their teacher portal account and send a welcome email to{' '}
              <strong>{teacher.email}</strong> with login instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-900 space-y-1">
            <p className="font-medium">The teacher will receive:</p>
            <ul className="list-disc list-inside space-y-0.5 text-green-800">
              <li>Approval confirmation from Damon Music Academy</li>
              <li>Portal login URL and their signup password</li>
              <li>Next steps for setting up availability</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => void handleApprove()} disabled={loading}>
              {loading ? 'Approving…' : 'Approve & send email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application?</DialogTitle>
            <DialogDescription>
              A polite rejection email will be sent to <strong>{teacher.email}</strong> and the
              application will be removed from the pending list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleReject()} disabled={loading}>
              {loading ? 'Sending…' : 'Reject & notify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request more information</DialogTitle>
            <DialogDescription>
              Send an email to {teacher.name} asking for additional documents or clarification.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="e.g. Please upload a clearer copy of your ID and your latest certificate."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => void handleRequestInfo()} disabled={loading || !requestMessage.trim()}>
              Send email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingTeacherApplicationCard;
