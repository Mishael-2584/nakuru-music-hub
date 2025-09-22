import React, { useState } from 'react';
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
  Hash
} from "lucide-react";
import { QuizQuestionFormData, QuizAnswerFormData, QuizMatchingPairFormData } from '@/types/quiz';

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
  const [newAnswer, setNewAnswer] = useState('');
  const [newMatchingLeft, setNewMatchingLeft] = useState('');
  const [newMatchingRight, setNewMatchingRight] = useState('');

  const updateQuestion = (updates: Partial<QuizQuestionFormData>) => {
    onChange({ ...question, ...updates });
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
