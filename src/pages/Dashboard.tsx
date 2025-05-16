import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, BarChart3Icon, TrendingUpIcon, CalendarIcon, UsersIcon, Loader2Icon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchData } from '../firebase/database';

// Define interfaces for our data types
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  assignee: {
    name: string;
    avatar: string;
  };
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'meeting' | 'deadline';
  assignee?: {
    name: string;
    avatar: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'event' | 'team' | 'system';
  timestamp: string;
  read: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  // State for data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState({
    tasks: true,
    events: true
  });
  const [error, setError] = useState<string | null>(null);

  // Get first name only
  const firstName = user?.name.split(' ')[0] || 'User';

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch tasks from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Task[]>('tasks', (data) => {
      if (data) {
        setTasks(data);
      } else {
        setTasks([]);
      }
      setLoading(prev => ({ ...prev, tasks: false }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch events from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<Event[]>('events', (data) => {
      if (data) {
        setEvents(data);
      } else {
        setEvents([]);
      }
      setLoading(prev => ({ ...prev, events: false }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper functions for date handling
  const isToday = (dateString?: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isUpcoming = (dateString?: string, days: number = 7): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return date > today && date <= futureDate;
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 172800) return 'Yesterday';

    return date.toLocaleDateString();
  };

  const getDaysUntil = (dateString?: string): string => {
    if (!dateString) return 'No due date';

    const date = new Date(dateString);
    const today = new Date();

    // Reset time part for accurate day calculation
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffInTime = date.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

    if (diffInDays < 0) return 'Overdue';
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} days`;
    if (diffInDays < 30) return `In ${Math.floor(diffInDays / 7)} weeks`;

    return `In ${Math.floor(diffInDays / 30)} months`;
  };

  // Computed values for dashboard
  const stats = useMemo(() => {
    if (loading.tasks) return {
      completed: 0,
      inProgress: 0,
      upcoming: 0,
      productivity: 0
    };

    const completed = tasks.filter(task => task.status === 'done').length;
    const inProgress = tasks.filter(task => task.status === 'inProgress').length;
    const upcoming = tasks.filter(task => isUpcoming(task.dueDate, 7) && task.status !== 'done').length;

    // Calculate productivity (completed tasks as percentage of total)
    const totalTasks = tasks.length;
    const productivity = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return {
      completed,
      inProgress,
      upcoming,
      productivity
    };
  }, [tasks, loading.tasks]);

  // Get today's tasks
  const todaysTasks = useMemo(() => {
    if (loading.tasks) return [];

    return tasks
      .filter(task => isToday(task.dueDate) && task.status !== 'done')
      .sort((a, b) => {
        // Sort by priority (High > Medium > Low)
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 4); // Limit to 4 tasks
  }, [tasks, loading.tasks]);

  // Get upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    if (loading.tasks) return [];

    return tasks
      .filter(task => isUpcoming(task.dueDate) && task.status !== 'done')
      .sort((a, b) => {
        // Sort by due date (earliest first)
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 3); // Limit to 3 deadlines
  }, [tasks, loading.tasks]);

  // Get recent activity from notifications
  const recentActivity = useMemo(() => {
    return notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3); // Limit to 3 activities
  }, [notifications]);

  return <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="font-['Caveat',_cursive] text-3xl md:text-4xl text-[#3a3226] mb-2">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-[#7a7067]">
          Here's what's happening with your projects today.
        </p>
      </header>

      {/* Stats Section */}
      <section>
        {/* Mobile Stats Carousel */}
        <div className="overflow-x-auto pb-4 md:hidden">
          <div className="flex space-x-4 min-w-max px-1">
            {loading.tasks ? (
              // Loading skeleton for mobile stats
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-5 w-[200px] animate-pulse">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#f5f0e8] mr-3"></div>
                      <div className="h-4 bg-[#f5f0e8] rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-[#f5f0e8] rounded w-16 mb-2"></div>
                    <div className="h-3 bg-[#f5f0e8] rounded w-32"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-white rounded-xl p-5 w-[200px] shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-3">
                      <CheckCircleIcon className="h-5 w-5 text-[#7eb8ab]" />
                    </div>
                    <h3 className="text-[#3a3226] font-medium">Completed</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#3a3226]">{stats.completed}</p>
                  <p className="text-[#7a7067] text-sm mt-1">Tasks completed</p>
                </div>

                <div className="bg-white rounded-xl p-5 w-[200px] shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#f5eee8] flex items-center justify-center mr-3">
                      <ClockIcon className="h-5 w-5 text-[#d4a5a5]" />
                    </div>
                    <h3 className="text-[#3a3226] font-medium">In Progress</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#3a3226]">{stats.inProgress}</p>
                  <p className="text-[#7a7067] text-sm mt-1">Tasks in progress</p>
                </div>

                <div className="bg-white rounded-xl p-5 w-[200px] shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#e8ecf3] flex items-center justify-center mr-3">
                      <AlertCircleIcon className="h-5 w-5 text-[#8ca3d8]" />
                    </div>
                    <h3 className="text-[#3a3226] font-medium">Upcoming</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#3a3226]">{stats.upcoming}</p>
                  <p className="text-[#7a7067] text-sm mt-1">Tasks due soon</p>
                </div>

                <div className="bg-white rounded-xl p-5 w-[200px] shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f0e8] flex items-center justify-center mr-3">
                      <BarChart3Icon className="h-5 w-5 text-[#b8b87e]" />
                    </div>
                    <h3 className="text-[#3a3226] font-medium">Productivity</h3>
                  </div>
                  <p className="text-3xl font-bold text-[#3a3226]">{stats.productivity}%</p>
                  <p className="text-[#7a7067] text-sm mt-1">Completion rate</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop Stats Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {loading.tasks ? (
            // Loading skeleton for desktop stats
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#f5f0e8] mr-3"></div>
                    <div className="h-4 bg-[#f5f0e8] rounded w-24"></div>
                  </div>
                  <div className="h-8 bg-[#f5f0e8] rounded w-16 mb-2"></div>
                  <div className="h-3 bg-[#f5f0e8] rounded w-32"></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-3">
                    <CheckCircleIcon className="h-5 w-5 text-[#7eb8ab]" />
                  </div>
                  <h3 className="text-[#3a3226] font-medium">Completed</h3>
                </div>
                <p className="text-3xl font-bold text-[#3a3226]">{stats.completed}</p>
                <p className="text-[#7a7067] text-sm mt-1">Tasks completed</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#f5eee8] flex items-center justify-center mr-3">
                    <ClockIcon className="h-5 w-5 text-[#d4a5a5]" />
                  </div>
                  <h3 className="text-[#3a3226] font-medium">In Progress</h3>
                </div>
                <p className="text-3xl font-bold text-[#3a3226]">{stats.inProgress}</p>
                <p className="text-[#7a7067] text-sm mt-1">Tasks in progress</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#e8ecf3] flex items-center justify-center mr-3">
                    <AlertCircleIcon className="h-5 w-5 text-[#8ca3d8]" />
                  </div>
                  <h3 className="text-[#3a3226] font-medium">Upcoming</h3>
                </div>
                <p className="text-3xl font-bold text-[#3a3226]">{stats.upcoming}</p>
                <p className="text-[#7a7067] text-sm mt-1">Tasks due soon</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#f0f0e8] flex items-center justify-center mr-3">
                    <BarChart3Icon className="h-5 w-5 text-[#b8b87e]" />
                  </div>
                  <h3 className="text-[#3a3226] font-medium">Productivity</h3>
                </div>
                <p className="text-3xl font-bold text-[#3a3226]">{stats.productivity}%</p>
                <p className="text-[#7a7067] text-sm mt-1">Completion rate</p>
              </div>
            </>
          )}
        </div>
      </section>
      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="font-['Caveat',_cursive] text-xl md:text-2xl text-[#3a3226]">
            Recent Activity
          </h2>
          <Link to="/notifications" className="text-[#d4a5a5] font-medium text-sm md:text-base">View all</Link>
        </div>

        {recentActivity.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl p-5 md:p-6 text-center shadow-sm">
            <p className="text-[#7a7067]">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {recentActivity.map(activity => {
              // Determine icon based on notification type
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'task':
                    return <CheckCircleIcon className="h-5 w-5 text-[#7eb8ab]" />;
                  case 'event':
                    return <CalendarIcon className="h-5 w-5 text-[#d4a5a5]" />;
                  case 'team':
                    return <UsersIcon className="h-5 w-5 text-[#8ca3d8]" />;
                  case 'system':
                    return <AlertCircleIcon className="h-5 w-5 text-[#b8b87e]" />;
                  default:
                    return <TrendingUpIcon className="h-5 w-5 text-[#8ca3d8]" />;
                }
              };

              // Determine background color based on notification type
              const getActivityBg = (type: string) => {
                switch (type) {
                  case 'task':
                    return 'bg-[#e8f3f1]';
                  case 'event':
                    return 'bg-[#f5eee8]';
                  case 'team':
                    return 'bg-[#e8ecf3]';
                  case 'system':
                    return 'bg-[#f0f0e8]';
                  default:
                    return 'bg-[#e8ecf3]';
                }
              };

              return (
                <div key={activity.id} className="bg-white rounded-xl p-4 flex items-start md:items-center shadow-sm">
                  <div className={`w-10 h-10 rounded-full ${getActivityBg(activity.type)} flex items-center justify-center mr-3 md:mr-4 flex-shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#3a3226] font-medium text-sm md:text-base truncate">{activity.title}</p>
                    <p className="text-[#7a7067] text-xs md:text-sm line-clamp-2">{activity.message}</p>
                  </div>
                  <p className="text-[#7a7067] text-xs md:text-sm ml-2 whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's Tasks */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="font-['Caveat',_cursive] text-xl md:text-2xl text-[#3a3226]">
            Today's Tasks
          </h2>
          <Link to="/taskboard" className="text-[#d4a5a5] font-medium text-sm md:text-base">View all</Link>
        </div>

        {loading.tasks ? (
          // Loading skeleton for tasks
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse shadow-sm">
                <div className="h-5 bg-[#f5f0e8] rounded w-3/4 mb-4"></div>
                <div className="flex items-center mb-4">
                  <div className="h-4 bg-[#f5f0e8] rounded w-24 mr-4"></div>
                  <div className="h-4 bg-[#f5f0e8] rounded w-16"></div>
                </div>
                <div className="h-2 bg-[#f5f0e8] rounded-full mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#f5f0e8] mr-2"></div>
                    <div className="h-3 bg-[#f5f0e8] rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-[#f5f0e8] rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : todaysTasks.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl p-5 md:p-6 text-center shadow-sm">
            <p className="text-[#7a7067] mb-4">No tasks due today</p>
            <Link
              to="/taskboard"
              className="inline-block px-4 py-3 bg-[#d4a5a5] text-white rounded-lg"
            >
              View all tasks
            </Link>
          </div>
        ) : (
          // Mobile: Horizontal scroll for tasks, Desktop: Grid
          <>
            {/* Mobile Task Scroll */}
            <div className="md:hidden overflow-x-auto pb-4">
              <div className="flex space-x-4 min-w-max px-1">
                {todaysTasks.map(task => {
                  // Format due date for display
                  const formatDueDate = (dateString?: string) => {
                    if (!dateString) return 'No due date';

                    const date = new Date(dateString);
                    const hours = date.getHours();
                    const minutes = date.getMinutes();

                    // Format time as 12-hour with AM/PM
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
                    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

                    return `Today, ${formattedHours}:${formattedMinutes} ${ampm}`;
                  };

                  return (
                    <div
                      key={task.id}
                      className="w-[280px] flex-shrink-0"
                      onClick={() => navigate(`/taskboard?task=${task.id}`)}
                    >
                      <TaskCard
                        title={task.title}
                        dueDate={formatDueDate(task.dueDate)}
                        priority={task.priority}
                        assignee={task.assignee}
                        progress={task.progress || 0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Task Grid */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              {todaysTasks.map(task => {
                // Format due date for display
                const formatDueDate = (dateString?: string) => {
                  if (!dateString) return 'No due date';

                  const date = new Date(dateString);
                  const hours = date.getHours();
                  const minutes = date.getMinutes();

                  // Format time as 12-hour with AM/PM
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
                  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

                  return `Today, ${formattedHours}:${formattedMinutes} ${ampm}`;
                };

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/taskboard?task=${task.id}`)}
                  >
                    <TaskCard
                      title={task.title}
                      dueDate={formatDueDate(task.dueDate)}
                      priority={task.priority}
                      assignee={task.assignee}
                      progress={task.progress || 0}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
      {/* Upcoming Deadlines */}
      <section>
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="font-['Caveat',_cursive] text-xl md:text-2xl text-[#3a3226]">
            Upcoming Deadlines
          </h2>
          <Link to="/calendar" className="text-[#d4a5a5] font-medium text-sm md:text-base">View calendar</Link>
        </div>

        {loading.tasks ? (
          // Loading skeleton for deadlines
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#f5f0e8] mr-3 md:mr-4 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-[#f5f0e8] rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#f5f0e8] rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-[#f5f0e8] rounded w-12 ml-2 flex-shrink-0"></div>
                </div>
              ))}
            </div>
          </div>
        ) : upcomingDeadlines.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl p-5 md:p-6 text-center shadow-sm">
            <p className="text-[#7a7067]">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 md:p-6 space-y-4">
              {upcomingDeadlines.map(task => {
                // Determine background color based on priority
                const getPriorityBg = (priority: string) => {
                  switch (priority) {
                    case 'High':
                      return 'bg-[#f5eee8]';
                    case 'Medium':
                      return 'bg-[#f0f0e8]';
                    case 'Low':
                      return 'bg-[#e8f3f1]';
                    default:
                      return 'bg-[#e8ecf3]';
                  }
                };

                // Determine icon color based on priority
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'High':
                      return 'text-[#d4a5a5]';
                    case 'Medium':
                      return 'text-[#b8b87e]';
                    case 'Low':
                      return 'text-[#7eb8ab]';
                    default:
                      return 'text-[#8ca3d8]';
                  }
                };

                return (
                  <div key={task.id} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full ${getPriorityBg(task.priority)} flex items-center justify-center mr-3 md:mr-4 flex-shrink-0`}>
                      <CalendarIcon className={`h-5 w-5 ${getPriorityColor(task.priority)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#3a3226] font-medium text-sm md:text-base truncate">
                        {task.title}
                      </p>
                      <p className="text-[#7a7067] text-xs md:text-sm">{getDaysUntil(task.dueDate)}</p>
                    </div>
                    <button
                      className="ml-2 px-3 py-1.5 bg-[#f5f0e8] hover:bg-[#f5eee8] text-[#d4a5a5] rounded-lg text-sm flex-shrink-0 transition-colors"
                      onClick={() => navigate(`/taskboard?task=${task.id}`)}
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>;
};
export default Dashboard;