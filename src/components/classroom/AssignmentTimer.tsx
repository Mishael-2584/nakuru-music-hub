import React, { useState, useEffect, useRef } from 'react';
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
  /** Server-authoritative remaining seconds (refresh-safe). */
  initialSecondsRemaining?: number | null;
  /** Hide manual start when attempt is managed by parent. */
  hideStartButton?: boolean;
}

export default function AssignmentTimer({ 
  timeLimitMinutes, 
  onTimeUp, 
  onStartTimer,
  isStarted,
  isCompleted,
  initialSecondsRemaining,
  hideStartButton = false,
}: AssignmentTimerProps) {
  const fallbackSeconds = Math.max(0, Math.round((timeLimitMinutes || 0) * 60));
  const [timeLeft, setTimeLeft] = useState(
    typeof initialSecondsRemaining === 'number' ? Math.max(0, initialSecondsRemaining) : fallbackSeconds
  );
  const [isRunning, setIsRunning] = useState(false);
  const hasFiredTimeUp = useRef(false);

  // Sync when server sends a new remaining value (e.g. after refresh/resume)
  useEffect(() => {
    if (typeof initialSecondsRemaining === 'number') {
      setTimeLeft(Math.max(0, initialSecondsRemaining));
      hasFiredTimeUp.current = false;
    }
  }, [initialSecondsRemaining]);

  useEffect(() => {
    if (isStarted && !isRunning && !isCompleted) {
      setIsRunning(true);
    }
    if (isCompleted) {
      setIsRunning(false);
    }
  }, [isStarted, isRunning, isCompleted]);

  useEffect(() => {
    if (!isRunning || isCompleted || timeLeft <= 0) {
      if (isStarted && !isCompleted && timeLeft <= 0 && !hasFiredTimeUp.current) {
        hasFiredTimeUp.current = true;
        setIsRunning(false);
        onTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setIsRunning(false);
          if (!hasFiredTimeUp.current) {
            hasFiredTimeUp.current = true;
            onTimeUp();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp, isCompleted, isStarted]);

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
    if (timeLeft <= 60) return 'text-red-600';
    if (timeLeft <= 300) return 'text-orange-600';
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
      timerStatus === 'expired' ? 'border-red-500 bg-red-50' :
      'border-blue-500 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              timerStatus === 'critical' || timerStatus === 'expired' ? 'bg-red-100' :
              timerStatus === 'warning' ? 'bg-orange-100' :
              timerStatus === 'completed' ? 'bg-green-100' :
              'bg-blue-100'
            }`}>
              {timerStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className={`h-5 w-5 ${
                  timerStatus === 'critical' || timerStatus === 'expired' ? 'text-red-600' :
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
                {timerStatus === 'expired' && (
                  <Badge variant="destructive">
                    Time Expired — Submitting
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
                {timerStatus === 'completed' ? 'Quiz submitted' :
                 timerStatus === 'expired' ? 'Time expired' :
                 isStarted ? 'Timer running' : 'Click start to begin timed quiz'}
              </p>
            </div>
          </div>
          
          {!hideStartButton && !isStarted && !isCompleted && (
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
