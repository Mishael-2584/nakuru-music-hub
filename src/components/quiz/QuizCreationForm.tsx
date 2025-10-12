import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Settings, 
  Clock, 
  Eye, 
  EyeOff,
  CheckCircle,
  Circle,
  ArrowRight,
  Hash,
  Calendar,
  Save,
  Upload,
  Image
} from "lucide-react";
import { QuizFormData, QuizQuestionFormData } from '@/types/quiz';
import QuizQuestionEditor from './QuizQuestionEditor';

interface QuizCreationFormProps {
  onSubmit: (quizData: QuizFormData) => void;
  isSubmitting?: boolean;
  hideSubmitButton?: boolean;
}

export default function QuizCreationForm({ onSubmit, isSubmitting = false, hideSubmitButton = false }: QuizCreationFormProps) {
  const [quizData, setQuizData] = useState<QuizFormData>({
    title: '',
    description: '',
    time_limit_minutes: undefined,
    show_answers_after: true,
    show_marks_immediately: true,
    passing_score: 60,
    max_attempts: 1,
    scheduled_open_at: undefined,
    status: 'draft',
    is_draft: true,
    questions: []
  });

  // Check if quiz is ready for submission
  const isQuizReady = () => {
    if (!quizData.title.trim() || quizData.questions.length === 0) return false;
    
    return quizData.questions.every(q => {
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        return q.answers.length >= 2 && q.answers.some(a => a.is_correct);
      } else if (q.question_type === 'matching') {
        return q.matching_pairs.length >= 2;
      }
      return false;
    });
  };

  // Get validation message for why quiz can't be submitted
  const getValidationMessage = () => {
    if (!quizData.title.trim()) return "Please enter a quiz title";
    if (quizData.questions.length === 0) return "Please add at least one question";
    
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
        if (q.answers.length < 2) return `Question ${i + 1}: Please add at least 2 answer options`;
        if (!q.answers.some(a => a.is_correct)) return `Question ${i + 1}: Please select at least one correct answer`;
      } else if (q.question_type === 'matching') {
        if (q.matching_pairs.length < 2) return `Question ${i + 1}: Please add at least 2 matching pairs`;
      }
    }
    return "";
  };

  const addQuestion = (type: 'multiple_choice' | 'true_false' | 'matching') => {
    const newQuestion: QuizQuestionFormData = {
      question_text: '',
      question_type: type,
      points: 1,
      order_index: 0, // New questions go to top
      has_image_attachment: false,
      answers: type === 'true_false' ? [
        { answer_text: 'True', is_correct: false, order_index: 0 },
        { answer_text: 'False', is_correct: false, order_index: 1 }
      ] : [],
      matching_pairs: []
    };

    // Move new question to top, reorder existing questions
    const updatedQuestions = [newQuestion, ...quizData.questions.map((q, i) => ({
      ...q,
      order_index: i + 1
    }))];

    setQuizData({
      ...quizData,
      questions: updatedQuestions
    });
  };

  const updateQuestion = (index: number, question: QuizQuestionFormData) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index] = question;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
    // Reorder questions
    updatedQuestions.forEach((question, i) => {
      question.order_index = i;
    });
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const questions = [...quizData.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < questions.length) {
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      // Update order indices
      questions.forEach((question, i) => {
        question.order_index = i;
      });
      setQuizData({ ...quizData, questions });
    }
  };

  const handleSubmit = () => {
    // Validate quiz data
    if (!quizData.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (quizData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    // Validate questions
    for (const question of quizData.questions) {
      if (!question.question_text.trim()) {
        alert('All questions must have text');
        return;
      }

      if (question.question_type === 'multiple_choice') {
        if (question.answers.length < 2) {
          alert('Multiple choice questions must have at least 2 answer options');
          return;
        }
        const hasCorrectAnswer = question.answers.some(answer => answer.is_correct);
        if (!hasCorrectAnswer) {
          alert('Multiple choice questions must have at least one correct answer');
          return;
        }
      }

      if (question.question_type === 'true_false') {
        const hasCorrectAnswer = question.answers.some(answer => answer.is_correct);
        if (!hasCorrectAnswer) {
          alert('True/False questions must have a correct answer selected');
          return;
        }
      }

      if (question.question_type === 'matching') {
        if (question.matching_pairs.length < 2) {
          alert('Matching questions must have at least 2 pairs');
          return;
        }
      }
    }

    onSubmit(quizData);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return <Circle className="h-4 w-4" />;
      case 'true_false': return <CheckCircle className="h-4 w-4" />;
      case 'matching': return <ArrowRight className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* Quiz Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quiz Settings
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                {quizData.questions.length} Question{quizData.questions.length !== 1 ? 's' : ''}
              </Badge>
              {isQuizReady() && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  ✓ Ready
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <Input
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                placeholder="Enter quiz title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <Input
                type="number"
                value={quizData.time_limit_minutes || ''}
                onChange={(e) => setQuizData({ 
                  ...quizData, 
                  time_limit_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="No time limit"
                min="1"
                max="480"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={quizData.description || ''}
              onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
              placeholder="Enter quiz description (optional)..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <Input
                type="number"
                value={quizData.passing_score}
                onChange={(e) => setQuizData({ ...quizData, passing_score: parseInt(e.target.value) || 60 })}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Attempts
              </label>
              <Input
                type="number"
                value={quizData.max_attempts}
                onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) || 1 })}
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show_answers_after"
                  checked={quizData.show_answers_after}
                  onChange={(e) => setQuizData({ ...quizData, show_answers_after: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show_answers_after" className="text-sm font-medium text-gray-700">
                  Show answers after submission
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_marks_immediately"
              checked={quizData.show_marks_immediately}
              onChange={(e) => setQuizData({ ...quizData, show_marks_immediately: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show_marks_immediately" className="text-sm font-medium text-gray-700">
              Show marks immediately after submission
            </label>
          </div>

          {/* Schedule Quiz Opening */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Schedule Quiz Opening (Optional)
            </label>
            <Input
              type="datetime-local"
              value={quizData.scheduled_open_at ? new Date(quizData.scheduled_open_at).toISOString().slice(0, 16) : ''}
              onChange={(e) => setQuizData({ 
                ...quizData, 
                scheduled_open_at: e.target.value ? new Date(e.target.value).toISOString() : undefined 
              })}
              placeholder="Leave empty to publish immediately"
            />
            <p className="text-xs text-gray-500 mt-1">
              If set, the quiz will only be available to students after this date and time.
            </p>
          </div>

          {/* Draft Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_draft"
              checked={quizData.is_draft}
              onChange={(e) => setQuizData({ 
                ...quizData, 
                is_draft: e.target.checked,
                status: e.target.checked ? 'draft' : 'published'
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_draft" className="text-sm font-medium text-gray-700">
              Save as draft (students won't see this quiz yet)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Add Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => addQuestion('multiple_choice')}
              className="h-20 flex flex-col items-center gap-2"
            >
              <Circle className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">Multiple Choice</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => addQuestion('true_false')}
              className="h-20 flex flex-col items-center gap-2"
            >
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">True/False</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => addQuestion('matching')}
              className="h-20 flex flex-col items-center gap-2"
            >
              <ArrowRight className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Matching</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {quizData.questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Questions ({quizData.questions.length})</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Total Points: {quizData.questions.reduce((sum, q) => sum + q.points, 0)}
              </span>
            </div>
          </div>
          
          {quizData.questions.map((question, index) => (
            <QuizQuestionEditor
              key={index}
              question={question}
              index={index}
              onChange={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
              onDelete={() => deleteQuestion(index)}
              onMoveUp={index > 0 ? () => moveQuestion(index, 'up') : undefined}
              onMoveDown={index < quizData.questions.length - 1 ? () => moveQuestion(index, 'down') : undefined}
            />
          ))}
        </div>
      )}

      {/* Submit Buttons */}
      {!hideSubmitButton && (
        <div className="pt-4 border-t">
          {!isQuizReady() && getValidationMessage() && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">⚠️ {getValidationMessage()}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => onSubmit({ ...quizData, is_draft: true, status: 'draft' })}
              disabled={isSubmitting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isQuizReady()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
            </Button>
          </div>
        </div>
      )}

      {/* Save Quiz Button (when embedded in PostCreationForm) */}
      {hideSubmitButton && (
        <div className="pt-4 border-t">
          {!isQuizReady() && getValidationMessage() && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">⚠️ {getValidationMessage()}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => onSubmit({ ...quizData, is_draft: true, status: 'draft' })}
              disabled={isSubmitting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            {isQuizReady() && (
              <Button
                onClick={() => onSubmit({ ...quizData, is_draft: false, status: 'published' })}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? 'Publishing Quiz...' : 'Publish Quiz'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
