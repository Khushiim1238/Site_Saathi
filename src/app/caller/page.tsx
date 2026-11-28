'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  PhoneCall, 
  Phone, 
  Check, 
  MapPin, 
  Loader2, 
  ChevronRight
} from 'lucide-react';
import { Lead } from '@/lib/types';

export default function CallingDeskPage() {
  const { staffName, openStaffNamePrompt } = useUser();

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
    if (!isBackground) setInitialLoading(true);

    try {
      const callerId = 'user_caller_1';
      const poolPromise = fetch('/api/leads?status=UNCLAIMED').then((r) => r.json());
      const myLeadsPromise = fetch(`/api/leads?claimed_by_name=${encodeURIComponent(staffName || 'Staff')}`).then((r) => r.json());
      const fuPromise = fetch(`/api/followups?status=PENDING`).then((r) => r.json());

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
  }, [staffName]);

  // Real-time auto-refresh in background every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAllData(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [staffName]);

  // Claim Lead
  const handleClaim = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_id: 'user_caller_1', caller_name: staffName || 'Staff' }),
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
    if (!activeLead) return;
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
          caller_id: 'user_caller_1',
          caller_name: staffName || 'Staff',
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
      } else {
        alert(data.error || 'Failed to record call');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingOutcome(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Telecalling Desk</h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium">
            <span>Caller:</span>
            <button
              type="button"
              onClick={openStaffNamePrompt}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-0.5 cursor-pointer"
            >
              <span>{staffName || 'Staff'}</span>
              <span className="text-slate-400 text-[10px]">✎</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-slate-600 text-xs font-medium border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium w-full">
        <button
          type="button"
          onClick={() => setActiveTab('POOL')}
          className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'POOL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Available</span>
          {poolLeads.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-slate-200 text-slate-800 text-[10px] font-mono font-bold flex items-center justify-center">
              {poolLeads.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MY_CALLS')}
          className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'MY_CALLS' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>My Leads</span>
          {myLeads.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-slate-800 text-white text-[10px] font-mono font-bold flex items-center justify-center">
              {myLeads.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REMINDERS')}
          className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'REMINDERS' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Callbacks</span>
          {followUps.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
              {followUps.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AVAILABLE POOL */}
      {activeTab === 'POOL' && (
        <div className="space-y-2.5">
          {initialLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
              Loading pool leads...
            </div>
          ) : poolLeads.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200/90 text-center shadow-2xs">
              <Check className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">No Unclaimed Leads</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                All leads have been claimed. As field agents add new sites, they appear here live.
              </p>
            </div>
          ) : (
            poolLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                      {lead.project_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lead.site_address}</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                    {lead.construction_stage}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-lg text-xs space-y-1 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Contact:</span>
                    <span className="font-semibold text-slate-800">{lead.contact_name} ({lead.contact_role})</span>
                  </div>
                  {lead.material_requirements && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Needs:</span> {lead.material_requirements}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-xs text-slate-500 font-medium truncate">
                    Logged by <strong className="text-slate-800">{lead.captured_by_name || 'Field Staff'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleClaim(lead.id)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Claim Lead</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MY CLAIMED LEADS */}
      {activeTab === 'MY_CALLS' && (
        <div className="space-y-2.5">
          {initialLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
              Loading your leads...
            </div>
          ) : myLeads.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200/90 text-center shadow-2xs">
              <Phone className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">No Active Leads</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Go to the Available tab to claim site leads and begin calling.
              </p>
            </div>
          ) : (
            myLeads.map((lead) => {
              const isWon = lead.status === 'WON';
              const isLost = lead.status === 'LOST';

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                        {lead.project_name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.site_address}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                        isWon
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isLost
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="text-xs bg-slate-50/80 p-2.5 rounded-lg flex items-center justify-between flex-wrap gap-1 border border-slate-100">
                    <span className="font-semibold text-slate-800">{lead.contact_name} ({lead.contact_role})</span>
                    <span className="font-mono font-bold text-slate-900">+91 {lead.contact_phone}</span>
                  </div>

                  {lead.material_requirements && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400">Needs:</span> {lead.material_requirements}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${lead.contact_phone}`}
                      onClick={() => setActiveLead(lead)}
                      className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveLead(lead)}
                      className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
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
        <div className="space-y-2.5">
          {followUps.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200/90 text-center shadow-2xs">
              <Check className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 text-sm">No Pending Callbacks</h3>
              <p className="text-xs text-slate-500 mt-1">All scheduled follow-up calls are completed.</p>
            </div>
          ) : (
            followUps.map((fu) => (
              <div
                key={fu.id}
                className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Scheduled Callback
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{fu.lead_project_name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{fu.lead_contact_name} (+91 {fu.lead_contact_phone})</p>
                </div>

                <a
                  href={`tel:${fu.lead_contact_phone}`}
                  className="px-3.5 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg shadow-2xs flex items-center gap-1 shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* Slide-Up Outcome Sheet */}
      {activeLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Record Call Outcome</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeLead.project_name} ({activeLead.contact_name})</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLead(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {/* Option 1 */}
              <button
                type="button"
                onClick={() => submitOutcome('INTERESTED', 'Customer interested. Quoted rates.')}
                disabled={submittingOutcome}
                className="w-full py-2.5 px-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Interested / In Negotiation</div>
                  <div className="text-[11px] text-slate-500">Discussion in progress; rates sent</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 2 */}
              <button
                type="button"
                onClick={() => submitOutcome('CALLBACK_REQUESTED', 'Customer requested callback tomorrow.')}
                disabled={submittingOutcome}
                className="w-full py-2.5 px-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Call Back Tomorrow</div>
                  <div className="text-[11px] text-slate-500">Adds reminder to your callback schedule</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Option 3 */}
              <button
                type="button"
                onClick={() => submitOutcome('WON', 'Deal closed / Order booked!')}
                disabled={submittingOutcome}
                className="w-full py-2.5 px-3.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-900">Order Confirmed / Won</div>
                  <div className="text-[11px] text-emerald-700">Customer placed material order</div>
                </div>
                <Check className="w-4 h-4 text-emerald-700" />
              </button>

              {/* Option 4 */}
              <button
                type="button"
                onClick={() => submitOutcome('NOT_INTERESTED', 'Not interested / rate high.')}
                disabled={submittingOutcome}
                className="w-full py-2.5 px-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">Lost / Not Interested</div>
                  <div className="text-[11px] text-slate-500">Competitor selected or construction paused</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Call Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Quoted ₹54,000/ton for 20 tons TMT"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:border-slate-800 font-medium"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
