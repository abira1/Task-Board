import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon, ClockIcon, Loader2Icon, AlertCircleIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchData, addData, updateData, removeData } from '../firebase/database';
import { defaultEvents } from '../firebase/initData';
import Avatar from '../components/Avatar';

interface Event {
  id: string;
  title: string;
  date: string; // Store as ISO string for Firebase compatibility
  type: 'task' | 'meeting' | 'deadline';
  assignee?: {
    name: string;
    avatar: string;
  };
  description?: string;
  meetingLink?: string; // URL for virtual meetings
}

// Define User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  status?: 'active' | 'inactive';
}
const CalendarView = () => {
  const {
    isAdmin
  } = useAuth();
  const {
    addNotification
  } = useNotifications();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // State for team members
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
  const [teamMemberError, setTeamMemberError] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [hasMeetingLink, setHasMeetingLink] = useState<boolean>(false);
  const [meetingLink, setMeetingLink] = useState<string>('');

  // State for event detail modal
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [isEventDetailClosing, setIsEventDetailClosing] = useState(false);

  // State for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{id: string, title: string} | null>(null);

  // State for date events modal (when a date has multiple events)
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);
  const [showDateEventsModal, setShowDateEventsModal] = useState(false);
  const [isDateEventsModalClosing, setIsDateEventsModalClosing] = useState(false);

  // Fetch events from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Event[]>('events', (data) => {
      if (data) {
        setEvents(data);
      } else {
        setEvents([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch team members from Firebase
  useEffect(() => {
    setTeamMemberError(null);

    const unsubscribe = fetchData<User[]>('users', (data) => {
      try {
        if (data) {
          // Filter to include all approved users, including admins
          // Make sure to include all admin users regardless of approval status
          const approvedUsers = data.filter(user =>
            user.approvalStatus === 'approved' || user.status === 'active' || user.role === 'admin'
          );

          // Log the users to help with debugging
          console.log('All users:', data);
          console.log('Approved users and admins:', approvedUsers);
          console.log('Admin users:', approvedUsers.filter(user => user.role === 'admin'));

          if (approvedUsers.length === 0) {
            setTeamMemberError('No approved team members found.');
          }

          setTeamMembers(approvedUsers);
        } else {
          setTeamMembers([]);
          setTeamMemberError('Unable to load team members.');
        }
      } catch (error) {
        console.error('Error processing team members:', error);
        setTeamMemberError('An error occurred while loading team members.');
      } finally {
        setLoadingTeamMembers(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle keyboard events for modals (ESC key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false);
          setEventToDelete(null);
        } else if (showEventDetail) {
          closeEventDetailModal();
        } else if (showDateEventsModal) {
          closeDateEventsModal();
        } else if (isModalOpen) {
          setIsModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDeleteModalOpen, showEventDetail, showDateEventsModal, isModalOpen]);
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
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-[#f5f0e8] text-[#3a3226] border border-[#d4a5a5]';
      case 'task':
        return 'bg-[#f5f0e8] text-[#3a3226] border border-[#7a7067]';
      case 'deadline':
        return 'bg-[#d4a5a5] text-white';
      default:
        return 'bg-[#f5f0e8] text-[#7a7067]';
    }
  };
  // Function to handle showing events for a specific date
  const handleViewDateEvents = (day: number) => {
    const dayEvents = getEventsByDate(day);

    // Only proceed if there are events for this date
    if (dayEvents.length === 0) return;

    // If there's only one event, show it directly
    if (dayEvents.length === 1) {
      handleEventClick(dayEvents[0]);
      return;
    }

    // If there are multiple events, show the date events modal
    setSelectedDateEvents(dayEvents);
    setShowDateEventsModal(true);
  };

  // Function to open the add event modal (only used by the "Add new Event" button)
  const handleAddEventClick = (date: Date) => {
    // Only admin can open the create event modal
    if (!isAdmin()) return;
    setSelectedDate(date);
    setHasMeetingLink(false);
    setMeetingLink('');
    setIsModalOpen(true);
  };
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const type = formData.get('type') as 'task' | 'meeting' | 'deadline';
    const eventDateStr = formData.get('eventDate') as string;
    const startTime = formData.get('startTime') as string;
    const assigneeId = formData.get('assignee') as string;
    const notes = formData.get('notes') as string;

    if (!eventDateStr || !title || !type) return;

    try {
      const [hours, minutes] = startTime ? startTime.split(':') : ['0', '0'];
      // Create a new date from the form's date input
      const eventDate = new Date(eventDateStr);
      // Set the time components
      eventDate.setHours(parseInt(hours), parseInt(minutes));

      // Find the selected team member
      const selectedMember = teamMembers.find(member => member.id === assigneeId);

      // Create new event with ISO string date for Firebase
      const newEvent = {
        title,
        date: eventDate.toISOString(),
        type,
        assignee: selectedMember ? {
          name: selectedMember.name,
          avatar: selectedMember.avatar || ''
        } : undefined,
        description: notes,
        meetingLink: hasMeetingLink ? meetingLink : undefined
      };

      // Add event to Firebase
      const eventRef = await addData('events', newEvent);

      // Close the modal
      setIsModalOpen(false);

      // Add the new event to the local state to update UI immediately
      // This ensures the date will be highlighted with the appropriate styling
      if (eventRef) {
        const newEventWithId = { ...newEvent, id: eventRef };
        setEvents(prevEvents => [...prevEvents, newEventWithId]);
      }

      // Add notification
      await addNotification({
        title: 'New Event Created',
        message: `Event "${newEvent.title}" has been scheduled for ${eventDate.toLocaleDateString()}`,
        type: 'event'
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for event display
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert hours from 24-hour format to 12-hour format
    const formattedHours = hours % 12 || 12;

    // Add leading zero to minutes if needed
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    // Format as "HH : MM AM/PM" to match the Figma design
    return `${formattedHours} : ${formattedMinutes} ${ampm}`;
  };

  // Handle event click to show details
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailClosing(false);
    setShowEventDetail(true);
  };

  // Handle event deletion confirmation
  const confirmDeleteEvent = (eventId: string, eventTitle: string) => {
    if (!isAdmin()) {
      addNotification({
        title: 'Access Denied',
        message: 'Only administrators can delete events',
        type: 'system'
      });
      return;
    }

    setEventToDelete({ id: eventId, title: eventTitle });
    setIsDeleteModalOpen(true);
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!eventToDelete || !isAdmin()) {
      return;
    }

    try {
      // Delete event from Firebase
      await removeData('events', eventToDelete.id);

      // Close the event detail modal if it's open
      setIsEventDetailClosing(true);
      setTimeout(() => {
        setShowEventDetail(false);
        setSelectedEvent(null);
      }, 300);

      // Close the delete confirmation modal
      setIsDeleteModalOpen(false);
      setEventToDelete(null);

      // Update local state to remove the deleted event
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id));

      // Add notification
      await addNotification({
        title: 'Event Deleted',
        message: `Event "${eventToDelete.title}" has been deleted`,
        type: 'event'
      });
    } catch (error) {
      console.error('Error deleting event:', error);

      await addNotification({
        title: 'Error',
        message: 'Failed to delete event. Please try again.',
        type: 'system'
      });
    }
  };

  // Handle modal closing with animation
  const closeEventDetailModal = () => {
    setIsEventDetailClosing(true);
    setTimeout(() => {
      setShowEventDetail(false);
      setSelectedEvent(null);
      setIsEventDetailClosing(false);
    }, 300);
  };

  // Handle date events modal closing with animation
  const closeDateEventsModal = () => {
    setIsDateEventsModalClosing(true);
    setTimeout(() => {
      setShowDateEventsModal(false);
      setSelectedDateEvents([]);
      setIsDateEventsModalClosing(false);
    }, 300);
  };

  // Get upcoming events (sorted by date)
  const getUpcomingEvents = () => {
    return [...events]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8); // Limit to 8 events
  };

  const renderCalendarDays = () => {
    const days = [];
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // Render days of the week
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="text-center font-medium text-[#3a3226] py-2 border border-[#f5f0e8] rounded-lg">
          {daysOfWeek[i]}
        </div>
      );
    }

    // Render empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 h-16"></div>);
    }

    // Render days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsByDate(day);
      const isToday = new Date().getDate() === day &&
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();

      const hasEvents = dayEvents.length > 0;

      days.push(
        <div
          key={`day-${day}`}
          className={`
            p-2 h-16 flex justify-center items-center relative
            ${hasEvents ? 'hover:bg-[#f5f0e8]/30 cursor-pointer' : ''}
            transition-colors
            ${hasEvents ? 'border border-[#d4a5a5] rounded-lg' : 'border border-[#f5f0e8] rounded-lg'}
            ${isToday ? 'bg-[#d4a5a5] text-white' : ''}
          `}
          onClick={() => hasEvents ? handleViewDateEvents(day) : null}
        >
          <span className={`text-lg font-mono ${isToday ? 'font-bold text-white' : 'text-[#3a3226]'}`}>
            {day.toString().padStart(2, '0')}
          </span>

          {hasEvents && !isToday && (
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-[#d4a5a5] rounded-full"></div>
          )}
        </div>
      );
    }

    return days;
  };
  return (
    <div>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
            Calendar
          </h1>
          <p className="text-[#7a7067]">
            View your team's schedule
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {isAdmin() && (
            <button
              className="flex items-center px-6 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors"
              onClick={() => handleAddEventClick(new Date())}
            >
              <span>Add new Event</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events Section */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] mb-6">
            Upcoming Events
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-[#7a7067]">Loading events...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {getUpcomingEvents().length === 0 ? (
                <div className="text-[#7a7067] text-center py-8">No upcoming events</div>
              ) : (
                getUpcomingEvents().map(event => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg bg-[#f5f0e8] hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-[#3a3226]">{event.title}</h3>
                        <p className="text-sm text-[#7a7067] mt-1">
                          {event.description && event.description.length > 60
                            ? `${event.description.substring(0, 60)}...`
                            : event.description}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-md text-xs ${getEventTypeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </div>
                    </div>
                    <div className="flex items-center mt-3 text-sm text-[#7a7067]">
                      <span className="mr-4">{formatEventDate(event.date)}</span>
                      <span>{formatEventTime(event.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] mb-6">
            Calendar
          </h2>

          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="border border-[#f5f0e8] rounded-lg px-4 py-2 text-[#3a3226] font-mono">
                {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}
              </div>
              <div className="flex space-x-2">
                <button
                  className="p-2 rounded-lg border border-[#f5f0e8] text-[#3a3226] hover:bg-[#f5f0e8] transition-colors"
                  onClick={prevMonth}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-lg border border-[#f5f0e8] text-[#3a3226] hover:bg-[#f5f0e8] transition-colors"
                  onClick={nextMonth}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-[#7a7067]">Loading events...</div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && selectedDate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setHasMeetingLink(false);
              setMeetingLink('');
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-6 animate-scaleIn shadow-lg modal-content overflow-y-auto max-h-[90vh]">
            {/* Modal Header with styled background */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#f5f0e8]">
              <h2 className="font-['Caveat',_cursive] text-2xl md:text-3xl text-[#3a3226]">
                Add New Event
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setHasMeetingLink(false);
                  setMeetingLink('');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#7a7067] hover:text-[#3a3226] hover:bg-[#f5f0e8] transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-6">
              {/* Main form content with two-column layout on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Information */}
                <div className="space-y-5">
                  <div className="bg-[#f5f0e8]/30 p-4 rounded-lg border border-[#f5f0e8]">
                    <h3 className="text-[#3a3226] font-medium mb-4 text-sm uppercase tracking-wider">Event Details</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#3a3226] text-sm font-medium mb-2">
                          Event Title <span className="text-[#d4a5a5]">*</span>
                        </label>
                        <input
                          type="text"
                          name="title"
                          className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors"
                          placeholder="Enter event title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[#3a3226] text-sm font-medium mb-2">
                          Event Type <span className="text-[#d4a5a5]">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="type"
                            className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors"
                            required
                          >
                            <option value="">Select event type</option>
                            <option value="meeting">Meeting</option>
                            <option value="task">Task</option>
                            <option value="deadline">Deadline</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7a7067]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f5f0e8]/30 p-4 rounded-lg border border-[#f5f0e8]">
                    <h3 className="text-[#3a3226] font-medium mb-4 text-sm uppercase tracking-wider">Date & Time</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#3a3226] text-sm font-medium mb-2">
                          Date <span className="text-[#d4a5a5]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            name="eventDate"
                            className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            defaultValue={selectedDate.toISOString().split('T')[0]}
                            required
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#7a7067]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#3a3226] text-sm font-medium mb-2">
                          Start Time
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            name="startTime"
                            className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#7a7067]">
                            <ClockIcon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Assignee and Notes */}
                <div className="space-y-5">
                  <div className="bg-[#f5f0e8]/30 p-4 rounded-lg border border-[#f5f0e8]">
                    <h3 className="text-[#3a3226] font-medium mb-4 text-sm uppercase tracking-wider">Assignee</h3>

                    {loadingTeamMembers ? (
                      <div className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg flex items-center justify-center">
                        <Loader2Icon className="h-5 w-5 text-[#d4a5a5] animate-spin mr-2" />
                        <span>Loading team members...</span>
                      </div>
                    ) : teamMemberError ? (
                      <div className="bg-[#f9e9e9] text-[#d4a5a5] w-full px-4 py-3 rounded-lg border border-[#d4a5a5] flex items-start">
                        <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm">{teamMemberError}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {teamMembers.length === 0 ? (
                          <div className="bg-white border border-[#f5f0e8] text-[#7a7067] w-full px-4 py-3 rounded-lg flex items-center">
                            <UserIcon className="h-5 w-5 mr-2" />
                            <span>No team members available.</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              name="assignee"
                              value={selectedAssignee}
                              onChange={(e) => setSelectedAssignee(e.target.value)}
                              className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors"
                            >
                              <option value="">None</option>
                              {teamMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name} {member.role === 'admin' ? '(Admin)' : ''}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7a7067]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Selected Assignee Preview */}
                        {selectedAssignee && (
                          <div className="flex items-center p-3 bg-white rounded-lg mt-3 border border-[#f5f0e8] hover:border-[#d4a5a5]/50 transition-colors">
                            <Avatar
                              src={teamMembers.find(m => m.id === selectedAssignee)?.avatar}
                              alt={teamMembers.find(m => m.id === selectedAssignee)?.name || ''}
                              size="md"
                              className="mr-3"
                            />
                            <div>
                              <p className="text-[#3a3226] font-medium">
                                {teamMembers.find(m => m.id === selectedAssignee)?.name}
                              </p>
                              <p className="text-xs text-[#7a7067] capitalize flex items-center">
                                {teamMembers.find(m => m.id === selectedAssignee)?.role === 'admin' ? (
                                  <>
                                    <span className="inline-block w-2 h-2 rounded-full bg-[#d4a5a5] mr-1"></span>
                                    Administrator
                                  </>
                                ) : (
                                  <>
                                    <span className="inline-block w-2 h-2 rounded-full bg-[#7a7067] mr-1"></span>
                                    Team Member
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#f5f0e8]/30 p-4 rounded-lg border border-[#f5f0e8]">
                    <h3 className="text-[#3a3226] font-medium mb-4 text-sm uppercase tracking-wider">Notes</h3>

                    <textarea
                      name="notes"
                      className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors min-h-[150px] resize-y"
                      placeholder="Add any additional notes about this event..."
                    ></textarea>
                  </div>

                  {/* Meeting Link Section */}
                  <div className="bg-[#f5f0e8]/30 p-4 rounded-lg border border-[#f5f0e8]">
                    <h3 className="text-[#3a3226] font-medium mb-4 text-sm uppercase tracking-wider">Meeting Link</h3>

                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasMeetingLink"
                          checked={hasMeetingLink}
                          onChange={(e) => setHasMeetingLink(e.target.checked)}
                          className="w-4 h-4 text-[#d4a5a5] border-[#f5f0e8] rounded focus:ring-[#d4a5a5]"
                        />
                        <label htmlFor="hasMeetingLink" className="ml-2 text-[#3a3226] text-sm font-medium">
                          Has Meeting Link
                        </label>
                      </div>

                      {hasMeetingLink && (
                        <div>
                          <label className="block text-[#3a3226] text-sm font-medium mb-2">
                            Meeting URL
                          </label>
                          <input
                            type="url"
                            name="meetingLink"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            className="bg-white border border-[#f5f0e8] text-[#3a3226] w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5] focus:border-[#d4a5a5] hover:border-[#d4a5a5]/50 transition-colors"
                            placeholder="https://zoom.us/j/123456789"
                            required={hasMeetingLink}
                          />
                          <p className="text-xs text-[#7a7067] mt-1">
                            Enter the full URL for Zoom, Google Meet, Microsoft Teams, etc.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-[#f5f0e8] mt-6">
                <button
                  type="button"
                  className="px-6 py-3 text-[#7a7067] bg-[#f5f0e8] rounded-lg hover:bg-[#ebe6de] transition-colors font-medium"
                  onClick={() => {
                    setIsModalOpen(false);
                    setHasMeetingLink(false);
                    setMeetingLink('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors font-medium shadow-sm"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              closeEventDetailModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-title"
        >
          <div
            className={`bg-white rounded-2xl w-[95%] sm:w-auto sm:min-w-[400px] max-w-[500px] overflow-hidden shadow-xl ${
              isEventDetailClosing ? 'animate-fadeOut' : 'animate-scaleIn'
            } focus:outline-none`}
            tabIndex={0}
          >
            {/* Modal Header with Event Type */}
            <div className="relative">
              {/* Close button - absolute positioned */}
              <button
                onClick={closeEventDetailModal}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
                aria-label="Close event details"
              >
                <XIcon className="h-5 w-5" />
              </button>

              {/* Event type banner */}
              <div
                className={`w-full py-5 px-6 text-center ${
                  selectedEvent.type === 'deadline'
                    ? 'bg-[#d4a5a5] text-white'
                    : selectedEvent.type === 'meeting'
                    ? 'bg-[#f5f0e8] text-[#3a3226] border-b border-[#d4a5a5]'
                    : 'bg-[#f5f0e8] text-[#3a3226] border-b border-[#7a7067]'
                }`}
              >
                <span className="font-medium text-sm uppercase tracking-wider">
                  {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
              {/* Event Title */}
              <h2
                id="event-detail-title"
                className="font-medium text-xl md:text-2xl text-[#3a3226] mb-6 text-center"
              >
                {selectedEvent.title}
              </h2>

              {/* Time Display - Large and Centered */}
              <div className="bg-[#f5f0e8] rounded-xl p-5 sm:p-6 mb-6 text-center mx-auto max-w-[280px] shadow-md">
                <div className="text-[#7a7067] text-sm mb-3 font-medium">
                  {formatEventDate(selectedEvent.date)}
                </div>
                <div className="flex items-center justify-center">
                  {/* Split time into parts for better styling */}
                  {(() => {
                    const date = new Date(selectedEvent.date);
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const formattedHours = hours % 12 || 12;
                    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

                    return (
                      <>
                        <span className="text-[#3a3226] text-4xl font-mono font-bold">{formattedHours}</span>
                        <span className="text-[#3a3226] text-4xl font-mono font-bold mx-1">:</span>
                        <span className="text-[#3a3226] text-4xl font-mono font-bold">{formattedMinutes}</span>
                        <span className="text-[#3a3226] text-2xl font-mono font-bold ml-2">{ampm}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#f5f0e8] my-6"></div>

              {/* Event Details Section */}
              <div className="space-y-6">
                {/* Assignee Section */}
                {selectedEvent.assignee && (
                  <div className="bg-[#f5f0e8]/30 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-[#7a7067] text-sm mb-2 font-medium">Assigned to</div>
                    <div className="flex items-center">
                      <Avatar
                        src={selectedEvent.assignee.avatar}
                        alt={selectedEvent.assignee.name}
                        size="md"
                        className="mr-3 border-2 border-[#d4a5a5] rounded-full"
                      />
                      <span className="text-[#3a3226] font-medium">{selectedEvent.assignee.name}</span>
                    </div>
                  </div>
                )}

                {/* Description Section */}
                {selectedEvent.description && (
                  <div className="bg-[#f5f0e8]/30 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-[#7a7067] text-sm mb-2 font-medium">Description</div>
                    <p className="text-[#3a3226] leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Meeting Link Section */}
                {selectedEvent.meetingLink && (
                  <div className="bg-[#f5f0e8]/30 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="text-[#7a7067] text-sm mb-2 font-medium">Meeting Link</div>
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#d4a5a5] text-white rounded-lg hover:bg-[#c99595] transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                      Join Meeting
                    </a>
                    <p className="text-xs text-[#7a7067] mt-2 break-all">
                      {selectedEvent.meetingLink}
                    </p>
                  </div>
                )}

                {/* Event ID (for reference) */}
                <div className="text-[#7a7067] text-xs text-center mt-4">
                  Event ID: {selectedEvent.id}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-8 pt-4 border-t border-[#f5f0e8]">
                {/* Delete button (admin only) */}
                {isAdmin() && (
                  <button
                    className="px-4 py-3 bg-white border border-[#d4a5a5] text-[#d4a5a5] rounded-xl hover:bg-[#f9e9e9] transition-colors shadow-sm"
                    onClick={() => confirmDeleteEvent(selectedEvent.id, selectedEvent.title)}
                  >
                    Delete Event
                  </button>
                )}

                {/* Spacer div when admin to maintain layout */}
                {!isAdmin() && <div></div>}

                <button
                  className="px-6 py-3 bg-[#d4a5a5] text-white rounded-xl hover:bg-[#c99595] transition-colors font-medium shadow-sm"
                  onClick={closeEventDetailModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Events Modal (for dates with multiple events) */}
      {showDateEventsModal && selectedDateEvents.length > 0 && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 modal-overlay"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              closeDateEventsModal();
            }
          }}
        >
          <div
            className={`bg-white rounded-2xl w-full max-w-[95%] sm:max-w-md md:max-w-lg overflow-hidden shadow-xl ${
              isDateEventsModalClosing ? 'animate-fadeOut' : 'animate-scaleIn'
            }`}
          >
            <div className="relative">
              {/* Close button */}
              <button
                onClick={closeDateEventsModal}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 transition-colors"
                aria-label="Close events list"
              >
                <XIcon className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="w-full py-4 px-6 bg-[#f5f0e8] border-b border-[#d4a5a5]">
                <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] text-center">
                  {new Date(selectedDateEvents[0].date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <h3 className="text-[#7a7067] text-sm font-medium mb-4">
                {selectedDateEvents.length} events scheduled for this date
              </h3>

              <div className="space-y-4">
                {selectedDateEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl bg-[#f5f0e8] hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-[#d4a5a5]/30"
                    onClick={() => {
                      closeDateEventsModal();
                      setTimeout(() => {
                        handleEventClick(event);
                      }, 300);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-[#3a3226]">{event.title}</h4>
                      <div className={`px-3 py-1 rounded-full text-xs ${getEventTypeColor(event.type)}`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm text-[#7a7067]">
                        {formatEventTime(event.date)}
                      </div>

                      {event.assignee && (
                        <div className="flex items-center">
                          <Avatar
                            src={event.assignee.avatar}
                            alt={event.assignee.name}
                            size="sm"
                            className="mr-2 rounded-full"
                          />
                          <span className="text-xs text-[#7a7067]">{event.assignee.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  className="px-6 py-3 bg-[#d4a5a5] text-white rounded-xl hover:bg-[#c99595] transition-colors font-medium shadow-sm"
                  onClick={closeDateEventsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && eventToDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] modal-overlay"
          onClick={(e) => {
            // Close when clicking outside the modal
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setEventToDelete(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl w-[95%] sm:w-auto sm:min-w-[400px] max-w-[500px] p-6 shadow-xl animate-scaleIn">
            <div className="flex items-start mb-5">
              <div className="bg-[#f9e9e9] p-3 rounded-full mr-4 flex-shrink-0 shadow-sm">
                <XIcon className="h-6 w-6 text-[#d4a5a5]" />
              </div>
              <div>
                <h2 className="text-xl text-[#3a3226] font-medium mb-3">Confirm Delete</h2>
                <p className="text-[#7a7067] leading-relaxed">
                  Are you sure you want to delete the event <span className="font-medium text-[#3a3226]">"{eventToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-[#f5f0e8]">
              <button
                className="px-4 py-3 bg-[#f5f0e8] text-[#7a7067] rounded-xl hover:bg-[#ebe6de] transition-colors font-medium shadow-sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setEventToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-3 bg-[#d4a5a5] text-white rounded-xl hover:bg-[#c99595] transition-colors font-medium shadow-sm"
                onClick={handleDeleteEvent}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CalendarView;