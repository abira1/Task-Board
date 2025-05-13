import React, { useEffect, useState, createContext, useContext } from 'react';
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_member';
  avatar: string;
}
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Mock user data
const mockUsers = [{
  id: '1',
  name: 'Emma Chen',
  email: 'emma@toiral.com',
  password: 'admin123',
  role: 'admin',
  avatar: 'https://i.pravatar.cc/150?img=5'
}, {
  id: '2',
  name: 'Alex Kim',
  email: 'alex@toiral.com',
  password: 'team123',
  role: 'team_member',
  avatar: 'https://i.pravatar.cc/150?img=11'
}, {
  id: '3',
  name: 'Jordan Lee',
  email: 'jordan@toiral.com',
  password: 'team123',
  role: 'team_member',
  avatar: 'https://i.pravatar.cc/150?img=32'
}] as const;
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);
  const login = async (email: string, password: string) => {
    // Simulate API call
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
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
  };
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };
  const isAdmin = () => {
    return user?.role === 'admin';
  };
  return <AuthContext.Provider value={{
    user,
    login,
    logout,
    isAdmin,
    isAuthenticated
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