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
