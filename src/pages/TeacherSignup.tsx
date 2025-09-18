import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, Phone, Lock, BookOpen, Layers, User } from "lucide-react";

const CATEGORY_SUBJECTS = {
  Music: ["Piano", "Drums", "Violin", "Saxophone", "Bass Guitar", "Acoustic Guitar", "Electric Guitar", "Flute", "Clarinet", "Cello", "Voice", "Music Theory", "Trumpet", "Trombone", "Other"],
  Production: ["Music Production", "Live Sound", "Videography", "Other"],
  Art: ["Drawing", "Painting", "Sculpture", "Digital Art", "Other"]
};

export default function TeacherSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    bio: "",
    experience: "",
    category: "Music",
    subjects: [],
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [kraFile, setKraFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<FileList | null>(null);
  const [transcriptFiles, setTranscriptFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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

  const handleCategoryChange = (e) => {
    setForm((prev) => ({ ...prev, category: e.target.value, subjects: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    if (!cvFile || !idFile || !kraFile || !certFiles || certFiles.length === 0 || !transcriptFiles || transcriptFiles.length === 0) {
      setError("Please attach CV, ID, KRA, transcripts and certificates.");
      setSubmitting(false);
      return;
    }
    try {
      // Upload CV to Supabase Storage
      const cvName = `${form.email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}_cv.${cvFile.name.split('.').pop()}`;
      const { data: cvUp, error: cvErr } = await supabase.storage
        .from('teacher-cvs')
        .upload(cvName, cvFile, { upsert: true, contentType: cvFile.type });
      if (cvErr) throw cvErr;
      const cvFilePath = cvUp?.path || cvName;
      // Insert teacher application with CV file path
      const { data, error } = await supabase.from("pending_teachers").insert([
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password, // Consider hashing or encrypting in production
          bio: form.bio,
          experience: form.experience,
          category: form.category,
          subjects: form.subjects,
          status: "pending",
          cv_file_path: cvFilePath,
        },
      ]);
      if (error) throw error;
      const pendingId = data?.[0]?.id;

      // Upload additional required docs
      if (pendingId) {
        const uploads: Promise<any>[] = [];
        const uploadOne = async (file: File, type: string) => {
          const fname = `${form.email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}_${type}.${file.name.split('.').pop()}`;
          const { data: up, error: upErr } = await supabase.storage.from('teacher-cvs').upload(fname, file, { upsert: true, contentType: file.type });
          if (upErr) throw upErr;
          await supabase.from('pending_teacher_documents').insert({ pending_teacher_id: pendingId, doc_type: type, file_path: up?.path || fname, file_name: file.name });
        };
        uploads.push(uploadOne(idFile, 'id'));
        uploads.push(uploadOne(kraFile, 'kra'));
        Array.from(certFiles).forEach(f => uploads.push(uploadOne(f, 'certificate')));
        Array.from(transcriptFiles).forEach(f => uploads.push(uploadOne(f, 'transcript')));
        await Promise.all(uploads);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <CardDescription>Apply to become a teacher at Damon Music Academy. Your application will be reviewed by our admin team.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Info */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2"><User className="h-5 w-5 text-primary" /> Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
                <Input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
                <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="md:col-span-2" />
              </div>
            </div>
            {/* Password */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2"><Lock className="h-5 w-5 text-primary" /> Set Password</h3>
              <Input name="password" type="password" placeholder="Set Password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            {/* Bio & Experience */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2"><BookOpen className="h-5 w-5 text-primary" /> About You</h3>
              <Textarea name="bio" placeholder="Short Bio" value={form.bio} onChange={handleChange} required className="mb-2" />
              <Input name="experience" placeholder="Years of Experience" value={form.experience} onChange={handleChange} required />
            </div>
            {/* Category & Subjects */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-2"><Layers className="h-5 w-5 text-primary" /> Teaching Areas</h3>
              <div className="mb-2">
                <label className="block font-medium mb-1">Category</label>
                <select name="category" value={form.category} onChange={handleCategoryChange} className="w-full border rounded p-2">
                  {Object.keys(CATEGORY_SUBJECTS).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Subjects/Disciplines</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_SUBJECTS[form.category].map((subject) => (
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
            {/* Required Uploads */}
            <div>
              <label className="block font-medium mb-1">Upload CV <span className="text-red-500">*</span></label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                required
                onChange={e => setCvFile(e.target.files?.[0] || null)}
                className="block w-full border rounded p-2 bg-white"
              />
              <span className="text-xs text-muted-foreground">Accepted formats: PDF, DOC, DOCX</span>
            </div>
            <div>
              <label className="block font-medium mb-1">National ID (soft copy) <span className="text-red-500">*</span></label>
              <input type="file" accept="image/*,.pdf" required onChange={e => setIdFile(e.target.files?.[0] || null)} className="block w-full border rounded p-2 bg-white" />
            </div>
            <div>
              <label className="block font-medium mb-1">KRA PIN <span className="text-red-500">*</span></label>
              <input type="file" accept="image/*,.pdf" required onChange={e => setKraFile(e.target.files?.[0] || null)} className="block w-full border rounded p-2 bg-white" />
            </div>
            <div>
              <label className="block font-medium mb-1">Transcripts (multiple) <span className="text-red-500">*</span></label>
              <input type="file" multiple accept="image/*,.pdf" required onChange={e => setTranscriptFiles(e.target.files)} className="block w-full border rounded p-2 bg-white" />
            </div>
            <div>
              <label className="block font-medium mb-1">Certificates (multiple) <span className="text-red-500">*</span></label>
              <input type="file" multiple accept="image/*,.pdf" required onChange={e => setCertFiles(e.target.files)} className="block w-full border rounded p-2 bg-white" />
            </div>
            <p className="text-xs text-muted-foreground">Please attach all relevant academic certificates, transcripts, ID soft copy and KRA PIN. All are required to proceed.</p>
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