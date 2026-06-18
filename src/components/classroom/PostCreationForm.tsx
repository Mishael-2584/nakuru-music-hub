import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BookOpen, 
  Users, 
  X,
  Calendar,
  Hash,
  Save,
  Pin
} from "lucide-react";
import { SimpleTextEditor } from "@/components/SimpleTextEditor";
import { PostFileUpload } from "@/components/PostFileUpload";
import QuizCreationForm from "@/components/quiz/QuizCreationForm";
import { QuizFormData } from "@/types/quiz";

interface PostCreationFormProps {
  onSubmit: (data: {
    content: string;
    isAssignment: boolean;
    assignmentTitle: string;
    dueDate: string;
    maxPoints: number;
    isTimed: boolean;
    timeLimitMinutes: number;
    attachments: any[];
    quizData?: QuizFormData;
    isPinned?: boolean;
  }) => void;
  isSubmitting?: boolean;
}

export default function PostCreationForm({ onSubmit, isSubmitting = false }: PostCreationFormProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [postType, setPostType] = useState<'general' | 'assignment'>('general');
  const [content, setContent] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState(100);
  const [isTimed, setIsTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isQuiz, setIsQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizFormData | undefined>(undefined);
  const [pinAnnouncement, setPinAnnouncement] = useState(false);

  const handleSubmit = () => {
    // For quizzes, content is not required
    if (!isQuiz && !content.trim()) return;
    if (postType === 'assignment' && !assignmentTitle.trim()) return;
    
    // For quizzes, quizData is required
    if (isQuiz && !quizData) return;

    onSubmit({
      content: isQuiz ? (quizData?.description || `Quiz: ${quizData?.title}`) : content.trim(),
      isAssignment: postType === 'assignment',
      assignmentTitle: assignmentTitle.trim(),
      dueDate,
      maxPoints,
      isTimed: postType === 'assignment' ? isTimed : false,
      timeLimitMinutes: postType === 'assignment' ? timeLimitMinutes : 0,
      attachments,
      quizData: isQuiz ? { ...quizData, is_draft: false, status: 'published' } : undefined,
      isPinned: postType === 'general' ? pinAnnouncement : false,
    });

    // Reset form after submission
    setContent('');
    setAssignmentTitle('');
    setDueDate('');
    setMaxPoints(100);
    setIsTimed(false);
    setTimeLimitMinutes(60);
    setAttachments([]);
    setIsQuiz(false);
    setQuizData(undefined);
    setPinAnnouncement(false);
    setPostType('general');
    setIsVisible(false);
  };

  const handleCancel = () => {
    setContent('');
    setAssignmentTitle('');
    setDueDate('');
    setMaxPoints(100);
    setIsTimed(false);
    setTimeLimitMinutes(60);
    setAttachments([]);
    setIsQuiz(false);
    setQuizData(undefined);
    setPinAnnouncement(false);
    setPostType('general');
    setIsVisible(false);
  };

  if (!isVisible) {
    return (
      <div className="mb-6">
        <Button
          onClick={() => setIsVisible(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg border-0 h-12"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-3" />
          Share something with your class
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-6 shadow-lg border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {postType === 'assignment' ? (
                <>
                  <BookOpen className="h-5 w-5" />
                  Create Assignment
                </>
              ) : (
                <>
                  <Users className="h-5 w-5" />
                  Share with Class
                </>
              )}
            </CardTitle>
            <CardDescription className="text-blue-100 mt-1">
              {postType === 'assignment' 
                ? 'Create a new assignment for your students'
                : 'Share an announcement, resource, or update'
              }
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Post Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            What would you like to create?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPostType('general')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                postType === 'general'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  postType === 'general' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Users className={`h-5 w-5 ${
                    postType === 'general' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <div className={`font-semibold ${
                    postType === 'general' ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    General Post
                  </div>
                  <div className={`text-sm ${
                    postType === 'general' ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    Announcements, resources, discussions
                  </div>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setPostType('assignment')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                postType === 'assignment'
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  postType === 'assignment' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <BookOpen className={`h-5 w-5 ${
                    postType === 'assignment' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <div className={`font-semibold ${
                    postType === 'assignment' ? 'text-purple-900' : 'text-gray-900'
                  }`}>
                    Assignment
                  </div>
                  <div className={`text-sm ${
                    postType === 'assignment' ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                    Homework, projects, quizzes
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Assignment Details */}
        {postType === 'assignment' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="font-semibold text-purple-900">Assignment Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Assignment Title *
                </label>
                <Input
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="e.g., Music Theory Quiz #1"
                  className="border-purple-200 focus:border-purple-500 bg-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Due Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pl-10 border-purple-200 focus:border-purple-500 bg-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Max Points
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                  <Input
                    type="number"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(parseInt(e.target.value) || 100)}
                    min="1"
                    max="1000"
                    className="pl-10 border-purple-200 focus:border-purple-500 bg-white"
                  />
                </div>
              </div>
            </div>
            
              {/* Quiz Options */}
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isQuiz"
                    checked={isQuiz}
                    onChange={(e) => setIsQuiz(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isQuiz" className="text-sm font-medium text-purple-800">
                    Make this a quiz assignment
                  </label>
                </div>
                
                <p className="text-xs text-purple-600 mb-3">
                  Create interactive quiz questions with automatic grading
                </p>
              </div>

              {/* Timed Assignment Options */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isTimed"
                    checked={isTimed}
                    onChange={(e) => setIsTimed(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isTimed" className="text-sm font-medium text-blue-800">
                    Make this a timed assignment
                  </label>
                </div>
                
                {isTimed && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Time Limit (minutes)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 60)}
                        min="1"
                        max="480"
                        className="w-24 border-blue-200 focus:border-blue-500 bg-white"
                      />
                      <span className="text-sm text-blue-600">
                        ({Math.floor(timeLimitMinutes / 60)}h {timeLimitMinutes % 60}m)
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Students will have a timer running during the assignment
                    </p>
                  </div>
                )}
              </div>
          </div>
        )}

        {/* Quiz Creation Form */}
        {isQuiz && postType === 'assignment' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Quiz Questions
              </label>
              {quizData && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  ✓ Quiz Ready
                </Badge>
              )}
            </div>
            <QuizCreationForm
              onSubmit={(quizFormData) => setQuizData(quizFormData)}
              isSubmitting={isSubmitting}
              hideSubmitButton={true}
            />
          </div>
        ) : (
          /* Content Editor */
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {postType === 'assignment' ? 'Assignment Instructions' : 'Your Message'}
            </label>
            <SimpleTextEditor
              content={content}
              onChange={setContent}
              placeholder={postType === 'assignment' 
                ? "Provide clear instructions for your assignment..."
                : "Share something with your class..."
              }
              className="min-h-[200px]"
              showPreview={true}
            />
          </div>
        )}

        {postType === 'general' && !isQuiz && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pinAnnouncement}
                onChange={(e) => setPinAnnouncement(e.target.checked)}
                className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Pin className="h-4 w-4" />
                  Pin this announcement to the top
                </span>
                <span className="block text-sm text-amber-800 mt-1">
                  Pinned announcements stay fixed at the top of the classroom feed for all students.
                </span>
              </span>
            </label>
          </div>
        )}

        {/* File Attachments - Hide for quizzes */}
        {!isQuiz && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Attach Files (Optional)
            </label>
            <PostFileUpload
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxFiles={5}
              acceptedTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp3,.mp4,.zip,.rar,.ppt,.pptx,.pps,.ppsx"
              showUploadedFiles={true}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {postType === 'assignment' && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <BookOpen className="h-3 w-3 mr-1" />
                {isQuiz ? 'Quiz' : 'Assignment'}
              </Badge>
            )}
            {!isQuiz && attachments.length > 0 && (
              <Badge variant="outline" className="text-gray-600">
                {attachments.length} file{attachments.length > 1 ? 's' : ''} attached
              </Badge>
            )}
            
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {/* Single Quiz/Assignment button */}
            <Button
              onClick={handleSubmit}
              disabled={
                (!isQuiz && !content.trim()) || 
                (postType === 'assignment' && !assignmentTitle.trim()) || 
                (isQuiz && !quizData) ||
                isSubmitting
              }
              className={`${
                isQuiz
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                  : postType === 'assignment'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              } text-white shadow-md`}
            >
              {isSubmitting 
                ? (isQuiz ? 'Publishing Quiz...' : 'Creating...') 
                : isQuiz 
                  ? 'Publish Quiz' 
                  : postType === 'assignment' 
                    ? 'Create Assignment' 
                    : 'Share Post'
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}