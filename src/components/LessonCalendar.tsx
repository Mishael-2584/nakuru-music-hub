import React from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  Event,
} from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Event type for lessons/bookings
export interface LessonEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: string; // scheduled, completed, cancelled, etc.
  lesson_type?: string;
  student_name?: string;
  teacher_name?: string;
  meeting_link?: string;
  [key: string]: any;
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface LessonCalendarProps {
  events: LessonEvent[];
  onSelectEvent?: (event: LessonEvent) => void;
  onSelectSlot?: (slotInfo: any) => void;
  selectable?: boolean;
  defaultView?: 'week' | 'month' | 'day';
}

const statusColors: Record<string, string> = {
  scheduled: '#2563eb', // blue
  completed: '#22c55e', // green
  cancelled: '#ef4444', // red
  makeup: '#f59e42', // orange
  rescheduled: '#eab308', // yellow
};

export const LessonCalendar: React.FC<LessonCalendarProps> = ({
  events,
  onSelectEvent,
  onSelectSlot,
  selectable = false,
  defaultView = 'week',
}) => {
  // Validate events
  const validEvents = events.filter(event => {
    if (!event.start || !event.end) {
      return false;
    }
    if (!(event.start instanceof Date) || !(event.end instanceof Date)) {
      return false;
    }
    return true;
  });

  // Custom event style by status
  const eventPropGetter = (event: LessonEvent) => {
    const color = statusColors[event.status || 'scheduled'] || '#64748b';
    return {
      style: {
        backgroundColor: color,
        color: '#fff',
        borderRadius: '6px',
        border: 'none',
        padding: '2px 6px',
        opacity: event.status === 'cancelled' ? 0.6 : 1,
      },
    };
  };

  // Test with sample data if no valid events
  const testEvents: LessonEvent[] = [
    {
      id: 'test-1',
      title: 'Test Lesson',
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      status: 'scheduled',
      lesson_type: 'lesson',
      student_name: 'Test Student'
    }
  ];

  const eventsToShow = validEvents.length > 0 ? validEvents : testEvents;

  return (
    <div style={{ minHeight: 500 }}>
      <Calendar
        localizer={localizer}
        events={eventsToShow}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        views={[Views.WEEK, Views.MONTH, Views.DAY]}
        defaultView={defaultView}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable={selectable}
        eventPropGetter={eventPropGetter}
        popup
        toolbar
        messages={{
          week: 'Week',
          work_week: 'Work Week',
          day: 'Day',
          month: 'Month',
          previous: '<',
          next: '>',
          today: 'Today',
          agenda: 'Agenda',
        }}
      />
    </div>
  );
}; 