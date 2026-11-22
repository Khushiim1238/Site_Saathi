'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { 
  LayoutDashboard, 
  PhoneCall, 
  PlusCircle, 
  FolderKanban, 
  ChevronDown, 
  Check,
  Lock,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPoolCount = async () => {
      try {
        const res = await fetch('/api/leads?status=UNCLAIMED');
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          setUnclaimedCount(data.leads.length);
        }
      } catch (e) {
        // silent
      }
    };
    fetchPoolCount();
    const interval = setInterval(fetchPoolCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      name: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'New Site',
      href: '/agent',
      icon: PlusCircle,
    },
    {
      name: 'Calling',
      href: '/caller',
      icon: PhoneCall,
      badge: unclaimedCount > 0 ? unclaimedCount : null,
    },
    {
      name: 'Directory',
      href: '/leads',
      icon: FolderKanban,
    },
  ];

  const displayName = mounted && currentUser?.name ? currentUser.name : 'Account';
  const roleLabel =
    currentUser?.role === 'MANAGER'
      ? 'Manager'
      : currentUser?.role === 'CALLER'
      ? 'Telecaller'
      : 'Field Agent';

  return (
    <>
      {/* Top Header - Clean executive corporate navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shadow-2xs overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="Veer Cover Block" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-slate-900 text-sm tracking-tight">VEER</span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded leading-none">
                  CRM
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 leading-none">
                Cover Block Operations
              </span>
            </div>
          </Link>

          {/* User Role & Identity Badge */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {mounted && currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[110px] leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] font-medium text-slate-500 leading-none">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Verified Profile
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    PIN Verified
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-xl my-1 border border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-500">{roleLabel} • {currentUser?.phone ? `+91 ${currentUser.phone}` : 'Active'}</div>
                </div>

                {/* Lock / Switch Account Button */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock / Switch User (PIN)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modern Enterprise Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-area-bottom shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
                  isActive 
                    ? 'text-blue-700 font-bold bg-blue-50/70' 
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
