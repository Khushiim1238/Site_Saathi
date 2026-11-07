'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Download, 
  MapPin, 
  Phone, 
  User, 
  Loader2, 
  ChevronRight,
  ExternalLink,
  Check
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
    const headers = ['Project Name', 'Contact Name', 'Phone', 'Role', 'Site Address', 'Stage', 'Materials', 'Status', 'Field Agent', 'Telecaller', 'Date'];
    const rows = leads.map((l) => [
      `"${l.project_name.replace(/"/g, '""')}"`,
      `"${l.contact_name.replace(/"/g, '""')}"`,
      `"${l.contact_phone}"`,
      `"${l.contact_role}"`,
      `"${l.site_address.replace(/"/g, '""')}"`,
      `"${l.construction_stage}"`,
      `"${(l.material_requirements || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.captured_by_name || ''}"`,
      `"${l.claimed_by_name || ''}"`,
      `"${new Date(l.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `site_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-32 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Site Directory</h1>
          <p className="text-xs text-zinc-500">{leads.length} recorded sites in database</p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={leads.length === 0}
          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-2.5 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search site, person, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-base rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:border-zinc-900"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="UNCLAIMED">Unclaimed Pool</option>
          <option value="CLAIMED">Claimed / In-Calling</option>
          <option value="INTERESTED">Interested</option>
          <option value="WON">Closed Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      {/* Sites List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
            Loading sites...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-zinc-200/80 text-center text-xs text-zinc-400 shadow-xs">
            No sites match your criteria.
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => handleInspectLead(lead.id)}
              className="w-full bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900 text-sm sm:text-base leading-tight">
                    {lead.project_name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                    <span className="truncate">{lead.site_address}</span>
                  </p>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${
                  lead.status === 'WON'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : lead.status === 'LOST'
                    ? 'bg-zinc-100 text-zinc-500'
                    : lead.status === 'UNCLAIMED'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-zinc-100 text-zinc-800'
                }`}>
                  {lead.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-700 bg-zinc-50/80 p-2 rounded-xl flex-wrap gap-1 border border-zinc-100">
                <span className="font-medium">{lead.contact_name} ({lead.contact_role})</span>
                <span className="font-mono font-semibold text-zinc-900">+91 {lead.contact_phone}</span>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                <span className="text-zinc-900 font-medium text-xs flex items-center gap-0.5">
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Slide-Up Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl safe-area-bottom">
            <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4 sm:hidden"></div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">{selectedLead.lead.project_name}</h3>
                <p className="text-xs text-zinc-500">{selectedLead.lead.site_address}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-50 p-3.5 rounded-2xl space-y-1.5 border border-zinc-100">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Contact Person:</span>
                  <span className="font-semibold text-zinc-900">{selectedLead.lead.contact_name} ({selectedLead.lead.contact_role})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Phone:</span>
                  <span className="font-mono font-semibold text-zinc-900">+91 {selectedLead.lead.contact_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Stage:</span>
                  <span className="font-medium text-zinc-800">{selectedLead.lead.construction_stage}</span>
                </div>
                {selectedLead.lead.material_requirements && (
                  <div className="pt-1 text-zinc-700">
                    <span className="text-zinc-400">Needs:</span> {selectedLead.lead.material_requirements}
                  </div>
                )}
                {selectedLead.lead.maps_url && (
                  <div className="pt-1">
                    <a
                      href={selectedLead.lead.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-900 font-semibold underline flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-zinc-600" /> View on Google Maps
                    </a>
                  </div>
                )}
              </div>

              {/* Call Records */}
              <div>
                <h4 className="font-semibold text-zinc-900 mb-2">Call Records ({selectedLead.callLogs?.length || 0})</h4>
                {selectedLead.callLogs?.length === 0 ? (
                  <p className="text-zinc-400 italic">No calls made yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedLead.callLogs.map((log: any) => (
                      <div key={log.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex justify-between font-semibold text-zinc-900">
                          <span>{log.call_status}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        {log.notes && <p className="text-zinc-600 mt-1">{log.notes}</p>}
                        <div className="text-[10px] text-zinc-400 mt-1">Caller: {log.caller_name || 'Staff'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
