import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, CheckCircle, Users, GraduationCap, Clock, Hash, Edit3, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ClassroomPostCard from "@/components/classroom/ClassroomPostCard";
import AssignmentSubmissionPanel from "@/components/classroom/AssignmentSubmissionPanel";
import PostCreationForm from "@/components/classroom/PostCreationForm";
import QuizTakingInterface from "@/components/quiz/QuizTakingInterface";
import QuizResultsDisplay from "@/components/quiz/QuizResultsDisplay";
import QuizManagementInterface from "@/components/quiz/QuizManagementInterface";
import { QuizFormData, StudentQuizAnswer, QuizResult } from "@/types/quiz";

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
  
  // Quiz-related state
  const [quizData, setQuizData] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [quizMatchingPairs, setQuizMatchingPairs] = useState<any[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<any[]>([]);
  const [currentQuizSubmission, setCurrentQuizSubmission] = useState<any>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [showQuizManagement, setShowQuizManagement] = useState(false);
  const [quizSubmissionStatuses, setQuizSubmissionStatuses] = useState<{[key: string]: any}>({});
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<{id: string, content: string, title?: string} | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = async (postId: string) => {
    const { data } = await supabase.rpc('get_post_comments', { post_id_param: postId });
    setPostComments(prev => ({ ...prev, [postId]: data || [] }));
  };

  const checkQuizSubmissionStatus = async (quizId: string) => {
    try {
      if (!currentStudent) return null;

      const { data: submission, error } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('student_id', currentStudent.user_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking quiz submission:', error);
        return null;
      }

      return submission;
    } catch (error) {
      console.error('Error checking quiz submission:', error);
      return null;
    }
  };

  const loadQuizSubmissionStatuses = async (posts: any[]) => {
    try {
      const quizPosts = posts.filter(post => post.has_quiz);
      const statusMap: {[key: string]: any} = {};
      
      for (const post of quizPosts) {
        // Get quiz ID from the post
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('id')
          .eq('post_id', post.post_id)
          .single();
        
        if (quizData) {
          const submission = await checkQuizSubmissionStatus(quizData.id);
          if (submission) {
            statusMap[post.post_id] = submission;
          }
        }
      }
      
      setQuizSubmissionStatuses(statusMap);
    } catch (error) {
      console.error('Error loading quiz submission statuses:', error);
    }
  };

  // Quiz-related functions
  const createQuiz = async (postId: string, quizFormData: QuizFormData) => {
    try {
      console.log('Creating quiz for post:', postId);
      
      // Create quiz using RPC function to bypass RLS issues
      const { data: quiz, error: quizError } = await supabase.rpc('create_quiz', {
        post_id_param: postId,
        title_param: quizFormData.title,
        description_param: quizFormData.description,
        time_limit_minutes_param: quizFormData.time_limit_minutes,
        show_answers_after_param: quizFormData.show_answers_after,
        show_marks_immediately_param: quizFormData.show_marks_immediately,
        passing_score_param: quizFormData.passing_score,
        max_attempts_param: quizFormData.max_attempts
      });

      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw quizError;
      }
      
      console.log('Quiz created successfully with ID:', quiz);

      // Create questions using RPC function
      const questionsData = quizFormData.questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        order_index: q.order_index,
        answers: q.answers || [],
        matching_pairs: q.matching_pairs || []
      }));

      const { error: questionsError } = await supabase.rpc('create_quiz_questions', {
        quiz_id_param: quiz,
        questions_data: questionsData
      });

      if (questionsError) {
        console.error('Questions creation error:', questionsError);
        throw questionsError;
      }

      toast({ title: 'Success', description: 'Quiz created successfully!' });
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({ title: 'Error', description: 'Failed to create quiz', variant: 'destructive' });
    }
  };

  const loadQuizData = async (postId: string) => {
    try {
      // Try RPC function first, fallback to direct queries
      let data, error;
      
      try {
        const result = await supabase.rpc('get_quiz_by_post_id', {
          post_id_param: postId
        });
        data = result.data;
        error = result.error;
      } catch (rpcError) {
        console.log('RPC function not available, using fallback approach');
        
        // Fallback: Get quiz data using direct queries
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            time_limit_minutes,
            show_answers_after,
            show_marks_immediately,
            passing_score,
            max_attempts
          `)
          .eq('post_id', postId)
          .single();

        if (quizError) {
          toast({ title: 'Error', description: 'No quiz found for this post', variant: 'destructive' });
          return;
        }

        // Get questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .order('order_index');

        if (questionsError) {
          throw questionsError;
        }

        // Get answers
        const { data: answersData, error: answersError } = await supabase
          .from('quiz_answers')
          .select('*')
          .in('question_id', questionsData.map(q => q.id));

        if (answersError) {
          throw answersError;
        }

        // Get matching pairs
        const { data: matchingData, error: matchingError } = await supabase
          .from('quiz_matching_pairs')
          .select('*')
          .in('question_id', questionsData.map(q => q.id));

        if (matchingError) {
          throw matchingError;
        }

        // Transform data to match expected format
        data = [];
        questionsData.forEach(question => {
          const baseRow = {
            quiz_id: quizData.id,
            quiz_title: quizData.title,
            quiz_description: quizData.description,
            time_limit_minutes: quizData.time_limit_minutes,
            show_answers_after: quizData.show_answers_after,
            show_marks_immediately: quizData.show_marks_immediately,
            passing_score: quizData.passing_score,
            max_attempts: quizData.max_attempts,
            question_id: question.id,
            question_text: question.question_text,
            question_type: question.question_type,
            question_points: question.points,
            question_order: question.order_index
          };

          // Add answers
          const questionAnswers = answersData.filter(a => a.question_id === question.id);
          if (questionAnswers.length > 0) {
            questionAnswers.forEach(answer => {
              data.push({
                ...baseRow,
                answer_id: answer.id,
                answer_text: answer.answer_text,
                answer_is_correct: answer.is_correct,
                answer_order: answer.order_index
              });
            });
          } else {
            // Add matching pairs
            const questionMatching = matchingData.filter(m => m.question_id === question.id);
            if (questionMatching.length > 0) {
              questionMatching.forEach(match => {
                data.push({
                  ...baseRow,
                  matching_left: match.left_item,
                  matching_right: match.right_item,
                  matching_order: match.order_index
                });
              });
            } else {
              // Just the question
              data.push(baseRow);
            }
          }
        });

        error = null;
      }

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: 'Error', description: 'No quiz data found', variant: 'destructive' });
        return;
      }

      // Process the data to separate quiz, questions, answers, and matching pairs
      const quiz = data[0];
      const questions = [];
      const answers = [];
      const matchingPairs = [];

      for (const row of data) {
        if (row.question_id && !questions.find(q => q.id === row.question_id)) {
          questions.push({
            id: row.question_id,
            quiz_id: row.quiz_id,
            question_text: row.question_text,
            question_type: row.question_type,
            points: row.question_points,
            order_index: row.question_order
          });
        }

        if (row.answer_id && !answers.find(a => a.id === row.answer_id)) {
          answers.push({
            id: row.answer_id,
            question_id: row.question_id,
            answer_text: row.answer_text,
            is_correct: row.answer_is_correct,
            order_index: row.answer_order
          });
        }

        if (row.matching_left && !matchingPairs.find(mp => mp.left_item === row.matching_left)) {
          matchingPairs.push({
            question_id: row.question_id,
            left_item: row.matching_left,
            right_item: row.matching_right,
            order_index: row.matching_order
          });
        }
      }

      setQuizData({
        id: quiz.quiz_id,
        title: quiz.quiz_title,
        description: quiz.quiz_description,
        time_limit_minutes: quiz.time_limit_minutes,
        show_answers_after: quiz.show_answers_after,
        show_marks_immediately: quiz.show_marks_immediately,
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts
      });
      setQuizQuestions(questions);
      setQuizAnswers(answers);
      setQuizMatchingPairs(matchingPairs);
      
      // Reset timer state
      setTimerStarted(false);
      setTimerCompleted(false);
    } catch (error) {
      console.error('Error loading quiz data:', error);
    }
  };

  const handleTimeUp = () => {
    setTimerCompleted(true);
    toast({ title: 'Time Up!', description: 'Quiz time has expired', variant: 'destructive' });
  };

  const handleEditDescription = () => {
    setEditedDescription(classroom?.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!classroom) return;
    
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ description: editedDescription })
        .eq('id', classroom.id);

      if (error) throw error;

      // Update local state
      setClassroom(prev => prev ? { ...prev, description: editedDescription } : null);
      setIsEditingDescription(false);
      
      toast({ title: 'Success', description: 'Classroom description updated successfully!' });
    } catch (error) {
      console.error('Error updating description:', error);
      toast({ title: 'Error', description: 'Failed to update description', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleEditName = () => {
    setEditedName(classroom?.name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!classroom || !editedName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ name: editedName.trim() })
        .eq('id', classroom.id);

      if (error) throw error;

      // Update local state
      setClassroom(prev => prev ? { ...prev, name: editedName.trim() } : null);
      setIsEditingName(false);
      
      toast({ title: 'Success', description: 'Classroom name updated successfully!' });
    } catch (error) {
      console.error('Error updating name:', error);
      toast({ title: 'Error', description: 'Failed to update classroom name', variant: 'destructive' });
    }
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleExtendDeadline = async (postId: string, newDueDate: string) => {
    try {
      const { error } = await supabase
        .from('classroom_posts')
        .update({ due_date: newDueDate })
        .eq('id', postId);

      if (error) throw error;

      // Update local state
      setFeed(prev => prev.map(post => 
        post.post_id === postId 
          ? { ...post, due_date: newDueDate }
          : post
      ));
      
      toast({ title: 'Success', description: 'Assignment deadline extended successfully!' });
    } catch (error) {
      console.error('Error extending deadline:', error);
      toast({ title: 'Error', description: 'Failed to extend deadline', variant: 'destructive' });
    }
  };

  const handleCancelPostEdit = () => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditContent("");
  };

  const submitQuiz = async (answers: StudentQuizAnswer[]) => {
    if (!quizData || !user) return;

    try {
      // Create quiz submission
      const { data: submission, error: submissionError } = await supabase
        .from('quiz_submissions')
        .insert({
          quiz_id: quizData.id,
          student_id: user.id,
          attempt_number: 1, // For now, always 1
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        })
        .select('id')
        .single();

      if (submissionError) throw submissionError;

      // Create submission answers
      for (const answer of answers) {
        const question = quizQuestions.find(q => q.id === answer.question_id);
        if (!question) continue;

        let isCorrect = false;
        let pointsEarned = 0;

        if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
          const correctAnswer = quizAnswers.find(a => 
            a.question_id === question.id && a.is_correct
          );
          isCorrect = correctAnswer?.id === answer.selected_answer_id;
          pointsEarned = isCorrect ? question.points : 0;
        } else if (question.question_type === 'matching') {
          // For matching, we'd need to compare with correct pairs
          // For now, we'll assume all matches are correct
          isCorrect = answer.matching_pairs.length > 0;
          pointsEarned = isCorrect ? question.points : 0;
        }

        await supabase
          .from('quiz_submission_answers')
          .insert({
            submission_id: submission.id,
            question_id: answer.question_id,
            selected_answer_id: answer.selected_answer_id,
            matching_pairs: answer.matching_pairs,
            is_correct: isCorrect,
            points_earned: pointsEarned
          });
      }

      // Grade the submission
      const { data: gradeResult, error: gradeError } = await supabase.rpc('grade_quiz_submission', {
        submission_id_param: submission.id
      });

      if (gradeError) throw gradeError;

      setCurrentQuizSubmission(submission);
      setShowQuizResults(true);
      
      toast({ title: 'Success', description: 'Quiz submitted successfully!' });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({ title: 'Error', description: 'Failed to submit quiz', variant: 'destructive' });
    }
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
    quizData?: QuizFormData;
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

      // Create quiz if quiz data is provided
      if (data.quizData && postId) {
        try {
          await createQuiz(postId, data.quizData);
        } catch (error) {
          console.error('Quiz creation failed:', error);
          toast({ title: 'Error', description: 'Failed to create quiz', variant: 'destructive' });
          return; // Don't continue if quiz creation fails
        }
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
    // Find the post to get its title
    const post = feed.find(p => p.post_id === postId);
    setEditingPost({
      id: postId,
      content: content,
      title: post?.assignment_title || post?.title
    });
    setEditContent(content);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !classroom) return;

    try {
      const { error } = await supabase
        .from('classroom_posts')
        .update({ content: editContent })
        .eq('id', editingPost.id);

      if (error) throw error;

      // Update local state
      setFeed(prev => prev.map(post => 
        post.post_id === editingPost.id 
          ? { ...post, content: editContent }
          : post
      ));

      setShowEditModal(false);
      setEditingPost(null);
      setEditContent("");
      
      toast({ title: 'Success', description: 'Post updated successfully!' });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({ title: 'Error', description: 'Failed to update post', variant: 'destructive' });
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
      
      // Load quiz submission statuses for enrolled students
      if (isEnrolledStudent && currentStudent) {
        await loadQuizSubmissionStatuses(postsWithAttachments);
      }
      
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
                    {isEditingName ? (
                      <div className="space-y-2 mb-3">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          placeholder="Enter classroom name..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/70 text-2xl sm:text-3xl font-bold"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveName}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelNameEdit}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                          {classroom.name}
                        </h1>
                        {isTeacherOfClass && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEditName}
                            className="text-white/70 hover:text-white hover:bg-white/10 p-1 h-auto"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-blue-100 text-lg">
                      {classroom.teacher_name}
                    </p>
                    <div className="mt-2 max-w-2xl">
                      {isEditingDescription ? (
                        <div className="space-y-2">
                          <Input
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            placeholder="Enter classroom description..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveDescription}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {classroom.description && (
                            <p className="text-blue-200 text-sm flex-1">
                              {classroom.description}
                            </p>
                          )}
                          {isTeacherOfClass && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleEditDescription}
                              className="text-white/70 hover:text-white hover:bg-white/10 p-1 h-auto"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
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

          {/* Quiz Taking Interface */}
          {quizData && !showQuizResults && !showQuizManagement && (
            <QuizTakingInterface
              quiz={quizData}
              questions={quizQuestions}
              answers={quizAnswers}
              matchingPairs={quizMatchingPairs}
              onSubmit={submitQuiz}
              onStartTimer={() => setTimerStarted(true)}
              onTimeUp={handleTimeUp}
              timerStarted={timerStarted}
              timerCompleted={timerCompleted}
              timeLimitMinutes={quizData.time_limit_minutes}
            />
          )}

          {/* Quiz Results Display */}
          {showQuizResults && currentQuizSubmission && (
            <QuizResultsDisplay
              result={{
                submission: currentQuizSubmission,
                answers: [], // Would need to load these
                questions: quizQuestions,
                showAnswers: quizData?.show_answers_after || false
              }}
              onRetake={() => {
                setShowQuizResults(false);
                setCurrentQuizSubmission(null);
                setTimerStarted(false);
                setTimerCompleted(false);
              }}
              canRetake={true}
            />
          )}

          {/* Quiz Management Interface */}
          {showQuizManagement && isTeacherOfClass && (
            <QuizManagementInterface
              quizId={quizData?.id || ''}
              quizTitle={quizData?.title || ''}
              submissions={quizSubmissions}
              questions={quizQuestions}
              onViewSubmission={(submissionId) => {
                // Handle viewing individual submission
                console.log('View submission:', submissionId);
              }}
              onExportResults={() => {
                // Handle exporting results
                console.log('Export results');
              }}
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
                  onExtendDeadline={handleExtendDeadline}
                  comments={postComments[post.post_id] || []}
                >
                  {post.is_assignment && (
                    <>
                      {/* Quiz Actions - Moved to top for better visibility */}
                      {isEnrolledStudent && post.has_quiz && (
                        <div className="border-t border-gray-100 pt-4 mt-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                                🧠 Quiz Assignment
                              </Badge>
                              {post.quiz_time_limit && (
                                <Badge variant="outline" className="text-orange-600 border-orange-200">
                                  ⏱️ {post.quiz_time_limit} min
                                </Badge>
                              )}
                              {quizSubmissionStatuses[post.post_id] && (
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    quizSubmissionStatuses[post.post_id].is_passed 
                                      ? 'text-green-600 border-green-200 bg-green-50' 
                                      : 'text-red-600 border-red-200 bg-red-50'
                                  }`}
                                >
                                  {quizSubmissionStatuses[post.post_id].is_passed ? '✅ Passed' : '❌ Failed'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {quizSubmissionStatuses[post.post_id] ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/quiz/${post.post_id}`, '_blank');
                                  }}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  View Results
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/quiz/${post.post_id}`, '_blank');
                                  }}
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                  🧠 Start Quiz
                                </Button>
                              )}
                              {isTeacherOfClass && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    loadQuizData(post.post_id);
                                    setShowQuizManagement(true);
                                  }}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  Manage Quiz
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <AssignmentSubmissionPanel
                        post={post}
                        isTeacher={isTeacherOfClass}
                        submissions={submissions[post.post_id] || []}
                        currentStudentId={classroom.currentStudent?.user_id}
                        onSubmit={handleSubmitAssignment}
                        onGrade={handleGradeSubmission}
                        onLoadSubmissions={loadSubmissions}
                      />
                    </>
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

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit {editingPost?.title ? 'Assignment' : 'Post'}</h2>
              <Button variant="ghost" size="sm" onClick={handleCancelPostEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {editingPost?.title && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Assignment Title</label>
                  <p className="text-sm text-gray-600 mt-1">{editingPost.title}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter your content here..."
                  className="mt-1 min-h-[200px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCancelPostEdit}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}