import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  EyeOff,
  Upload,
  Image,
  X
} from "lucide-react";
import { Quiz, QuizQuestion, QuizAnswer, QuizMatchingPair, StudentQuizAnswer } from '@/types/quiz';
import AssignmentTimer from '../classroom/AssignmentTimer';

interface QuizTakingInterfaceProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  matchingPairs: QuizMatchingPair[];
  onSubmit: (answers: StudentQuizAnswer[]) => void;
  onStartTimer?: () => void;
  timerStarted?: boolean;
  timerCompleted?: boolean;
  timeLimitMinutes?: number;
  onTimeUp?: () => void;
  isTeacherPreview?: boolean;
}

export default function QuizTakingInterface({
  quiz,
  questions,
  answers,
  matchingPairs,
  onSubmit,
  onStartTimer,
  timerStarted = false,
  timerCompleted = false,
  timeLimitMinutes,
  onTimeUp,
  isTeacherPreview = false
}: QuizTakingInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<StudentQuizAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({});
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [currentQuestion.id]: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreviews(prev => ({ ...prev, [currentQuestion.id]: result }));
        updateAnswer(currentQuestion.id, { 
          image_attachment: result,
          image_filename: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFiles(prev => {
      const updated = { ...prev };
      delete updated[currentQuestion.id];
      return updated;
    });
    setImagePreviews(prev => {
      const updated = { ...prev };
      delete updated[currentQuestion.id];
      return updated;
    });
    updateAnswer(currentQuestion.id, { 
      image_attachment: undefined,
      image_filename: undefined
    });
  };

  const handleSubmit = () => {
    if (isSubmitting) return; // Prevent multiple submissions
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting quiz with answers:', studentAnswers);
      await onSubmit(studentAnswers);
      setShowConfirmDialog(false);
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
      const question = questions.find(q => q.id === answer.question_id);
      if (!question) return false;
      
      if (question.question_type === 'matching') {
        return answer.matching_pairs.length > 0;
      }
      
      // Check if question requires image attachment
      if (question.has_image_attachment) {
        return answer.selected_answer_id !== undefined && answer.image_attachment !== undefined;
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
    
    // Check if question requires image attachment
    if (question.has_image_attachment) {
      return answer.selected_answer_id !== undefined && answer.image_attachment !== undefined;
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Bar - Similar to ABRSM */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Quiz Title */}
          <div>
            <h1 className="text-lg font-semibold">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-sm text-gray-600">{quiz.description}</p>
            )}
          </div>
          
          {/* Right: Controls */}
          <div className="flex items-center gap-4">
            {/* Question Progress Badge */}
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            
            {/* End Test Button - Only show on last question */}
            {!isTeacherPreview && currentQuestionIndex === questions.length - 1 && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || timerCompleted}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                {isSubmitting ? 'Submitting...' : 'End Test'}
              </Button>
            )}
            
            {/* Timer */}
            {timeLimitMinutes && !isTeacherPreview && (
              <div className="flex items-center">
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
          </div>
        </div>
      </div>

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

          {/* Reference Image (if teacher uploaded one) */}
          {currentQuestion.image_url && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Image:</h4>
              <img
                src={currentQuestion.image_url}
                alt="Reference"
                className="max-w-full max-h-64 object-contain border rounded"
              />
            </div>
          )}

          {/* Image Attachment Requirement */}
          {currentQuestion.has_image_attachment && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Image className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Image Upload Required</h4>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                This question requires you to upload an image as part of your answer.
              </p>
              
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id={`image-upload-${currentQuestion.id}`}
                />
                <label
                  htmlFor={`image-upload-${currentQuestion.id}`}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 text-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  {currentAnswer?.image_attachment ? 'Change Image' : 'Upload Image'}
                </label>
                
                {currentAnswer?.image_attachment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700 font-medium">✓ Image uploaded</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    {imagePreviews[currentQuestion.id] && (
                      <img
                        src={imagePreviews[currentQuestion.id]}
                        alt="Your upload"
                        className="max-w-full max-h-48 object-contain border rounded"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Multiple Choice */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {questionAnswers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-3 border rounded-lg ${
                    isTeacherPreview 
                      ? answer.is_correct 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                      : currentAnswer?.selected_answer_id === answer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isTeacherPreview ? '' : 'cursor-pointer'} transition-colors`}
                  onClick={() => !isTeacherPreview && handleMultipleChoiceAnswer(answer.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isTeacherPreview
                        ? answer.is_correct
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                        : currentAnswer?.selected_answer_id === answer.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                    <span className="flex-1">{answer.answer_text}</span>
                    {isTeacherPreview && answer.is_correct && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        ✓ Correct Answer
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQuestion.question_type === 'true_false' && (
            <div className="flex gap-4">
              <Button
                variant={
                  isTeacherPreview
                    ? questionAnswers.find(a => a.answer_text === 'True')?.is_correct
                      ? "default"
                      : "outline"
                    : currentAnswer?.selected_answer_id === questionAnswers.find(a => a.answer_text === 'True')?.id
                    ? "default"
                    : "outline"
                }
                onClick={() => !isTeacherPreview && handleTrueFalseAnswer(true)}
                disabled={isTeacherPreview}
                className={`flex items-center gap-2 ${
                  isTeacherPreview && questionAnswers.find(a => a.answer_text === 'True')?.is_correct
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                True
                {isTeacherPreview && questionAnswers.find(a => a.answer_text === 'True')?.is_correct && (
                  <span className="text-xs">✓</span>
                )}
              </Button>
              <Button
                variant={
                  isTeacherPreview
                    ? questionAnswers.find(a => a.answer_text === 'False')?.is_correct
                      ? "default"
                      : "outline"
                    : currentAnswer?.selected_answer_id === questionAnswers.find(a => a.answer_text === 'False')?.id
                    ? "default"
                    : "outline"
                }
                onClick={() => !isTeacherPreview && handleTrueFalseAnswer(false)}
                disabled={isTeacherPreview}
                className={`flex items-center gap-2 ${
                  isTeacherPreview && questionAnswers.find(a => a.answer_text === 'False')?.is_correct
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                False
                {isTeacherPreview && questionAnswers.find(a => a.answer_text === 'False')?.is_correct && (
                  <span className="text-xs">✓</span>
                )}
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

      {/* Bottom Navigation - ABRSM Style */}
      <div className="bg-white border-t shadow-sm fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="min-w-[100px]"
            >
              Prev
            </Button>
            
            {/* Question Dots Navigation */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-red-500 text-white'
                      : isQuestionAnswered(question.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={`Question ${index + 1}${isQuestionAnswered(question.id) ? ' (Answered)' : ''}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Next Button */}
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="min-w-[100px]"
            >
              Next
            </Button>
          </div>
          
          {/* Info/Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-200"></div>
              <span>Not Answered</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add bottom padding to prevent content from being hidden by fixed navigation */}
      <div className="h-32"></div>

      {/* Teacher Preview Badge */}
      {isTeacherPreview && (
        <div className="flex justify-center pt-4">
          <Badge variant="outline" className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">
            👁️ Teacher Preview Mode - No submission required
          </Badge>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Quiz Submission
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your quiz? Once submitted, you cannot make any changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Quiz Summary:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Total Questions: {questions.length}</div>
                <div>• Answered Questions: {studentAnswers.filter(answer => 
                  answer.selected_answer_id || (answer.matching_pairs && answer.matching_pairs.length > 0)
                ).length}</div>
                <div>• Unanswered Questions: {questions.length - studentAnswers.filter(answer => 
                  answer.selected_answer_id || (answer.matching_pairs && answer.matching_pairs.length > 0)
                ).length}</div>
              </div>
            </div>
            
            {questions.length - studentAnswers.filter(answer => 
              answer.selected_answer_id || (answer.matching_pairs && answer.matching_pairs.length > 0)
            ).length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">You have unanswered questions!</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  Consider reviewing your answers before submitting.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSubmit} 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Submitting...' : 'Yes, Submit Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
