import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Student {
  id: string;
  student_name: string;
  email: string;
  instrument: string;
  proficiency_level: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  lesson_type: string;
  notes?: string;
  student_id: string;
  student_name?: string;
}

interface LessonSchedulerProps {
  students: Student[];
  lessons: Lesson[];
  onAddLesson: (lesson: any) => void;
  onUpdateLesson: (id: string, lesson: any) => void;
  onDeleteLesson: (id: string) => void;
}

const LessonScheduler: React.FC<LessonSchedulerProps> = ({
  students,
  lessons,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    lesson_date: '',
    start_time: '',
    end_time: '',
    lesson_type: 'regular',
    student_id: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLesson) {
      onUpdateLesson(editingLesson.id, newLesson);
    } else {
      onAddLesson(newLesson);
    }
    setShowModal(false);
    setEditingLesson(null);
    setNewLesson({
      title: '',
      description: '',
      lesson_date: '',
      start_time: '',
      end_time: '',
      lesson_type: 'regular',
      student_id: '',
      notes: ''
    });
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setNewLesson({
      title: lesson.title,
      description: lesson.description || '',
      lesson_date: lesson.lesson_date,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      lesson_type: lesson.lesson_type,
      student_id: lesson.student_id,
      notes: lesson.notes || ''
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const upcomingLessons = lessons.filter(l => l.status === 'scheduled').slice(0, 5);
  const completedLessons = lessons.filter(l => l.status === 'completed').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{lessons.length}</div>
                <div className="text-sm text-gray-600">Total Lessons</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{lessons.filter(l => l.status === 'scheduled').length}</div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{lessons.filter(l => l.status === 'completed').length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule New Lesson */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Schedule New Lesson</CardTitle>
            <CardDescription>Book a lesson with one of your students</CardDescription>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? 'Edit Lesson' : 'Schedule New Lesson'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Lesson Title</Label>
                    <Input
                      id="title"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                      placeholder="e.g., Piano Fundamentals"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="student">Student</Label>
                    <Select value={newLesson.student_id} onValueChange={(value) => setNewLesson({...newLesson, student_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.student_name} ({student.instrument})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newLesson.lesson_date}
                      onChange={(e) => setNewLesson({...newLesson, lesson_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lesson_type">Lesson Type</Label>
                    <Select value={newLesson.lesson_type} onValueChange={(value) => setNewLesson({...newLesson, lesson_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular Lesson</SelectItem>
                        <SelectItem value="makeup">Makeup Lesson</SelectItem>
                        <SelectItem value="exam_prep">Exam Preparation</SelectItem>
                        <SelectItem value="performance">Performance Prep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newLesson.start_time}
                      onChange={(e) => setNewLesson({...newLesson, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newLesson.end_time}
                      onChange={(e) => setNewLesson({...newLesson, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                    placeholder="Lesson objectives and focus areas"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newLesson.notes}
                    onChange={(e) => setNewLesson({...newLesson, notes: e.target.value})}
                    placeholder="Additional notes for the lesson"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingLesson ? 'Update Lesson' : 'Schedule Lesson'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Upcoming Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Lessons</CardTitle>
          <CardDescription>Your scheduled lessons for the next few days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingLessons.length > 0 ? (
              upcomingLessons.map(lesson => (
                <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">{lesson.title}</h4>
                      <p className="text-sm text-gray-600">{formatDate(lesson.lesson_date)} at {formatTime(lesson.start_time)}</p>
                      <p className="text-sm text-gray-600">Student: {lesson.student_name}</p>
                      <p className="text-sm text-gray-600">Duration: {lesson.start_time} - {lesson.end_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDeleteLesson(lesson.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming lessons scheduled</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Completed Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Lessons</CardTitle>
          <CardDescription>Your recently completed lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedLessons.length > 0 ? (
              completedLessons.map(lesson => (
                <div key={lesson.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold">{lesson.title}</h4>
                      <p className="text-sm text-gray-600">{formatDate(lesson.lesson_date)}</p>
                      <p className="text-sm text-gray-600">Student: {lesson.student_name}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No completed lessons yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonScheduler; 