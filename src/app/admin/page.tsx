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
  Layers,
  Trash2,
  UserPlus,
  Settings,
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser, staffName, refreshUsers } = useUser();
  const [data, setData] = useState<any | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Settings Modal
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
      'Clear all test and demo leads? This will reset all counts to 0 so you can start recording real construction sites.'
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
        setActionSuccess('All test leads cleared. Ready for live site records.');
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

  const activeManagerName = mounted && (staffName || currentUser?.name) ? (staffName || currentUser?.name) : 'Operations';

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Quiet Executive Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active: <span className="font-semibold text-slate-800">{activeManagerName}</span> • Veer Cover Block
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Team & Data Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-slate-600 text-xs font-medium border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Unified 3-Metric Tiles (Harmonious Graphite Neutral Surfaces) */}
      <div className="grid grid-cols-3 gap-2 text-left">
        {/* Sites Logged */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Sites Logged</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1">{totalLeads}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {statusCounts['UNCLAIMED'] || 0} in pool
          </div>
        </div>

        {/* Active In Calling */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">In Outreach</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1">
            {(statusCounts['CLAIMED'] || 0) + (statusCounts['INTERESTED'] || 0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">Active calls</div>
        </div>

        {/* Orders Won */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Orders Won</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tracking-tight mt-1">{wonCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 truncate">Deals closed</div>
        </div>
      </div>

      {/* Quiet Overdue Alert */}
      {overdueFollowUps > 0 && (
        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{overdueFollowUps} callback calls require follow-up</span>
          </div>
          <Link href="/caller" className="text-rose-700 font-semibold underline text-xs shrink-0">
            View
          </Link>
        </div>
      )}

      {/* Field Site Visits */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-xs">Field Visits Logged</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">By Executive</span>
        </div>

        <div className="space-y-1.5">
          {agentStats.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-1">No field visits logged yet.</p>
          ) : (
            agentStats.map((agent: any) => (
              <div
                key={agent.id}
                className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800">{agent.name}</h4>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {agent.phone ? `+91 ${agent.phone}` : 'Field Staff'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-slate-900">{agent.leads_captured}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Sites</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Telecalling Conversions */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-xs">Telecalling Outreach</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Closed</span>
        </div>

        <div className="space-y-1.5">
          {callerStats.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-1">No calls recorded yet.</p>
          ) : (
            callerStats.map((caller: any) => (
              <div
                key={caller.id}
                className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800">{caller.name}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Claimed: <strong className="text-slate-700">{caller.leads_claimed}</strong> • Calls: <strong className="text-slate-700">{caller.total_calls_made}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-emerald-700">{caller.deals_won}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Won</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-900 text-xs">Recent Operations Activity</h3>
          <Link href="/leads" className="text-xs text-slate-600 font-semibold hover:text-slate-900 flex items-center gap-0.5">
            <span>Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">No site activity recorded yet.</p>
          ) : (
            recentActivities.slice(0, 6).map((act: any) => (
              <div key={act.id} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 text-xs text-slate-700">
                <div className="font-bold text-slate-900">
                  {act.user_name || 'Staff'}: <span className="font-normal text-slate-600">{act.description}</span>
                </div>
                {act.lead_project_name && (
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Site: {act.lead_project_name}
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
        className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Layers className="w-4 h-4 text-slate-500" />
        <span>Open Lead Directory &amp; Export Data</span>
      </Link>

      {/* Team & System Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">System &amp; Team Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage personnel and test data</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Add Team Member */}
            <form onSubmit={handleAddStaff} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Staff Member</span>
              </h4>

              <input
                type="text"
                required
                placeholder="Full Name (e.g. Ramesh Singh)"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-medium"
              />

              <input
                type="tel"
                placeholder="Mobile Number (Optional)"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-mono text-xs"
              />

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setNewStaffRole('FIELD_AGENT')}
                  className={`py-2 rounded-lg border transition-all cursor-pointer ${
                    newStaffRole === 'FIELD_AGENT'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Field Executive
                </button>
                <button
                  type="button"
                  onClick={() => setNewStaffRole('CALLER')}
                  className={`py-2 rounded-lg border transition-all cursor-pointer ${
                    newStaffRole === 'CALLER'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Telecaller
                </button>
              </div>

              <button
                type="submit"
                disabled={addingStaff}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {addingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>Save Staff Member</span>
              </button>
            </form>

            {/* Wipe Test Data */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Trash2 className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Reset Test Data</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Clears old demo records from database to maintain a clean slate for genuine site visits.
              </p>
              <button
                type="button"
                onClick={handleClearDemoData}
                disabled={clearingData}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {clearingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Clear All Demo Leads</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
