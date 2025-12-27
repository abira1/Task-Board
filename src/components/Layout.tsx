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
  BuildingIcon,
  BarChart3Icon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Avatar from './Avatar';
import NotificationAlert from './NotificationAlert';
import BottomNavigation from './BottomNavigation';

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
      <div className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white shadow-md z-20 md:hidden flex items-center px-3">
        <button
          id="menu-button"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f5f0e8] active:bg-[#f5f0e8] transition-all duration-200 mr-2 border border-transparent hover:border-[#f5f0e8]"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {isSidebarOpen ?
            <XIcon className="h-5 w-5 text-[#3a3226]" /> :
            <MenuIcon className="h-5 w-5 text-[#3a3226]" />
          }
        </button>
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center">
            <img
              src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
              alt="Toiral Task Board"
              className="h-6"
            />
            <span className="text-[10px] font-medium text-[#7a7067] mt-0.5 compact-mobile">{getCurrentPageTitle()}</span>
          </div>
        </div>
        <NavLink to="/notifications" className="w-10 h-10 flex items-center justify-center relative rounded-full hover:bg-[#f5f0e8] active:bg-[#f5f0e8] transition-all duration-200 border border-transparent hover:border-[#f5f0e8]">
          <BellIcon className="h-5 w-5 text-[#7a7067]" />
          {unseenCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#d4a5a5] text-white text-[10px] rounded-full flex items-center justify-center animate-pulse font-medium">
              {unseenCount > 9 ? '9+' : unseenCount}
            </span>
          )}
        </NavLink>
      </div>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed z-40 h-full w-[260px] sm:w-[280px] md:w-64 bg-white shadow-lg transition-all duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } pt-14 md:pt-0 overflow-hidden`}
      >
        <div className="p-4 md:p-6 flex flex-col h-full overflow-y-auto overscroll-contain">
          <div className="mb-6 md:mb-10 hidden md:block">
            <img
              src="https://i.postimg.cc/L8dT1dnX/Toiral-Task-Board-Logo.png"
              alt="Toiral Task Board"
              className="h-12"
            />
          </div>
          <nav className="flex-1">
            <ul className="space-y-2 md:space-y-4">
              {/* Main Section */}
              <li className="mb-1 md:mb-2">
                <h3 className="text-[10px] md:text-xs font-semibold text-[#7a7067] uppercase tracking-wider px-3 md:px-4 compact-mobile">
                  Main
                </h3>
              </li>
              <li>
                <NavLink
                  to="/dashboard"
                  className={({isActive}) => `
                    flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <LayoutDashboardIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  <span className="text-sm md:text-base">Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/taskboard"
                  className={({isActive}) => `
                    flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <ClipboardListIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  <span className="text-sm md:text-base">Task Board</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/calendar"
                  className={({isActive}) => `
                    flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  <span className="text-sm md:text-base">Calendar</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/notifications"
                  className={({isActive}) => `
                    flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <BellIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  <span className="text-sm md:text-base">Notifications</span>
                  {unseenCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-[#d4a5a5] text-white text-[10px] md:text-xs rounded-full flex items-center justify-center min-w-[20px] md:min-w-[24px] animate-pulse font-medium">
                      {unseenCount > 9 ? '9+' : unseenCount}
                    </span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/leads"
                  className={({isActive}) => `
                    flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <BuildingIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  <span className="text-sm md:text-base">Lead Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/progress"
                  className={({isActive}) => `
                    flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                      : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                  `}
                >
                  <BarChart3Icon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                  <span className="text-sm md:text-base">Progress Tracker</span>
                </NavLink>
              </li>

              {/* Admin Section */}
              <li className="mt-6 md:mt-8 mb-1 md:mb-2">
                <h3 className="text-[10px] md:text-xs font-semibold text-[#7a7067] uppercase tracking-wider px-3 md:px-4 compact-mobile">
                  Administration
                </h3>
              </li>
              {isAdmin() && (
                <li>
                  <NavLink
                    to="/team"
                    className={({isActive}) => `
                      flex items-center p-3 md:p-4 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-[#f5f0e8] text-[#3a3226] font-medium shadow-sm border-l-4 border-[#d4a5a5]'
                        : 'hover:bg-[#f5f0e8]/50 text-[#7a7067] hover:text-[#3a3226]'}
                    `}
                  >
                    <UsersIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                    <span className="text-sm md:text-base">Team Management</span>
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          <div className="mt-auto pt-3 md:pt-4">
            <div className="p-3 md:p-4 border-t border-[#f5f0e8]">
              <div className="flex items-center">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name}
                  size="sm"
                  className="mr-2 md:mr-3 w-8 h-8"
                />
                <div>
                  <p className="text-xs md:text-sm font-medium text-[#3a3226] truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-[#7a7067] capitalize compact-mobile">
                    {user?.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            <NavLink
              to="/"
              onClick={logout}
              className="flex items-center p-3 md:p-4 rounded-lg text-[#7a7067] hover:bg-[#f5f0e8]/50 hover:text-[#3a3226] transition-all duration-200"
            >
              <LogOutIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
              <span className="text-sm md:text-base">Logout</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content - Add bottom padding on mobile for bottom nav */}
      <main className="flex-1 pt-14 md:pt-6 p-3 sm:p-4 md:p-10 md:ml-64 pb-20 md:pb-10 overflow-y-auto transition-all duration-300">
        <Outlet />
        {user && <NotificationAlert />}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
};

export default Layout;