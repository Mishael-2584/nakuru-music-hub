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
import { SimpleTextEditor } from "@/components/SimpleTextEditor";
import { PostFileUpload } from "@/components/PostFileUpload";

type Classroom = {
  id: string;
  name: string;
  description: string | null;
  class_code: string | null;
  status: string;
  teacher_id: string;
  teacher_name?: string;
  currentStudent?: { id: string; user_id: string };
};

type FeedPost = {
  post_id: string;
  content: string;
  created_at: string;
  author_name: string;
  comments_count: number;
  is_assignment?: boolean;
  assignment_title?: string;
  due_date?: string;
  max_points?: number;
  attachments?: PostAttachment[];
};

type PostAttachment = {
  id?: string;
  file?: File;
  file_name: string;
  file_url?: string;
  file_size: number;
  file_type: string;
  uploaded?: boolean;
};

type AssignmentSubmission = {
  id: string;
  submission_text: string;
  submitted_at: string;
  grade_points?: number;
  grade_feedback?: string;
  graded_by?: string;
  graded_at?: string;
  attachments?: SubmissionAttachment[];
};

type SubmissionAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
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
  const [isAssignment, setIsAssignment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [postAttachments, setPostAttachments] = useState<PostAttachment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission[]>>({});
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, PostAttachment[]>>({});

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

        // Determine role in this class and get current student info
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
            .select("id, user_id")
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
            
            // Store current student info in classroom object
            setClassroom(prev => prev ? { ...prev, currentStudent: s } : null);
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
    if (!error) {
      // Load attachments for each post
      const postsWithAttachments = await Promise.all(
        (data || []).map(async (post: any) => {
          const { data: attachments } = await supabase
            .from('classroom_post_attachments')
            .select('*')
            .eq('post_id', post.post_id);
          
          return {
            ...post,
            attachments: attachments || []
          };
        })
      );
      setFeed(postsWithAttachments);
      
      // Auto-load submissions for assignment posts if teacher
      if (isTeacherOfClass) {
        for (const post of postsWithAttachments) {
          if (post.is_assignment) {
            await loadSubmissions(post.post_id);
          }
        }
      }
    }
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
      

      
      // Try to create the post using the RPC function first
      let postId;
      try {
        console.log('Attempting RPC call to create_classroom_post...');
        const { data: postData, error } = await supabase.rpc("create_classroom_post", {
          classroom_id_param: classroom.id,
          author_teacher_id_param: t.id,
          content_param: newPost.trim(),
        });
        
        if (error) {
          console.error('RPC error:', error);
          throw error;
        }
        
        console.log('RPC response:', postData);
        
        // Extract post ID from RPC response
        if (postData && Array.isArray(postData) && postData.length > 0) {
          postId = postData[0]?.id;
        } else if (postData?.id) {
          postId = postData.id;
        }
        
        if (postId) {
          console.log('Successfully got post ID from RPC:', postId);
        }
      } catch (rpcError) {
        console.error('RPC call failed, falling back to direct insert:', rpcError);
      }
      
      // If RPC failed, use direct insert
      if (!postId) {
        console.log('Using direct insert fallback...');
        const { data: directData, error: directError } = await supabase
          .from('classroom_posts')
          .insert({
            classroom_id: classroom.id,
            author_teacher_id: t.id,
            content: newPost.trim(),
            is_assignment: isAssignment && assignmentTitle.trim() ? true : false,
            assignment_title: isAssignment && assignmentTitle.trim() ? assignmentTitle.trim() : null,
            due_date: isAssignment && dueDate ? dueDate : null,
            max_points: isAssignment && maxPoints ? maxPoints : null
          })
          .select('id')
          .single();
        
        if (directError) {
          console.error('Direct insert failed:', directError);
          throw directError;
        }
        
        postId = directData.id;
        console.log('Direct insert successful, post ID:', postId);
      }
      
      // Update post with assignment details if it's an assignment
      if (isAssignment && assignmentTitle.trim()) {
        const { error: updateError } = await supabase
          .from('classroom_posts')
          .update({
            is_assignment: true,
            assignment_title: assignmentTitle.trim(),
            due_date: dueDate || null,
            max_points: maxPoints || null
          })
          .eq('id', postId);
        
        if (updateError) console.error('Failed to update assignment details:', updateError);
      }
      
      // Save attachment records for uploaded files
      if (postAttachments.length > 0) {
        for (const attachment of postAttachments) {
          if (attachment.uploaded && attachment.file_url) {
            await supabase.from('classroom_post_attachments').insert({
              post_id: postId,
              file_name: attachment.file_name,
              file_url: attachment.file_url,
              file_size: attachment.file_size,
              file_type: attachment.file_type
            });
          }
        }
      }
      
      // Reset form
      setNewPost("");
      setIsAssignment(false);
      setAssignmentTitle("");
      setDueDate("");
      setMaxPoints(100);
      setPostAttachments([]);
      
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
      const { error } = await supabase
        .from('classroom_posts')
        .update({ content: editContent.trim() })
        .eq('id', postId);
      
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

  // Assignment submission functions
  const loadSubmissions = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          students(student_name, user_id),
          teachers(name),
          assignment_submission_files(*)
        `)
        .eq('post_id', postId);
      
      if (error) throw error;
      
      // Get user emails for student identification
      const userIds = [...new Set((data || []).map(sub => sub.students?.user_id).filter(Boolean))];
      let userEmails: { [key: string]: string } = {};
      
      console.log('Fetching emails for user IDs:', userIds);
      
      if (userIds.length > 0) {
        try {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);
          
          console.log('Profiles query result:', { profiles, profileError });
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }
          
          if (profiles && profiles.length > 0) {
            userEmails = profiles.reduce((acc, profile) => {
              console.log('Processing profile:', profile);
              if (profile.email) {
                acc[profile.id] = profile.email;
              } else {
                acc[profile.id] = 'No email found';
              }
              return acc;
            }, {} as { [key: string]: string });
          } else {
            console.warn('No profiles found for user IDs:', userIds);
            // Set default for all user IDs
            userIds.forEach(id => {
              userEmails[id] = 'Email not available';
            });
          }
        } catch (emailError) {
          console.error('Failed to fetch user emails:', emailError);
          // Set default for all user IDs
          userIds.forEach(id => {
            userEmails[id] = 'Email fetch failed';
          });
        }
      }
      
      console.log('Final userEmails mapping:', userEmails);

      // Transform data to include author names, emails and files
      const transformedSubmissions = (data || []).map(sub => ({
        ...sub,
        author_name: sub.students?.student_name || 'Unknown Student',
        author_email: userEmails[sub.students?.user_id] || 'No email',
        graded_by_name: sub.teachers?.name || 'Unknown Teacher',
        files: sub.assignment_submission_files || []
      }));
      
      setSubmissions(prev => ({ ...prev, [postId]: transformedSubmissions }));
    } catch (err) {
      console.error('Failed to load submissions:', err);
      toast({ title: 'Error', description: 'Failed to load submissions', variant: 'destructive' });
    }
  };

  const handleGradeSubmission = async (submissionId: string, points: number, feedback: string) => {
    if (!user) {
      console.error('No user found');
      return;
    }
    
    console.log('Grading submission:', { submissionId, points, feedback });
    
    try {
      // Get teacher ID
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      console.log('Teacher lookup result:', { teacher, teacherError });
      
      if (teacherError) {
        console.error('Teacher lookup error:', teacherError);
        throw new Error(`Teacher lookup failed: ${teacherError.message}`);
      }
      
      if (!teacher) {
        console.error('No teacher found for user:', user.id);
        throw new Error('Teacher not found');
      }
      
      // Update submission with grade
      const updateData = {
        grade_points: points,
        grade_feedback: feedback || null,
        graded_by: teacher.id,
        graded_at: new Date().toISOString()
      };
      
      console.log('Updating submission with data:', updateData);
      
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('assignment_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select()
        .single();
      
      console.log('Update result:', { updatedSubmission, updateError });
      
      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update submission: ${updateError.message}`);
      }
      
      toast({ title: 'Success', description: 'Submission graded successfully' });
      
      // Refresh submissions for this post
      const postId = Object.keys(submissions).find(key => 
        submissions[key].some(s => s.id === submissionId)
      );
      
      console.log('Refreshing submissions for post:', postId);
      
      if (postId) {
        await loadSubmissions(postId);
      }
    } catch (err) {
      console.error('Failed to grade submission:', err);
      toast({ 
        title: 'Error', 
        description: `Failed to grade submission: ${err instanceof Error ? err.message : 'Unknown error'}`, 
        variant: 'destructive' 
      });
    }
  };

  const handleSubmitAssignment = async (postId: string, submissionText: string, attachments: PostAttachment[] = []) => {
    if (!user || !classroom || (!submissionText.trim() && attachments.length === 0)) return;
    
    try {
      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!student) throw new Error('Student not found');
      
      // Check if submission already exists and handle accordingly
      const { data: existingSubmission } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('post_id', postId)
        .eq('student_id', student.id)
        .maybeSingle();
      
      let submissionData;
      let error;
      
      if (existingSubmission) {
        // Update existing submission
        const { data, error: updateError } = await supabase
          .from('assignment_submissions')
          .update({
            submission_text: submissionText.trim() || '',
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id)
          .select()
          .single();
        
        submissionData = data;
        error = updateError;
      } else {
        // Create new submission
        const { data, error: insertError } = await supabase
          .from('assignment_submissions')
          .insert({
            post_id: postId,
            student_id: student.id,
            submission_text: submissionText.trim() || ''
          })
          .select()
          .single();
        
        submissionData = data;
        error = insertError;
      }
      
      if (error) throw error;
      
      // Handle file attachments if any
      if (attachments.length > 0 && submissionData) {
        if (existingSubmission) {
          // Delete existing files first
          await supabase
            .from('assignment_submission_files')
            .delete()
            .eq('submission_id', submissionData.id);
        }
        
        // Insert new files
        const fileInserts = attachments.map(attachment => ({
          submission_id: submissionData.id,
          file_name: attachment.file_name || attachment.name,
          file_url: attachment.file_url || attachment.url,
          file_size: attachment.file_size || attachment.size
        }));
        
        const { error: fileError } = await supabase
          .from('assignment_submission_files')
          .insert(fileInserts);
        
        if (fileError) throw fileError;
      }
      
      // Clear the submission text and files
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setSubmissionFiles(prev => ({ ...prev, [postId]: [] }));
      
      toast({ title: 'Success', description: 'Assignment submitted successfully' });
      
      // Refresh submissions for this post
      await loadSubmissions(postId);
    } catch (err) {
      console.error('Failed to submit assignment:', err);
      toast({ title: 'Error', description: 'Failed to submit assignment', variant: 'destructive' });
    }
  };

  // Function to render markdown content as HTML
  const renderContent = (content: string) => {
    if (!content) return '';
    
    // Simple markdown to HTML conversion
    let html = content
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks: ```code``` -> <pre><code>code</code></pre>
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code: `code` -> <code>code</code>
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links: [text](url) -> <a href="url">text</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      // Headings: ### text -> <h3>text</h3>
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Line breaks: Convert \n to <br>
      .replace(/\n/g, '<br>');
    
    return html;
  };

  // Function to get display filename (removes any generated suffixes)
  const getDisplayFileName = (storedName: string) => {
    // Remove timestamp prefix if it exists
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/;
    let cleanName = storedName;
    if (timestampPattern.test(storedName)) {
      cleanName = storedName.replace(timestampPattern, '');
    }
    // Remove random suffix added for uniqueness (format: name_abc123.ext)
    const suffixPattern = /_[a-z0-9]{6}(\.[^.]+)$/;
    if (suffixPattern.test(cleanName)) {
      cleanName = cleanName.replace(suffixPattern, '$1');
    }
    return cleanName;
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
                  {/* Post Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAssignment(false)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          !isAssignment
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-5 w-5" />
                          <span className="font-medium">General Update</span>
                          <span className="text-xs text-center">Share news, resources, or announcements</span>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setIsAssignment(true)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isAssignment
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          <span className="font-medium">Assignment</span>
                          <span className="text-xs text-center">Create homework or graded tasks</span>
                        </div>
                      </button>
                      
                    </div>
                    
                    {/* Assignment Details Form */}
                    {isAssignment && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Assignment Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">
                              Assignment Title *
                            </label>
                            <Input
                              value={assignmentTitle}
                              onChange={(e) => setAssignmentTitle(e.target.value)}
                              placeholder="e.g., Music Theory Quiz #1"
                              className="text-sm border-blue-200 focus:border-blue-400"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">
                              Due Date
                            </label>
                            <Input
                              type="datetime-local"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="text-sm border-blue-200 focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">
                              Max Points
                            </label>
                            <Input
                              type="number"
                              value={maxPoints}
                              onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
                              min="1"
                              max="1000"
                              className="text-sm border-blue-200 focus:border-blue-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Simple Text Editor */}
                  <SimpleTextEditor
                    content={newPost}
                    onChange={setNewPost}
                    placeholder="Announce a new assignment, share a resource, or post a question for discussion."
                    className="min-h-[200px]"
                    showPreview={true}
                  />

                  {/* Post-Specific File Upload */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files to This Post (Optional)
                    </label>
                    <PostFileUpload
                      attachments={postAttachments}
                      onAttachmentsChange={setPostAttachments}
                      maxFiles={5}
                      acceptedTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.zip,.rar"
                      showUploadedFiles={true}
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                                         <Button 
                       onClick={handleCreatePost} 
                       disabled={!newPost.trim() || (isAssignment && !assignmentTitle.trim())}
                       className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                     >
                       {isAssignment ? 'Create Assignment' : 'Post Update'}
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
                        <SimpleTextEditor
                          content={editContent}
                          onChange={setEditContent}
                          placeholder="Edit your post..."
                          className="min-h-[200px]"
                          showPreview={true}
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
                       <div>
                       {/* Assignment Header - Special UI for assignments */}
                       {post.is_assignment && (
                         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                               <div className="bg-blue-100 p-2 rounded-full">
                                 <BookOpen className="h-5 w-5 text-blue-600" />
                               </div>
                               <div>
                                 <h4 className="font-semibold text-blue-900">Assignment</h4>
                                 <p className="text-sm text-blue-700">Max Points: {post.max_points || 100}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               {post.due_date && (
                                 <div className={`text-sm font-medium ${
                                   new Date(post.due_date) < new Date() 
                                     ? 'text-red-600' 
                                     : new Date(post.due_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                                     ? 'text-orange-600'
                                     : 'text-green-600'
                                 }`}>
                                   Due: {new Date(post.due_date).toLocaleDateString()} at {new Date(post.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </div>
                               )}
                               {post.due_date && new Date(post.due_date) < new Date() && (
                                 <Badge variant="destructive" className="mt-1">Overdue</Badge>
                               )}
                             </div>
                           </div>
                         </div>
                       )}
                       
                       {/* Post Content */}
                       <div 
                         className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none text-gray-700 leading-relaxed"
                         dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
                         style={{
                           '--tw-prose-body': '#374151',
                           '--tw-prose-headings': '#111827',
                           '--tw-prose-links': '#3b82f6',
                           '--tw-prose-bold': '#111827',
                           '--tw-prose-code': '#dc2626',
                           '--tw-prose-pre-bg': '#f3f4f6',
                           '--tw-prose-pre-code': '#374151',
                           direction: 'ltr',
                           textAlign: 'left'
                         } as React.CSSProperties}
                       />

                       {/* File Attachments */}
                       {post.attachments && post.attachments.length > 0 && (
                         <div className="mt-4 border-t border-gray-100 pt-4">
                           <div className="flex items-center gap-2 mb-3">
                             <FileText className="h-4 w-4 text-gray-600" />
                             <span className="text-sm font-medium text-gray-700">
                               Attachments ({post.attachments.length})
                             </span>
                           </div>
                           <div className="grid gap-2">
                             {post.attachments.map((attachment: any, index: number) => (
                               <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                 <div className="flex items-center gap-3">
                                   <FileText className="h-5 w-5 text-blue-600" />
                                   <div>
                                     <div className="font-medium text-gray-800">
                                       {getDisplayFileName(attachment.file_name)}
                                     </div>
                                     <div className="text-xs text-gray-500">
                                       {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : '0.00 MB'}
                                     </div>
                                   </div>
                                 </div>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => window.open(attachment.file_url, '_blank')}
                                   className="flex items-center gap-1"
                                 >
                                   <Download className="h-3 w-3" />
                                   Download
                                 </Button>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Assignment Submission for Students */}
                          {post.is_assignment && !isTeacherOfClass && (
                            <div className="border-t border-gray-100 pt-4">
                              {(() => {
                                const isOverdue = post.due_date && new Date(post.due_date) < new Date();
                                const hasSubmitted = submissions[post.post_id]?.some(s => s.student_id === classroom?.currentStudent?.id);
                                const userSubmission = submissions[post.post_id]?.find(s => s.student_id === classroom?.currentStudent?.id);
                                const isGraded = userSubmission?.grade_points !== undefined;
                                
                                return (
                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-gray-700">Assignment Submission</h5>
                                      <div className="flex gap-2">
                                        {hasSubmitted ? (
                                          <Badge className={isGraded ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                            {isGraded ? `Graded: ${userSubmission.grade_points}/${post.max_points}` : 'Submitted - Awaiting Grade'}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-gray-600">
                                            Not Submitted
                                          </Badge>
                                        )}
                                        {isOverdue && (
                                          <Badge variant="destructive">
                                            Overdue
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {hasSubmitted ? (
                                      <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="mb-2">
                                          <span className="text-sm font-medium text-gray-600">Your Submission:</span>
                                          <span className="text-xs text-gray-500 ml-2">
                                            Submitted on {new Date(userSubmission.submitted_at).toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="text-gray-700 mb-3">{userSubmission.submission_text}</div>
                                        
                                        {/* Show submitted files */}
                                        {userSubmission.files && userSubmission.files.length > 0 && (
                                          <div className="mt-3">
                                            <span className="text-sm font-medium text-gray-600">Attached Files:</span>
                                            <div className="mt-2 space-y-2">
                                              {userSubmission.files.map((file: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                                                  <FileText className="h-4 w-4 text-gray-500" />
                                                  <a 
                                                    href={file.file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                  >
                                                    {file.file_name}
                                                  </a>
                                                  <span className="text-xs text-gray-400">
                                                    ({Math.round(file.file_size / 1024)} KB)
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {isGraded && userSubmission.grade_feedback && (
                                          <div className="border-t pt-3">
                                            <span className="text-sm font-medium text-gray-600">Teacher Feedback:</span>
                                            <div className="text-gray-700 mt-1">{userSubmission.grade_feedback}</div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {isOverdue ? (
                                          <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                                            <div className="flex items-center gap-3 text-red-700 mb-2">
                                              <div className="bg-red-100 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5" />
                                              </div>
                                              <span className="font-semibold text-lg">Submission Closed</span>
                                            </div>
                                            <p className="text-red-600 ml-10">
                                              This assignment was due on {new Date(post.due_date).toLocaleString()}. Late submissions are not accepted.
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                              <div className="bg-blue-100 p-2 rounded-full">
                                                <Edit3 className="h-5 w-5 text-blue-600" />
                                              </div>
                                              <h6 className="font-semibold text-blue-900">Submit Your Assignment</h6>
                                            </div>
                                            
                                            {/* Text Submission */}
                                            <div className="space-y-3 mb-4">
                                              <label className="block text-sm font-medium text-gray-700">
                                                Written Response
                                              </label>
                                              <Textarea
                                                placeholder="Write your assignment response here... (optional if uploading files)"
                                                value={newComment[post.post_id] || ''}
                                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                                                className="min-h-[120px] resize-none border-blue-200 focus:border-blue-400 bg-white"
                                              />
                                            </div>

                                            {/* File Upload for Submissions */}
                                            <div className="space-y-3 mb-4">
                                              <label className="block text-sm font-medium text-gray-700">
                                                Upload Assignment Files (Optional)
                                              </label>
                                              <PostFileUpload
                                                attachments={submissionFiles[post.post_id] || []}
                                                onAttachmentsChange={(files) => setSubmissionFiles(prev => ({ ...prev, [post.post_id]: files }))}
                                                maxFiles={3}
                                                acceptedTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                                                showUploadedFiles={true}
                                              />
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t border-blue-200">
                                              <div className="text-sm text-gray-600">
                                                You can submit text, files, or both
                                              </div>
                                              <div className="flex gap-3">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setNewComment(prev => ({ ...prev, [post.post_id]: '' }));
                                                    setSubmissionFiles(prev => ({ ...prev, [post.post_id]: [] }));
                                                  }}
                                                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                                                >
                                                  Clear All
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleSubmitAssignment(post.post_id, newComment[post.post_id] || '', submissionFiles[post.post_id] || [])}
                                                  disabled={(!newComment[post.post_id]?.trim()) && (!submissionFiles[post.post_id] || submissionFiles[post.post_id].length === 0)}
                                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                                                >
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  Submit Assignment
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Assignment Grading for Teachers */}
                          {post.is_assignment && isTeacherOfClass && (
                            <div className="border-t border-gray-100 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-700">Student Submissions</h5>
                                <div className="flex items-center gap-3">
                                  {submissions[post.post_id] && (
                                    <div className="text-sm text-gray-600">
                                      {submissions[post.post_id].filter(s => s.grade_points !== undefined).length} graded / {submissions[post.post_id].length} submitted
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => loadSubmissions(post.post_id)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    {submissions[post.post_id] ? 'Refresh' : 'Load'} Submissions
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Submissions List */}
                              {submissions[post.post_id] && submissions[post.post_id].length > 0 && (
                                <div className="space-y-3">
                                  {submissions[post.post_id].map((submission) => (
                                    <div key={submission.id} className="p-3 bg-gray-50 rounded-lg border">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-800">{submission.author_name}</span>
                                            <span className="text-sm text-gray-600">({submission.author_email})</span>
                                          </div>
                                          <span className="text-xs text-gray-500">
                                            Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                          </span>
                                        </div>
                                        {submission.grade_points !== undefined && submission.grade_points !== null ? (
                                          <Badge className="bg-green-100 text-green-800">
                                            {submission.grade_points}/{post.max_points} points
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-gray-600">
                                            Ungraded
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="text-gray-700 mb-3">{submission.submission_text}</div>
                                      
                                      {/* Show submitted files for teachers */}
                                      {submission.files && submission.files.length > 0 && (
                                        <div className="mt-3 mb-3">
                                          <span className="text-sm font-medium text-gray-600">Attached Files:</span>
                                          <div className="mt-2 space-y-2">
                                            {submission.files.map((file: any, index: number) => (
                                              <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                                                <FileText className="h-4 w-4 text-gray-500" />
                                                <a 
                                                  href={file.file_url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                  {file.file_name}
                                                </a>
                                                <span className="text-xs text-gray-400">
                                                  ({Math.round(file.file_size / 1024)} KB)
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Grading Form */}
                                      {(submission.grade_points === undefined || submission.grade_points === null) ? (
                                        <div className="space-y-2">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-600">Points</label>
                                              <Input
                                                type="number"
                                                min="0"
                                                max={post.max_points || 100}
                                                placeholder="0"
                                                className="text-sm h-8"
                                                onChange={(e) => {
                                                  const input = e.target;
                                                  input.dataset.points = e.target.value;
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-600">Feedback</label>
                                              <Input
                                                placeholder="Optional feedback"
                                                className="text-sm h-8"
                                                onChange={(e) => {
                                                  const input = e.target;
                                                  input.dataset.feedback = e.target.value;
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              const container = e.currentTarget.parentElement;
                                              const pointsInput = container?.querySelector('input[type="number"]') as HTMLInputElement;
                                              const feedbackInput = container?.querySelector('input[placeholder*="feedback"]') as HTMLInputElement;
                                              
                                              const points = parseInt(pointsInput?.value || '0') || 0;
                                              const feedback = feedbackInput?.value || '';
                                              
                                              console.log('Grade button clicked for submission:', submission.id, 'Points:', points, 'Feedback:', feedback);
                                              handleGradeSubmission(submission.id, points, feedback);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            Grade Submission
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-600">
                                          <div>Graded by: {submission.graded_by_name}</div>
                                          <div>Graded on: {new Date(submission.graded_at || '').toLocaleString()}</div>
                                          {submission.grade_feedback && (
                                            <div className="mt-1 p-2 bg-blue-50 rounded border">
                                              <span className="font-medium">Feedback:</span> {submission.grade_feedback}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

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
                         <div className="font-semibold text-gray-800 truncate" title={getDisplayFileName(f.name)}>
                           {getDisplayFileName(f.name)}
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

