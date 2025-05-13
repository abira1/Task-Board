import React from 'react';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon, BarChart3Icon, TrendingUpIcon, CalendarIcon, UsersIcon } from 'lucide-react';
import TaskCard from '../components/TaskCard';
const Dashboard = () => {
  return <div className="space-y-8">
      <header>
        <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
          Good morning, Emma!
        </h1>
        <p className="text-[#7a7067]">
          Here's what's happening with your projects today.
        </p>
      </header>
      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-3">
              <CheckCircleIcon className="h-5 w-5 text-[#7eb8ab]" />
            </div>
            <h3 className="text-[#3a3226] font-medium">Completed</h3>
          </div>
          <p className="text-3xl font-bold text-[#3a3226]">24</p>
          <p className="text-[#7a7067] text-sm mt-1">Tasks this month</p>
        </div>
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#f5eee8] flex items-center justify-center mr-3">
              <ClockIcon className="h-5 w-5 text-[#d4a5a5]" />
            </div>
            <h3 className="text-[#3a3226] font-medium">In Progress</h3>
          </div>
          <p className="text-3xl font-bold text-[#3a3226]">12</p>
          <p className="text-[#7a7067] text-sm mt-1">Tasks in progress</p>
        </div>
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#e8ecf3] flex items-center justify-center mr-3">
              <AlertCircleIcon className="h-5 w-5 text-[#8ca3d8]" />
            </div>
            <h3 className="text-[#3a3226] font-medium">Upcoming</h3>
          </div>
          <p className="text-3xl font-bold text-[#3a3226]">8</p>
          <p className="text-[#7a7067] text-sm mt-1">Tasks due soon</p>
        </div>
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#f0f0e8] flex items-center justify-center mr-3">
              <BarChart3Icon className="h-5 w-5 text-[#b8b87e]" />
            </div>
            <h3 className="text-[#3a3226] font-medium">Productivity</h3>
          </div>
          <p className="text-3xl font-bold text-[#3a3226]">87%</p>
          <p className="text-[#7a7067] text-sm mt-1">Completion rate</p>
        </div>
      </section>
      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            Recent Activity
          </h2>
          <button className="text-[#d4a5a5] font-medium">View all</button>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-4">
              <CheckCircleIcon className="h-5 w-5 text-[#7eb8ab]" />
            </div>
            <div className="flex-1">
              <p className="text-[#3a3226] font-medium">Website Redesign</p>
              <p className="text-[#7a7067] text-sm">Alex completed the task</p>
            </div>
            <p className="text-[#7a7067] text-sm">2 hours ago</p>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#f5eee8] flex items-center justify-center mr-4">
              <UsersIcon className="h-5 w-5 text-[#d4a5a5]" />
            </div>
            <div className="flex-1">
              <p className="text-[#3a3226] font-medium">Team Meeting</p>
              <p className="text-[#7a7067] text-sm">New meeting scheduled</p>
            </div>
            <p className="text-[#7a7067] text-sm">4 hours ago</p>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#e8ecf3] flex items-center justify-center mr-4">
              <TrendingUpIcon className="h-5 w-5 text-[#8ca3d8]" />
            </div>
            <div className="flex-1">
              <p className="text-[#3a3226] font-medium">Marketing Campaign</p>
              <p className="text-[#7a7067] text-sm">
                Sarah updated the progress
              </p>
            </div>
            <p className="text-[#7a7067] text-sm">Yesterday</p>
          </div>
        </div>
      </section>
      {/* Today's Tasks */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            Today's Tasks
          </h2>
          <button className="text-[#d4a5a5] font-medium">View all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TaskCard title="Finalize brand guidelines" dueDate="Today, 2:00 PM" priority="High" assignee={{
          name: 'Alex Kim',
          avatar: 'https://i.pravatar.cc/150?img=11'
        }} progress={75} />
          <TaskCard title="Review homepage mockups" dueDate="Today, 4:00 PM" priority="Medium" assignee={{
          name: 'Jordan Lee',
          avatar: 'https://i.pravatar.cc/150?img=32'
        }} progress={40} />
          <TaskCard title="Client presentation prep" dueDate="Today, 5:30 PM" priority="High" assignee={{
          name: 'Emma Chen',
          avatar: 'https://i.pravatar.cc/150?img=5'
        }} progress={20} />
          <TaskCard title="Weekly team check-in" dueDate="Today, 3:00 PM" priority="Low" assignee={{
          name: 'Team',
          avatar: 'https://i.pravatar.cc/150?img=68'
        }} progress={0} />
        </div>
      </section>
      {/* Upcoming Deadlines */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            Upcoming Deadlines
          </h2>
        </div>
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#f5eee8] flex items-center justify-center mr-4">
                <CalendarIcon className="h-5 w-5 text-[#d4a5a5]" />
              </div>
              <div className="flex-1">
                <p className="text-[#3a3226] font-medium">
                  Social Media Campaign
                </p>
                <p className="text-[#7a7067] text-sm">Due in 2 days</p>
              </div>
              <button className="text-[#d4a5a5]">View</button>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#e8f3f1] flex items-center justify-center mr-4">
                <CalendarIcon className="h-5 w-5 text-[#7eb8ab]" />
              </div>
              <div className="flex-1">
                <p className="text-[#3a3226] font-medium">
                  Client Website Launch
                </p>
                <p className="text-[#7a7067] text-sm">Due in 5 days</p>
              </div>
              <button className="text-[#d4a5a5]">View</button>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#e8ecf3] flex items-center justify-center mr-4">
                <CalendarIcon className="h-5 w-5 text-[#8ca3d8]" />
              </div>
              <div className="flex-1">
                <p className="text-[#3a3226] font-medium">Quarterly Report</p>
                <p className="text-[#7a7067] text-sm">Due in 1 week</p>
              </div>
              <button className="text-[#d4a5a5]">View</button>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default Dashboard;