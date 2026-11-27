'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Lock, ShieldCheck, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  loading: boolean;
  isAuthenticated: boolean;
  authChecked: boolean;
  loginWithPin: (userId: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_INITIAL_USER: User = {
  id: 'user_admin_1',
  name: 'Mr. Sharma (Director/Manager)',
  email: 'sharma@business.com',
  phone: '9876543210',
  role: 'MANAGER',
  pin: '1234',
  is_active: 1,
  created_at: new Date().toISOString(),
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([DEFAULT_INITIAL_USER]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_INITIAL_USER);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Modal PIN login states
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && data.users.length > 0) {
        setUsers(data.users);

        // Check stored auth
        if (typeof window !== 'undefined') {
          const isAuthed = localStorage.getItem('crm_auth_pin_verified') === 'true';
          const savedUserId = localStorage.getItem('crm_active_user_id');
          const matched = data.users.find((u: User) => u.id === savedUserId);

          if (isAuthed && matched) {
            setCurrentUser(matched);
            setSelectedUserId(matched.id);
            setIsAuthenticated(true);
          } else {
            // Pick default user to select in dialog
            const defaultUser = matched || data.users[0];
            setSelectedUserId(defaultUser.id);
            setCurrentUser(defaultUser);
            setIsAuthenticated(false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loginWithPin = async (userId: string, pin: string) => {
    setVerifying(true);
    setLoginError(null);

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      setVerifying(false);
      const err = 'User profile not found.';
      setLoginError(err);
      return { success: false, error: err };
    }

    // Default PIN is 1234
    const validPin = targetUser.pin || '1234';
    if (pin.trim() !== validPin.trim()) {
      setVerifying(false);
      const err = 'Incorrect PIN. Please try again.';
      setLoginError(err);
      return { success: false, error: err };
    }

    // PIN matched
    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    setPinInput('');
    setLoginError(null);

    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_auth_pin_verified', 'true');
      localStorage.setItem('crm_active_user_id', targetUser.id);
    }

    setVerifying(false);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    setLoginError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_auth_pin_verified');
    }
  };

  const handleSetUser = (user: User) => {
    setCurrentUser(user);
    setSelectedUserId(user.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_active_user_id', user.id);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser: handleSetUser,
        loading,
        isAuthenticated,
        authChecked,
        loginWithPin,
        logout,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
