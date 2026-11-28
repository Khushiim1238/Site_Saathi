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
  Plus, 
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const { currentUser, staffName } = useUser();
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

  const activeStaffName = mounted && (staffName || currentUser?.name) ? (staffName || currentUser?.name) : 'Operations';

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Brand & Overview Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Veer Cover Block" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-tight block">Veer Cover Block</span>
              <span className="text-[11px] text-slate-500 font-medium">Site Operations</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Live Sync</span>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Field Dispatch &amp; Telecalling Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-normal">
            Coordinating site visits, telecalling follow-ups, and cover block order fulfillment.
          </p>
        </div>

        {/* 3 Metric Tiles */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-left">
            <div>
              <div className="text-xs font-medium text-slate-500">Total Sites</div>
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 mt-0.5">{stats.totalLeads}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">In Pool</div>
              <div className="text-xl font-bold font-mono tracking-tight text-slate-900 mt-0.5">
                {stats.statusCounts?.UNCLAIMED || 0}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Orders Won</div>
              <div className="text-xl font-bold font-mono tracking-tight text-emerald-700 mt-0.5">{stats.wonCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Modules */}
      <div className="space-y-2.5">
        {/* Module 1: Site Visit Form */}
        <Link
          href="/agent"
          className="block w-full bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Log Site Visit Slip
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vardhman site slip entry with GPS tagging &amp; offline persistence
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
          </div>
        </Link>

        {/* Module 2: Calling Desk */}
        <Link
          href="/caller"
          className="block w-full bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <PhoneCall className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Telecalling Desk
                  </h3>
                  {stats?.statusCounts?.UNCLAIMED > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                      {stats.statusCounts.UNCLAIMED} in pool
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Claim site leads, conduct calls, and schedule callbacks
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
          </div>
        </Link>

        {/* Module 3: Executive Overview */}
        <Link
          href="/admin"
          className="block w-full bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-xl p-4 shadow-2xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <LayoutGrid className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Operations Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conversion metrics, field visits, and telecaller closings
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
          </div>
        </Link>
      </div>

      {/* Directory Link */}
      <div className="pt-1">
        <Link
          href="/leads"
          className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>View Site Directory &amp; Export Data</span>
        </Link>
      </div>
    </div>
  );
}
