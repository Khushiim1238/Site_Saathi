'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  loading: boolean;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_INITIAL_USER: User = {
  id: 'usr_agent1',
  name: 'Ramesh (Field)',
  email: 'ramesh@veercoverblock.com',
  phone: '9876543211',
  role: 'FIELD_AGENT',
  pin: '1234',
  is_active: 1,
  created_at: new Date().toISOString(),
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([DEFAULT_INITIAL_USER]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_INITIAL_USER);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && data.users.length > 0) {
        setUsers(data.users);

        // Restore last selected user or default to Manager
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('crm_active_user_id') : null;
        const matched = data.users.find((u: User) => u.id === savedUserId);
        if (matched) {
          setCurrentUser(matched);
        } else {
          // Default to manager
          const defaultUser = data.users.find((u: User) => u.role === 'MANAGER') || data.users[0];
          setCurrentUser(defaultUser);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetUser = (user: User) => {
    setCurrentUser(user);
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
