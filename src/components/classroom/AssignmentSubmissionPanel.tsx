import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Upload, 
  Download,
  AlertTriangle,
  Star,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PostFileUpload } from "@/components/PostFileUpload";
import { useToast } from "@/hooks/use-toast";
import AssignmentTimer from "./AssignmentTimer";

interface EnrolledStudent {
  id: string;
  student_name: string;
}

interface AssignmentSubmissionPanelProps {
  post: any;
  isTeacher: boolean;
  submissions?: any[];
  enrolledStudents?: EnrolledStudent[];
  currentStudentId?: string;
  onSubmit?: (postId: string, text: string, files: any[]) => void;
  onGrade?: (
    postId: string,
    studentId: string,
    points: number,
    feedback: string,
    submissionId?: string
  ) => void;
  onLoadSubmissions?: (postId: string) => void;
}

export default function AssignmentSubmissionPanel({ 
  post, 
  isTeacher, 
  submissions = [],
  enrolledStudents = [],
  currentStudentId,
  onSubmit,
  onGrade,
  onLoadSubmissions
}: AssignmentSubmissionPanelProps) {
  const { toast } = useToast();
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [showGradingForm, setShowGradingForm] = useState<string | null>(null);
  const [gradePoints, setGradePoints] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isOverdue = post.due_date && new Date(post.due_date) < new Date();
  const userSubmission = submissions.find(s => s.student_id === currentStudentId);
  const isNoSubmissionGrade = !!userSubmission?.no_submission;
  const hasSubmitted = !!userSubmission && !isNoSubmissionGrade;
  const isGraded =
    userSubmission?.grade_points !== undefined && userSubmission?.grade_points !== null;

  const classRoster = useMemo(() => {
    if (enrolledStudents.length > 0) {
      return enrolledStudents.map((student) => ({
        studentId: student.id,
        studentName: student.student_name,
        submission: submissions.find((s) => s.student_id === student.id),
      }));
    }
    return submissions.map((submission) => ({
      studentId: submission.student_id,
      studentName: submission.author_name || 'Student',
      submission,
    }));
  }, [enrolledStudents, submissions]);

  const gradedCount = classRoster.filter(
    (entry) =>
      entry.submission?.grade_points !== undefined && entry.submission?.grade_points !== null
  ).length;
  const submittedCount = classRoster.filter(
    (entry) => entry.submission && !entry.submission.no_submission
  ).length;

  const handleSubmission = () => {
    // For quiz assignments, only text is required (no files)
    if (post.has_quiz) {
      if (!submissionText.trim()) {
        toast({
          title: 'Response Required',
          description: 'Please provide a written response before submitting.',
          variant: 'destructive'
        });
        return;
      }
    } else {
      // For regular assignments, require either text or files
      if (!submissionText.trim() && submissionFiles.length === 0) {
        toast({
          title: 'Nothing to Submit',
          description: 'Please add some text or upload files before submitting.',
          variant: 'destructive'
        });
        return;
      }

      const hasPendingUploads = submissionFiles.some(f => f.file && !f.uploaded);
      if (hasPendingUploads) {
        toast({
          title: 'Upload Required',
          description: 'Please upload all files before submitting.',
          variant: 'destructive'
        });
        return;
      }
    }

    // Show confirmation dialog instead of submitting directly
    setShowConfirmDialog(true);
  };

  const confirmSubmission = () => {
    onSubmit?.(post.post_id, submissionText, submissionFiles);
    setSubmissionText('');
    setSubmissionFiles([]);
    setShowConfirmDialog(false);
  };

  const handleGrading = (studentId: string, submissionId?: string) => {
    const points = parseInt(gradePoints, 10);
    if (Number.isNaN(points) || points < 0 || points > (post.max_points || 100)) {
      toast({
        title: 'Invalid Points',
        description: `Points must be between 0 and ${post.max_points || 100}`,
        variant: 'destructive'
      });
      return;
    }

    onGrade?.(post.post_id, studentId, points, gradeFeedback, submissionId);
    setShowGradingForm(null);
    setGradePoints('');
    setGradeFeedback('');
  };

  const gradingFormKey = (studentId: string, submissionId?: string) =>
    submissionId || `new-${studentId}`;

  const openGradingForm = (
    studentId: string,
    submissionId?: string,
    preset?: { points?: string; feedback?: string }
  ) => {
    setShowGradingForm(gradingFormKey(studentId, submissionId));
    setGradePoints(preset?.points ?? '');
    setGradeFeedback(preset?.feedback ?? '');
  };

  const handleTimerStart = () => {
    setTimerStarted(true);
    toast({
      title: 'Timer Started',
      description: 'Your timed assignment has begun. Good luck!',
    });
  };

  const handleTimeUp = () => {
    setTimerCompleted(true);
    toast({
      title: 'Time\'s Up!',
      description: 'The timer has expired. Please submit your work immediately.',
      variant: 'destructive'
    });
  };

  const getGradeColor = (points: number, maxPoints: number) => {
    const percentage = (points / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!post.is_assignment) return null;

  return (
    <div className="border-t border-gray-100 mt-4">
      {/* Student View - Hide for quiz assignments */}
      {!isTeacher && !post.has_quiz && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isGraded ? 'bg-green-100' : hasSubmitted ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {isGraded ? (
                  <Star className="h-4 w-4 text-green-600" />
                ) : hasSubmitted ? (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Your Work</h4>
                <p className="text-sm text-gray-600">
                  {isGraded
                    ? isNoSubmissionGrade
                      ? 'Graded (no submission)'
                      : 'Graded'
                    : hasSubmitted
                      ? 'Submitted'
                      : 'Not submitted'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isGraded && (
                <Badge className={`${getGradeColor(userSubmission.grade_points, post.max_points || 100)} border`}>
                  {userSubmission.grade_points}/{post.max_points || 100} points
                </Badge>
              )}
              {hasSubmitted && !isGraded && (
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Awaiting Grade
                </Badge>
              )}
              {isOverdue && !hasSubmitted && !isGraded && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Timer Component for Timed Assignments */}
          {post.is_timed && !hasSubmitted && (
            <div className="mb-4">
              <AssignmentTimer
                timeLimitMinutes={post.time_limit_minutes}
                onTimeUp={handleTimeUp}
                onStartTimer={handleTimerStart}
                isStarted={timerStarted}
                isCompleted={timerCompleted}
              />
            </div>
          )}

          {isNoSubmissionGrade && isGraded ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-900">No submission received</h4>
                </div>
                <p className="text-sm text-amber-800 mb-3">
                  Your teacher recorded a grade for this assignment even though you did not submit work.
                </p>
                <Badge className={`${getGradeColor(userSubmission.grade_points, post.max_points || 100)} border`}>
                  {userSubmission.grade_points}/{post.max_points || 100} points
                </Badge>
                {userSubmission.grade_feedback && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200 text-sm text-amber-900">
                    {userSubmission.grade_feedback}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : hasSubmitted ? (
            /* Show Existing Submission */
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Submitted</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(userSubmission.submitted_at), { addSuffix: true })}
                    </span>
                  </div>
                  {userSubmission.submission_text && (
                    <div className="text-gray-800 mb-3 whitespace-pre-wrap">
                      {userSubmission.submission_text}
                    </div>
                  )}
                </div>

                {/* Show submitted files */}
                {userSubmission.files && userSubmission.files.length > 0 && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700 block mb-2">Attached Files:</span>
                    <div className="space-y-2">
                      {userSubmission.files.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-800">{file.file_name}</span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(file.file_size / 1024)} KB)
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            asChild
                          >
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show grade and feedback */}
                {isGraded && (
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Grade & Feedback</span>
                      <Badge className={`${getGradeColor(userSubmission.grade_points, post.max_points || 100)} border`}>
                        {userSubmission.grade_points}/{post.max_points || 100}
                      </Badge>
                    </div>
                    {userSubmission.grade_feedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm text-blue-900">{userSubmission.grade_feedback}</div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Graded by {userSubmission.graded_by_name} • {formatDistanceToNow(new Date(userSubmission.graded_at), { addSuffix: true })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : isOverdue && !isGraded ? (
            /* Show Overdue Message */
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h4 className="font-semibold text-red-900 mb-1">Assignment Overdue</h4>
                <p className="text-sm text-red-700">
                  This assignment was due {formatDistanceToNow(new Date(post.due_date), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Show Submission Form */
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Submit Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Written Response (Optional)
                  </label>
                  <Textarea
                    placeholder="Enter your assignment response here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                {/* Hide file upload for quiz assignments */}
                {!post.has_quiz && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Files (Optional)
                    </label>
                    <PostFileUpload
                      attachments={submissionFiles}
                      onAttachmentsChange={setSubmissionFiles}
                      maxFiles={5}
                      acceptedTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar,.ppt,.pptx,.pps,.ppsx"
                      showUploadedFiles={true}
                    />
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm text-gray-600">
                    {post.due_date ? `Due ${formatDistanceToNow(new Date(post.due_date), { addSuffix: true })}` : 'No due date'}
                  </div>
                  <Button
                    onClick={handleSubmission}
                    disabled={post.has_quiz ? !submissionText.trim() : (!submissionText.trim() && submissionFiles.length === 0)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Teacher View */}
      {isTeacher && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Class grades</h4>
                <p className="text-sm text-gray-600">
                  {gradedCount} graded of {classRoster.length} student{classRoster.length !== 1 ? 's' : ''} ({submittedCount} submitted)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoadSubmissions?.(post.post_id)}
              >
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = !showSubmissions;
                  setShowSubmissions(next);
                  if (next) onLoadSubmissions?.(post.post_id);
                }}
              >
                {showSubmissions ? 'Hide' : 'Show'} class roster ({classRoster.length})
              </Button>
            </div>
          </div>

          {showSubmissions && (
            <div className="space-y-3">
              {classRoster.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No students enrolled in this class</p>
                  </CardContent>
                </Card>
              ) : (
                classRoster.map(({ studentId, studentName, submission }) => {
                  const hasStudentSubmission = !!submission && !submission.no_submission;
                  const isGradedEntry =
                    submission?.grade_points !== undefined && submission?.grade_points !== null;
                  const formKey = gradingFormKey(studentId, submission?.id);

                  return (
                    <Card
                      key={studentId}
                      className={`border-gray-200 ${!hasStudentSubmission ? 'border-amber-200 bg-amber-50/40' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-200 text-gray-700 text-sm">
                                {studentName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{studentName}</div>
                              <div className="text-xs text-gray-500">
                                {hasStudentSubmission && submission.submitted_at
                                  ? `Submitted ${formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}`
                                  : submission?.no_submission
                                    ? 'No submission — graded by teacher'
                                    : 'No submission yet'}
                              </div>
                            </div>
                          </div>

                          {isGradedEntry ? (
                            <Badge
                              className={`${getGradeColor(submission.grade_points, post.max_points || 100)} border`}
                            >
                              {submission.grade_points}/{post.max_points || 100}
                            </Badge>
                          ) : hasStudentSubmission ? (
                            <Badge variant="outline">Submitted · ungraded</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-300 text-amber-800">
                              No submission
                            </Badge>
                          )}
                        </div>

                        {hasStudentSubmission && submission.submission_text && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                              {submission.submission_text}
                            </div>
                          </div>
                        )}

                        {hasStudentSubmission && submission.files && submission.files.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Attached files</div>
                            <div className="space-y-1">
                              {submission.files.map((file: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">{file.file_name}</span>
                                  </div>
                                  <Button variant="outline" size="sm" className="h-6 px-2 text-xs" asChild>
                                    <a href={file.file_url} target="_blank" rel="noreferrer">
                                      View
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-gray-200 pt-3">
                          {isGradedEntry ? (
                            <div className="text-sm text-gray-600 space-y-1">
                              {submission.graded_by_name && (
                                <div>Graded by: {submission.graded_by_name}</div>
                              )}
                              {submission.graded_at && (
                                <div>
                                  Graded{' '}
                                  {formatDistanceToNow(new Date(submission.graded_at), {
                                    addSuffix: true,
                                  })}
                                </div>
                              )}
                              {submission.grade_feedback && (
                                <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                  <span className="font-medium">Feedback:</span> {submission.grade_feedback}
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => openGradingForm(studentId, submission.id, {
                                  points: String(submission.grade_points ?? ''),
                                  feedback: submission.grade_feedback || '',
                                })}
                              >
                                Edit grade
                              </Button>
                            </div>
                          ) : showGradingForm === formKey ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Points (max {post.max_points || 100})
                                  </label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={post.max_points || 100}
                                    value={gradePoints}
                                    onChange={(e) => setGradePoints(e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Feedback (optional)
                                  </label>
                                  <Input
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    placeholder={
                                      hasStudentSubmission ? 'Great work!' : 'No submission received.'
                                    }
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleGrading(studentId, submission?.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Save grade
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowGradingForm(null);
                                    setGradePoints('');
                                    setGradeFeedback('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => openGradingForm(studentId, submission?.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {hasStudentSubmission ? 'Grade submission' : 'Assign grade'}
                              </Button>
                              {!hasStudentSubmission && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-300 text-amber-900 hover:bg-amber-100"
                                  onClick={() =>
                                    openGradingForm(studentId, undefined, {
                                      points: '0',
                                      feedback: 'No submission received.',
                                    })
                                  }
                                >
                                  Grade 0 (no submission)
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Submission
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this assignment? Once submitted, you cannot make changes unless the teacher allows resubmission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Submission Preview:</div>
              {submissionText && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Text:</div>
                  <div className="text-sm">{submissionText.length > 100 ? `${submissionText.substring(0, 100)}...` : submissionText}</div>
                </div>
              )}
              {submissionFiles.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Files ({submissionFiles.length}):</div>
                  <div className="text-sm space-y-1">
                    {submissionFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSubmission}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}