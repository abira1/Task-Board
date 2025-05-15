import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  getDataOnce,
  initializeDatabase,
  addData,
  updateData
} from '../firebase/database';
import { defaultUsers } from '../firebase/initData';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
  providerId?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    id: string;
    name: string;
    date: string;
  };
  joinedDate: string;
}

interface UserWithPassword extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
  loading: boolean;
  isApproved: () => boolean;
  isPending: () => boolean;
  isRejected: () => boolean;
  getPendingUsers: () => Promise<User[]>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize database and set up auth state listener
  useEffect(() => {
    const initDb = async () => {
      await initializeDatabase({ users: defaultUsers });
    };

    initDb();

    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        await handleUserAuthenticated(firebaseUser);
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle user authentication (both for regular and Google login)
  const handleUserAuthenticated = async (firebaseUser: FirebaseUser) => {
    try {
      // Log Firebase user details for debugging
      console.log('Firebase user:', {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        providerId: firebaseUser.providerId
      });

      // Get users from Firebase
      const users = await getDataOnce<Record<string, User>>('users');

      // Find user by email
      let userRecord: User | null = null;

      if (users) {
        const usersArray = Object.entries(users).map(([userId, userData]) => {
          return {
            ...userData,
            id: userId
          };
        });

        userRecord = usersArray.find(u => u.email === firebaseUser.email) || null;
      }

      // If user doesn't exist, create a new one
      if (!userRecord) {
        // Check if the email is the admin email
        const isAdminEmail = firebaseUser.email === 'abirsabirhossain@gmail.com';

        const newUser: Omit<User, 'id'> = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          role: isAdminEmail ? 'admin' : 'team_member',
          avatar: firebaseUser.photoURL || '',
          providerId: firebaseUser.providerId || 'google.com',
          // Auto-approve admin users, set others to pending
          approvalStatus: isAdminEmail ? 'approved' : 'pending',
          joinedDate: new Date().toISOString()
        };

        // Add user to database
        const userId = await addData('users', newUser);

        if (userId) {
          userRecord = {
            id: userId,
            ...newUser
          };
        }
      } else {
        // Always update the user's avatar with the Google profile picture if available
        if (firebaseUser.photoURL) {
          await updateData('users', userRecord.id, {
            providerId: firebaseUser.providerId || 'google.com',
            avatar: firebaseUser.photoURL
          });

          userRecord.providerId = firebaseUser.providerId || 'google.com';
          userRecord.avatar = firebaseUser.photoURL;

          console.log('Updated user avatar with Google profile picture:', firebaseUser.photoURL);
        } else if (!userRecord.providerId) {
          // Update existing user with provider ID if it's missing
          await updateData('users', userRecord.id, {
            providerId: firebaseUser.providerId || 'google.com'
          });

          userRecord.providerId = firebaseUser.providerId || 'google.com';
        }
      }

      if (userRecord) {
        // Log the user record for debugging
        console.log('User record being set:', userRecord);

        setUser(userRecord);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userRecord));
      }
    } catch (error) {
      console.error('Error handling authenticated user:', error);
      throw error;
    }
  };

  // Legacy email/password login
  const login = async (email: string, password: string) => {
    try {
      // Get users from Firebase
      const users = await getDataOnce<Record<string, UserWithPassword>>('users');

      if (!users) {
        throw new Error('No users found');
      }

      // Convert Firebase object to array with IDs
      const usersArray = Object.entries(users).map(([userId, userData]) => {
        return {
          ...userData,
          id: userId
        };
      });

      // Find user with matching credentials
      const foundUser = usersArray.find(u => u.email === email && u.password === password);

      if (!foundUser) {
        throw new Error('Invalid credentials');
      }

      const {
        password: _,
        ...userWithoutPassword
      } = foundUser;

      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Request additional scopes to ensure we get the profile picture
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in result:', result);

      // The user state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      // The user state will be updated by the onAuthStateChanged listener
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.email === 'abirsabirhossain@gmail.com';
  };

  // User approval status methods
  const isApproved = () => {
    return user?.approvalStatus === 'approved';
  };

  const isPending = () => {
    return user?.approvalStatus === 'pending';
  };

  const isRejected = () => {
    return user?.approvalStatus === 'rejected';
  };

  // Get all pending users
  const getPendingUsers = async (): Promise<User[]> => {
    try {
      const users = await getDataOnce<Record<string, User>>('users');

      if (!users) {
        return [];
      }

      const usersArray = Object.entries(users).map(([userId, userData]) => {
        return {
          ...userData,
          id: userId
        };
      });

      return usersArray.filter(user => user.approvalStatus === 'pending');
    } catch (error) {
      console.error('Error getting pending users:', error);
      return [];
    }
  };

  // Approve a user
  const approveUser = async (userId: string): Promise<void> => {
    if (!isAdmin()) {
      throw new Error('Only admins can approve users');
    }

    try {
      await updateData('users', userId, {
        approvalStatus: 'approved',
        approvedBy: {
          id: user?.id || '',
          name: user?.name || '',
          date: new Date().toISOString()
        }
      });

      // If the current user is being approved, update the local state
      if (user?.id === userId) {
        setUser({
          ...user,
          approvalStatus: 'approved',
          approvedBy: {
            id: user?.id || '',
            name: user?.name || '',
            date: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  };

  // Reject a user
  const rejectUser = async (userId: string): Promise<void> => {
    if (!isAdmin()) {
      throw new Error('Only admins can reject users');
    }

    try {
      await updateData('users', userId, {
        approvalStatus: 'rejected',
        approvedBy: {
          id: user?.id || '',
          name: user?.name || '',
          date: new Date().toISOString()
        }
      });

      // If the current user is being rejected, update the local state
      if (user?.id === userId) {
        setUser({
          ...user,
          approvalStatus: 'rejected',
          approvedBy: {
            id: user?.id || '',
            name: user?.name || '',
            date: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  };

  return <AuthContext.Provider value={{
    user,
    login,
    loginWithGoogle,
    logout,
    isAdmin,
    isAuthenticated,
    loading,
    isApproved,
    isPending,
    isRejected,
    getPendingUsers,
    approveUser,
    rejectUser
  }}>
      {children}
    </AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};