'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  MapPin, 
  Phone, 
  Loader2, 
  ChevronRight,
  HardHat,
  PhoneCall,
  Calendar,
  Layers,
  CheckCircle2,
  FileText
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
    let localList: any[] = [];
    try {
      const stored = localStorage.getItem('veer_local_logged_sites_v2');
      if (stored) localList = JSON.parse(stored);
    } catch {
      // silent
    }

    try {
      let url = '/api/leads?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const serverLeads = Array.isArray(data.leads) ? data.leads : [];
        const merged = [...serverLeads];
        for (const loc of localList) {
          if (!merged.some((m) => m.id === loc.id || (m.contact_phone && m.contact_phone === loc.contact_phone))) {
            merged.unshift(loc);
          }
        }
        setLeads(merged);
      } else if (localList.length > 0) {
        setLeads(localList);
      }
    } catch (e) {
      console.error(e);
      if (localList.length > 0) {
        setLeads(localList);
      }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Won
          </span>
        );
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Lost
          </span>
        );
      case 'UNCLAIMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            In Pool
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Site Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            <span className="font-mono font-semibold text-slate-800">{leads.length}</span> site visits recorded across operations
          </p>
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={leads.length === 0}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-2 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search site, owner, contractor, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:border-slate-800 font-medium"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none text-slate-700 cursor-pointer"
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
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            Loading site directory...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-xs text-slate-400 shadow-2xs">
            No construction sites match your filter.
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => handleInspectLead(lead.id)}
              className="w-full bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:border-slate-400/80 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">
                    {lead.ihb_name || lead.project_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{lead.site_address}</span>
                  </p>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(lead.status)}
                </div>
              </div>

              {/* Stakeholder Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 text-[11px] block">Owner / IHB</span>
                  <span className="font-semibold text-slate-800">{lead.ihb_name || lead.contact_name}</span>
                  {(lead.ihb_phone || lead.contact_phone) && (
                    <span className="font-mono text-slate-500 block text-[11px]">+91 {lead.ihb_phone || lead.contact_phone}</span>
                  )}
                </div>
                {lead.contractor_name && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">Contractor</span>
                    <span className="font-semibold text-slate-800">{lead.contractor_name}</span>
                    {lead.contractor_phone && (
                      <span className="font-mono text-slate-500 block text-[11px]">+91 {lead.contractor_phone}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Brands & Cover Block summary tag */}
              {(lead.cement_brand || lead.cover_block_sizes) && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-600">
                  {lead.cement_brand && (
                    <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Cement: {lead.cement_brand} {lead.cement_rate ? `(₹${lead.cement_rate})` : ''}
                    </span>
                  )}
                  {lead.tmt_brand && (
                    <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      TMT: {lead.tmt_brand}
                    </span>
                  )}
                  {lead.cover_block_sizes && (
                    <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Cover Block: {lead.cover_block_sizes}
                    </span>
                  )}
                </div>
              )}

              {/* Accountability Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Logged by <strong className="text-slate-800">{lead.captured_by_name || 'Field Staff'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {lead.claimed_by_name ? (
                      <>Handling: <strong className="text-slate-800">{lead.claimed_by_name}</strong></>
                    ) : (
                      <span className="text-slate-500 font-medium">Unassigned</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Site Visit Record
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug mt-0.5">
                  {selectedLead.lead.ihb_name || selectedLead.lead.project_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedLead.lead.site_address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Team Ownership Audit Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Accountability Audit</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-500 text-[11px] block">Logged By:</span>
                  <span className="font-semibold text-slate-900">{selectedLead.lead.captured_by_name || 'Field Staff'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {new Date(selectedLead.lead.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Handling Telecaller:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedLead.lead.claimed_by_name || 'Unassigned (In Pool)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Status: <strong className="text-slate-700">{selectedLead.lead.status}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Contacts on Site Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl space-y-2.5 border border-slate-200/80 text-xs">
              <h4 className="font-semibold text-slate-800 text-xs">Site Stakeholders</h4>
              
              {/* IHB */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px] block">Owner / IHB</span>
                  <span className="font-semibold text-slate-900">{selectedLead.lead.ihb_name || selectedLead.lead.contact_name}</span>
                </div>
                {(selectedLead.lead.ihb_phone || selectedLead.lead.contact_phone) && (
                  <a
                    href={`tel:${selectedLead.lead.ihb_phone || selectedLead.lead.contact_phone}`}
                    className="font-mono text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs hover:bg-slate-50"
                  >
                    <Phone className="w-3 h-3 text-slate-500" />
                    +91 {selectedLead.lead.ihb_phone || selectedLead.lead.contact_phone}
                  </a>
                )}
              </div>

              {/* Contractor */}
              {selectedLead.lead.contractor_name && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Contractor</span>
                    <span className="font-semibold text-slate-900">{selectedLead.lead.contractor_name}</span>
                  </div>
                  {selectedLead.lead.contractor_phone && (
                    <a
                      href={`tel:${selectedLead.lead.contractor_phone}`}
                      className="font-mono text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs hover:bg-slate-50"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      +91 {selectedLead.lead.contractor_phone}
                    </a>
                  )}
                </div>
              )}

              {/* Engineer */}
              {selectedLead.lead.engineer_name && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Site Engineer</span>
                    <span className="font-semibold text-slate-900">{selectedLead.lead.engineer_name}</span>
                  </div>
                  {selectedLead.lead.engineer_phone && (
                    <a
                      href={`tel:${selectedLead.lead.engineer_phone}`}
                      className="font-mono text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shadow-2xs hover:bg-slate-50"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      +91 {selectedLead.lead.engineer_phone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Material & Construction Specs */}
            <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-200/80 text-xs">
              <h4 className="font-semibold text-slate-800 text-xs">Material &amp; Site Specs</h4>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 text-[11px] block">Stage</span>
                  <span className="font-semibold text-slate-900">{selectedLead.lead.construction_stage}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Site Area</span>
                  <span className="font-semibold text-slate-900">{selectedLead.lead.site_area ? `${selectedLead.lead.site_area} Sq. Ft.` : 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Cement Brand</span>
                  <span className="font-semibold text-slate-900">
                    {selectedLead.lead.cement_brand || 'Not Specified'}
                    {selectedLead.lead.cement_rate ? ` @ ₹${selectedLead.lead.cement_rate}/bag` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">TMT Brand</span>
                  <span className="font-semibold text-slate-900">{selectedLead.lead.tmt_brand || 'Not Specified'}</span>
                </div>
              </div>

              {(selectedLead.lead.cover_block_sizes || selectedLead.lead.material_requirements) && (
                <div className="pt-2 border-t border-slate-200/70">
                  <span className="text-slate-500 text-[11px] block">Cover Block Requirements</span>
                  <span className="font-semibold text-slate-900">
                    {selectedLead.lead.cover_block_sizes || selectedLead.lead.material_requirements}
                  </span>
                </div>
              )}

              {selectedLead.lead.notes && (
                <div className="pt-2 border-t border-slate-200/70 text-slate-700">
                  <span className="text-slate-500 text-[11px] block">Field Remarks</span>
                  <p className="mt-0.5">{selectedLead.lead.notes}</p>
                </div>
              )}

              {selectedLead.lead.maps_url && (
                <div className="pt-2 border-t border-slate-200/80">
                  <a
                    href={selectedLead.lead.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-700 hover:text-slate-900 font-semibold underline flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" /> View on Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Call History Audit */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-slate-900 text-xs">
                Call History ({selectedLead.callLogs?.length || 0})
              </h4>
              {selectedLead.callLogs?.length === 0 ? (
                <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg text-center">No calls logged yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedLead.callLogs.map((log: any) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{log.call_status}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {log.notes && <p className="text-slate-600 mt-1">{log.notes}</p>}
                      <div className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60">
                        Caller: <strong className="text-slate-700">{log.caller_name || 'Staff'}</strong>
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
