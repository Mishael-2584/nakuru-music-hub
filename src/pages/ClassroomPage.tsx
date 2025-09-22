import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, CheckCircle, Users, GraduationCap, Clock, Hash } from "lucide-react";
import ClassroomPostCard from "@/components/classroom/ClassroomPostCard";
import AssignmentSubmissionPanel from "@/components/classroom/AssignmentSubmissionPanel";
import PostCreationForm from "@/components/classroom/PostCreationForm";

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
  student_id: string;
  submission_text: string;
  submitted_at: string;
  grade_points?: number;
  grade_feedback?: string;
  graded_by?: string;
  graded_at?: string;
  author_name?: string;
  author_email?: string;
  graded_by_name?: string;
  files?: SubmissionAttachment[];
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

  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission[]>>({});
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const loadComments = async (postId: string) => {
    const { data } = await supabase.rpc('get_post_comments', { post_id_param: postId });
    setPostComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !classroom) return;
    const text = (newComment[postId] || '').trim();
    if (!text) return;
    try {
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

  const handleCreatePost = async (data: {
    content: string;
    isAssignment: boolean;
    assignmentTitle: string;
    dueDate: string;
    maxPoints: number;
    isTimed: boolean;
    timeLimitMinutes: number;
    attachments: any[];
  }) => {
    if (!classroom) return;
    setIsCreatingPost(true);
    try {
      const { data: t, error: terr } = await supabase.from("teachers").select("id").eq("user_id", user?.id).single();
      if (terr || !t?.id) {
        toast({ title: "Not a teacher", description: "Only the class teacher can post.", variant: "destructive" });
        return;
      }
      
      let postId;
      try {
        const { data: postData, error } = await supabase.rpc("create_classroom_post", {
          classroom_id_param: classroom.id,
          author_teacher_id_param: t.id,
          content_param: data.content,
        });
        
        if (error) throw error;
        
        if (postData && Array.isArray(postData) && postData.length > 0) {
          postId = postData[0]?.id;
        } else if (postData?.id) {
          postId = postData.id;
        }
      } catch (rpcError) {
        console.error('RPC call failed, falling back to direct insert:', rpcError);
      }
      
      if (!postId) {
        const { data: directData, error: directError } = await supabase
          .from('classroom_posts')
          .insert({
            classroom_id: classroom.id,
            author_teacher_id: t.id,
            content: data.content,
            is_assignment: data.isAssignment,
            assignment_title: data.isAssignment ? data.assignmentTitle : null,
            due_date: data.isAssignment && data.dueDate ? data.dueDate : null,
            max_points: data.isAssignment ? data.maxPoints : null,
            is_timed: data.isAssignment ? data.isTimed : false,
            time_limit_minutes: data.isAssignment && data.isTimed ? data.timeLimitMinutes : null
          })
          .select('id')
          .single();
        
        if (directError) throw directError;
        postId = directData.id;
      }
      
      if (data.isAssignment) {
        await supabase
          .from('classroom_posts')
          .update({
            is_assignment: true,
            assignment_title: data.assignmentTitle,
            due_date: data.dueDate || null,
            max_points: data.maxPoints || null,
            is_timed: data.isTimed,
            time_limit_minutes: data.isTimed ? data.timeLimitMinutes : null
          })
          .eq('id', postId);
      }
      
      if (data.attachments.length > 0) {
        for (const attachment of data.attachments) {
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
      
      await loadFeed(classroom.id);
      toast({ title: "Posted", description: "Your update has been shared." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleSubmitAssignment = async (postId: string, submissionText: string, files: any[]) => {
    if (!user) return;
    
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!student) throw new Error('Student not found');
      
      const { data: existingSubmission } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('post_id', postId)
        .eq('student_id', student.id)
        .maybeSingle();
      
      let submissionData;
      let error;
      
      if (existingSubmission) {
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
        const { data, error: insertError } = await supabase
          .from('assignment_submissions')
          .insert({
            post_id: postId,
            student_id: student.id,
            submission_text: submissionText.trim() || ''
          } as any)
          .select()
          .single();
        
        submissionData = data;
        error = insertError;
      }
      
      if (error) throw error;
      
      if (files.length > 0 && submissionData) {
        if (existingSubmission) {
          await supabase
            .from('assignment_submission_files')
            .delete()
            .eq('submission_id', submissionData.id);
        }
        
        const uploadedFiles = files.filter(f => f.uploaded && f.file_url);
        
        if (uploadedFiles.length > 0) {
          const fileInserts = uploadedFiles.map(attachment => ({
            submission_id: submissionData.id,
            file_name: attachment.file_name,
            file_url: attachment.file_url,
            file_size: attachment.file_size || 0
          }));
          
          const { error: fileError } = await supabase
            .from('assignment_submission_files')
            .insert(fileInserts as any);
          
          if (fileError) throw fileError;
        }
      }
      
      toast({ title: 'Success', description: 'Assignment submitted successfully' });
      await loadSubmissions(postId);
      if (classroom) await loadFeed(classroom.id);
    } catch (err) {
      console.error('Failed to submit assignment:', err);
      toast({ 
        title: 'Error', 
        description: `Failed to submit assignment: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: 'destructive' 
      });
    }
  };

  const handleGradeSubmission = async (submissionId: string, points: number, feedback: string) => {
    if (!user) return;
    
    try {
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (teacherError || !teacher) {
        throw new Error('Teacher not found');
      }
      
      const { error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          grade_points: points,
          grade_feedback: feedback || null,
          graded_by: teacher.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (updateError) throw updateError;
      
      toast({ title: 'Success', description: 'Submission graded successfully' });
      
      const postId = Object.keys(submissions).find(key => 
        submissions[key].some(s => s.id === submissionId)
      );
      
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

  const handleEditPost = (postId: string, content: string) => {
    // Implementation for editing posts - would need edit modal
    console.log('Edit post:', postId, content);
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

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
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

        if (user?.id) {
          const { data: t } = await supabase
            .from("teachers")
            .select("id")
            .eq("user_id", user.id)
            .single();
          if (t?.id && loaded.teacher_id === t.id) setIsTeacherOfClass(true);

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
            
            setClassroom(prev => prev ? { ...prev, currentStudent: s } : null);
          }
        }

        await loadFeed(id);
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
      
      for (const post of postsWithAttachments) {
        if (post.is_assignment) {
          await loadSubmissions(post.post_id);
        }
      }
    }
  };

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
      
      const userIds = [...new Set((data || []).map(sub => sub.students?.user_id).filter(Boolean))];
      let userEmails: { [key: string]: string } = {};
      
      if (userIds.length > 0) {
        try {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);
          
          if (profiles && profiles.length > 0) {
            userEmails = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile.email || 'No email found';
              return acc;
            }, {} as { [key: string]: string });
          }
        } catch (emailError) {
          console.error('Failed to fetch user emails:', emailError);
        }
      }

      const transformedSubmissions = (data || []).map(sub => {
        const files = sub.assignment_submission_files || [];
        
        return {
          ...sub,
          author_name: sub.students?.student_name || 'Unknown Student',
          author_email: userEmails[sub.students?.user_id] || 'No email',
          graded_by_name: sub.teachers?.name || 'Unknown Teacher',
          files: files.map(file => ({
            id: file.id,
            file_name: file.file_name,
            file_url: file.file_url,
            file_size: file.file_size || 0,
            file_type: file.file_type || 'application/octet-stream'
          }))
        };
      });
      
      setSubmissions(prev => ({ ...prev, [postId]: transformedSubmissions }));
    } catch (err) {
      console.error('Failed to load submissions:', err);
      toast({ title: 'Error', description: 'Failed to load submissions', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Classroom Not Found</h2>
            <p className="text-gray-600 mb-6">The classroom you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {classroom.name}
                    </h1>
                    <p className="text-blue-100 text-lg">
                      {classroom.teacher_name}
                    </p>
                    {classroom.description && (
                      <p className="text-blue-200 text-sm mt-2 max-w-2xl">
                        {classroom.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  {classroom.class_code && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
                      <Hash className="h-3 w-3 mr-1" />
                      {classroom.class_code}
                    </Badge>
                  )}
                  <Badge className={`px-3 py-1 backdrop-blur-sm ${
                    classroom.status === 'approved' 
                      ? 'bg-green-500/20 text-green-100 border-green-300/30' 
                      : 'bg-yellow-500/20 text-yellow-100 border-yellow-300/30'
                  }`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {classroom.status}
                  </Badge>
                  
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Class Feed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{feed.length} posts</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 border-white/30 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Post Creation Form for Teachers */}
          {isTeacherOfClass && (
            <PostCreationForm 
              onSubmit={handleCreatePost}
              isSubmitting={isCreatingPost}
            />
          )}

          {/* Feed */}
          <div className="space-y-6">
            {feed.length > 0 ? (
              feed.map(post => (
                <ClassroomPostCard
                  key={post.post_id}
                  post={post}
                  isTeacher={isTeacherOfClass}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onLoadComments={loadComments}
                  comments={postComments[post.post_id] || []}
                >
                  {post.is_assignment && (
                    <AssignmentSubmissionPanel
                      post={post}
                      isTeacher={isTeacherOfClass}
                      submissions={submissions[post.post_id] || []}
                      currentStudentId={classroom.currentStudent?.id}
                      onSubmit={handleSubmitAssignment}
                      onGrade={handleGradeSubmission}
                      onLoadSubmissions={loadSubmissions}
                    />
                  )}
                  
                  {/* Comment Input */}
                  {(isEnrolledStudent || isTeacherOfClass) && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex gap-3">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment[post.post_id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.post_id]: e.target.value }))}
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.post_id);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleAddComment(post.post_id)} 
                          disabled={!newComment[post.post_id]?.trim()}
                          size="sm"
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  )}
                </ClassroomPostCard>
              ))
            ) : (
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {isTeacherOfClass 
                      ? "Share your first update with the class! Create an announcement or assignment to get started." 
                      : "Your instructor will post updates, assignments, and resources here."
                    }
                  </p>
                  {isTeacherOfClass && (
                    <div className="mt-6">
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Share updates</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          <span>Create assignments</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Upload resources</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}