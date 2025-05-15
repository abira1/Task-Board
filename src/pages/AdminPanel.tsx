import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  UsersIcon,
  SettingsIcon,
  ChevronRightIcon,
  LogOutIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState(() => {
    // Set active page based on current path
    const path = location.pathname;
    if (path.includes('/admin/team-management')) return 'team-management';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  });

  const handleNavigation = (page: string) => {
    setActivePage(page);
    navigate(`/admin/${page === 'dashboard' ? '' : page}`);
  };

  return (
    <div className="flex h-screen bg-[#f5f0e8]">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b border-[#f5f0e8]">
          <h1 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            Admin Panel
          </h1>
        </div>

        <div className="p-4">
          <div className="flex items-center mb-6">
            <Avatar
              src={user?.avatar}
              alt={user?.name || 'Admin'}
              className="mr-3"
            />
            <div>
              <p className="text-[#3a3226] font-medium">{user?.name}</p>
              <p className="text-[#7a7067] text-xs">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activePage === 'dashboard'
                  ? 'bg-[#f5f0e8] text-[#3a3226]'
                  : 'text-[#7a7067] hover:bg-[#f5f0e8]/50'
              }`}
              onClick={() => handleNavigation('dashboard')}
            >
              <LayoutDashboardIcon className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
              {activePage === 'dashboard' && (
                <ChevronRightIcon className="h-4 w-4 ml-auto" />
              )}
            </button>

            <button
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activePage === 'team-management'
                  ? 'bg-[#f5f0e8] text-[#3a3226]'
                  : 'text-[#7a7067] hover:bg-[#f5f0e8]/50'
              }`}
              onClick={() => handleNavigation('team-management')}
            >
              <UsersIcon className="h-5 w-5 mr-3" />
              <span>Team Management</span>
              {activePage === 'team-management' && (
                <ChevronRightIcon className="h-4 w-4 ml-auto" />
              )}
            </button>

            <button
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left ${
                activePage === 'settings'
                  ? 'bg-[#f5f0e8] text-[#3a3226]'
                  : 'text-[#7a7067] hover:bg-[#f5f0e8]/50'
              }`}
              onClick={() => handleNavigation('settings')}
            >
              <SettingsIcon className="h-5 w-5 mr-3" />
              <span>Settings</span>
              {activePage === 'settings' && (
                <ChevronRightIcon className="h-4 w-4 ml-auto" />
              )}
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-4 border-t border-[#f5f0e8]">
          <button
            className="w-full flex items-center px-4 py-3 rounded-lg text-left text-[#7a7067] hover:bg-[#f5f0e8]/50"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOutIcon className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminPanel;
