import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  Loader2Icon, 
  UserIcon, 
  CalendarIcon, 
  MailIcon,
  AlertCircleIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  joinedDate: string;
}

const UserApproval: React.FC = () => {
  const { getPendingUsers, approveUser, rejectUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUsers, setProcessingUsers] = useState<Record<string, boolean>>({});

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await getPendingUsers();
      setPendingUsers(users);
      setError(null);
    } catch (err) {
      setError('Failed to load pending users. Please try again.');
      console.error('Error fetching pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Handle user approval
  const handleApproveUser = async (userId: string) => {
    try {
      setProcessingUsers(prev => ({ ...prev, [userId]: true }));
      await approveUser(userId);
      // Remove the approved user from the list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError('Failed to approve user. Please try again.');
      console.error('Error approving user:', err);
    } finally {
      setProcessingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle user rejection
  const handleRejectUser = async (userId: string) => {
    try {
      setProcessingUsers(prev => ({ ...prev, [userId]: true }));
      await rejectUser(userId);
      // Remove the rejected user from the list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError('Failed to reject user. Please try again.');
      console.error('Error rejecting user:', err);
    } finally {
      setProcessingUsers(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2Icon className="h-8 w-8 text-[#d4a5a5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h2 className="text-xl font-medium text-[#3a3226] mb-4">Pending User Approvals</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm mb-6 flex items-center">
          <AlertCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="text-center py-8 bg-[#f9f6f1] rounded-lg">
          <UserIcon className="h-12 w-12 text-[#d4a5a5] mx-auto mb-3 opacity-50" />
          <p className="text-[#7a7067]">No pending user approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map(user => (
            <div key={user.id} className="border border-[#f5f0e8] rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <Avatar src={user.avatar} alt={user.name} size="md" className="mr-4" />
                  <div>
                    <h3 className="font-medium text-[#3a3226]">{user.name}</h3>
                    <div className="flex items-center text-sm text-[#7a7067] mt-1">
                      <MailIcon className="h-4 w-4 mr-1" />
                      {user.email}
                    </div>
                    <div className="flex items-center text-sm text-[#7a7067] mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Joined {formatDate(user.joinedDate)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    disabled={processingUsers[user.id]}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    {processingUsers[user.id] ? (
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleRejectUser(user.id)}
                    disabled={processingUsers[user.id]}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg flex items-center hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {processingUsers[user.id] ? (
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserApproval;
