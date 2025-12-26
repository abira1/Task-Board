import React, { useState, useEffect } from 'react';
import { XIcon, UserIcon, MailIcon, ShieldIcon } from 'lucide-react';
import { addData, updateData } from '../firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { GooeyLoader } from './ui/loader-10';

interface User {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  status?: 'active' | 'inactive';
  providerId?: string;
}

interface UserManagementFormProps {
  onClose: () => void;
  onSuccess: () => void;
  user?: User; // If provided, we're editing an existing user
  isEdit?: boolean;
}

const UserManagementForm: React.FC<UserManagementFormProps> = ({
  onClose,
  onSuccess,
  user,
  isEdit = false
}) => {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'team_member',
    avatar: user?.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
    status: user?.status || 'active'
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (name in errors) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    let valid = true;
    const newErrors = { name: '', email: '' };
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isEdit && user?.id) {
        // Update existing user
        await updateData('users', user.id, formData);
        
        await addNotification({
          title: 'User Updated',
          message: `${formData.name}'s information has been updated`,
          type: 'team'
        });
      } else {
        // Add new user
        const timestamp = new Date().toISOString();
        const newUser = {
          ...formData,
          createdAt: timestamp,
          createdBy: currentUser?.id
        };
        
        await addData('users', newUser);
        
        await addNotification({
          title: 'New Team Member',
          message: `${formData.name} has been added to the team`,
          type: 'team'
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      
      await addNotification({
        title: 'Error',
        message: `Failed to ${isEdit ? 'update' : 'add'} user. Please try again.`,
        type: 'system'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate a random avatar when the form is opened
  useEffect(() => {
    if (!isEdit) {
      setFormData(prev => ({
        ...prev,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      }));
    }
  }, [isEdit]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="font-['Caveat',_cursive] text-2xl text-[#3a3226]">
            {isEdit ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-[#7a7067] hover:text-[#3a3226]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a7067]" size={18} />
              <input 
                type="text" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                className={`bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`} 
                placeholder="Enter full name" 
                required 
              />
            </div>
            {errors.name && <p className="text-[#d4a5a5] text-xs mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a7067]" size={18} />
              <input 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                className={`bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${errors.email ? 'border-2 border-[#d4a5a5] focus:ring-[#d4a5a5]' : 'focus:ring-[#d4a5a5]'}`} 
                placeholder="Enter email address" 
                required 
              />
            </div>
            {errors.email && <p className="text-[#d4a5a5] text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-[#3a3226] text-sm font-medium mb-2">
              Role
            </label>
            <div className="relative">
              <ShieldIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a7067]" size={18} />
              <select 
                name="role" 
                value={formData.role}
                onChange={handleChange}
                className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]"
              >
                <option value="team_member">Team Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          {!isEdit && (
            <div className="flex items-center mt-4">
              <input 
                type="checkbox" 
                id="sendInvite" 
                checked={sendInvite}
                onChange={() => setSendInvite(!sendInvite)}
                className="h-4 w-4 text-[#d4a5a5] rounded border-[#7a7067] focus:ring-[#d4a5a5]" 
              />
              <label htmlFor="sendInvite" className="ml-2 text-sm text-[#7a7067]">
                Send invitation email
              </label>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f5f0e8] text-[#7a7067] rounded-lg"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-[#d4a5a5] text-white rounded-lg flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <GooeyLoader size="small" />
                  <span>Processing...</span>
                </div>
              ) : (
                isEdit ? 'Update' : 'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagementForm;
