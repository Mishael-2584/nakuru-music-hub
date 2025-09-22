import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClassroomPostCardProps {
  post: any;
  isTeacher: boolean;
  onEdit?: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
  onLoadComments?: (postId: string) => void;
  comments?: any[];
  children?: React.ReactNode; // For submission/grading sections
}

export default function ClassroomPostCard({ 
  post, 
  isTeacher, 
  onEdit, 
  onDelete, 
  onLoadComments,
  comments = [],
  children 
}: ClassroomPostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

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

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-white">
      {/* Assignment Banner */}
      {post.is_assignment && (
        <div className={`h-2 ${isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-orange-500' : 'bg-blue-500'}`} />
      )}
      
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold">
                {post.author_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{post.author_name}</h3>
                {isTeacher && (
                  <CheckCircle className="h-4 w-4 text-blue-600" title="Verified Teacher" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                {post.is_assignment && (
                  <>
                    <span>•</span>
                    <BookOpen className="h-3 w-3" />
                    <span>Assignment</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Post Actions */}
          {isTeacher && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit?.(post.post_id, post.content)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete?.(post.post_id)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Assignment Header Info */}
        {post.is_assignment && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">{post.assignment_title}</h4>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <span>Max Points: {post.max_points || 100}</span>
                    {post.is_timed && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Timed: {Math.floor(post.time_limit_minutes / 60)}h {post.time_limit_minutes % 60}m</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {post.due_date && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    <span className={`font-medium ${
                      isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      Due {formatDistanceToNow(new Date(post.due_date), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(post.due_date).toLocaleDateString()} at {new Date(post.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {isOverdue && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      {/* Post Content */}
      <CardContent className="pt-0">
        {/* Content Preview/Full */}
        <div className="mb-4">
          <div 
            className={`prose prose-sm max-w-none text-gray-700 ${
              !expanded && post.content.length > 300 ? 'line-clamp-3' : ''
            }`}
            dangerouslySetInnerHTML={{ 
              __html: renderContent(expanded ? post.content : post.content.slice(0, 300)) 
            }}
          />
          {post.content.length > 300 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
            >
              {expanded ? (
                <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
              ) : (
                <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        {/* File Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {post.attachments.length} attachment{post.attachments.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid gap-2">
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
        <div className="border-t border-gray-100 pt-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowComments(!showComments);
              if (!showComments && onLoadComments) {
                onLoadComments(post.post_id);
              }
            }}
            className="text-gray-600 hover:text-gray-800 p-0 h-auto"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : 'Add comment'}
            {showComments ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>

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
      </CardContent>
    </Card>
  );
}