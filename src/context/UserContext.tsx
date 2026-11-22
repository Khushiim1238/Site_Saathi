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
      return { success: false, error: 'User profile not found.' };
    }

    // Default PIN is 1234
    const validPin = targetUser.pin || '1234';
    if (pin.trim() !== validPin.trim()) {
      setVerifying(false);
      const err = 'Incorrect PIN. Please try again.';
      setLoginError(err);
      return { success: false, error: err };
      return { success: false, error: 'Incorrect PIN. Please try again.' };
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

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setLoginError('Please select your user profile.');
      return;
    }
    if (!pinInput) {
      setLoginError('Please enter your 4-digit PIN.');
      return;
    }
    await loginWithPin(selectedUserId, pinInput);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser: handleSetUser,
        loading,
        isAuthenticated,
        loginWithPin,
        logout,
        refreshUsers: fetchUsers,
      }}
    >
      {/* If not authenticated, show professional PIN screen */}
      {authChecked && !isAuthenticated ? (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                <Lock className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Veer Operations CRM
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Select your name &amp; enter your PIN to verify identity
              </p>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Select User */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">
                  Who is logging in?
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {users.map((u) => {
                    const isSelected = selectedUserId === u.id;
                    const roleText =
                      u.role === 'MANAGER'
                        ? 'Manager / Owner'
                        : u.role === 'CALLER'
                        ? 'Telecaller'
                        : 'Field Agent';

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setLoginError(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {u.name}
                          </div>
                          <div className={`text-[10px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {roleText}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4-Digit PIN Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 pl-0.5">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    setLoginError(null);
                  }}
                  placeholder="••••"
                  className="w-full text-center text-3xl tracking-[0.5em] py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-mono font-bold focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all placeholder:tracking-normal placeholder:text-slate-300"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 text-center mt-1 font-medium">
                  Default PIN: <strong className="text-slate-600 font-mono">1234</strong>
                </p>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center animate-in fade-in duration-100">
                  {loginError}
                </div>
              )}

              {/* Unlock Button */}
              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Unlock Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Render app contents once verified */}
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
