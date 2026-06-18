import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Eye, FileText, RefreshCw } from 'lucide-react';
import {
  collectApprovedTeacherDocuments,
  type TeacherApplicationDocument,
} from '@/lib/teacherDocuments';
import TeacherDocumentPreviewDialog from './TeacherDocumentPreviewDialog';

interface ApprovedTeacher {
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
  status?: string;
}

interface ApprovedTeacherCardProps {
  teacher: ApprovedTeacher;
  documents: {
    id: string;
    teacher_id: string;
    doc_type: string;
    file_path: string;
    file_name?: string | null;
  }[];
  onRecoverDocuments?: (teacherId: string) => Promise<void>;
  recovering?: boolean;
}

const ApprovedTeacherCard = ({
  teacher,
  documents,
  onRecoverDocuments,
  recovering = false,
}: ApprovedTeacherCardProps) => {
  const teacherDocs = useMemo(
    () => collectApprovedTeacherDocuments(teacher, documents),
    [teacher, documents]
  );

  const [previewDoc, setPreviewDoc] = useState<TeacherApplicationDocument | null>(null);

  return (
    <>
      <Card className="shadow border-0 bg-white/90">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">{teacher.name}</span>
              <Badge>{teacher.category}</Badge>
              {teacher.status && teacher.status !== 'approved' && (
                <Badge variant="secondary">{teacher.status}</Badge>
              )}
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
              {teacherDocs.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No documents linked yet. If this teacher applied before the approval fix, their
                    files may still exist in storage.
                  </p>
                  {onRecoverDocuments && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={recovering}
                      onClick={() => void onRecoverDocuments(teacher.id)}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${recovering ? 'animate-spin' : ''}`} />
                      {recovering ? 'Searching storage…' : 'Link documents from storage'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teacherDocs.map((doc) => (
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
              Approved: {new Date(teacher.created_at).toLocaleString()}
            </p>
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
    </>
  );
};

export default ApprovedTeacherCard;
