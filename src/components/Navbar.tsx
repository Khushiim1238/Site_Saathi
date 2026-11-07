'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { 
  Building2, 
  PhoneCall, 
  LayoutGrid, 
  Layers, 
  Plus, 
  ChevronDown, 
  Check,
  User,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUser } = useUser();
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
      icon: LayoutGrid,
    },
    {
      name: 'New Site',
      href: '/agent',
      icon: Plus,
      isAction: true,
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
      icon: Layers,
    },
  ];

  return (
    <>
      {/* Top Bar - Minimalist, high contrast, clean */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-zinc-200/70 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200/90 p-0.5 flex items-center justify-center shadow-xs overflow-hidden group-hover:border-zinc-300 transition-all flex-shrink-0">
              <img src="/logo.png" alt="Veer Cover Block" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-zinc-900 text-sm tracking-tight">VEER</span>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1 py-0.5 rounded leading-none uppercase tracking-wider">CRM</span>
              </div>
              <span className="text-[9px] font-semibold text-zinc-400 tracking-tight leading-none mt-0.5">COVER BLOCK</span>
            </div>
          </Link>

          {/* User Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-zinc-100/80 hover:bg-zinc-200/70 border border-zinc-200/60 text-left transition-all active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {mounted && currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-medium text-zinc-800 truncate max-w-[85px] sm:max-w-[120px]">
                {mounted && currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-zinc-200/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-zinc-100 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Active User Role
                </div>

                <div className="space-y-0.5 mt-1">
                  {users.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    const roleLabel =
                      user.role === 'MANAGER'
                        ? 'Manager / Owner'
                        : user.role === 'CALLER'
                        ? 'Calling Representative'
                        : 'Field Agent';

                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUser(user);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-zinc-900 text-white font-medium'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <div>
                          <div className={isSelected ? 'text-white' : 'text-zinc-900'}>{user.name}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            {roleLabel}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modern iOS-Style Glass Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white/90 backdrop-blur-2xl border-t border-zinc-200/70 safe-area-bottom">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center py-1 group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-zinc-900 text-white shadow-sm hover:scale-105 active:scale-95'
                  }`}>
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                    isActive ? 'text-amber-600' : 'text-zinc-600'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 transition-colors relative ${
                  isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.2] scale-105' : 'stroke-[1.7]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-semibold text-zinc-900' : 'font-medium'}`}>
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
