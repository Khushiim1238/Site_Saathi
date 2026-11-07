'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { 
  Building2, 
  HardHat, 
  PhoneCall, 
  LayoutGrid, 
  Layers, 
  ArrowRight, 
  Plus, 
  TrendingUp, 
  FileText,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const { currentUser } = useUser();
  const [stats, setStats] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) setStats(data.analytics);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-32 space-y-4">
      {/* Executive Hero Card */}
      <div className="bg-zinc-900 text-white rounded-3xl p-5 shadow-xs space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Auto-Sync</span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {mounted && currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Site Lead Tracker
          </h1>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Eliminating WhatsApp bottlenecks. Real-time site visits, telecalling, and conversion oversight.
          </p>
        </div>

        {/* 3 Metric Pills */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800 text-left">
            <div>
              <div className="text-xs text-zinc-400 font-medium">Total Sites</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats.totalLeads}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">Ready in Pool</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">
                {stats.statusCounts?.UNCLAIMED || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">Orders Won</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{stats.wonCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2 Primary Core Action Cards */}
      <div className="space-y-3">
        {/* Card 1: Add New Site */}
        <Link
          href="/agent"
          className="block w-full bg-white hover:bg-zinc-50/80 border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 text-amber-400 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 text-base">
                  Log New Construction Site
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  1-tap GPS, auto-saved draft &amp; duplicate check
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors flex-shrink-0" />
          </div>
        </Link>

        {/* Card 2: Calling Desk */}
        <Link
          href="/caller"
          className="block w-full bg-white hover:bg-zinc-50/80 border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5 text-blue-400 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-zinc-900 text-base">
                    Telecalling Desk
                  </h3>
                  {stats?.statusCounts?.UNCLAIMED > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      {stats.statusCounts.UNCLAIMED} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Claim site leads, 1-tap call &amp; log outcomes
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors flex-shrink-0" />
          </div>
        </Link>

        {/* Card 3: Manager Overview */}
        <Link
          href="/admin"
          className="block w-full bg-white hover:bg-zinc-50/80 border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                <LayoutGrid className="w-5 h-5 text-purple-400 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 text-base">
                  Manager Business Summary
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Live conversion funnel, agent visits &amp; call closures
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Directory Link */}
      <div className="pt-1">
        <Link
          href="/leads"
          className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Layers className="w-4 h-4 text-zinc-500" />
          <span>View All Recorded Sites &amp; Export Report</span>
        </Link>
      </div>
    </div>
  );
}
