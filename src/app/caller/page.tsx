'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  PhoneCall, 
  Phone, 
  User, 
  Building2, 
  Clock, 
  Check, 
  RotateCcw, 
  MapPin, 
  Loader2, 
  Calendar,
  Sparkles,
  Inbox,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { Lead } from '@/lib/types';

export default function CallingDeskPage() {
  const { currentUser } = useUser();

  const [activeTab, setActiveTab] = useState<'POOL' | 'MY_CALLS' | 'REMINDERS'>('POOL');

  // Leads Data
  const [poolLeads, setPoolLeads] = useState<Lead[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Calling & Outcome Action Modal
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [followUpTime, setFollowUpTime] = useState('Tomorrow 11 AM');
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAllData = async (isBackground = false) => {
    if (!currentUser) return;
    if (!isBackground) setInitialLoading(true);

    try {
      const poolPromise = fetch('/api/leads?status=UNCLAIMED').then((r) => r.json());
      const myLeadsPromise = fetch(`/api/leads?claimed_by_id=${currentUser.id}`).then((r) => r.json());
      const fuPromise = fetch(`/api/followups?caller_id=${currentUser.id}&status=PENDING`).then((r) => r.json());

      const [poolData, myData, fuData] = await Promise.all([poolPromise, myLeadsPromise, fuPromise]);

      if (poolData.success) setPoolLeads(poolData.leads);
      if (myData.success) setMyLeads(myData.leads);
      if (fuData.success) setFollowUps(fuData.followUps);
    } catch (e) {
      console.error('Silent auto-sync error:', e);
    } finally {
      if (!isBackground) setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(false);
  }, [currentUser]);

  // Real-time auto-refresh in background every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAllData(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Claim Lead
  const handleClaim = async (leadId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_id: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllData(true);
        setActiveTab('MY_CALLS');
      } else {
        alert(data.error || 'Failed to claim');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Outcome
  const submitOutcome = async (status: string, extraNote = '') => {
    if (!activeLead || !currentUser) return;
    setSubmittingOutcome(true);

    let scheduledDate: string | null = null;
    if (status === 'CALLBACK_REQUESTED') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(11, 0, 0, 0);
      scheduledDate = d.toISOString();
    }

    try {
      const res = await fetch(`/api/leads/${activeLead.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_id: currentUser.id,
          call_status: status,
          notes: callNotes ? `${callNotes}. ${extraNote}` : extraNote || 'Outcome updated',
          duration_seconds: 60,
          follow_up_date: scheduledDate,
          follow_up_reason: followUpTime,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveLead(null);
        setCallNotes('');
        fetchAllData(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingOutcome(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Calling Desk</h1>
          <p className="text-xs text-zinc-500">
            Caller: <span className="font-semibold text-zinc-800">{mounted && currentUser?.name ? currentUser.name.split(' ')[0] : 'Staff'}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-full text-zinc-600 text-[11px] font-medium border border-zinc-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* iOS-Style Segmented Control */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-100/90 p-1 rounded-2xl mb-4 text-xs font-medium w-full">
        <button
          onClick={() => setActiveTab('POOL')}
          className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'POOL' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <span>Available</span>
          {poolLeads.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {poolLeads.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MY_CALLS')}
          className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'MY_CALLS' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <span>My Leads</span>
          {myLeads.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
              {myLeads.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('REMINDERS')}
          className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'REMINDERS' ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <span>Callbacks</span>
          {followUps.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {followUps.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: POOL LEADS */}
      {activeTab === 'POOL' && (
        <div className="space-y-3">
          {initialLoading ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
              Loading pool leads...
            </div>
          ) : poolLeads.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 text-center shadow-xs">
              <Check className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">No Unclaimed Leads</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                All leads have been claimed. As field agents add new sites, they appear here live.
              </p>
            </div>
          ) : (
            poolLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-3 transition-all hover:border-zinc-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 text-base leading-tight">
                      {lead.project_name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                      <span className="truncate">{lead.site_address}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 uppercase flex-shrink-0">
                    {lead.construction_stage}
                  </span>
                </div>

                <div className="bg-zinc-50/80 p-3 rounded-xl text-xs space-y-1 border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Contact:</span>
                    <span className="font-semibold text-zinc-900">{lead.contact_name} ({lead.contact_role})</span>
                  </div>
                  {lead.material_requirements && (
                    <div className="text-[11px] text-zinc-700 pt-1">
                      <span className="text-zinc-500">Needs:</span> {lead.material_requirements}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[11px] text-zinc-400 truncate">
                    Logged by {lead.captured_by_name?.split(' ')[0] || 'Agent'}
                  </span>
                  <button
                    onClick={() => handleClaim(lead.id)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all flex-shrink-0"
                  >
                    <span>Claim Lead</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MY CLAIMED LEADS */}
      {activeTab === 'MY_CALLS' && (
        <div className="space-y-3">
          {initialLoading ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
              Loading your leads...
            </div>
          ) : myLeads.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 text-center shadow-xs">
              <Phone className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">No Active Leads</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Go to the <strong>Available</strong> tab to claim site leads and begin calling.
              </p>
            </div>
          ) : (
            myLeads.map((lead) => {
              const isWon = lead.status === 'WON';
              const isLost = lead.status === 'LOST';

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs space-y-3 transition-all hover:border-zinc-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 text-base">
                        {lead.project_name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{lead.site_address}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                        isWon
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : isLost
                          ? 'bg-zinc-100 text-zinc-500'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/80'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-700 bg-zinc-50/80 p-2.5 rounded-xl flex items-center justify-between flex-wrap gap-1 border border-zinc-100">
                    <span className="font-medium">{lead.contact_name} ({lead.contact_role})</span>
                    <span className="font-mono font-semibold text-zinc-900">+91 {lead.contact_phone}</span>
                  </div>

                  {lead.material_requirements && (
                    <div className="text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg">
                      <span className="text-zinc-400">Needs:</span> {lead.material_requirements}
                    </div>
                  )}

                  {/* Call Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${lead.contact_phone}`}
                      onClick={() => setActiveLead(lead)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-medium text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>

                    <button
                      onClick={() => setActiveLead(lead)}
                      className="py-2.5 bg-zinc-100 hover:bg-zinc-200 active:scale-98 text-zinc-800 font-medium text-xs rounded-xl transition-all"
                    >
                      <span>Record Outcome</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: REMINDERS */}
      {activeTab === 'REMINDERS' && (
        <div className="space-y-3">
          {followUps.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 text-center shadow-xs">
              <Check className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <h3 className="font-semibold text-zinc-900 text-sm">No Pending Callbacks</h3>
              <p className="text-xs text-zinc-500 mt-1">All scheduled follow-up calls are completed.</p>
            </div>
          ) : (
            followUps.map((fu) => (
              <div
                key={fu.id}
                className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Scheduled Callback
                  </span>
                  <h4 className="font-semibold text-zinc-900 text-sm mt-1">{fu.lead_project_name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{fu.lead_contact_name} (+91 {fu.lead_contact_phone})</p>
                </div>

                <a
                  href={`tel:${fu.lead_contact_phone}`}
                  className="px-3.5 py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1 flex-shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modern Slide-Up Outcome Sheet */}
      {activeLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl safe-area-bottom">
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4 sm:hidden"></div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">Record Call Outcome</h3>
                <p className="text-xs text-zinc-500">{activeLead.project_name} ({activeLead.contact_name})</p>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Option 1 */}
              <button
                onClick={() => submitOutcome('INTERESTED', 'Customer interested. Quoted rates.')}
                disabled={submittingOutcome}
                className="w-full py-3 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-900">Interested / In Negotiation</div>
                  <div className="text-[11px] text-zinc-500">Discussion in progress; rates sent</div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Option 2 */}
              <button
                onClick={() => submitOutcome('CALLBACK_REQUESTED', 'Customer requested callback tomorrow.')}
                disabled={submittingOutcome}
                className="w-full py-3 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-900">Call Back Tomorrow</div>
                  <div className="text-[11px] text-zinc-500">Adds reminder to your callback schedule</div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Option 3 */}
              <button
                onClick={() => submitOutcome('WON', 'Deal closed / Order booked!')}
                disabled={submittingOutcome}
                className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-emerald-900">Order Confirmed / Won</div>
                  <div className="text-[11px] text-emerald-700">Customer placed material order</div>
                </div>
                <Check className="w-4 h-4 text-emerald-700" />
              </button>

              {/* Option 4 */}
              <button
                onClick={() => submitOutcome('NOT_INTERESTED', 'Not interested / rate high.')}
                disabled={submittingOutcome}
                className="w-full py-3 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-900">Lost / Not Interested</div>
                  <div className="text-[11px] text-zinc-500">Competitor selected or construction paused</div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Optional Call Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Quoted ₹54,000/ton for 20 tons TMT"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
