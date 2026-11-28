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
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { staffName, openStaffNamePrompt } = useUser();
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

  const displayName = mounted && staffName ? staffName : 'Staff';

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

          {/* Staff Name Badge with 1-Tap Edit */}
          <button
            type="button"
            onClick={openStaffNamePrompt}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer group"
            title="Click to change your name"
          >
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px] leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-700 font-semibold">✎</span>
          </button>
        </div>
      </header>

      {/* Modern Enterprise Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 safe-area-bottom shadow-xs">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'text-slate-900 font-bold bg-slate-100' 
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-slate-800 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-2xs">
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
