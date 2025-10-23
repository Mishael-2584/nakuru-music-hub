import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const QuizDebugPanel = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [classroomId, setClassroomId] = useState('');

  const checkQuizAccess = async () => {
    if (!user?.id) {
      setDebugInfo({ error: 'Not logged in' });
      return;
    }

    try {
      // Check if user is a teacher
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();

      // Check if user is a student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      // Get classroom info if ID provided
      let classroomData = null;
      if (classroomId) {
        const { data: classData, error: classError } = await supabase
          .from('classrooms')
          .select('id, name, teacher_id')
          .eq('id', classroomId)
          .single();
        
        if (!classError) classroomData = classData;
      }

      // Get quiz assignments
      const { data: quizPosts, error: quizError } = await supabase
        .from('posts')
        .select('post_id, title, has_quiz, is_assignment')
        .eq('has_quiz', true)
        .eq('is_assignment', true)
        .limit(5);

      setDebugInfo({
        user: {
          id: user.id,
          email: user.email
        },
        teacher: teacherData,
        student: studentData,
        admin: adminData,
        classroom: classroomData,
        quizPosts: quizPosts || [],
        isTeacherOfClass: classroomData && (
          (teacherData && classroomData.teacher_id === teacherData.id) ||
          (adminData && (adminData.role === 'admin' || adminData.role === 'super_admin'))
        )
      });
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  useEffect(() => {
    checkQuizAccess();
  }, [user, classroomId]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quiz Management Debug Panel</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Classroom ID (optional):</label>
          <input
            type="text"
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
            placeholder="Enter classroom ID to check teacher access"
            className="w-full p-2 border rounded-lg"
          />
        </div>
        
        <button
          onClick={checkQuizAccess}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Debug Info
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">User Info:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.user, null, 2)}
            </pre>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Teacher Status:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.teacher, null, 2)}
            </pre>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Admin Status:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.admin, null, 2)}
            </pre>
          </div>

          {debugInfo.classroom && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Classroom Info:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo.classroom, null, 2)}
              </pre>
            </div>
          )}

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Quiz Posts:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo.quizPosts, null, 2)}
            </pre>
          </div>

          <div className={`p-4 border rounded-lg ${debugInfo.isTeacherOfClass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className="font-semibold mb-2">Can See Manage Quiz Button:</h3>
            <p className={`font-bold ${debugInfo.isTeacherOfClass ? 'text-green-800' : 'text-red-800'}`}>
              {debugInfo.isTeacherOfClass ? '✅ YES' : '❌ NO'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {debugInfo.isTeacherOfClass 
                ? 'You are the teacher of this classroom and can manage quizzes.'
                : 'You need to be the teacher of this classroom to see the Manage Quiz button.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizDebugPanel;
