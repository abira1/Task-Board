import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'meeting' | 'deadline';
  assignee?: {
    name: string;
    avatar: string;
  };
}
const mockEvents: Event[] = [{
  id: '1',
  title: 'Team Weekly Meeting',
  date: new Date(2023, 6, 10, 10, 0),
  type: 'meeting'
}, {
  id: '2',
  title: 'Client Presentation',
  date: new Date(2023, 6, 12, 14, 0),
  type: 'meeting',
  assignee: {
    name: 'Emma Chen',
    avatar: 'https://i.pravatar.cc/150?img=5'
  }
}, {
  id: '3',
  title: 'Website Redesign Deadline',
  date: new Date(2023, 6, 15),
  type: 'deadline'
}, {
  id: '4',
  title: 'Finalize Marketing Assets',
  date: new Date(2023, 6, 18),
  type: 'task',
  assignee: {
    name: 'Jordan Lee',
    avatar: 'https://i.pravatar.cc/150?img=32'
  }
}, {
  id: '5',
  title: 'Quarterly Planning',
  date: new Date(2023, 6, 25, 9, 0),
  type: 'meeting'
}, {
  id: '6',
  title: 'Brand Guidelines Review',
  date: new Date(2023, 6, 20),
  type: 'task',
  assignee: {
    name: 'Alex Kim',
    avatar: 'https://i.pravatar.cc/150?img=11'
  }
}];
const CalendarView = () => {
  const {
    isAdmin
  } = useAuth();
  const {
    addNotification
  } = useNotifications();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const formatMonth = () => {
    return currentDate.toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });
  };
  const getEventsByDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => event.date.getDate() === date.getDate() && event.date.getMonth() === date.getMonth() && event.date.getFullYear() === date.getFullYear());
  };
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-[#e8ecf3] text-[#8ca3d8]';
      case 'task':
        return 'bg-[#e8f3f1] text-[#7eb8ab]';
      case 'deadline':
        return 'bg-[#f5eee8] text-[#d4a5a5]';
      default:
        return 'bg-[#f5f0e8] text-[#7a7067]';
    }
  };
  const handleDateClick = (day: number) => {
    // Only admin can open the create event modal
    if (!isAdmin()) return;
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selectedDate);
    setIsModalOpen(true);
  };
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const type = formData.get('type') as 'task' | 'meeting' | 'deadline';
    const startTime = formData.get('startTime') as string;
    const assignee = formData.get('assignee') as string;
    const notes = formData.get('notes') as string;
    if (!selectedDate || !title || !type) return;
    const assigneeMap = {
      'Emma Chen': {
        name: 'Emma Chen',
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      'Alex Kim': {
        name: 'Alex Kim',
        avatar: 'https://i.pravatar.cc/150?img=11'
      },
      'Jordan Lee': {
        name: 'Jordan Lee',
        avatar: 'https://i.pravatar.cc/150?img=32'
      }
    };
    const [hours, minutes] = startTime ? startTime.split(':') : ['0', '0'];
    const eventDate = new Date(selectedDate);
    eventDate.setHours(parseInt(hours), parseInt(minutes));
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title,
      date: eventDate,
      type,
      assignee: assignee ? assigneeMap[assignee as keyof typeof assigneeMap] : undefined
    };
    setEvents([...events, newEvent]);
    setIsModalOpen(false);
    addNotification({
      title: 'New Event Created',
      message: `Event "${newEvent.title}" has been scheduled for ${newEvent.date.toLocaleDateString()}`,
      type: 'event'
    });
  };
  const renderCalendarDays = () => {
    const days = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Render days of the week
    for (let i = 0; i < 7; i++) {
      days.push(<div key={`header-${i}`} className="text-center font-medium text-[#3a3226] py-2">
          {daysOfWeek[i]}
        </div>);
    }
    // Render empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="border border-[#f5f0e8] p-2 h-28"></div>);
    }
    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsByDate(day);
      const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
      days.push(<div key={`day-${day}`} className={`border border-[#f5f0e8] p-2 h-28 overflow-hidden 
            ${isAdmin() ? 'hover:bg-[#f5f0e8]/30 cursor-pointer' : ''} 
            transition-colors 
            ${isToday ? 'bg-[#f5f0e8]/50' : ''}`} onClick={() => handleDateClick(day)}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${isToday ? 'font-bold text-[#d4a5a5]' : 'text-[#3a3226]'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && <span className="text-xs text-[#7a7067]">
                {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
              </span>}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => <div key={event.id} className={`text-xs px-2 py-1 rounded truncate ${getEventTypeColor(event.type)}`}>
                {event.title}
              </div>)}
            {dayEvents.length > 3 && <div className="text-xs text-[#7a7067]">
                +{dayEvents.length - 3} more
              </div>}
          </div>
        </div>);
    }
    return days;
  };
  return <div>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
            Calendar
          </h1>
          <p className="text-[#7a7067]">
            {isAdmin() ? "View and manage your team's schedule" : "View your team's schedule"}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {isAdmin() && <button className="flex items-center px-4 py-2 bg-[#d4a5a5] text-white rounded-lg" onClick={() => {
          setSelectedDate(new Date());
          setIsModalOpen(true);
        }}>
              <PlusIcon className="h-4 w-4 mr-2" />
              <span>Add Event</span>
            </button>}
        </div>
      </header>
      <div className="bg-white rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            {formatMonth()}
          </h2>
          <div className="flex space-x-2">
            <button className="p-2 rounded-lg bg-[#f5f0e8] text-[#3a3226]" onClick={prevMonth}>
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg bg-[#f5f0e8] text-[#3a3226]" onClick={nextMonth}>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
      </div>
      {/* Add Event Modal */}
      {isModalOpen && selectedDate && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
                {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#7a7067] hover:text-[#3a3226]">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Event Title
                </label>
                <input type="text" name="title" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Enter event title" required />
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Event Type
                </label>
                <select name="type" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" required>
                  <option value="">Select event type</option>
                  <option value="task">Task</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Start Time
                </label>
                <input type="time" name="startTime" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" />
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Assignee
                </label>
                <select name="assignee" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]">
                  <option value="">Select assignee (optional)</option>
                  <option value="Emma Chen">Emma Chen</option>
                  <option value="Alex Kim">Alex Kim</option>
                  <option value="Jordan Lee">Jordan Lee</option>
                </select>
              </div>
              <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea name="notes" className="bg-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] min-h-[100px]" placeholder="Add any additional notes..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" className="px-4 py-2 text-[#7a7067] bg-[#f5f0e8] rounded-lg" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export default CalendarView;