import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Layers, User, Lock } from "lucide-react";
import {
  TEACHER_CATEGORY_SUBJECTS,
  TEACHER_CATEGORIES,
  type TeacherCategory,
} from "@/lib/teacherCategories";
import { sendTeacherApplicationReceivedEmail } from "@/lib/emailService";

function formatSignupError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      details?: string;
      hint?: string;
      error?: string;
      code?: string;
    };
    const msg = e.message || e.error || "";
    if (msg.includes("row-level security") && msg.includes("pending_teachers")) {
      return "Application could not be saved. Please log out of any student/admin account, refresh the page, and try again in a private/incognito window.";
    }
    const parts = [msg, e.details, e.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(" — ");
  }
  if (err instanceof Error) return err.message;
  return "Submission failed. Please try again.";
}

type UploadedDoc = { doc_type: string; file_path: string; file_name: string };

async function saveTeacherApplication(payload: {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  bio: string;
  experience: string;
  category: string;
  subjects: string[];
  cv_file_path: string;
  documents: UploadedDoc[];
}) {
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
    "submit-teacher-application",
    { body: payload }
  );

  if (!edgeError && edgeData?.success) {
    return;
  }

  const { error: rpcError } = await supabase.rpc("submit_teacher_application", {
    p_id: payload.id,
    p_name: payload.name,
    p_email: payload.email,
    p_phone: payload.phone,
    p_password: payload.password,
    p_bio: payload.bio,
    p_experience: payload.experience,
    p_category: payload.category,
    p_subjects: payload.subjects,
    p_cv_file_path: payload.cv_file_path,
  });
  if (rpcError) throw rpcError;

  for (const doc of payload.documents) {
    const { error: docError } = await supabase.rpc("submit_teacher_document", {
      p_pending_teacher_id: payload.id,
      p_doc_type: doc.doc_type,
      p_file_path: doc.file_path,
      p_file_name: doc.file_name,
    });
    if (docError) throw docError;
  }
}

function buildUploadFileName(email: string, type: string, originalName: string): string {
  const safeEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
  const ext = originalName.split(".").pop() || "bin";
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `${safeEmail}_${unique}_${type}.${ext}`;
}

export default function TeacherSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    bio: "",
    experience: "",
    category: "Music" as TeacherCategory,
    subjects: [] as string[],
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [kraFile, setKraFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<FileList | null>(null);
  const [transcriptFiles, setTranscriptFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value } = target;
    const checked = "checked" in target ? target.checked : false;
    const type = "type" in target ? target.type : undefined;
    if (name === "subjects") {
      setForm((prev) => ({
        ...prev,
        subjects: checked
          ? [...prev.subjects, value]
          : prev.subjects.filter((s) => s !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value as TeacherCategory;
    setForm((prev) => ({ ...prev, category, subjects: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (
      !cvFile ||
      !idFile ||
      !certFiles ||
      certFiles.length === 0 ||
      !transcriptFiles ||
      transcriptFiles.length === 0
    ) {
      setError("Please attach CV, ID, transcripts and certificates.");
      setSubmitting(false);
      return;
    }

    if (form.subjects.length === 0) {
      setError("Please select at least one subject/discipline.");
      setSubmitting(false);
      return;
    }

    try {
      // Logged-in sessions (student/admin) can block public signup RLS — use anon for uploads + save
      await supabase.auth.signOut({ scope: "local" });

      const pendingId = crypto.randomUUID();
      const documents: UploadedDoc[] = [];

      const uploadFile = async (file: File, type: string) => {
        const fname = buildUploadFileName(form.email, type, file.name);
        const { data: up, error: upErr } = await supabase.storage
          .from("teacher-cvs")
          .upload(fname, file, { upsert: false, contentType: file.type || undefined });
        if (upErr) throw upErr;
        return {
          doc_type: type,
          file_path: up?.path || fname,
          file_name: file.name,
        };
      };

      const cvUpload = await uploadFile(cvFile, "cv");
      const cvFilePath = cvUpload.file_path;
      documents.push(await uploadFile(idFile, "id"));
      if (kraFile) {
        documents.push(await uploadFile(kraFile, "kra"));
      }
      for (const f of Array.from(certFiles)) {
        documents.push(await uploadFile(f, "certificate"));
      }
      for (const f of Array.from(transcriptFiles)) {
        documents.push(await uploadFile(f, "transcript"));
      }

      await saveTeacherApplication({
        id: pendingId,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        bio: form.bio.trim(),
        experience: form.experience.trim(),
        category: form.category,
        subjects: form.subjects,
        cv_file_path: cvFilePath,
        documents,
      });

      void sendTeacherApplicationReceivedEmail({
        name: form.name,
        email: form.email,
        category: form.category,
        subjects: form.subjects,
      });

      setSubmitted(true);
    } catch (err: unknown) {
      console.error("Teacher signup failed:", err);
      setError(formatSignupError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const categorySubjects = TEACHER_CATEGORY_SUBJECTS[form.category];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-2">
        <Card className="max-w-xl w-full shadow-2xl border-0">
          <CardHeader className="text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-2xl font-bold">Thank You for Applying!</CardTitle>
            <CardDescription>Your application is under review. We'll contact you soon.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-2">
      <Card className="max-w-xl w-full shadow-2xl border-0">
        <CardHeader className="text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold">Teacher Signup</CardTitle>
          <CardDescription>
            Apply to become a teacher at Damon Music Academy. Your application will be reviewed by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
                <Input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="md:col-span-2"
                />
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                <Lock className="h-5 w-5 text-primary" /> Set Password
              </h3>
              <Input
                name="password"
                type="password"
                placeholder="Set Password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                <BookOpen className="h-5 w-5 text-primary" /> About You
              </h3>
              <Textarea
                name="bio"
                placeholder="Short Bio"
                value={form.bio}
                onChange={handleChange}
                required
                className="mb-2"
              />
              <Input
                name="experience"
                placeholder="Years of Experience"
                value={form.experience}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                <Layers className="h-5 w-5 text-primary" /> Teaching Areas
              </h3>
              <div className="mb-2">
                <label className="block font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleCategoryChange}
                  className="w-full border rounded p-2"
                >
                  {TEACHER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Subjects/Disciplines</label>
                <div className="flex flex-wrap gap-2">
                  {categorySubjects.map((subject) => (
                    <label key={subject} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                      <input
                        type="checkbox"
                        name="subjects"
                        value={subject}
                        checked={form.subjects.includes(subject)}
                        onChange={handleChange}
                        className="accent-primary"
                      />
                      {subject}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">
                Upload CV <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                required
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="block w-full border rounded p-2 bg-white"
              />
              <span className="text-xs text-muted-foreground">Accepted formats: PDF, DOC, DOCX</span>
            </div>
            <div>
              <label className="block font-medium mb-1">
                National ID (soft copy) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="block w-full border rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                KRA PIN <span className="text-muted-foreground text-sm font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setKraFile(e.target.files?.[0] || null)}
                className="block w-full border rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Transcripts (multiple) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                required
                onChange={(e) => setTranscriptFiles(e.target.files)}
                className="block w-full border rounded p-2 bg-white"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Certificates (multiple) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                required
                onChange={(e) => setCertFiles(e.target.files)}
                className="block w-full border rounded p-2 bg-white"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Required: CV, ID, transcripts and certificates. KRA PIN is optional but recommended if you have one.
            </p>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <Button type="submit" disabled={submitting} className="w-full text-base font-semibold h-12 mt-2 shadow-lg">
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
