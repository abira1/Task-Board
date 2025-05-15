import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  Trash2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldIcon,
  UserIcon,
  Loader2Icon,
  AlertCircleIcon
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData, removeData } from '../firebase/database';
import UserManagementForm from '../components/UserManagementForm';
import UserApproval from '../components/UserApproval';
import Avatar from '../components/Avatar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  status?: 'active' | 'inactive';
  providerId?: string;
  createdAt?: string;
  lastLogin?: string;
}

const TeamManagement = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const { addNotification } = useNotifications();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from Firebase
  useEffect(() => {
    const unsubscribe = fetchData<User[]>('users', (data) => {
      if (data) {
        setUsers(data);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.role === 'admin' ? 'admin' : 'team member').includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await removeData('users', selectedUser.id);

      await addNotification({
        title: 'User Removed',
        message: `${selectedUser.name} has been removed from the team`,
        type: 'team'
      });

      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getStatusColor = (status?: string) => {
    return status === 'inactive'
      ? 'bg-[#f5eee8] text-[#d4a5a5]'
      : 'bg-[#e8f3f1] text-[#7eb8ab]';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin'
      ? 'bg-[#f5eee8] text-[#d4a5a5]'
      : 'bg-[#e8f3f1] text-[#7eb8ab]';
  };

  return (
    <div>
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-['Caveat',_cursive] text-4xl text-[#3a3226] mb-2">
            Team Management
          </h1>
          <p className="text-[#7a7067]">
            Manage your team members and their roles
          </p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-[#d4a5a5] text-white rounded-lg mt-4 md:mt-0"
          onClick={handleAddUser}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          <span>Add Team Member</span>
        </button>
      </header>

      <div className="bg-white rounded-xl p-6 mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-[#7a7067]" />
          </div>
          <input
            type="text"
            className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#7a7067] mb-4">No team members found</p>
            <button
              className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg"
              onClick={handleAddUser}
            >
              Add your first team member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f5f0e8]">
                  <th className="text-left py-3 px-4 text-[#3a3226] font-medium">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-[#3a3226] font-medium">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-[#3a3226] font-medium hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-[#3a3226] font-medium">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-[#3a3226] font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-[#f5f0e8] hover:bg-[#f5f0e8]/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          className="mr-3"
                        />
                        <span className="text-[#3a3226] font-medium">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role === 'admin' ? (
                          <>
                            <ShieldIcon className="h-4 w-4 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="h-4 w-4 mr-1" />
                            Team Member
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#7a7067] hidden md:table-cell">
                      {user.email}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status === 'inactive' ? (
                          <>
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Inactive
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Active
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        className="text-[#7a7067] hover:text-[#3a3226] p-1"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      {/* Don't allow deleting yourself */}
                      {user.id !== currentUser?.id && (
                        <button
                          className="text-[#7a7067] hover:text-[#d4a5a5] p-1 ml-2"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Approval Section */}
      <div className="mb-8">
        <UserApproval />
      </div>

      {/* Role descriptions section */}
      <div className="bg-white rounded-xl p-6">
        <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] mb-4">
          Team Roles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">
              Admin
            </h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Full access to manage team members, tasks, and system settings. Can add and remove team members.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#d4a5a5] px-2 py-1 rounded-full">
                Admin Access
              </span>
            </div>
          </div>
          <div className="border border-[#f5f0e8] rounded-lg p-4">
            <h3 className="text-[#3a3226] font-medium mb-2">Team Member</h3>
            <p className="text-[#7a7067] text-sm mb-3">
              Can view and update assigned tasks, participate in team activities, and access shared resources.
            </p>
            <div className="flex items-center">
              <span className="text-xs text-white bg-[#7eb8ab] px-2 py-1 rounded-full">
                Standard Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <UserManagementForm
          onClose={() => setIsAddUserModalOpen(false)}
          onSuccess={() => {
            addNotification({
              title: 'Team Member Added',
              message: 'New team member has been added successfully',
              type: 'team'
            });
          }}
        />
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && selectedUser && (
        <UserManagementForm
          onClose={() => {
            setIsEditUserModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            addNotification({
              title: 'Team Member Updated',
              message: `${selectedUser.name}'s information has been updated`,
              type: 'team'
            });
          }}
          user={selectedUser}
          isEdit={true}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {isDeleteUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226] mb-4">
              Remove Team Member
            </h2>
            <p className="text-[#7a7067] mb-6">
              Are you sure you want to remove <span className="font-medium">{selectedUser.name}</span> from the team? This action cannot be undone.
            </p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-[#f5f0e8] text-[#7a7067] rounded-lg mr-2"
                onClick={() => {
                  setIsDeleteUserModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg"
                onClick={confirmDeleteUser}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
