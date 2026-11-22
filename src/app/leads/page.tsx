'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Search, 
  Download, 
  MapPin, 
  Phone, 
  User, 
  Loader2, 
  ChevronRight,
  ExternalLink,
  Check,
  HardHat,
  PhoneCall,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  Layers
} from 'lucide-react';
import { Lead } from '@/lib/types';

export default function MasterLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Details Modal
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = '/api/leads?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleInspectLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadCsv = () => {
    if (leads.length === 0) return;
    const headers = [
      'Project/Site Name',
      'Address',
      'IHB (Owner) Name',
      'IHB Phone',
      'Contractor Name',
      'Contractor Phone',
      'Engineer Name',
      'Engineer Phone',
      'Stage',
      'Site Area (Sq Ft)',
      'Cement Brand',
      'Cement Rate (Rs)',
      'TMT Brand',
      'Cover Block Sizes',
      'Notes',
      'Status',
      'Logged By (Agent)',
      'Handled By (Caller)',
      'Date'
    ];

    const rows = leads.map((l) => [
      `"${(l.project_name || '').replace(/"/g, '""')}"`,
      `"${(l.site_address || '').replace(/"/g, '""')}"`,
      `"${(l.ihb_name || l.contact_name || '').replace(/"/g, '""')}"`,
      `"${l.ihb_phone || l.contact_phone || ''}"`,
      `"${(l.contractor_name || '').replace(/"/g, '""')}"`,
      `"${l.contractor_phone || ''}"`,
      `"${(l.engineer_name || '').replace(/"/g, '""')}"`,
      `"${l.engineer_phone || ''}"`,
      `"${l.construction_stage || ''}"`,
      `"${l.site_area || ''}"`,
      `"${(l.cement_brand || '').replace(/"/g, '""')}"`,
      `"${l.cement_rate || ''}"`,
      `"${(l.tmt_brand || '').replace(/"/g, '""')}"`,
      `"${(l.cover_block_sizes || l.material_requirements || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.captured_by_name || ''}"`,
      `"${l.claimed_by_name || ''}"`,
      `"${new Date(l.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `vardhman_site_visits_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Site Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {leads.length} recorded site visits across team
          </p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={leads.length === 0}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search site, owner, contractor, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 font-medium transition-all"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="UNCLAIMED">Ready in Pool</option>
          <option value="CLAIMED">In-Calling</option>
          <option value="INTERESTED">Interested</option>
          <option value="WON">Closed Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      {/* Sites List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading sites...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400 shadow-2xs">
            No construction sites match your filter.
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => handleInspectLead(lead.id)}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {lead.ihb_name || lead.project_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lead.site_address}</span>
                  </p>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 ${
                  lead.status === 'WON'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : lead.status === 'LOST'
                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                    : lead.status === 'UNCLAIMED'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {lead.status === 'UNCLAIMED' ? 'In Pool' : lead.status}
                </span>
              </div>

              {/* Stakeholder Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">IHB / Owner</span>
                  <span className="font-bold text-slate-900">{lead.ihb_name || lead.contact_name}</span>
                  {(lead.ihb_phone || lead.contact_phone) && (
                    <span className="font-mono text-slate-600 block text-[11px]">+91 {lead.ihb_phone || lead.contact_phone}</span>
                  )}
                </div>
                {lead.contractor_name && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contractor</span>
                    <span className="font-bold text-slate-900">{lead.contractor_name}</span>
                    {lead.contractor_phone && (
                      <span className="font-mono text-slate-600 block text-[11px]">+91 {lead.contractor_phone}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Brands & Cover Block summary tag */}
              {(lead.cement_brand || lead.cover_block_sizes) && (
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  {lead.cement_brand && (
                    <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200/80">
                      Cement: {lead.cement_brand} {lead.cement_rate ? `(₹${lead.cement_rate})` : ''}
                    </span>
                  )}
                  {lead.tmt_brand && (
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                      TMT: {lead.tmt_brand}
                    </span>
                  )}
                  {lead.cover_block_sizes && (
                    <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200/80">
                      Cover Block: {lead.cover_block_sizes}
                    </span>
                  )}
                </div>
              )}

              {/* Authorship & Accountability Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Logged by <strong className="text-slate-800">{lead.captured_by_name || 'Field Agent'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {lead.claimed_by_name ? (
                      <>Handling: <strong className="text-blue-800 font-bold">{lead.claimed_by_name}</strong></>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-200/80">
                        Ready in Pool
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Slide-Up Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                  Vardhman Site Slip Details
                </span>
                <h3 className="font-black text-slate-900 text-lg leading-tight mt-1">
                  {selectedLead.lead.ihb_name || selectedLead.lead.project_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedLead.lead.site_address}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Team Ownership & Audit Card */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Accountability &amp; Ownership Audit</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60">
                <div>
                  <span className="text-slate-500 text-[11px] block">Field Visit Logged By:</span>
                  <span className="font-bold text-slate-900">{selectedLead.lead.captured_by_name || 'Field Agent'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {new Date(selectedLead.lead.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Assigned Telecaller:</span>
                  <span className="font-bold text-slate-900">
                    {selectedLead.lead.claimed_by_name || 'Unassigned (In Pool)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Status: <strong className="text-blue-700">{selectedLead.lead.status}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Contacts on Site Card */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Site Stakeholders</h4>
              
              {/* IHB */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">IHB / Property Owner</span>
                  <span className="font-bold text-slate-900">{selectedLead.lead.ihb_name || selectedLead.lead.contact_name}</span>
                </div>
                {(selectedLead.lead.ihb_phone || selectedLead.lead.contact_phone) && (
                  <a
                    href={`tel:${selectedLead.lead.ihb_phone || selectedLead.lead.contact_phone}`}
                    className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    +91 {selectedLead.lead.ihb_phone || selectedLead.lead.contact_phone}
                  </a>
                )}
              </div>

              {/* Contractor */}
              {selectedLead.lead.contractor_name && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contractor</span>
                    <span className="font-bold text-slate-900">{selectedLead.lead.contractor_name}</span>
                  </div>
                  {selectedLead.lead.contractor_phone && (
                    <a
                      href={`tel:${selectedLead.lead.contractor_phone}`}
                      className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      +91 {selectedLead.lead.contractor_phone}
                    </a>
                  )}
                </div>
              )}

              {/* Engineer */}
              {selectedLead.lead.engineer_name && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Site Engineer</span>
                    <span className="font-bold text-slate-900">{selectedLead.lead.engineer_name}</span>
                  </div>
                  {selectedLead.lead.engineer_phone && (
                    <a
                      href={`tel:${selectedLead.lead.engineer_phone}`}
                      className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      +91 {selectedLead.lead.engineer_phone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Material & Construction Specs */}
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Material &amp; Site Specs</h4>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Working Stage</span>
                  <span className="font-bold text-slate-900">{selectedLead.lead.construction_stage}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Site Area</span>
                  <span className="font-bold text-slate-900">{selectedLead.lead.site_area ? `${selectedLead.lead.site_area} Sq. Ft.` : 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Cement Brand (Use Brand)</span>
                  <span className="font-bold text-blue-700">
                    {selectedLead.lead.cement_brand || 'Not Specified'}
                    {selectedLead.lead.cement_rate ? ` @ ₹${selectedLead.lead.cement_rate}/bag` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">TMT Steel Brand</span>
                  <span className="font-bold text-slate-900">{selectedLead.lead.tmt_brand || 'Not Specified'}</span>
                </div>
              </div>

              {(selectedLead.lead.cover_block_sizes || selectedLead.lead.material_requirements) && (
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Cover Block Needs</span>
                  <span className="font-bold text-amber-900">
                    {selectedLead.lead.cover_block_sizes || selectedLead.lead.material_requirements}
                  </span>
                </div>
              )}

              {selectedLead.lead.notes && (
                <div className="pt-2 border-t border-slate-200/70 text-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Field Notes / Remarks</span>
                  <p className="mt-0.5">{selectedLead.lead.notes}</p>
                </div>
              )}

              {selectedLead.lead.maps_url && (
                <div className="pt-2 border-t border-slate-200/80">
                  <a
                    href={selectedLead.lead.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-bold underline flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" /> View Site on Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Call History Audit */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">
                Call History &amp; Outcomes ({selectedLead.callLogs?.length || 0})
              </h4>
              {selectedLead.callLogs?.length === 0 ? (
                <p className="text-slate-400 italic p-3 bg-slate-50 rounded-xl text-center">No calls made yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedLead.callLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span className="text-blue-700">{log.call_status}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {log.notes && <p className="text-slate-700 mt-1 font-medium">{log.notes}</p>}
                      <div className="text-[11px] text-slate-500 mt-1.5 pt-1 border-t border-slate-200/70">
                        Called by: <strong className="text-slate-800">{log.caller_name || 'Staff'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
