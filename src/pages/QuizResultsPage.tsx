import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Clock, Trophy } from "lucide-react";
import QuizResultsDisplay from "@/components/quiz/QuizResultsDisplay";

interface QuizSubmissionData {
  submission: {
    id: string;
    student_name: string;
    student_email: string;
    total_score: number;
    percentage_score: number;
    is_passed: boolean;
    time_taken_minutes: number;
    submitted_at: string;
  };
  questions: any[];
  answers: any[];
  showAnswers: boolean;
  totalScore: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
  timeTaken: number;
  submittedAt: string;
}

export default function QuizResultsPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submissionData, setSubmissionData] = useState<QuizSubmissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get submission data from sessionStorage
    const storedData = sessionStorage.getItem('quizSubmissionData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log('Loaded submission data from sessionStorage:', data);
        console.log('Answers in data:', data.answers);
        console.log('Questions in data:', data.questions);
        setSubmissionData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing submission data:', error);
        setLoading(false);
      }
    } else {
      console.log('No submission data found in sessionStorage');
      setLoading(false);
    }
  }, []);

  const handleBack = () => {
    // Clear sessionStorage and close the tab
    sessionStorage.removeItem('quizSubmissionData');
    window.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Quiz Data Found</h2>
            <p className="text-gray-600 mb-4">The quiz submission data could not be loaded.</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleBack}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Classroom
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
                <p className="text-gray-600">Student: {submissionData.submission.student_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                className={`text-sm px-3 py-1 ${
                  submissionData.isPassed 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {submissionData.isPassed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    PASSED
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    FAILED
                  </>
                )}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {submissionData.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {submissionData.totalScore}/{submissionData.totalPoints} points
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Results Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <QuizResultsDisplay
          result={{
            submission: submissionData.submission,
            answers: submissionData.answers,
            questions: submissionData.questions,
            showAnswers: true // Teachers can always see answers
          }}
          onBack={handleBack}
          canRetake={false} // Teachers can't retake quizzes
        />
      </div>
    </div>
  );
}
