import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MessageCircle, 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
  CalendarPlus,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClassroomPostCardProps {
  post: any;
  isTeacher: boolean;
  onEdit?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onLoadComments?: (postId: string) => void;
  onExtendDeadline?: (postId: string, newDueDate: string) => void;
  onEditQuiz?: (postId: string) => void;
  onPreviewQuiz?: (postId: string) => void;
  onManageQuiz?: (postId: string) => void;
  comments?: any[];
  children?: React.ReactNode; // For submission/grading sections
  userSubmission?: any; // Student's submission for this assignment
  quizSubmissionStatus?: any; // Student's quiz submission status
}

export default function ClassroomPostCard({ 
  post, 
  isTeacher, 
  onEdit, 
  onDelete, 
  onLoadComments,
  onExtendDeadline,
  onEditQuiz,
  onPreviewQuiz,
  onManageQuiz,
  comments = [],
  children,
  userSubmission,
  quizSubmissionStatus
}: ClassroomPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showFullPost, setShowFullPost] = useState(false);
  const [showExtendDeadline, setShowExtendDeadline] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  const getDisplayFileName = (storedName: string) => {
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/;
    let cleanName = storedName;
    if (timestampPattern.test(storedName)) {
      cleanName = storedName.replace(timestampPattern, '');
    }
    const suffixPattern = /_[a-z0-9]{6}(\.[^.]+)$/;
    if (suffixPattern.test(cleanName)) {
      cleanName = cleanName.replace(suffixPattern, '$1');
    }
    return cleanName;
  };

  const renderContent = (content: string) => {
    if (!content) return '';
    
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\n/g, '<br>');
    
    return html;
  };

  const isOverdue = post.due_date && new Date(post.due_date) < new Date();
  const isDueSoon = post.due_date && new Date(post.due_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  // Debug: Log quiz scheduled time and submission status
  if (post.has_quiz) {
    console.log('ClassroomPostCard - Quiz post:', {
      post_id: post.post_id,
      has_quiz: post.has_quiz,
      quiz_scheduled_open_at: post.quiz_scheduled_open_at,
      quiz_is_draft: post.quiz_is_draft,
      isTeacher: isTeacher,
      quizSubmissionStatus: quizSubmissionStatus
    });
  }

  const handleExtendDeadline = () => {
    if (!newDueDate) return;
    onExtendDeadline?.(post.post_id, newDueDate);
    setShowExtendDeadline(false);
    setNewDueDate('');
  };

  const handleCancelExtendDeadline = () => {
    setShowExtendDeadline(false);
    setNewDueDate('');
  };

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all duration-200 border-0 bg-white ${
      post.is_assignment ? 'border-l-4 border-l-blue-600' : ''
    }`}>
      {/* Ultra-Compact Single Row */}
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Title and Key Info in One Line */}
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-semibold text-gray-900 truncate text-sm">
                {post.is_assignment ? post.assignment_title : 'Post'}
              </h4>
              {post.is_assignment && post.max_points && (
                <span className="text-xs font-medium text-blue-600">{post.max_points} pts</span>
              )}
              {/* Show assignment submission status for students */}
              {!isTeacher && post.is_assignment && !post.has_quiz && userSubmission && (
                <>
                  {userSubmission.grade_points !== undefined && userSubmission.grade_points !== null ? (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-green-100 text-green-700 border-green-200">
                      ✓ Graded: {userSubmission.grade_points}/{post.max_points} pts
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-yellow-100 text-yellow-700 border-yellow-200">
                      ⏳ Submitted - Awaiting Grade
                    </Badge>
                  )}
                </>
              )}
              {!isTeacher && post.is_assignment && !post.has_quiz && !userSubmission && (
                <Badge variant="outline" className="text-xs px-2 py-0 bg-gray-100 text-gray-700 border-gray-200">
                  📝 Not Submitted
                </Badge>
              )}
              {post.due_date && (
                <span className={`text-xs font-medium ${
                  isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'
                }`}>
                  Due {formatDistanceToNow(new Date(post.due_date), { addSuffix: true })}
                </span>
              )}
              {post.attachments && post.attachments.length > 0 && (
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {post.attachments.length} file{post.attachments.length > 1 ? 's' : ''}
                </span>
              )}
              {post.has_quiz && (
                <>
                  <Badge variant="outline" className="text-xs px-2 py-0 bg-purple-100 text-purple-700 border-purple-200">
                    🧠 Quiz
                  </Badge>
                  {/* Show quiz submission status for students */}
                  {!isTeacher && quizSubmissionStatus ? (
                    <>
                      <Badge variant="outline" className="text-xs px-2 py-0 bg-green-100 text-green-700 border-green-200">
                        ✓ Completed
                      </Badge>
                      {quizSubmissionStatus.is_passed !== undefined && (
                        <Badge variant="outline" className={`text-xs px-2 py-0 ${
                          quizSubmissionStatus.is_passed 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          Score: {quizSubmissionStatus.percentage_score?.toFixed(0)}%
                        </Badge>
                      )}
                    </>
                  ) : !isTeacher ? (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-gray-100 text-gray-700 border-gray-200">
                      📝 Not Started
                    </Badge>
                  ) : null}
                  {/* Show draft/scheduled status to teachers */}
                  {isTeacher && post.quiz_is_draft && (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-yellow-100 text-yellow-700 border-yellow-200">
                      📝 Draft
                    </Badge>
                  )}
                  {isTeacher && !post.quiz_is_draft && post.quiz_scheduled_open_at && new Date(post.quiz_scheduled_open_at) > new Date() && (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-100 text-blue-700 border-blue-200">
                      🕐 Scheduled
                    </Badge>
                  )}
                  {/* Show restriction status to students for draft quizzes with scheduled time */}
                  {!isTeacher && post.quiz_is_draft && post.quiz_scheduled_open_at && (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-orange-100 text-orange-700 border-orange-200">
                      🔒 Restricted
                    </Badge>
                  )}
                  {!isTeacher && !post.quiz_is_draft && post.quiz_scheduled_open_at && new Date(post.quiz_scheduled_open_at) > new Date() && (
                    <Badge variant="outline" className="text-xs px-2 py-0 bg-gray-100 text-gray-700 border-gray-200">
                      🕐 Upcoming
                    </Badge>
                  )}
                  {/* Show scheduled opening time for all users */}
                  {post.quiz_scheduled_open_at && (
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(post.quiz_scheduled_open_at) > new Date() 
                        ? `Opens ${formatDistanceToNow(new Date(post.quiz_scheduled_open_at), { addSuffix: true })}`
                        : `Opened ${formatDistanceToNow(new Date(post.quiz_scheduled_open_at), { addSuffix: true })}`
                      }
                    </span>
                  )}
                </>
              )}
            </div>
            
            {/* Content for Regular Posts (Not Assignments) */}
            {!post.is_assignment && (
              <div className="mt-2">
                <div 
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: renderContent(showFullPost ? post.content : post.content.slice(0, 200) + (post.content.length > 200 ? '...' : '')) 
                  }} 
                />
                {post.content.length > 200 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowFullPost(!showFullPost)}
                    className="mt-2 text-blue-600 hover:text-blue-700 p-0 h-auto font-normal text-xs"
                  >
                    {showFullPost ? 'Show Less' : 'Read More'}
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-3">
            {post.is_assignment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="h-6 px-2 text-xs bg-white hover:bg-gray-50"
              >
                {showFullDetails ? 'Hide' : 'View'}
              </Button>
            )}
            {!post.is_assignment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments && onLoadComments) {
                    onLoadComments(post.post_id);
                  }
                }}
                className="text-gray-500 hover:text-gray-700 p-0 h-auto text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {comments.length > 0 ? comments.length : 'Comment'}
              </Button>
            )}
            {isTeacher && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit?.(post.post_id, post.content)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete?.(post.post_id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Overdue Badge */}
        {isOverdue && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs px-2 py-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          </div>
        )}

        {/* Expanded Details (Assignment Only) */}
        {showFullDetails && post.is_assignment && (
          <div className="border-t border-gray-100 pt-3 mt-3">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm font-semibold">
                  {post.author_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{post.author_name}</span>
                  {isTeacher && (
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Assignment Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Max Points:</span>
                  <span className="ml-2 font-medium">{post.max_points || 100}</span>
                </div>
                {post.due_date && (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <span className={`ml-2 font-medium ${
                        isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {new Date(post.due_date).toLocaleDateString()} at {new Date(post.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    {isTeacher && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowExtendDeadline(true)}
                        className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      >
                        <CalendarPlus className="h-3 w-3 mr-1" />
                        Extend
                      </Button>
                    )}
                  </div>
                )}
                {post.is_timed && (
                  <div>
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="ml-2 font-medium">{Math.floor(post.time_limit_minutes / 60)}h {post.time_limit_minutes % 60}m</span>
                  </div>
                )}
                {post.has_quiz && (
                  <>
                    <div>
                      <span className="text-gray-600">Quiz Time:</span>
                      <span className="ml-2 font-medium">{post.quiz_time_limit} min</span>
                    </div>
                    {/* Show quiz availability info */}
                    {isTeacher && post.quiz_is_draft && !post.quiz_scheduled_open_at && (
                      <div className="text-yellow-700 bg-yellow-50 p-2 rounded text-sm mt-2">
                        📝 This quiz is in draft mode and not visible to students (no scheduled time set)
                      </div>
                    )}
                    {isTeacher && post.quiz_is_draft && post.quiz_scheduled_open_at && (
                      <div className="text-yellow-700 bg-yellow-50 p-2 rounded text-sm mt-2">
                        📝 Draft quiz scheduled to open: {new Date(post.quiz_scheduled_open_at).toLocaleString()}
                        <br /><span className="text-xs">Students can see this but cannot access it until the scheduled time</span>
                      </div>
                    )}
                    {isTeacher && !post.quiz_is_draft && post.quiz_scheduled_open_at && new Date(post.quiz_scheduled_open_at) > new Date() && (
                      <div className="text-blue-700 bg-blue-50 p-2 rounded text-sm mt-2">
                        🕐 Quiz scheduled to open: {new Date(post.quiz_scheduled_open_at).toLocaleString()}
                      </div>
                    )}
                    {!isTeacher && post.quiz_is_draft && post.quiz_scheduled_open_at && (
                      <div className="text-orange-700 bg-orange-50 p-2 rounded text-sm mt-2 border border-orange-200">
                        🔒 This quiz is restricted until: {new Date(post.quiz_scheduled_open_at).toLocaleString()}
                        <br /><span className="text-xs">You will be able to access it after this time</span>
                      </div>
                    )}
                    {!isTeacher && !post.quiz_is_draft && post.quiz_scheduled_open_at && new Date(post.quiz_scheduled_open_at) > new Date() && (
                      <div className="text-gray-700 bg-gray-50 p-2 rounded text-sm mt-2">
                        🕐 This quiz will be available on: {new Date(post.quiz_scheduled_open_at).toLocaleString()}
                      </div>
                    )}
                    
                    {/* Teacher Quiz Actions */}
                    {isTeacher && post.has_quiz && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditQuiz?.(post.post_id)}
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit Quiz
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPreviewQuiz?.(post.post_id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Preview Quiz
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onManageQuiz?.(post.post_id)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Users className="h-4 w-4" />
                          Manage Quiz
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {isOverdue && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>

            {/* Full Formatted Content */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ 
                __html: renderContent(post.content) 
              }} />
            </div>

            {/* File Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {post.attachments.length} attachment{post.attachments.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {post.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-800 text-sm">
                            {getDisplayFileName(attachment.file_name)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : '0 KB'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.file_url, '_blank')}
                        className="h-7 px-2 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment/Submission Section */}
            {children}

            {/* Comments Section */}
            {showComments && (
              <div className="mt-3 space-y-2">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gray-400 text-white text-xs">
                          {comment.author_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm text-gray-800">{comment.author_name}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {comment.author_role}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 ml-8">{comment.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Section (Non-Assignment Posts) */}
        {!post.is_assignment && showComments && (
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
            {comments.map((comment: any) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                      {comment.author_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-gray-800">{comment.author_name}</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {comment.author_role}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-gray-700 ml-8">{comment.content}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Extend Deadline Dialog */}
      <Dialog open={showExtendDeadline} onOpenChange={setShowExtendDeadline}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Extend Assignment Deadline</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-due-date" className="text-right">
                Current Due Date
              </Label>
              <div className="col-span-3 text-sm text-gray-600">
                {post.due_date ? new Date(post.due_date).toLocaleString() : 'No due date set'}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-due-date" className="text-right">
                New Due Date
              </Label>
              <Input
                id="new-due-date"
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="col-span-3"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelExtendDeadline}>
              Cancel
            </Button>
            <Button onClick={handleExtendDeadline} disabled={!newDueDate}>
              Extend Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}