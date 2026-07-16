import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, XCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuizTakingInterface from '@/components/quiz/QuizTakingInterface';
import QuizResultsDisplay from '@/components/quiz/QuizResultsDisplay';
import { StudentQuizAnswer } from '@/types/quiz';

type AttemptInfo = {
  submission_id: string;
  started_at: string;
  seconds_remaining: number | null;
  timed_out?: boolean;
  attempt_number?: number;
};

export default function QuizPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quizData, setQuizData] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [quizMatchingPairs, setQuizMatchingPairs] = useState<any[]>([]);
  const [currentQuizSubmission, setCurrentQuizSubmission] = useState<any>(null);
  const [quizSubmissionAnswers, setQuizSubmissionAnswers] = useState<any[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptReady, setAttemptReady] = useState(false);
  const [beginAttemptLoading, setBeginAttemptLoading] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState<AttemptInfo | null>(null);
  const [studentUserId, setStudentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      void loadQuizData(postId);
    }
  }, [postId]);

  const getStudentUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    return student?.user_id || user.id;
  };

  const checkExistingSubmission = async (quizId: string) => {
    try {
      const userId = await getStudentUserId();
      if (!userId) return null;

      const { data: submissions, error } = await supabase.rpc('check_existing_quiz_submission', {
        quiz_id_param: quizId,
        student_id_param: userId,
      });

      if (error) {
        console.error('Error checking existing submission:', error);
        return null;
      }

      return submissions && submissions.length > 0 ? submissions[0] : null;
    } catch (error) {
      console.error('Error checking existing submission:', error);
      return null;
    }
  };

  const fetchQuizSubmissionAnswers = async (submissionId: string) => {
    try {
      const { data: answers, error } = await supabase.rpc('get_quiz_submission_answers', {
        submission_id_param: submissionId,
      });

      if (error) {
        const { data: directAnswers } = await supabase
          .from('quiz_submission_answers')
          .select('*')
          .eq('submission_id', submissionId);
        setQuizSubmissionAnswers(directAnswers || []);
        return;
      }

      setQuizSubmissionAnswers(answers || []);
    } catch (error) {
      console.error('Error fetching submission answers:', error);
      setQuizSubmissionAnswers([]);
    }
  };

  const sanitizeAnswers = (rows: any[]) =>
    rows.map((a) => ({ ...a, is_correct: false }));

  const loadQuizData = async (postIdValue: string) => {
    try {
      setIsLoading(true);
      const userId = await getStudentUserId();
      setStudentUserId(userId);

      let data: any[] | null = null;
      let error: any = null;

      try {
        const result = await supabase.rpc('get_quiz_by_post_id', {
          post_id_param: postIdValue,
        });
        data = result.data;
        error = result.error;
      } catch {
        const { data: quizRow, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            id, title, description, time_limit_minutes, show_answers_after,
            show_marks_immediately, passing_score, max_attempts, scheduled_open_at, status
          `)
          .eq('post_id', postIdValue)
          .single();

        if (quizError || !quizRow) {
          toast({ title: 'Error', description: 'No quiz found for this post', variant: 'destructive' });
          return;
        }

        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizRow.id)
          .order('order_index');
        if (questionsError) throw questionsError;

        const questionIds = (questionsData || []).map((q) => q.id);
        const { data: answersData } = await supabase.rpc('get_answers_for_questions', {
          question_ids_param: questionIds,
        });

        const { data: matchingData } = await supabase
          .from('quiz_matching_pairs')
          .select('*')
          .in('question_id', questionIds);

        data = [];
        (questionsData || []).forEach((question) => {
          const baseRow = {
            quiz_id: quizRow.id,
            quiz_title: quizRow.title,
            quiz_description: quizRow.description,
            time_limit_minutes: quizRow.time_limit_minutes,
            show_answers_after: quizRow.show_answers_after,
            show_marks_immediately: quizRow.show_marks_immediately,
            passing_score: quizRow.passing_score,
            max_attempts: quizRow.max_attempts,
            scheduled_open_at: quizRow.scheduled_open_at,
            question_id: question.id,
            question_text: question.question_text,
            question_type: question.question_type,
            question_points: question.points,
            question_order: question.order_index,
            has_image_attachment: question.has_image_attachment || false,
            image_url: question.image_url,
            image_filename: question.image_filename,
          };

          const questionAnswers = (answersData || []).filter((a: any) => a.question_id === question.id);
          if (questionAnswers.length > 0) {
            questionAnswers.forEach((answer: any) => {
              data!.push({
                ...baseRow,
                answer_id: answer.id,
                answer_text: answer.answer_text,
                answer_is_correct: false,
                answer_order: answer.order_index ?? 0,
              });
            });
          } else {
            const questionMatching = (matchingData || []).filter((m: any) => m.question_id === question.id);
            if (questionMatching.length > 0) {
              const rights = questionMatching.map((m: any) => m.right_item);
              // Scramble rights client-side as defense in depth
              for (let i = rights.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rights[i], rights[j]] = [rights[j], rights[i]];
              }
              questionMatching.forEach((match: any, idx: number) => {
                data!.push({
                  ...baseRow,
                  matching_left: match.left_item,
                  matching_right: rights[idx],
                  matching_order: match.order_index,
                });
              });
            } else {
              data!.push(baseRow);
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

      const quiz = data[0];
      const questions: any[] = [];
      const answers: any[] = [];
      const matchingPairs: any[] = [];

      for (const row of data) {
        if (row.question_id && !questions.find((q) => q.id === row.question_id)) {
          questions.push({
            id: row.question_id,
            quiz_id: row.quiz_id,
            question_text: row.question_text,
            question_type: row.question_type,
            points: row.question_points,
            order_index: row.question_order,
            has_image_attachment: row.has_image_attachment || false,
            image_url: row.image_url,
            image_filename: row.image_filename,
          });
        }

        if (row.answer_id && !answers.find((a) => a.id === row.answer_id)) {
          answers.push({
            id: row.answer_id,
            question_id: row.question_id,
            answer_text: row.answer_text,
            is_correct: false,
            order_index: row.answer_order,
          });
        }

        if (
          row.matching_left &&
          !matchingPairs.find(
            (mp) => mp.left_item === row.matching_left && mp.question_id === row.question_id
          )
        ) {
          matchingPairs.push({
            question_id: row.question_id,
            left_item: row.matching_left,
            right_item: row.matching_right,
            order_index: row.matching_order,
          });
        }
      }

      const quizScheduledOpenAt = quiz.scheduled_open_at || quiz.quiz_scheduled_open_at;
      const isScheduled = quizScheduledOpenAt && new Date(quizScheduledOpenAt) > new Date();

      setQuizData({
        id: quiz.quiz_id,
        title: quiz.quiz_title,
        description: quiz.quiz_description,
        time_limit_minutes: quiz.time_limit_minutes,
        show_answers_after: quiz.show_answers_after,
        show_marks_immediately: quiz.show_marks_immediately,
        passing_score: quiz.passing_score,
        max_attempts: quiz.max_attempts,
        scheduled_open_at: quizScheduledOpenAt,
      });

      if (isScheduled) {
        toast({
          title: 'Quiz Not Available',
          description: `This quiz opens on ${new Date(quizScheduledOpenAt).toLocaleString()}.`,
          variant: 'destructive',
        });
        setQuizQuestions([]);
        setQuizAnswers([]);
        setQuizMatchingPairs([]);
        return;
      }

      setQuizQuestions(questions);
      setQuizAnswers(sanitizeAnswers(answers));
      setQuizMatchingPairs(matchingPairs);

      const existingSubmission = await checkExistingSubmission(quiz.quiz_id);
      if (existingSubmission) {
        setCurrentQuizSubmission(existingSubmission);
        setShowQuizResults(true);
        await fetchQuizSubmissionAnswers(existingSubmission.id);
        return;
      }

      // Resume in-progress attempt if one already exists (does not create a new attempt)
      if (userId) {
        const { data: activeResult } = await supabase.rpc('get_active_quiz_attempt', {
          quiz_id_param: quiz.quiz_id,
          student_id_param: userId,
        });

        if (activeResult && !activeResult.error && activeResult.active) {
          applyAttempt(activeResult as AttemptInfo & { timed_out?: boolean });
        }
      }
    } catch (error) {
      console.error('Error loading quiz data:', error);
      toast({ title: 'Error', description: 'Failed to load quiz', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const applyAttempt = (result: AttemptInfo & { timed_out?: boolean; already_started?: boolean }) => {
    setAttemptInfo({
      submission_id: result.submission_id,
      started_at: result.started_at,
      seconds_remaining: result.seconds_remaining,
      timed_out: result.timed_out,
      attempt_number: result.attempt_number,
    });
    setAttemptReady(true);
    setTimerStarted(true);
    setTimerCompleted(false);
  };

  const beginAttempt = async () => {
    if (!quizData) return;
    setBeginAttemptLoading(true);
    try {
      const userId = studentUserId || (await getStudentUserId());
      if (!userId) {
        toast({ title: 'Error', description: 'You must be logged in to start the quiz', variant: 'destructive' });
        return;
      }

      const { data: result, error } = await supabase.rpc('start_quiz_attempt', {
        quiz_id_param: quizData.id,
        student_id_param: userId,
      });

      if (error) throw error;
      if (result?.error) {
        toast({ title: 'Cannot start quiz', description: result.error, variant: 'destructive' });
        return;
      }

      applyAttempt(result as AttemptInfo);
      toast({
        title: result.already_started ? 'Resuming quiz' : 'Quiz started',
        description: quizData.time_limit_minutes
          ? 'Your timer is running. Refreshing will not reset your time.'
          : 'Your attempt has been recorded.',
      });
    } catch (error: any) {
      console.error('Error starting quiz attempt:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Could not start quiz attempt. Apply the latest database migration if this persists.',
        variant: 'destructive',
      });
    } finally {
      setBeginAttemptLoading(false);
    }
  };

  const submitQuiz = useCallback(
    async (answers: StudentQuizAnswer[]) => {
      if (!quizData) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: 'Error', description: 'You must be logged in to submit a quiz', variant: 'destructive' });
          return;
        }

        const userId = studentUserId || user.id;

        const { data: submissionResult, error: submissionError } = await supabase.rpc(
          'submit_quiz_complete',
          {
            quiz_id_param: quizData.id,
            student_id_param: userId,
            answers_data: answers,
          }
        );

        if (submissionError) throw submissionError;
        if (submissionResult?.error) throw new Error(submissionResult.error);

        setTimerCompleted(true);
        setTimerStarted(false);

        const submissionData = {
          id: submissionResult.submission_id,
          total_score: submissionResult.score,
          percentage_score: submissionResult.percentage,
          is_passed: submissionResult.passed,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
          attempt_number: submissionResult.attempt_number,
          time_taken_minutes: submissionResult.time_taken_minutes,
        };

        setCurrentQuizSubmission(submissionData);
        await fetchQuizSubmissionAnswers(submissionResult.submission_id);
        setShowQuizResults(true);

        toast({
          title: submissionResult.timed_out ? 'Time up — quiz submitted' : 'Success',
          description: submissionResult.timed_out
            ? 'Your quiz was submitted because time ran out.'
            : 'Quiz submitted successfully!',
          variant: submissionResult.timed_out ? 'destructive' : 'default',
        });
      } catch (error: any) {
        console.error('Error submitting quiz:', error);

        if (error.code === '23505' && error.message?.includes('duplicate key')) {
          const existingSubmission = await checkExistingSubmission(quizData.id);
          if (existingSubmission) {
            setCurrentQuizSubmission(existingSubmission);
            setShowQuizResults(true);
            await fetchQuizSubmissionAnswers(existingSubmission.id);
            toast({
              title: 'Already Submitted',
              description: 'You have already submitted this quiz. Showing your results.',
            });
            return;
          }
        }

        toast({
          title: 'Error',
          description: error?.message || 'Failed to submit quiz',
          variant: 'destructive',
        });
      }
    },
    [quizData, studentUserId, toast]
  );

  const handleTimeUp = () => {
    setTimerCompleted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">
            The quiz you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isQuizLocked = quizData.scheduled_open_at && new Date(quizData.scheduled_open_at) > new Date();

  if (isQuizLocked && quizQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Yet Available</h2>
            <p className="text-gray-600 mb-4">This quiz is scheduled to open on:</p>
            <Badge variant="outline" className="text-lg px-4 py-2 text-yellow-600 border-yellow-300 bg-yellow-50 mb-6">
              {new Date(quizData.scheduled_open_at).toLocaleString()}
            </Badge>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classroom
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goBack = () => {
    if (window.history.length <= 1) {
      window.close();
      setTimeout(() => {
        if (!window.closed) navigate(-1);
      }, 100);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Classroom
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{quizData.title}</h1>
                {quizData.description && (
                  <p className="text-sm text-gray-600 mt-1">{quizData.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {quizData.time_limit_minutes && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {quizData.time_limit_minutes} min
                </Badge>
              )}
              <Badge variant="outline" className="text-blue-600">
                {quizQuestions.length} Question{quizQuestions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {!showQuizResults ? (
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
            initialSecondsRemaining={attemptInfo?.seconds_remaining}
            attemptReady={attemptReady}
            onBeginAttempt={beginAttempt}
            beginAttemptLoading={beginAttemptLoading}
          />
        ) : (
          <QuizResultsDisplay
            result={{
              submission: currentQuizSubmission,
              answers: quizSubmissionAnswers,
              questions: quizQuestions,
              showAnswers: quizData.show_answers_after || false,
            }}
            onRetake={() => {
              setShowQuizResults(false);
              setCurrentQuizSubmission(null);
              setQuizSubmissionAnswers([]);
              setTimerStarted(false);
              setTimerCompleted(false);
              setAttemptReady(false);
              setAttemptInfo(null);
            }}
            canRetake={quizData.max_attempts > 1}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
