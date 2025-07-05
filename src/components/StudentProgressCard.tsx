import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';

interface StudentProgressCardProps {
  student: {
    id: string;
    student_name: string;
    proficiency_level: string;
    instrument: string;
  };
  stats: {
    totalLessons: number;
    completedLessons: number;
    totalPracticeTime: number;
    averagePracticeTime: number;
    piecesMastered: number;
    attendanceRate: number;
  };
}

const StudentProgressCard: React.FC<StudentProgressCardProps> = ({ student, stats }) => {
  const attendancePercentage = stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0;
  const practiceProgress = Math.min((stats.totalPracticeTime / 1000) * 100, 100); // Assuming 1000 minutes is 100%

  return (
    <Card className="shadow-lg border-0 bg-white/95">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{student.student_name}</CardTitle>
            <CardDescription>{student.instrument} • {student.proficiency_level}</CardDescription>
          </div>
          <Badge variant="secondary">{student.proficiency_level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completedLessons}</div>
            <div className="text-sm text-gray-600">Lessons Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalPracticeTime}</div>
            <div className="text-sm text-gray-600">Practice Minutes</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Attendance Rate</span>
              <span className="text-sm text-gray-600">{attendancePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={attendancePercentage} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Practice Progress</span>
              <span className="text-sm text-gray-600">{practiceProgress.toFixed(1)}%</span>
            </div>
            <Progress value={practiceProgress} className="h-2" />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-semibold">{stats.averagePracticeTime}</div>
            <div className="text-xs text-gray-600">Avg. Practice (min)</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-semibold">{stats.piecesMastered}</div>
            <div className="text-xs text-gray-600">Pieces Mastered</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-semibold">{stats.attendanceRate}%</div>
            <div className="text-xs text-gray-600">Attendance</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="font-semibold mb-3">Recent Activity</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Last Practice Session</span>
              <span className="text-gray-600">2 days ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Last Lesson</span>
              <span className="text-gray-600">1 week ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Next Lesson</span>
              <span className="text-green-600">Tomorrow</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            View Details
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Send Message
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProgressCard; 