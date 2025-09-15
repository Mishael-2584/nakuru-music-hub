import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TeacherAccount = () => {
  const { toast } = useToast();
  const [teacherId, setTeacherId] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data } = await supabase
        .from('teachers')
        .select('id, phone, bio, avatar_url')
        .eq('user_id', userData.user.id)
        .single();
      if (data) {
        setTeacherId(data.id);
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    };
    load();
  }, []);

  const sanitizeFilename = (name: string) => {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    const safe = trimmed.replace(/[^a-zA-Z0-9_. -]/g, '');
    return safe.length > 80 ? safe.slice(0, 80) : safe;
  };

  const handleAvatar = async (file?: File) => {
    if (!file || !teacherId) return;
    try {
      setUploading(true);
      const filePath = `teacher-avatars/${teacherId}/${Date.now()}_${sanitizeFilename(file.name)}`;
      const { error: upErr } = await supabase.storage.from('images').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('images').getPublicUrl(filePath);
      setAvatarUrl(pub.publicUrl);
      await supabase.from('teachers').update({ avatar_url: pub.publicUrl }).eq('id', teacherId);
      toast({ title: 'Avatar updated' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const submitChanges = async () => {
    if (!teacherId) return;
    try {
      setSubmitting(true);
      const { error } = await supabase.from('teacher_profile_change_requests').insert({
        teacher_id: teacherId,
        proposed_phone: phone,
        proposed_bio: bio,
      });
      if (error) throw error;
      toast({ title: 'Submitted for approval', description: 'Admin will review your changes.' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const uploadDoc = async (type: string, file?: File) => {
    if (!file || !teacherId) return;
    try {
      const path = `teachers/${teacherId}/${type}/${Date.now()}_${sanitizeFilename(file.name)}`;
      const { error: upErr } = await supabase.storage.from('teacher-cvs').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error } = await supabase.from('teacher_documents').insert({ teacher_id: teacherId, doc_type: type, file_path: path, file_name: sanitizeFilename(file.name) });
      if (error) throw error;
      toast({ title: `${type.toUpperCase()} uploaded`, description: 'Awaiting admin approval.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <main className="pt-32 lg:pt-36 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Account</CardTitle>
            <CardDescription>Manage your profile and required documents. Profile edits require admin approval.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : <AvatarFallback>T</AvatarFallback>}
              </Avatar>
              <label className="inline-flex">
                <Input type="file" accept="image/*" onChange={(e) => handleAvatar(e.target.files?.[0] || undefined)} />
              </label>
              <Button disabled={uploading} onClick={() => {}} variant="outline">{uploading ? 'Uploading...' : 'Change Avatar'}</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={submitChanges} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Changes for Approval'}</Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Required Documents</h3>
              <p className="text-sm text-muted-foreground mb-3">Attach: academic certificates, transcripts, ID (soft copy), and KRA PIN. Each must be uploaded before proceeding.</p>
              <div className="grid md:grid-cols-2 gap-4">
                {['cv','certificate','transcript','id','kra'].map((t) => (
                  <div key={t} className="space-y-2">
                    <Label className="capitalize">{t}</Label>
                    <Input type="file" onChange={(e) => uploadDoc(t, e.target.files?.[0] || undefined)} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default TeacherAccount;


