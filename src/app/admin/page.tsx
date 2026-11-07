'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { 
  Building2, 
  PhoneCall, 
  Check, 
  AlertCircle, 
  HardHat, 
  Users, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  Layers,
  Trash2,
  UserPlus,
  Settings,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser, refreshUsers } = useUser();
  const [data, setData] = useState<any | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Settings / Real Production Modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'FIELD_AGENT' | 'CALLER'>('FIELD_AGENT');
  const [addingStaff, setAddingStaff] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) setInitialLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) setData(json.analytics);
    } catch (e) {
      console.error('Silent auto-sync error:', e);
    } finally {
      if (!isBackground) setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(false);
  }, []);

  // Real-time auto-refresh in background every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchStats(true);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // WIPE DEMO LEADS
  const handleClearDemoData = async () => {
    const confirmWipe = confirm(
      'Clear all test/demo leads? This will reset all counts to 0 so you can start recording real construction sites.'
    );
    if (!confirmWipe) return;

    setClearingData(true);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_ALL_LEADS' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('All test leads cleared! Ready for real business.');
        fetchStats(true);
      } else {
        alert(data.error || 'Failed to clear data');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClearingData(false);
    }
  };

  // ADD REAL TEAM MEMBER
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName) return;
    setAddingStaff(true);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_USER',
          name: newStaffName,
          phone: newStaffPhone,
          role: newStaffRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewStaffName('');
        setNewStaffPhone('');
        setActionSuccess(`Added "${newStaffName}" to team.`);
        refreshUsers();
        fetchStats(true);
      } else {
        alert(data.error || 'Failed to add staff');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingStaff(false);
    }
  };

  const {
    totalLeads = 0,
    wonCount = 0,
    statusCounts = {},
    agentStats = [],
    callerStats = [],
    pendingFollowUps = 0,
    overdueFollowUps = 0,
    recentActivities = [],
  } = data || {};

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-32 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Business Overview</h1>
          <p className="text-xs text-zinc-500">
            Manager: <span className="font-semibold text-zinc-800">{mounted && currentUser?.name ? currentUser.name.split(' ')[0] : 'Owner'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 flex items-center justify-center text-zinc-600 transition-colors"
            title="Team & Data Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-full text-zinc-600 text-[11px] font-medium border border-zinc-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* 3 HIGH-END METRIC TILES */}
      <div className="grid grid-cols-3 gap-2 text-left">
        {/* Sites Logged */}
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Sites Logged</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{totalLeads}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {statusCounts['UNCLAIMED'] || 0} in pool
          </div>
        </div>

        {/* Active In Calling */}
        <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">In Calling</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">
            {(statusCounts['CLAIMED'] || 0) + (statusCounts['INTERESTED'] || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">Active calls</div>
        </div>

        {/* Orders Won */}
        <div className="bg-zinc-900 text-white p-3.5 rounded-2xl shadow-xs">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Orders Won</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{wonCount}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5 truncate">Deals closed</div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueFollowUps > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{overdueFollowUps} callback calls are overdue</span>
          </div>
          <Link href="/caller" className="text-rose-700 font-semibold underline text-[11px] flex-shrink-0">
            View
          </Link>
        </div>
      )}

      {/* FIELD AGENTS PRODUCTIVITY */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 text-sm">Field Site Visits</h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">Logged</span>
        </div>

        <div className="space-y-2">
          {agentStats.map((agent: any) => (
            <div
              key={agent.id}
              className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-100 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-medium text-zinc-900">{agent.name}</h4>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{agent.phone ? `+91 ${agent.phone}` : 'Active'}</div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-zinc-900">{agent.leads_captured}</span>
                <span className="text-[9px] text-zinc-400 block uppercase font-medium">Sites</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TELECALLERS PERFORMANCE */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-900 text-sm">Telecalling Closures</h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">Won</span>
        </div>

        <div className="space-y-2">
          {callerStats.map((caller: any) => (
            <div
              key={caller.id}
              className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-100 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-medium text-zinc-900">{caller.name}</h4>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Claimed: <strong>{caller.leads_claimed}</strong> • Calls: <strong>{caller.total_calls_made}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-600">{caller.deals_won}</span>
                <span className="text-[9px] text-zinc-400 block uppercase font-medium">Won</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITY TIMELINE */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <h3 className="font-semibold text-zinc-900 text-sm">Recent Activity Stream</h3>
          <Link href="/leads" className="text-xs text-zinc-600 font-medium hover:text-zinc-900 flex items-center gap-0.5">
            <span>All</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <p className="text-zinc-400 text-xs italic py-2">No site activity yet.</p>
          ) : (
            recentActivities.slice(0, 6).map((act: any) => (
              <div key={act.id} className="p-2.5 bg-zinc-50 rounded-xl text-xs text-zinc-700">
                <div className="font-medium text-zinc-900">
                  {act.user_name || 'Staff'}: <span className="font-normal text-zinc-600">{act.description}</span>
                </div>
                {act.lead_project_name && (
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                    Project: {act.lead_project_name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Directory Link */}
      <Link
        href="/leads"
        className="w-full py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        <Layers className="w-4 h-4 text-zinc-500" />
        <span>Open Full Directory &amp; Download Report</span>
      </Link>

      {/* PRODUCTION SETUP & TEAM MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl safe-area-bottom space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">Setup Real Business Team</h3>
                <p className="text-xs text-zinc-400">Add staff and clear test data</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Add Team Member */}
            <form onSubmit={handleAddStaff} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-zinc-600" />
                <span>Add Real Staff Member</span>
              </h4>

              <input
                type="text"
                required
                placeholder="Full Name (e.g. Ramesh Singh)"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900"
              />

              <input
                type="tel"
                placeholder="Mobile Number (Optional)"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900 font-mono"
              />

              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setNewStaffRole('FIELD_AGENT')}
                  className={`py-2 rounded-xl border transition-all ${
                    newStaffRole === 'FIELD_AGENT'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200'
                  }`}
                >
                  Field Worker
                </button>
                <button
                  type="button"
                  onClick={() => setNewStaffRole('CALLER')}
                  className={`py-2 rounded-xl border transition-all ${
                    newStaffRole === 'CALLER'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200'
                  }`}
                >
                  Telecaller
                </button>
              </div>

              <button
                type="submit"
                disabled={addingStaff}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {addingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Save Staff</span>
              </button>
            </form>

            {/* Wipe Test Data */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <Trash2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <span>Clear All Demo Leads</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                Resets the database to zero leads so you can start logging real on-site construction work.
              </p>
              <button
                type="button"
                onClick={handleClearDemoData}
                disabled={clearingData}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {clearingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Wipe Test Leads</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
