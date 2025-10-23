import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle, 
  Circle,
  ArrowRight,
  Hash,
  Image,
  Upload,
  X
} from "lucide-react";
import { QuizQuestionFormData, QuizAnswerFormData, QuizMatchingPairFormData } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestionEditorProps {
  question: QuizQuestionFormData;
  index: number;
  onChange: (question: QuizQuestionFormData) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export default function QuizQuestionEditor({
  question,
  index,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown
}: QuizQuestionEditorProps) {
  const { toast } = useToast();
  const [newAnswer, setNewAnswer] = useState('');
  const [newMatchingLeft, setNewMatchingLeft] = useState('');
  const [newMatchingRight, setNewMatchingRight] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize preview when editing an existing question
  useEffect(() => {
    if (question.image_url && !imagePreview) {
      setImagePreview(question.image_url);
    }
  }, [question.image_url]);

  const updateQuestion = (updates: Partial<QuizQuestionFormData>) => {
    onChange({ ...question, ...updates });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase Storage
      try {
        const fileName = `quiz-images/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: 'Upload failed',
            description: 'Failed to upload image. Please try again.',
            variant: 'destructive'
          });
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        updateQuestion({
          has_image_attachment: true,
          image_url: publicUrl,
          image_filename: file.name
        });

        toast({
          title: 'Success',
          description: 'Image uploaded successfully'
        });

      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while uploading the image.',
          variant: 'destructive'
        });
      }
    }
  };

  const removeImage = async () => {
    // If there's an existing image URL, try to delete it from storage
    if (question.image_url && question.image_url.startsWith('https://')) {
      try {
        // Extract the file path from the URL
        const url = new URL(question.image_url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const filePath = `quiz-images/${fileName}`;
        
        const { error } = await supabase.storage
          .from('images')
          .remove([filePath]);
          
        if (error) {
          console.warn('Failed to delete image from storage:', error);
          // Continue with removal even if storage deletion fails
        }
      } catch (error) {
        console.warn('Error parsing image URL for deletion:', error);
        // Continue with removal even if URL parsing fails
      }
    }
    
    setImageFile(null);
    setImagePreview(null);
    updateQuestion({
      has_image_attachment: false,
      image_url: undefined,
      image_filename: undefined
    });
  };

  const addAnswer = () => {
    if (!newAnswer.trim()) return;
    
    const answer: QuizAnswerFormData = {
      answer_text: newAnswer.trim(),
      is_correct: false,
      order_index: question.answers.length
    };
    
    updateQuestion({
      answers: [...question.answers, answer]
    });
    setNewAnswer('');
  };

  const updateAnswer = (answerIndex: number, updates: Partial<QuizAnswerFormData>) => {
    const updatedAnswers = [...question.answers];
    updatedAnswers[answerIndex] = { ...updatedAnswers[answerIndex], ...updates };
    updateQuestion({ answers: updatedAnswers });
  };

  const deleteAnswer = (answerIndex: number) => {
    const updatedAnswers = question.answers.filter((_, i) => i !== answerIndex);
    // Reorder remaining answers
    updatedAnswers.forEach((answer, i) => {
      answer.order_index = i;
    });
    updateQuestion({ answers: updatedAnswers });
  };

  const addMatchingPair = () => {
    if (!newMatchingLeft.trim() || !newMatchingRight.trim()) return;
    
    const pair: QuizMatchingPairFormData = {
      left_item: newMatchingLeft.trim(),
      right_item: newMatchingRight.trim(),
      order_index: question.matching_pairs.length
    };
    
    updateQuestion({
      matching_pairs: [...question.matching_pairs, pair]
    });
    setNewMatchingLeft('');
    setNewMatchingRight('');
  };

  const updateMatchingPair = (pairIndex: number, updates: Partial<QuizMatchingPairFormData>) => {
    const updatedPairs = [...question.matching_pairs];
    updatedPairs[pairIndex] = { ...updatedPairs[pairIndex], ...updates };
    updateQuestion({ matching_pairs: updatedPairs });
  };

  const deleteMatchingPair = (pairIndex: number) => {
    const updatedPairs = question.matching_pairs.filter((_, i) => i !== pairIndex);
    // Reorder remaining pairs
    updatedPairs.forEach((pair, i) => {
      pair.order_index = i;
    });
    updateQuestion({ matching_pairs: updatedPairs });
  };

  const getQuestionTypeIcon = () => {
    switch (question.question_type) {
      case 'multiple_choice': return <Circle className="h-4 w-4" />;
      case 'true_false': return <CheckCircle className="h-4 w-4" />;
      case 'matching': return <ArrowRight className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = () => {
    switch (question.question_type) {
      case 'multiple_choice': return 'bg-blue-100 text-blue-800';
      case 'true_false': return 'bg-green-100 text-green-800';
      case 'matching': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
            </div>
            <Badge className={`${getQuestionTypeColor()} text-xs`}>
              {getQuestionTypeIcon()}
              <span className="ml-1 capitalize">
                {question.question_type.replace('_', ' ')}
              </span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {onMoveUp && (
              <Button variant="ghost" size="sm" onClick={onMoveUp}>
                ↑
              </Button>
            )}
            {onMoveDown && (
              <Button variant="ghost" size="sm" onClick={onMoveDown}>
                ↓
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <Textarea
            value={question.question_text}
            onChange={(e) => updateQuestion({ question_text: e.target.value })}
            placeholder="Enter your question here..."
            className="min-h-[80px]"
          />
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Points *
          </label>
          <Input
            type="number"
            value={question.points}
            onChange={(e) => updateQuestion({ points: parseInt(e.target.value) || 1 })}
            min="1"
            max="100"
            className="w-24"
          />
        </div>

        {/* Image Attachment Option */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id={`image-attachment-${index}`}
              checked={question.has_image_attachment}
              onChange={(e) => updateQuestion({ has_image_attachment: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`image-attachment-${index}`} className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Image className="h-4 w-4" />
              Require image attachment from students
            </label>
          </div>
          {/* Teacher reference image upload: available regardless of the checkbox */}
          <div className="space-y-3">
            {question.has_image_attachment && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">Image Attachment Instructions:</p>
                <p>Students will be required to upload an image when answering this question. This is useful for questions like:</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>"Looking at the images provided, name two different DAW software applications"</li>
                  <li>"Upload a screenshot of your music production setup"</li>
                  <li>"Show your completed assignment"</li>
                </ul>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id={`image-upload-${index}`}
                  ref={fileInputRef}
                />
                <label
                  htmlFor={`image-upload-${index}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white"
                >
                  <Upload className="h-4 w-4" />
                  {imagePreview ? 'Change Reference Image' : 'Upload Reference Image'}
                </label>
                {imagePreview && (
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
                )}
              </div>

              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Reference"
                    className="max-w-xs max-h-48 object-contain border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Reference image for this question
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multiple Choice Answers */}
        {question.question_type === 'multiple_choice' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options *
            </label>
            <div className="space-y-2">
              {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAnswer(answerIndex, { is_correct: !answer.is_correct })}
                    className={`p-1 ${answer.is_correct ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {answer.is_correct ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </Button>
                  <Input
                    value={answer.answer_text}
                    onChange={(e) => updateAnswer(answerIndex, { answer_text: e.target.value })}
                    placeholder="Enter answer option..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnswer(answerIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* Add new answer */}
              <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <Circle className="h-4 w-4 text-gray-400" />
                <Input
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Add new answer option..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAnswer();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={addAnswer}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click the circle icon to mark the correct answer. At least one answer must be marked as correct.
            </p>
          </div>
        )}

        {/* True/False Answers */}
        {question.question_type === 'true_false' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer *
            </label>
            <div className="flex gap-4">
              <Button
                variant={question.answers[0]?.is_correct ? "default" : "outline"}
                onClick={() => {
                  updateQuestion({
                    answers: [
                      { answer_text: 'True', is_correct: true, order_index: 0 },
                      { answer_text: 'False', is_correct: false, order_index: 1 }
                    ]
                  });
                }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                True
              </Button>
              <Button
                variant={question.answers[1]?.is_correct ? "default" : "outline"}
                onClick={() => {
                  updateQuestion({
                    answers: [
                      { answer_text: 'True', is_correct: false, order_index: 0 },
                      { answer_text: 'False', is_correct: true, order_index: 1 }
                    ]
                  });
                }}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                False
              </Button>
            </div>
          </div>
        )}

        {/* Matching Pairs */}
        {question.question_type === 'matching' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matching Pairs *
            </label>
            <div className="space-y-3">
              {question.matching_pairs.map((pair, pairIndex) => (
                <div key={pairIndex} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Input
                    value={pair.left_item}
                    onChange={(e) => updateMatchingPair(pairIndex, { left_item: e.target.value })}
                    placeholder="Left item..."
                    className="flex-1"
                  />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <Input
                    value={pair.right_item}
                    onChange={(e) => updateMatchingPair(pairIndex, { right_item: e.target.value })}
                    placeholder="Right item..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMatchingPair(pairIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* Add new matching pair */}
              <div className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <Input
                  value={newMatchingLeft}
                  onChange={(e) => setNewMatchingLeft(e.target.value)}
                  placeholder="Left item..."
                  className="flex-1"
                />
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Input
                  value={newMatchingRight}
                  onChange={(e) => setNewMatchingRight(e.target.value)}
                  placeholder="Right item..."
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addMatchingPair}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Create pairs of items that students need to match together.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
