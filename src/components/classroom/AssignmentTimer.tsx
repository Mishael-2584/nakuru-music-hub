import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface AssignmentTimerProps {
  timeLimitMinutes: number;
  onTimeUp: () => void;
  onStartTimer: () => void;
  isStarted: boolean;
  isCompleted: boolean;
}

export default function AssignmentTimer({ 
  timeLimitMinutes, 
  onTimeUp, 
  onStartTimer,
  isStarted,
  isCompleted 
}: AssignmentTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);

  // Auto-start timer when isStarted becomes true
  useEffect(() => {
    if (isStarted && !isRunning && !isCompleted) {
      setIsRunning(true);
    }
  }, [isStarted, isRunning, isCompleted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0 && !isCompleted) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            onTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp, isCompleted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (isCompleted) return 'text-green-600';
    if (timeLeft <= 60) return 'text-red-600'; // Last minute
    if (timeLeft <= 300) return 'text-orange-600'; // Last 5 minutes
    return 'text-blue-600';
  };

  const getTimerStatus = () => {
    if (isCompleted) return 'completed';
    if (timeLeft === 0) return 'expired';
    if (timeLeft <= 60) return 'critical';
    if (timeLeft <= 300) return 'warning';
    return 'normal';
  };

  const handleStartTimer = () => {
    setIsRunning(true);
    onStartTimer();
  };

  const timerStatus = getTimerStatus();

  return (
    <Card className={`border-2 ${
      timerStatus === 'critical' ? 'border-red-500 bg-red-50' :
      timerStatus === 'warning' ? 'border-orange-500 bg-orange-50' :
      timerStatus === 'completed' ? 'border-green-500 bg-green-50' :
      'border-blue-500 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              timerStatus === 'critical' ? 'bg-red-100' :
              timerStatus === 'warning' ? 'bg-orange-100' :
              timerStatus === 'completed' ? 'bg-green-100' :
              'bg-blue-100'
            }`}>
              {timerStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className={`h-5 w-5 ${
                  timerStatus === 'critical' ? 'text-red-600' :
                  timerStatus === 'warning' ? 'text-orange-600' :
                  'text-blue-600'
                }`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </span>
                {timerStatus === 'critical' && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Time Almost Up!
                  </Badge>
                )}
                {timerStatus === 'warning' && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Time Running Low
                  </Badge>
                )}
                {timerStatus === 'completed' && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {timerStatus === 'completed' ? 'Assignment completed successfully' :
                 timerStatus === 'expired' ? 'Time expired' :
                 isStarted ? 'Timer running' : 'Click start to begin timed assignment'}
              </p>
            </div>
          </div>
          
          {!isStarted && !isCompleted && (
            <Button 
              onClick={handleStartTimer}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Timer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
