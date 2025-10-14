import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  RotateCcw,
  Eye,
  EyeOff,
  Circle,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { QuizResult, QuizQuestion, QuizSubmissionAnswer } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

interface QuizResultsDisplayProps {
  result: QuizResult;
  onRetake?: () => void;
  canRetake?: boolean;
  onBack?: () => void;
}

export default function QuizResultsDisplay({ 
  result, 
  onRetake, 
  canRetake = false,
  onBack
}: QuizResultsDisplayProps) {
  const [showAnswers, setShowAnswers] = useState(result.showAnswers);
  const [answerDetails, setAnswerDetails] = useState<{[key: string]: any}>({});
  const [correctAnswers, setCorrectAnswers] = useState<{[key: string]: any}>({});
  const [localAnswers, setLocalAnswers] = useState(result.answers || []);

  const { submission, questions } = result;
  
  // If answers were not provided, fetch them by submission id
  useEffect(() => {
    const loadSubmissionAnswers = async () => {
      if (localAnswers && localAnswers.length > 0) return;
      if (!submission?.id) return;
      const { data, error } = await supabase
        .from('quiz_submission_answers')
        .select('question_id, selected_answer_id, matching_pairs, is_correct, points_earned')
        .eq('submission_id', submission.id);
      if (!error && data) {
        setLocalAnswers(data as any);
      }
    };
    loadSubmissionAnswers();
  }, [submission?.id]);

  // Fetch answer details when answers or questions change
  useEffect(() => {
    const fetchAnswerDetails = async () => {
      if (!localAnswers || localAnswers.length === 0) return;

      try {
        // Fetch ALL answers for these questions once, then derive both maps.
        const questionIds = questions.map(q => q.id);
        const { data: allAnswers, error } = await supabase
          .rpc('get_answers_for_questions', { question_ids_param: questionIds });

        if (!error && allAnswers) {
          const byId: {[key: string]: any} = {};
          const correctMap: {[key: string]: any} = {};
          (allAnswers as any[]).forEach((a) => {
            byId[a.id] = a;
            if (a.is_correct) correctMap[a.question_id] = a;
          });
          setAnswerDetails(byId);        // lets us show the student's selected answer text immediately
          setCorrectAnswers(correctMap); // used for the correct answer text
        }
      } catch (err) {
        console.error('Error fetching answer details:', err);
      }
    };
    
    fetchAnswerDetails();
  }, [localAnswers, questions]);
  
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <Circle className="h-4 w-4" />;
      case 'true_false': return <CheckCircle className="h-4 w-4" />;
      case 'matching': return <ArrowRight className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'bg-blue-100 text-blue-800';
      case 'true_false': return 'bg-green-100 text-green-800';
      case 'matching': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeTaken = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getAnswerForQuestion = (questionId: string) => {
    return localAnswers.find(answer => answer.question_id === questionId);
  };

  const getCorrectAnswerForQuestion = (question: QuizQuestion) => {
    // This would need to be passed from the parent component
    // For now, we'll show the student's answer
    return getAnswerForQuestion(question.id);
  };

  if (!submission) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Results...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please wait while we process your quiz results.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Summary */}
      <Card className={`border-l-4 ${
        submission.is_passed ? 'border-l-green-500' : 'border-l-red-500'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {submission.is_passed ? (
                  <Trophy className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
                Quiz Results
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {submission.is_passed ? 'Congratulations! You passed!' : 'Better luck next time!'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(submission.percentage_score)}`}>
                {submission.percentage_score.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                {submission.total_score} points earned
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">{submission.total_score}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">{questions.reduce((sum, q) => sum + q.points, 0)}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">{formatTimeTaken(submission.time_taken_minutes)}</div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold">{submission.attempt_number}</div>
              <div className="text-sm text-gray-600">Attempt</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <Badge className={getScoreBadgeColor(submission.percentage_score)}>
              {submission.is_passed ? 'PASSED' : 'FAILED'}
            </Badge>
            
            <div className="flex items-center gap-2">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Classroom
                </Button>
              )}
              
              {canRetake && onRetake && (
                <Button
                  variant="outline"
                  onClick={onRetake}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake Quiz
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center gap-2"
              >
                {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showAnswers ? 'Hide Answers' : 'Show Answers'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Review */}
      {showAnswers && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Question Review</h3>
          
          {questions.map((question, index) => {
            const studentAnswer = getAnswerForQuestion(question.id);
            const isCorrect = studentAnswer?.is_correct || false;
            const pointsEarned = studentAnswer?.points_earned || 0;
            
            return (
              <Card key={question.id} className={`border-l-4 ${
                isCorrect ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                      <Badge className={`${getQuestionTypeColor(question.question_type)} text-xs`}>
                        {getQuestionTypeIcon(question.question_type)}
                        <span className="ml-1 capitalize">
                          {question.question_type.replace('_', ' ')}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.points} point{question.points !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {pointsEarned}/{question.points} points
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <h4 className="font-semibold mb-3">{question.question_text}</h4>
                  
                  {/* Show student's answer */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-600 mb-2">Your Answer:</div>
                    <div className={`p-3 rounded-lg ${
                      isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      {question.question_type === 'matching' ? (
                        <div className="space-y-2">
                          {studentAnswer?.matching_pairs && studentAnswer.matching_pairs.length > 0 ? (
                            studentAnswer.matching_pairs.map((pair: any, pairIndex: number) => (
                              <div key={pairIndex} className="flex items-center gap-2">
                                <span className="font-medium">{pair.left}</span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{pair.right}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500">No matching pairs provided</span>
                          )}
                        </div>
                      ) : (
                        <span>
                          {studentAnswer?.selected_answer_id ? (
                            answerDetails[studentAnswer.selected_answer_id]?.answer_text || 'Answer not found'
                          ) : (
                            'No answer provided'
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Show correct answer */}
                  {showAnswers && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Correct Answer:</div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        {question.question_type === 'matching' ? (
                          <div className="space-y-2">
                            {correctAnswers[question.id] ? (
                              <div className="text-green-800">
                                Correct matching pairs would be shown here
                              </div>
                            ) : (
                              <div className="text-green-800">Correct matching pairs not available</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-green-800">
                            {correctAnswers[question.id]?.answer_text || 'Correct answer not found'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Questions Answered Correctly</span>
              <span className="font-semibold">
                {localAnswers.filter(a => a.is_correct).length} / {questions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Score</span>
              <span className="font-semibold">
                {submission.total_score} / {questions.reduce((sum, q) => sum + q.points, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Percentage</span>
              <span className={`font-semibold ${getScoreColor(submission.percentage_score)}`}>
                {submission.percentage_score.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge className={getScoreBadgeColor(submission.percentage_score)}>
                {submission.is_passed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
