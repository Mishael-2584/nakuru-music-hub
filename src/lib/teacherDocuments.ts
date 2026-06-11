import { supabase } from '@/integrations/supabase/client';

export type TeacherDocKind = 'pdf' | 'image' | 'other';

export interface TeacherApplicationDocument {
  id: string;
  docType: string;
  label: string;
  filePath: string;
  fileName: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  id: 'National ID',
  kra: 'KRA PIN',
  certificate: 'Certificate',
  transcript: 'Transcript',
};

export function getTeacherDocTypeLabel(docType: string): string {
  return DOC_TYPE_LABELS[docType] || docType.charAt(0).toUpperCase() + docType.slice(1);
}

export function getTeacherDocKind(fileNameOrPath: string): TeacherDocKind {
  const lower = fileNameOrPath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|gif|webp|bmp|heic)$/.test(lower)) return 'image';
  return 'other';
}

export async function getTeacherDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('teacher-cvs')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    const { data: pub } = supabase.storage.from('teacher-cvs').getPublicUrl(filePath);
    if (pub?.publicUrl) return pub.publicUrl;
    throw new Error(error?.message || 'Could not load document preview');
  }

  return data.signedUrl;
}

export async function downloadTeacherDocument(filePath: string, fileName: string): Promise<void> {
  const url = await getTeacherDocumentSignedUrl(filePath);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function collectTeacherApplicationDocuments(
  teacher: { id: string; cv_file_path?: string | null },
  pendingDocs: {
    id: string;
    pending_teacher_id: string;
    doc_type: string;
    file_path: string;
    file_name?: string | null;
  }[]
): TeacherApplicationDocument[] {
  const docs: TeacherApplicationDocument[] = [];

  if (teacher.cv_file_path) {
    docs.push({
      id: `cv-${teacher.id}`,
      docType: 'cv',
      label: getTeacherDocTypeLabel('cv'),
      filePath: teacher.cv_file_path,
      fileName: teacher.cv_file_path.split('/').pop() || 'cv.pdf',
    });
  }

  for (const doc of pendingDocs.filter((d) => d.pending_teacher_id === teacher.id)) {
    docs.push({
      id: doc.id,
      docType: doc.doc_type,
      label: getTeacherDocTypeLabel(doc.doc_type),
      filePath: doc.file_path,
      fileName: doc.file_name || doc.file_path.split('/').pop() || doc.doc_type,
    });
  }

  return docs;
}
