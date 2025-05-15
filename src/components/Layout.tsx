import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  UsersIcon,
  CalendarIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  BellIcon,
  UserIcon,
  BuildingIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Avatar from './Avatar';
const Layout = () => {
  const {
    user,
    logout,
    isAdmin
  } = useAuth();
  const { unreadCount } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return <div className="flex min-h-screen bg-[#f5f0e8]">
      {/* Mobile menu button */}
      <button className="fixed top-4 left-4 z-50 p-2 rounded-full bg-[#e7d9c9] md:hidden" onClick={toggleSidebar}>
        {isSidebarOpen ? <XIcon className="h-6 w-6 text-[#3a3226]" /> : <MenuIcon className="h-6 w-6 text-[#3a3226]" />}
      </button>
      {/* Sidebar */}
      <aside className={`fixed md:static z-40 h-full w-64 bg-white transition-all duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="mb-10">
            <img src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png" alt="Toiral Task Board" className="h-12" />
          </div>
          <nav className="flex-1">
            <ul className="space-y-4">
              <li>
                <NavLink to="/dashboard" className={({
                isActive
              }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-[#f5f0e8] text-[#3a3226]' : 'hover:bg-[#f5f0e8] text-[#7a7067]'}`}>
                  <LayoutDashboardIcon className="h-5 w-5 mr-3" />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/taskboard" className={({
                isActive
              }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-[#f5f0e8] text-[#3a3226]' : 'hover:bg-[#f5f0e8] text-[#7a7067]'}`}>
                  <ClipboardListIcon className="h-5 w-5 mr-3" />
                  <span>Task Board</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/calendar" className={({
                isActive
              }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-[#f5f0e8] text-[#3a3226]' : 'hover:bg-[#f5f0e8] text-[#7a7067]'}`}>
                  <CalendarIcon className="h-5 w-5 mr-3" />
                  <span>Calendar</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/notifications" className={({
                isActive
              }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-[#f5f0e8] text-[#3a3226]' : 'hover:bg-[#f5f0e8] text-[#7a7067]'}`}>
                  <BellIcon className="h-5 w-5 mr-3" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[#d4a5a5] text-white text-xs rounded-full flex items-center justify-center min-w-[20px]">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink to="/leads" className={({
                isActive
              }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-[#f5f0e8] text-[#3a3226]' : 'hover:bg-[#f5f0e8] text-[#7a7067]'}`}>
                  <BuildingIcon className="h-5 w-5 mr-3" />
                  <span>Lead Management</span>
                </NavLink>
              </li>
              {isAdmin() && <li>
                  <NavLink to="/team" className={({
                isActive
              }) => `flex items-center p-3 rounded-lg transition-colors ${isActive ? 'bg-[#f5f0e8] text-[#3a3226]' : 'hover:bg-[#f5f0e8] text-[#7a7067]'}`}>
                    <UsersIcon className="h-5 w-5 mr-3" />
                    <span>Team Management</span>
                  </NavLink>
                </li>}
            </ul>
          </nav>
          <div className="mt-auto">
            <div className="p-4 border-t border-[#f5f0e8]">
              <div className="flex items-center">
                <Avatar src={user?.avatar} alt={user?.name} size="sm" className="mr-3" />
                <div>
                  <p className="text-sm font-medium text-[#3a3226]">
                    {user?.name}
                  </p>
                  <p className="text-xs text-[#7a7067] capitalize">
                    {user?.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
            <NavLink to="/" onClick={logout} className="flex items-center p-3 rounded-lg text-[#7a7067] hover:bg-[#f5f0e8] transition-colors">
              <LogOutIcon className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </NavLink>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>;
};
export default Layout;