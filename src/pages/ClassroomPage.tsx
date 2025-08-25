import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, Trash2, ArrowLeft, Users, BookOpen, Edit3, CheckCircle } from "lucide-react";
import { SimpleRichTextEditor } from "@/components/SimpleRichTextEditor";

type Classroom = {
  id: string;
  name: string;
  description: string | null;
  class_code: string | null;
  status: string;
  teacher_id: string;
  teacher_name?: string;
};

type FeedPost = {
  post_id: string;
  content: string;
  created_at: string;
  author_name: string;
  comments_count: number;
};

export default function ClassroomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTeacherOfClass, setIsTeacherOfClass] = useState(false);
  const [isEnrolledStudent, setIsEnrolledStudent] = useState(false);

  const [activeTab, setActiveTab] = useState("feed");

  // Feed state
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");

  // Materials state
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  
  // Edit state
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = async (postId: string) => {
    const { data } = await supabase.rpc('get_post_comments', { post_id_param: postId });
    setPostComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !classroom) return;
    const text = (newComment[postId] || '').trim();
    if (!text) return;
    try {
      // find role ids
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('students').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle(),
      ]);
      const { error } = await supabase.rpc('add_classroom_comment', {
        post_id_param: postId,
        author_student_id_param: s?.id || null,
        author_teacher_id_param: t?.id || null,
        content_param: text,
      });
      if (error) throw error;
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
    } catch (err) {
      console.error('Add comment failed:', err);
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    }
  };

  const classroomPath = useMemo(() => (id ? `classrooms/${id}` : null), [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        // Fetch classroom details with teacher name
        const { data: classroomData, error } = await supabase
          .from("classrooms")
          .select("id, name, description, class_code, status, teacher_id, teachers(name)")
          .eq("id", id)
          .single();

        if (error) throw error;

        const loaded: Classroom = {
          id: classroomData.id,
          name: classroomData.name,
          description: classroomData.description,
          class_code: classroomData.class_code,
          status: classroomData.status,
          teacher_id: classroomData.teacher_id,
          teacher_name: classroomData.teachers?.name || "Teacher",
        };
        setClassroom(loaded);

        // Determine role in this class
        if (user?.id) {
          // Teacher?
          const { data: t } = await supabase
            .from("teachers")
            .select("id")
            .eq("user_id", user.id)
            .single();
          if (t?.id && loaded.teacher_id === t.id) setIsTeacherOfClass(true);

          // Student?
          const { data: s } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", user.id)
            .single();
          if (s?.id) {
            const { data: enr } = await supabase
              .from("classroom_enrollments")
              .select("id")
              .eq("classroom_id", id)
              .eq("student_id", s.id)
              .maybeSingle();
            if (enr) setIsEnrolledStudent(true);
          }
        }

        // Load feed
        await loadFeed(id);

        // Load materials
        await listMaterials();
      } catch (err: any) {
        console.error("Failed to load classroom:", err);
        toast({ title: "Error", description: "Unable to load classroom", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user?.id]);

  const loadFeed = async (classroomId: string) => {
    const { data, error } = await supabase.rpc("get_classroom_feed", { classroom_id_param: classroomId });
    if (!error) setFeed(data || []);
  };

  const handleCreatePost = async () => {
    if (!classroom || !newPost.trim()) return;
    try {
      // fetch teacher id for current user
      const { data: t, error: terr } = await supabase.from("teachers").select("id").eq("user_id", user?.id).single();
      if (terr || !t?.id) {
        toast({ title: "Not a teacher", description: "Only the class teacher can post.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.rpc("create_classroom_post", {
        classroom_id_param: classroom.id,
        author_teacher_id_param: t.id,
        content_param: newPost.trim(),
      });
      if (error) throw error;
      setNewPost("");
      await loadFeed(classroom.id);
      toast({ title: "Posted", description: "Your update has been shared." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    }
  };

  const listMaterials = async () => {
    if (!classroomPath) return;
    const { data, error } = await supabase.storage.from("lesson-materials").list(classroomPath, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });
    if (!error) setFiles(data || []);
  };

  const handleUpload = async () => {
    if (!uploadFile || !classroomPath) return;
    try {
      setUploading(true);
      // Keep original filename but add timestamp prefix to avoid conflicts
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${timestamp}_${uploadFile.name}`;
      const fullPath = `${classroomPath}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("lesson-materials").upload(fullPath, uploadFile, { upsert: true });
      if (uploadError) throw uploadError;
      setUploadFile(null);
      await listMaterials();
      toast({ title: "Uploaded", description: "File uploaded successfully." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const filePublicUrl = (name: string) => {
    const { data } = supabase.storage.from("lesson-materials").getPublicUrl(`${classroomPath}/${name}`);
    return data.publicUrl;
  };

  const handleDeleteFile = async (name: string) => {
    if (!classroomPath) return;
    try {
      const { error } = await supabase.storage.from("lesson-materials").remove([`${classroomPath}/${name}`]);
      if (error) throw error;
      await listMaterials();
      toast({ title: "Deleted", description: "File removed." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
    }
  };

  // Post editing functions
  const handleEditPost = (postId: string, content: string) => {
    setEditingPost(postId);
    setEditContent(content);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase.rpc("update_classroom_post", {
        post_id_param: postId,
        new_content_param: editContent.trim(),
      });
      if (error) throw error;
      setEditingPost(null);
      setEditContent("");
      await loadFeed(classroom!.id);
      toast({ title: "Updated", description: "Post has been updated." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update post", variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.rpc("delete_classroom_post", {
        post_id_param: postId,
      });
      if (error) throw error;
      await loadFeed(classroom!.id);
      toast({ title: "Deleted", description: "Post has been deleted." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
  };

  // Function to render HTML content safely
  const renderContent = (content: string) => {
    return content;
  };

  // Function to get original filename from stored filename
  const getOriginalFileName = (storedName: string) => {
    // Remove timestamp prefix if it exists
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/;
    if (timestampPattern.test(storedName)) {
      return storedName.replace(timestampPattern, '');
    }
    return storedName;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
        <Card>
          <CardContent className="p-6">Classroom not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl mb-6 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-bold text-white flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-purple-200"/>
                  {classroom.name}
                </h1>
                <p className="text-purple-100 text-lg mb-3">
                  Instructor: <span className="font-semibold">{classroom.teacher_name}</span>
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {classroom.class_code && (
                    <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
                      Class Code: {classroom.class_code}
                    </Badge>
                  )}
                  <Badge className={`text-sm px-3 py-1 ${
                    classroom.status === 'approved' 
                      ? 'bg-green-500/20 text-green-100 border-green-300/30' 
                      : 'bg-yellow-500/20 text-yellow-100 border-yellow-300/30'
                  }`}>
                    {classroom.status}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 border-white/30"
              >
                <ArrowLeft className="h-4 w-4 mr-2"/>Back
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 bg-white shadow-lg border-0 p-1 rounded-xl">
            <TabsTrigger 
              value="feed" 
              className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2"/>
              Class Feed
            </TabsTrigger>
            <TabsTrigger 
              value="materials"
              className="rounded-lg font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2"/>
              Materials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6 space-y-6">
            {isTeacherOfClass && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5"/>
                    Create an Assignment
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Announce a new assignment, share a resource, or post a question for discussion.
                  </CardDescription>
                </CardHeader>
                                                   <CardContent className="p-6">
                    <SimpleRichTextEditor
                      content={newPost}
                      onChange={setNewPost}
                      placeholder="Announce a new assignment, share a resource, or post a question for discussion."
                      className="min-h-[200px]"
                    />
                   <div className="mt-4 flex justify-end">
                     <Button 
                       onClick={handleCreatePost} 
                       disabled={!newPost.trim()}
                       className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                     >
                       Post Update
                     </Button>
                   </div>
                 </CardContent>
              </Card>
            )}

            {feed.length > 0 ? feed.map(post => (
              <Card key={post.post_id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
                <CardHeader className="border-l-4 border-l-purple-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.author_name.charAt(0)}
                    </div>
                                         <div>
                                                <div className="flex items-center gap-2">
                           <CardTitle className="text-lg text-gray-800">{post.author_name}</CardTitle>
                           {classroom && classroom.teacher_name === post.author_name && (
                             <CheckCircle className="h-5 w-5 text-blue-600" title="Verified Teacher" />
                           )}
                         </div>
                       <CardDescription className="text-gray-500">
                         {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                       </CardDescription>
                     </div>
                  </div>
                </CardHeader>
                                 <CardContent className="p-6">
                                       {editingPost === post.post_id ? (
                      <div className="space-y-4">
                        <SimpleRichTextEditor
                          content={editContent}
                          onChange={setEditContent}
                          placeholder="Edit your post..."
                          className="min-h-[200px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleSaveEdit(post.post_id)}
                            disabled={!editContent.trim()}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                     <div className="space-y-4">
                                               <div 
                          className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
                          style={{
                            '--tw-prose-body': '#374151',
                            '--tw-prose-headings': '#111827',
                            '--tw-prose-links': '#2563eb',
                            '--tw-prose-bold': '#111827',
                            '--tw-prose-counters': '#6b7280',
                            '--tw-prose-bullets': '#d1d5db',
                            '--tw-prose-hr': '#e5e7eb',
                            '--tw-prose-quotes': '#111827',
                            '--tw-prose-quote-borders': '#e5e7eb',
                            '--tw-prose-captions': '#6b7280',
                            '--tw-prose-code': '#111827',
                            '--tw-prose-pre-code': '#e5e7eb',
                            '--tw-prose-pre-bg': '#1f2937',
                            '--tw-prose-th-borders': '#d1d5db',
                            '--tw-prose-td-borders': '#e5e7eb',
                          } as React.CSSProperties}
                        />
                       
                       {/* Post actions for teachers */}
                       {isTeacherOfClass && (
                         <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleEditPost(post.post_id, post.content)}
                             className="text-gray-600 hover:text-purple-600"
                           >
                             <Edit3 className="h-4 w-4 mr-1" />
                             Edit
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleDeletePost(post.post_id)}
                             className="text-gray-600 hover:text-red-600"
                           >
                             <Trash2 className="h-4 w-4 mr-1" />
                             Delete
                           </Button>
                         </div>
                       )}
                     </div>
                   )}

                  {/* Comments */}
                  <div className="mt-6 space-y-3">
                    <div className="text-sm font-semibold text-gray-700">Comments</div>
                    <div className="space-y-2">
                      {(postComments[post.post_id] || []).map((c: any) => (
                        <div key={c.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="font-medium text-gray-800">{c.author_name} <span className="text-xs text-gray-400">({c.author_role})</span></div>
                          <div className="text-gray-700 mt-1">{c.content}</div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => loadComments(post.post_id)}>Load comments</Button>
                    </div>

                    {(isEnrolledStudent || isTeacherOfClass) && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment[post.post_id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                        />
                        <Button onClick={() => handleAddComment(post.post_id)} disabled={!newComment[post.post_id]?.trim()}>Comment</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4"/>
                  <p className="text-gray-500 text-lg font-medium">No posts yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {isTeacherOfClass ? "Share your first update with the class!" : "Your instructor will post updates here"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            {/* Upload Section */}
            <Card className="mb-6 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5"/>
                  Upload Materials
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Share files, documents, and resources with the classroom
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="border-2 focus:border-blue-300"
                    />
                  </div>
                  <Button 
                    onClick={handleUpload} 
                    disabled={!uploadFile || uploading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  >
                    <Upload className="h-4 w-4 mr-2" /> 
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Files Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.length > 0 ? files.map((f) => (
                <Card key={f.name} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white"/>
                      </div>
                                             <div className="flex-1 min-w-0">
                         <div className="font-semibold text-gray-800 truncate" title={getOriginalFileName(f.name)}>
                           {getOriginalFileName(f.name)}
                         </div>
                         <div className="text-sm text-gray-500">{Math.round((f.metadata?.size || 0) / 1024)} KB</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={filePublicUrl(f.name)} target="_blank" rel="noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2"/>View
                        </Button>
                      </a>
                      {(isTeacherOfClass || isEnrolledStudent) && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteFile(f.name)}
                          className="px-3"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full">
                  <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4"/>
                      <p className="text-gray-500 text-lg font-medium">No materials uploaded yet</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Upload files to share resources with the classroom
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
                 </Tabs>
       </div>

       
     </div>
   );
 }

