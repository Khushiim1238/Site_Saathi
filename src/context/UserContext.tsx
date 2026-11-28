'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';

interface UserContextType {
  staffName: string;
  setStaffName: (name: string) => void;
  openStaffNamePrompt: () => void;
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  selectUserById: (userId: string) => void;
  loading: boolean;
  isAuthenticated: boolean;
  authChecked: boolean;
  isPickerOpen: boolean;
  openUserPicker: () => void;
  closeUserPicker: () => void;
  createNewUser: (name: string, role: string, phone?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithPin: (userId: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [staffName, setStaffNameState] = useState<string>('Staff');
  const [showFirstTimePrompt, setShowFirstTimePrompt] = useState<boolean>(false);
  const [promptInput, setPromptInput] = useState<string>('');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('veer_staff_name') || localStorage.getItem('vbc_staff_name') || '';
      if (saved && saved.trim()) {
        setStaffNameState(saved.trim());
      } else {
        setShowFirstTimePrompt(true);
      }
      setAuthChecked(true);
    }
  }, []);

  const setStaffName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStaffNameState(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('veer_staff_name', trimmed);
    }
    setShowFirstTimePrompt(false);
  };

  const openStaffNamePrompt = () => {
    setPromptInput(staffName !== 'Staff' ? staffName : '');
    setShowFirstTimePrompt(true);
  };

  const currentUser: User = {
    id: 'user_agent_1',
    name: staffName,
    email: `${staffName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'}@veer.local`,
    phone: '',
    role: 'FIELD_AGENT',
    pin: '1234',
    is_active: 1,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <UserContext.Provider
      value={{
        staffName,
        setStaffName,
        openStaffNamePrompt,
        currentUser,
        users,
        setCurrentUser: () => {},
        selectUserById: (id: string) => {
          const u = users.find((x) => x.id === id);
          if (u) setStaffName(u.name);
        },
        loading,
        isAuthenticated: true,
        authChecked,
        isPickerOpen: showFirstTimePrompt,
        openUserPicker: openStaffNamePrompt,
        closeUserPicker: () => setShowFirstTimePrompt(false),
        createNewUser: async (name: string) => {
          setStaffName(name);
          return { success: true };
        },
        loginWithPin: async () => ({ success: true }),
        logout: openStaffNamePrompt,
        refreshUsers: fetchUsers,
      }}
    >
      {/* Clean 1-Time Name Prompt (Only shown once on first visit if no name exists) */}
      {showFirstTimePrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Staff / Executive Name</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please enter your name so your site visits are recorded under you.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (promptInput.trim()) {
                  setStaffName(promptInput);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Your Name (e.g. Ramraj, Vikram)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 font-bold text-slate-900"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

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
