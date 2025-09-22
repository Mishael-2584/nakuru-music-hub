import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  BarChart3,
  Calendar,
  Trophy,
  AlertTriangle
} from "lucide-react";
import { QuizSubmission, QuizQuestion } from '@/types/quiz';

interface QuizManagementInterfaceProps {
  quizId: string;
  quizTitle: string;
  submissions: QuizSubmission[];
  questions: QuizQuestion[];
  onViewSubmission: (submissionId: string) => void;
  onExportResults?: () => void;
}

export default function QuizManagementInterface({
  quizId,
  quizTitle,
  submissions,
  questions,
  onViewSubmission,
  onExportResults
}: QuizManagementInterfaceProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'in_progress'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'submitted_at'>('submitted_at');

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const totalSubmissions = submissions.length;
  const passedSubmissions = submissions.filter(s => s.is_passed).length;
  const failedSubmissions = submissions.filter(s => !s.is_passed).length;
  const averageScore = submissions.length > 0 
    ? submissions.reduce((sum, s) => sum + s.percentage_score, 0) / submissions.length 
    : 0;

  const filteredSubmissions = submissions.filter(submission => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'passed') return submission.is_passed;
    if (filterStatus === 'failed') return !submission.is_passed;
    if (filterStatus === 'in_progress') return submission.status === 'in_progress';
    return true;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.student_id.localeCompare(b.student_id);
      case 'score':
        return b.percentage_score - a.percentage_score;
      case 'submitted_at':
        return new Date(b.submitted_at || b.started_at).getTime() - new Date(a.submitted_at || a.started_at).getTime();
      default:
        return 0;
    }
  });

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusBadgeColor = (status: string, isPassed: boolean) => {
    if (status === 'in_progress') return 'bg-blue-100 text-blue-800';
    if (isPassed) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeTaken = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Quiz Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quiz Analytics: {quizTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalSubmissions}</div>
              <div className="text-sm text-blue-600">Total Submissions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{passedSubmissions}</div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedSubmissions}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageScore.toFixed(1)}%</div>
              <div className="text-sm text-purple-600">Average Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Submissions</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="in_progress">In Progress</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="submitted_at">Submission Date</option>
                  <option value="score">Score</option>
                  <option value="name">Student Name</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onExportResults && (
                <Button
                  variant="outline"
                  onClick={onExportResults}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Results
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-3">
        {sortedSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Submissions Found</h3>
              <p className="text-gray-500">
                {filterStatus === 'all' 
                  ? 'No students have submitted this quiz yet.'
                  : `No submissions match the "${filterStatus}" filter.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-semibold">{submission.student_id}</div>
                      <div className="text-sm text-gray-600">
                        Attempt {submission.attempt_number}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {submission.submitted_at 
                            ? formatDate(submission.submitted_at)
                            : 'In Progress'
                          }
                        </span>
                      </div>
                      
                      {submission.time_taken_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeTaken(submission.time_taken_minutes)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(submission.percentage_score)}`}>
                        {submission.percentage_score.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {submission.total_score}/{totalPoints} points
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreBadgeColor(submission.percentage_score)}>
                        {submission.is_passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                      
                      <Badge className={getStatusBadgeColor(submission.status, submission.is_passed)}>
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewSubmission(submission.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Score Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">90-100%</span>
                    <span className="text-sm font-medium">
                      {submissions.filter(s => s.percentage_score >= 90).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">80-89%</span>
                    <span className="text-sm font-medium">
                      {submissions.filter(s => s.percentage_score >= 80 && s.percentage_score < 90).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">70-79%</span>
                    <span className="text-sm font-medium">
                      {submissions.filter(s => s.percentage_score >= 70 && s.percentage_score < 80).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">60-69%</span>
                    <span className="text-sm font-medium">
                      {submissions.filter(s => s.percentage_score >= 60 && s.percentage_score < 70).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Below 60%</span>
                    <span className="text-sm font-medium">
                      {submissions.filter(s => s.percentage_score < 60).length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Pass Rate</span>
                    <span className="text-sm font-medium">
                      {((passedSubmissions / totalSubmissions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Score</span>
                    <span className="text-sm font-medium">{averageScore.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Highest Score</span>
                    <span className="text-sm font-medium">
                      {Math.max(...submissions.map(s => s.percentage_score)).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Lowest Score</span>
                    <span className="text-sm font-medium">
                      {Math.min(...submissions.map(s => s.percentage_score)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Time Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Time</span>
                    <span className="text-sm font-medium">
                      {formatTimeTaken(
                        submissions
                          .filter(s => s.time_taken_minutes)
                          .reduce((sum, s) => sum + (s.time_taken_minutes || 0), 0) / 
                        submissions.filter(s => s.time_taken_minutes).length
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fastest Completion</span>
                    <span className="text-sm font-medium">
                      {formatTimeTaken(
                        Math.min(...submissions.map(s => s.time_taken_minutes || Infinity))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slowest Completion</span>
                    <span className="text-sm font-medium">
                      {formatTimeTaken(
                        Math.max(...submissions.map(s => s.time_taken_minutes || 0))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
