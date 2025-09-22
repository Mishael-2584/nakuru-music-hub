import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react";
import { Quiz, QuizQuestion, QuizAnswer, QuizMatchingPair, StudentQuizAnswer } from '@/types/quiz';
import AssignmentTimer from '../classroom/AssignmentTimer';

interface QuizTakingInterfaceProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  matchingPairs: QuizMatchingPair[];
  onSubmit: (answers: StudentQuizAnswer[]) => void;
  onStartTimer: () => void;
  timerStarted: boolean;
  timerCompleted: boolean;
  timeLimitMinutes?: number;
}

export default function QuizTakingInterface({
  quiz,
  questions,
  answers,
  matchingPairs,
  onSubmit,
  onStartTimer,
  timerStarted,
  timerCompleted,
  timeLimitMinutes
}: QuizTakingInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<StudentQuizAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Initialize student answers
  useEffect(() => {
    const initialAnswers: StudentQuizAnswer[] = questions.map(question => ({
      question_id: question.id,
      selected_answer_id: undefined,
      matching_pairs: []
    }));
    setStudentAnswers(initialAnswers);
  }, [questions]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = studentAnswers.find(a => a.question_id === currentQuestion.id);
  const questionAnswers = answers.filter(a => a.question_id === currentQuestion.id);
  const questionMatchingPairs = matchingPairs.filter(mp => mp.question_id === currentQuestion.id);

  const updateAnswer = (questionId: string, updates: Partial<StudentQuizAnswer>) => {
    setStudentAnswers(prev => 
      prev.map(answer => 
        answer.question_id === questionId 
          ? { ...answer, ...updates }
          : answer
      )
    );
  };

  const handleMultipleChoiceAnswer = (answerId: string) => {
    updateAnswer(currentQuestion.id, { selected_answer_id: answerId });
  };

  const handleTrueFalseAnswer = (isTrue: boolean) => {
    const correctAnswer = questionAnswers.find(a => a.answer_text === (isTrue ? 'True' : 'False'));
    if (correctAnswer) {
      updateAnswer(currentQuestion.id, { selected_answer_id: correctAnswer.id });
    }
  };

  const handleMatchingAnswer = (leftItem: string, rightItem: string) => {
    const currentMatching = currentAnswer?.matching_pairs || [];
    const existingIndex = currentMatching.findIndex(pair => pair.left === leftItem);
    
    let updatedMatching;
    if (existingIndex >= 0) {
      // Update existing pair
      updatedMatching = [...currentMatching];
      updatedMatching[existingIndex] = { left: leftItem, right: rightItem };
    } else {
      // Add new pair
      updatedMatching = [...currentMatching, { left: leftItem, right: rightItem }];
    }
    
    updateAnswer(currentQuestion.id, { matching_pairs: updatedMatching });
  };

  const removeMatchingAnswer = (leftItem: string) => {
    const currentMatching = currentAnswer?.matching_pairs || [];
    const updatedMatching = currentMatching.filter(pair => pair.left !== leftItem);
    updateAnswer(currentQuestion.id, { matching_pairs: updatedMatching });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    try {
      console.log('Submitting quiz with answers:', studentAnswers);
      await onSubmit(studentAnswers);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  const getAnsweredCount = () => {
    return studentAnswers.filter(answer => {
      if (currentQuestion.question_type === 'matching') {
        return answer.matching_pairs.length > 0;
      }
      return answer.selected_answer_id !== undefined;
    }).length;
  };

  const isQuestionAnswered = (questionId: string) => {
    const answer = studentAnswers.find(a => a.question_id === questionId);
    if (!answer) return false;
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return false;
    
    if (question.question_type === 'matching') {
      return answer.matching_pairs.length > 0;
    }
    return answer.selected_answer_id !== undefined;
  };

  const getMatchingRightItems = () => {
    const usedRightItems = currentAnswer?.matching_pairs.map(pair => pair.right) || [];
    return questionMatchingPairs
      .filter(pair => !usedRightItems.includes(pair.right_item))
      .map(pair => pair.right_item);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {getAnsweredCount()} answered
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timer */}
      {timeLimitMinutes && (
        <div className="mb-4">
          <AssignmentTimer
            timeLimitMinutes={timeLimitMinutes}
            onTimeUp={() => {
              if (!timerCompleted && !isSubmitting) {
                console.log('Timer expired, auto-submitting quiz');
                handleSubmit();
              }
            }}
            onStartTimer={onStartTimer}
            isStarted={timerStarted}
            isCompleted={timerCompleted}
          />
        </div>
      )}

      {/* Question Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Question Navigation</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-2"
            >
              {showReview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showReview ? 'Hide Review' : 'Show Review'}
            </Button>
          </div>
          
          {showReview && (
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
              {questions.map((question, index) => (
                <Button
                  key={question.id}
                  variant={index === currentQuestionIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-8 w-8 p-0 ${
                    isQuestionAnswered(question.id) 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : ''
                  }`}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} of {questions.length}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className={`${getQuestionTypeColor(currentQuestion.question_type)} text-xs`}>
              {getQuestionTypeIcon(currentQuestion.question_type)}
              <span className="ml-1 capitalize">
                {currentQuestion.question_type.replace('_', ' ')}
              </span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">{currentQuestion.question_text}</h3>

          {/* Multiple Choice */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {questionAnswers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    currentAnswer?.selected_answer_id === answer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleMultipleChoiceAnswer(answer.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      currentAnswer?.selected_answer_id === answer.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                    <span>{answer.answer_text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.question_type === 'true_false' && (
            <div className="flex gap-4">
              <Button
                variant={currentAnswer?.selected_answer_id === questionAnswers.find(a => a.answer_text === 'True')?.id ? "default" : "outline"}
                onClick={() => handleTrueFalseAnswer(true)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                True
              </Button>
              <Button
                variant={currentAnswer?.selected_answer_id === questionAnswers.find(a => a.answer_text === 'False')?.id ? "default" : "outline"}
                onClick={() => handleTrueFalseAnswer(false)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                False
              </Button>
            </div>
          )}

          {/* Matching */}
          {currentQuestion.question_type === 'matching' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Items */}
                <div>
                  <h4 className="font-medium mb-3">Items to Match</h4>
                  <div className="space-y-2">
                    {questionMatchingPairs.map((pair) => (
                      <div
                        key={pair.id}
                        className={`p-3 border rounded-lg ${
                          currentAnswer?.matching_pairs.find(p => p.left === pair.left_item)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{pair.left_item}</span>
                          {currentAnswer?.matching_pairs.find(p => p.left === pair.left_item) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMatchingAnswer(pair.left_item)}
                              className="text-red-600 hover:text-red-700"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Items */}
                <div>
                  <h4 className="font-medium mb-3">Match With</h4>
                  <div className="space-y-2">
                    {getMatchingRightItems().map((rightItem) => (
                      <Button
                        key={rightItem}
                        variant="outline"
                        onClick={() => {
                          // Find the first unmatched left item
                          const unmatchedLeft = questionMatchingPairs.find(pair => 
                            !currentAnswer?.matching_pairs.find(p => p.left === pair.left_item)
                          );
                          if (unmatchedLeft) {
                            handleMatchingAnswer(unmatchedLeft.left_item, rightItem);
                          }
                        }}
                        className="w-full justify-start"
                      >
                        {rightItem}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Matches */}
              {currentAnswer?.matching_pairs.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Your Matches</h4>
                  <div className="space-y-2">
                    {currentAnswer.matching_pairs.map((pair, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded">
                        <span className="font-medium">{pair.left}</span>
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{pair.right}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMatchingAnswer(pair.left)}
                          className="text-red-600 hover:text-red-700 ml-auto"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || timerCompleted}
          className="bg-purple-600 hover:bg-purple-700 px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
}
