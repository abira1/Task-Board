import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  ClipboardList, 
  Bell, 
  Calendar, 
  MoreHorizontal,
  Plus 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';
import MoreMenu from './MoreMenu';
import AddTaskSheet from './AddTaskSheet';

const BottomNavigation = () => {
  const { isAdmin } = useAuth();
  const { unseenCount } = useNotifications();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const location = useLocation();

  // Navigation item component
  const NavItem = ({ to, icon: Icon, label, badge }: any) => {
    const isActive = location.pathname === to;
    
    return (
      <NavLink
        to={to}
        className={cn(
          "flex flex-col items-center justify-center flex-1 py-2 px-3 transition-colors",
          "active:scale-95 transition-transform duration-150"
        )}
        data-testid={`bottom-nav-${label.toLowerCase()}`}
      >
        <div className="relative">
          <Icon 
            className={cn(
              "h-6 w-6 transition-colors",
              isActive ? "text-[#d4a5a5]" : "text-[#7a7067]"
            )} 
          />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d4a5a5] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span 
          className={cn(
            "text-[10px] mt-1 font-medium transition-colors",
            isActive ? "text-[#d4a5a5]" : "text-[#7a7067]"
          )}
        >
          {label}
        </span>
      </NavLink>
    );
  };

  // Center button - role-based
  const CenterButton = () => {
    if (isAdmin()) {
      // Admin: Add Task button
      return (
        <button
          onClick={() => setShowAddTask(true)}
          className="relative -mt-6 w-14 h-14 rounded-full bg-[#d4a5a5] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform duration-150"
          data-testid="add-task-button"
        >
          <Plus className="h-7 w-7" />
        </button>
      );
    } else {
      // Regular user: Notification button
      return (
        <NavLink
          to="/notifications"
          className="relative -mt-6 w-14 h-14 rounded-full bg-[#d4a5a5] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform duration-150"
          data-testid="notification-center-button"
        >
          <Bell className="h-7 w-7" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#d4a5a5] text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
              {unseenCount > 9 ? '9+' : unseenCount}
            </span>
          )}
        </NavLink>
      );
    }
  };

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f5f0e8] shadow-lg md:hidden z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        data-testid="bottom-navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Dashboard */}
          <NavItem 
            to="/dashboard" 
            icon={Home} 
            label="Home" 
          />

          {/* Task Board */}
          <NavItem 
            to="/taskboard" 
            icon={ClipboardList} 
            label="Tasks" 
          />

          {/* Center Button (Role-based) */}
          <div className="flex-1 flex justify-center">
            <CenterButton />
          </div>

          {/* Calendar */}
          <NavItem 
            to="/calendar" 
            icon={Calendar} 
            label="Calendar" 
          />

          {/* More Menu */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-2 px-3 active:scale-95 transition-transform duration-150"
            data-testid="more-menu-button"
          >
            <MoreHorizontal className="h-6 w-6 text-[#7a7067]" />
            <span className="text-[10px] mt-1 font-medium text-[#7a7067]">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <MoreMenu open={showMoreMenu} onOpenChange={setShowMoreMenu} />

      {/* Add Task Sheet (Admin only) */}
      {isAdmin() && (
        <AddTaskSheet open={showAddTask} onOpenChange={setShowAddTask} />
      )}
    </>
  );
};

export default BottomNavigation;
