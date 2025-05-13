import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const {
    login
  } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };
  return <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <img src="/Toiral_TaskBoard_Logo_.png" alt="Toiral Taskboard" className="h-16" />
        </div>
        <h1 className="font-['Caveat',_cursive] text-4xl text-center text-[#3a3226] mb-8">
          {isLogin ? 'Welcome back!' : 'Join Toiral'}
        </h1>
        <div className="bg-white rounded-2xl p-8">
          <div className="flex mb-6">
            <button className={`flex-1 pb-2 text-center font-medium ${isLogin ? 'text-[#3a3226] border-b-2 border-[#d4a5a5]' : 'text-[#7a7067]'}`} onClick={() => setIsLogin(true)}>
              Login
            </button>
            <button className={`flex-1 pb-2 text-center font-medium ${!isLogin ? 'text-[#3a3226] border-b-2 border-[#d4a5a5]' : 'text-[#7a7067]'}`} onClick={() => setIsLogin(false)}>
              Sign Up
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>}
            <div>
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[#7a7067]" />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Enter your email" required />
              </div>
            </div>
            <div>
              <label className="block text-[#3a3226] text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockIcon className="h-5 w-5 text-[#7a7067]" />
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Enter your password" required />
              </div>
            </div>
            {!isLogin && <div>
                <label className="block text-[#3a3226] text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LockIcon className="h-5 w-5 text-[#7a7067]" />
                  </div>
                  <input type="password" className="bg-[#f5f0e8] text-[#3a3226] w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a5a5]" placeholder="Confirm your password" required />
                </div>
              </div>}
            {isLogin && <div className="flex justify-end">
                <button type="button" className="text-sm text-[#7a7067] hover:text-[#d4a5a5]">
                  Forgot password?
                </button>
              </div>}
            <button type="submit" className="w-full bg-[#d4a5a5] text-white font-medium py-3 rounded-lg hover:bg-[#c99090] transition-colors">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>;
};
export default LoginPage;