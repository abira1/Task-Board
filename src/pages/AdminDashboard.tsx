import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  CalendarIcon,
  BarChart3Icon
} from 'lucide-react';
import { fetchData } from '../firebase/database';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inProgress' | 'done';
  assignee: {
    name: string;
    avatar: string;
  };
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    tasks: true
  });

  // Fetch users
  useEffect(() => {
    const unsubscribe = fetchData<User[]>('users', (data) => {
      if (data) {
        setUsers(data);
      } else {
        setUsers([]);
      }
      setLoading(prev => ({ ...prev, users: false }));
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch tasks
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

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(user => user.role === 'admin').length,
    teamMembers: users.filter(user => user.role === 'team_member').length,
    completedTasks: tasks.filter(task => task.status === 'done').length,
    inProgressTasks: tasks.filter(task => task.status === 'inProgress').length,
    todoTasks: tasks.filter(task => task.status === 'todo').length,
    totalTasks: tasks.length
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
          Admin Dashboard
        </h1>
        <p className="text-[#7a7067]">
          Manage your team and monitor project progress
        </p>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading.users || loading.tasks ? (
          // Loading skeleton for stats
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-3">
                  <UsersIcon className="h-5 w-5 text-[#7eb8ab]" />
                </div>
                <h3 className="text-[#3a3226] font-medium">Team Members</h3>
              </div>
              <p className="text-3xl font-bold text-[#3a3226]">{stats.totalUsers}</p>
              <p className="text-[#7a7067] text-sm mt-1">
                {stats.adminUsers} admins, {stats.teamMembers} members
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-3">
                  <CheckCircleIcon className="h-5 w-5 text-[#7eb8ab]" />
                </div>
                <h3 className="text-[#3a3226] font-medium">Completed Tasks</h3>
              </div>
              <p className="text-3xl font-bold text-[#3a3226]">{stats.completedTasks}</p>
              <p className="text-[#7a7067] text-sm mt-1">
                {Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}% completion rate
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#f5eee8] flex items-center justify-center mr-3">
                  <ClockIcon className="h-5 w-5 text-[#d4a5a5]" />
                </div>
                <h3 className="text-[#3a3226] font-medium">In Progress</h3>
              </div>
              <p className="text-3xl font-bold text-[#3a3226]">{stats.inProgressTasks}</p>
              <p className="text-[#7a7067] text-sm mt-1">
                Tasks currently in progress
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#e8ecf3] flex items-center justify-center mr-3">
                  <BarChart3Icon className="h-5 w-5 text-[#8ca3d8]" />
                </div>
                <h3 className="text-[#3a3226] font-medium">Total Tasks</h3>
              </div>
              <p className="text-3xl font-bold text-[#3a3226]">{stats.totalTasks}</p>
              <p className="text-[#7a7067] text-sm mt-1">
                {stats.todoTasks} to do, {stats.inProgressTasks} in progress
              </p>
            </div>
          </>
        )}
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl p-6">
        <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="flex items-center p-4 bg-[#f5f0e8] rounded-lg hover:bg-[#f5eee8] transition-colors"
            onClick={() => window.location.href = '/admin/team-management'}
          >
            <UsersIcon className="h-5 w-5 text-[#d4a5a5] mr-3" />
            <span className="text-[#3a3226]">Manage Team</span>
          </button>
          
          <button 
            className="flex items-center p-4 bg-[#f5f0e8] rounded-lg hover:bg-[#f5eee8] transition-colors"
            onClick={() => window.location.href = '/task-board'}
          >
            <ClockIcon className="h-5 w-5 text-[#d4a5a5] mr-3" />
            <span className="text-[#3a3226]">View Tasks</span>
          </button>
          
          <button 
            className="flex items-center p-4 bg-[#f5f0e8] rounded-lg hover:bg-[#f5eee8] transition-colors"
            onClick={() => window.location.href = '/calendar'}
          >
            <CalendarIcon className="h-5 w-5 text-[#d4a5a5] mr-3" />
            <span className="text-[#3a3226]">View Calendar</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
