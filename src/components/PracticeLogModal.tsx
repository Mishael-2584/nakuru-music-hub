import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';

interface PracticeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (practiceLog: any) => void;
}

const PracticeLogModal: React.FC<PracticeLogModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [practiceLog, setPracticeLog] = useState({
    practice_date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    practice_type: 'regular',
    notes: '',
    pieces_practiced: [''],
    difficulty_rating: 3,
    mood_rating: 3
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(practiceLog);
    setPracticeLog({
      practice_date: new Date().toISOString().split('T')[0],
      duration_minutes: 30,
      practice_type: 'regular',
      notes: '',
      pieces_practiced: [''],
      difficulty_rating: 3,
      mood_rating: 3
    });
  };

  const addPiece = () => {
    setPracticeLog({
      ...practiceLog,
      pieces_practiced: [...practiceLog.pieces_practiced, '']
    });
  };

  const removePiece = (index: number) => {
    const newPieces = practiceLog.pieces_practiced.filter((_, i) => i !== index);
    setPracticeLog({
      ...practiceLog,
      pieces_practiced: newPieces
    });
  };

  const updatePiece = (index: number, value: string) => {
    const newPieces = [...practiceLog.pieces_practiced];
    newPieces[index] = value;
    setPracticeLog({
      ...practiceLog,
      pieces_practiced: newPieces
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Practice Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="practice_date">Date</Label>
              <Input
                id="practice_date"
                type="date"
                value={practiceLog.practice_date}
                onChange={(e) => setPracticeLog({...practiceLog, practice_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                value={practiceLog.duration_minutes}
                onChange={(e) => setPracticeLog({...practiceLog, duration_minutes: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="practice_type">Practice Type</Label>
            <Select value={practiceLog.practice_type} onValueChange={(value) => setPracticeLog({...practiceLog, practice_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Practice</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="performance_prep">Performance Prep</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Pieces Practiced</Label>
            <div className="space-y-2">
              {practiceLog.pieces_practiced.map((piece, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={piece}
                    onChange={(e) => updatePiece(index, e.target.value)}
                    placeholder="Piece name"
                  />
                  {practiceLog.pieces_practiced.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePiece(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPiece}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Piece
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Rating (1-5)</Label>
              <Select value={practiceLog.difficulty_rating.toString()} onValueChange={(value) => setPracticeLog({...practiceLog, difficulty_rating: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Easy</SelectItem>
                  <SelectItem value="2">2 - Easy</SelectItem>
                  <SelectItem value="3">3 - Moderate</SelectItem>
                  <SelectItem value="4">4 - Challenging</SelectItem>
                  <SelectItem value="5">5 - Very Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mood">Mood Rating (1-5)</Label>
              <Select value={practiceLog.mood_rating.toString()} onValueChange={(value) => setPracticeLog({...practiceLog, mood_rating: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Frustrated</SelectItem>
                  <SelectItem value="2">2 - Stressed</SelectItem>
                  <SelectItem value="3">3 - Neutral</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={practiceLog.notes}
              onChange={(e) => setPracticeLog({...practiceLog, notes: e.target.value})}
              placeholder="What did you practice today? Any challenges or breakthroughs?"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Log Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeLogModal; 