import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
  BuildingIcon,
  DownloadIcon,
  BarChart3Icon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Avatar from './Avatar';
import NotificationAlert from './NotificationAlert';

const Layout = () => {
  const {
    user,
    logout,
    isAdmin
  } = useAuth();
  const { unseenCount } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only close if sidebar is open and we're on mobile
      if (isSidebarOpen && window.innerWidth < 768) {
        // Check if click is outside the sidebar
        const sidebar = document.getElementById('sidebar');
        const menuButton = document.getElementById('menu-button');
        if (
          sidebar &&
          !sidebar.contains(target) &&
          menuButton &&
          !menuButton.contains(target)
        ) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get current page title for mobile header
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/taskboard')) return 'Task Board';
    if (path.includes('/calendar')) return 'Calendar';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/leads')) return 'Lead Management';
    if (path.includes('/team')) return 'Team Management';
    if (path.includes('/progress')) return 'Progress Tracker';
    return 'Toiral Task Board';
  };

  return (
    <div className="flex min-h-screen bg-[#f5f0e8] relative">
      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-20 md:hidden flex items-center px-4">
        <button
          id="menu-button"
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] active:bg-[#f5f0e8] transition-all duration-200 mr-2 border border-transparent hover:border-[#f5f0e8]"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ?
            <XIcon className="h-6 w-6 text-[#3a3226]" /> :
            <MenuIcon className="h-6 w-6 text-[#3a3226]" />
          }
        </button>
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center">
            <img
              src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
              alt="Toiral Task Board"
              className="h-8"
            />
            <span className="text-xs font-medium text-[#7a7067] mt-1">{getCurrentPageTitle()}</span>
          </div>
        </div>
        <NavLink to="/notifications" className="w-12 h-12 flex items-center justify-center relative rounded-full hover:bg-[#f5f0e8] active:bg-[#f5f0e8] transition-all duration-200 border border-transparent hover:border-[#f5f0e8]">
          <BellIcon className="h-6 w-6 text-[#7a7067]" />
          {unseenCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-[#d4a5a5] text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {unseenCount}
            </span>
          )}
        </NavLink>
      </div>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed z-40 h-full w-[280px] sm:w-[320px] md:w-64 bg-white shadow-lg transition-all duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } pt-16 md:pt-0 overflow-hidden`}
      >
        <div className="p-6 flex flex-col h-full overflow-y-auto overscroll-contain">
          <div className="mb-10 hidden md:block">
            <img
              src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
              alt="Toiral Task Board"
              className="h-12"
            />
          </div>
          <nav className="flex-1">
            <ul className="space-y-4">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({isActive}) => `
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <LayoutDashboardIcon className="h-6 w-6 mr-3" />
                  <span className="text-base">Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/taskboard"
                  className={({isActive}) => `
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <ClipboardListIcon className="h-6 w-6 mr-3" />
                  <span className="text-base">Task Board</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/calendar"
                  className={({isActive}) => `
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <CalendarIcon className="h-6 w-6 mr-3" />
                  <span className="text-base">Calendar</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/notifications"
                  className={({isActive}) => `
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <BellIcon className="h-6 w-6 mr-3" />
                  <span className="text-base">Notifications</span>
                  {unseenCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-[#d4a5a5] text-white text-xs rounded-full flex items-center justify-center min-w-[24px] animate-pulse">
                      {unseenCount}
                    </span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/leads"
                  className={({isActive}) => `
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <BuildingIcon className="h-6 w-6 mr-3" />
                  <span className="text-base">Lead Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/progress"
                  className={({isActive}) => `
                    flex items-center p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <BarChart3Icon className="h-6 w-6 mr-3" />
                  <span className="text-base">Progress Tracker</span>
                </NavLink>
              </li>
              {isAdmin() && (
                <li>
                  <NavLink
                    to="/team"
                    className={({isActive}) => `
                      flex items-center p-4 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                        : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                    `}
                  >
                    <UsersIcon className="h-6 w-6 mr-3" />
                    <span className="text-base">Team Management</span>
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          <div className="mt-auto pt-4">
            <div className="p-4 border-t border-[#f5f0e8]">
              <div className="flex items-center">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name}
                  size="sm"
                  className="mr-3"
                />
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

            <NavLink
              to="/"
              onClick={logout}
              className="flex items-center p-4 rounded-lg text-[#7a7067] hover:bg-[#f5f0e8]/50 hover:text-[#3a3226] transition-all duration-200"
            >
              <LogOutIcon className="h-6 w-6 mr-3" />
              <span className="text-base">Logout</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pt-16 md:pt-6 p-4 sm:p-6 md:p-10 md:ml-64 overflow-y-auto transition-all duration-300">
        <Outlet />
        {user && <NotificationAlert />}
      </main>
    </div>
  );
};

export default Layout;