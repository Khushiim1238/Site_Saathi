'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  MapPin, 
  Phone, 
  User, 
  Building2, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Plus,
  ArrowRight,
  History,
  X,
  Compass,
  FileText
} from 'lucide-react';

const COMMON_MATERIALS = [
  'TMT Steel',
  'Cement 53/43',
  'Ready Mix (RMC)',
  'Red Bricks',
  'AAC Blocks',
  'Coarse Sand',
  'Tiles & Marble',
  'Putty & Paint',
];

const ROLES = [
  { id: 'CONTRACTOR', label: 'Contractor' },
  { id: 'OWNER', label: 'Property Owner' },
  { id: 'BUILDER', label: 'Builder / Developer' },
  { id: 'SITE_ENGINEER', label: 'Site Engineer' },
];

const STAGES = [
  'Foundation',
  'Brickwork',
  'Plastering',
  'Flooring',
  'Finishing',
];

const DRAFT_STORAGE_KEY = 'sitetrack_field_draft_v2';

export default function FieldAgentPage() {
  const { currentUser } = useUser();

  // Form inputs
  const [projectName, setProjectName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('CONTRACTOR');
  const [siteAddress, setSiteAddress] = useState('');
  const [constructionStage, setConstructionStage] = useState('Foundation');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingGps, setGettingGps] = useState(false);

  // Draft Restored Indicator
  const [draftRestored, setDraftRestored] = useState(false);

  // Duplicate Check
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<any | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Past submissions view
  const [showHistory, setShowHistory] = useState(false);
  const [myLeads, setMyLeads] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. RESTORE DRAFT ON PAGE LOAD (Prevents data loss on accidental refresh)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.projectName || parsed.contactPhone || parsed.contactName || parsed.siteAddress) {
          if (parsed.projectName) setProjectName(parsed.projectName);
          if (parsed.contactName) setContactName(parsed.contactName);
          if (parsed.contactPhone) setContactPhone(parsed.contactPhone);
          if (parsed.contactRole) setContactRole(parsed.contactRole);
          if (parsed.siteAddress) setSiteAddress(parsed.siteAddress);
          if (parsed.constructionStage) setConstructionStage(parsed.constructionStage);
          if (Array.isArray(parsed.selectedMaterials)) setSelectedMaterials(parsed.selectedMaterials);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.latitude) setLatitude(parsed.latitude);
          if (parsed.longitude) setLongitude(parsed.longitude);
          setDraftRestored(true);
        }
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage', e);
    }
  }, []);

  // 2. AUTO-SAVE DRAFT ON EVERY FIELD CHANGE
  useEffect(() => {
    const hasAnyData =
      projectName ||
      contactName ||
      contactPhone ||
      siteAddress ||
      notes ||
      selectedMaterials.length > 0 ||
      latitude;

    if (hasAnyData) {
      const draftObj = {
        projectName,
        contactName,
        contactPhone,
        contactRole,
        siteAddress,
        constructionStage,
        selectedMaterials,
        notes,
        latitude,
        longitude,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
      } catch (e) {
        // silent
      }
    }
  }, [
    projectName,
    contactName,
    contactPhone,
    contactRole,
    siteAddress,
    constructionStage,
    selectedMaterials,
    notes,
    latitude,
    longitude,
  ]);

  // Discard draft manually
  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setProjectName('');
    setContactName('');
    setContactPhone('');
    setSiteAddress('');
    setSelectedMaterials([]);
    setNotes('');
    setLatitude(null);
    setLongitude(null);
    setDraftRestored(false);
  };

  // Phone validation & instant duplicate check
  useEffect(() => {
    const clean = contactPhone.replace(/\D/g, '');
    if (clean.length === 10) {
      setCheckingPhone(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/leads/check-phone?phone=${clean}`);
          const data = await res.json();
          if (data.exists) {
            setDuplicateLead(data.lead);
          } else {
            setDuplicateLead(null);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setCheckingPhone(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDuplicateLead(null);
      setCheckingPhone(false);
    }
  }, [contactPhone]);

  // Fetch GPS
  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported on this device.');
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGettingGps(false);
      },
      (err) => {
        alert('Could not fetch GPS: ' + err.message);
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleMaterial = (item: string) => {
    if (selectedMaterials.includes(item)) {
      setSelectedMaterials(selectedMaterials.filter((m) => m !== item));
    } else {
      setSelectedMaterials([...selectedMaterials, item]);
    }
  };

  const loadMyHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/leads?captured_by_id=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setMyLeads(data.leads);
        setShowHistory(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('Please select active agent role.');
      return;
    }

    if (duplicateLead) {
      setFormError('This phone number already exists in the system.');
      return;
    }

    const clean = contactPhone.replace(/\D/g, '');
    if (clean.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);

    try {
      const activeAgentId = currentUser?.id || 'usr_agent1';

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_role: contactRole,
          site_address: siteAddress,
          latitude,
          longitude,
          construction_stage: constructionStage,
          material_requirements: selectedMaterials.join(', '),
          notes,
          captured_by_id: activeAgentId,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        // Response wasn't valid JSON
      }

      if (res.ok && data?.success) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftRestored(false);
        setSuccessMessage(true);

        // Reset form
        setProjectName('');
        setContactName('');
        setContactPhone('');
        setSiteAddress('');
        setSelectedMaterials([]);
        setNotes('');
        setLatitude(null);
        setLongitude(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(data?.error || `Server responded with error (${res.status}). Please try again.`);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Network connection failed. Please check internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Log Construction Site</h1>
          <p className="text-xs text-zinc-500">
            Agent: <span className="font-semibold text-zinc-800">{mounted && currentUser?.name ? currentUser.name.split(' ')[0] : 'Agent'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={loadMyHistory}
          className="text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <History className="w-3.5 h-3.5 text-zinc-500" />
          <span>My History</span>
        </button>
      </div>

      {/* Auto-Draft Notification */}
      {draftRestored && (
        <div className="mb-4 px-3.5 py-2.5 bg-zinc-100 border border-zinc-200/90 rounded-2xl flex items-center justify-between text-xs text-zinc-700 shadow-xs">
          <span>Restored unsaved draft from this phone</span>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="text-[11px] font-semibold text-zinc-900 underline hover:text-black ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Site Successfully Logged</h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Lead is now visible in the central pool for the telecalling desk to follow up.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(false)}
            className="text-emerald-700 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {formError && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* GROUP 1: CONTACT DETAILS */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-zinc-500" />
            <span>Contact Details</span>
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-700">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              {checkingPhone ? (
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
                </span>
              ) : contactPhone.length === 10 && !duplicateLead ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Ready
                </span>
              ) : null}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm font-semibold text-zinc-400 font-mono">+91</span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="98765 43210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={`w-full pl-13 pr-3.5 py-2.5 text-base rounded-xl border font-mono tracking-wider focus:outline-none transition-all ${
                  duplicateLead
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900'
                    : 'border-zinc-200 bg-zinc-50/60 focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
                }`}
              />
            </div>

            {duplicateLead && (
              <div className="mt-2 p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-800">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Duplicate Found
                </div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Already logged for <strong>{duplicateLead.project_name}</strong> by {duplicateLead.captured_by_name || 'Agent'}.
                </p>
              </div>
            )}
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Thekedar"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>

          {/* Role Segmented Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Role at Site
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setContactRole(r.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    contactRole === r.id
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-zinc-50/80 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GROUP 2: SITE & LOCATION */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Site &amp; Location</span>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Site / Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Skyline Heights Tower C"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>

          {/* Address & GPS */}
          <div>
            <div className="flex items-center justify-between mb-1 gap-2">
              <label className="text-xs font-medium text-zinc-700">
                Site Location &amp; Landmark <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFetchGps}
                disabled={gettingGps}
                className="text-[11px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
              >
                {gettingGps ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-zinc-900" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3 text-zinc-600" />
                    <span>{latitude ? 'GPS Attached' : 'Auto-Tag GPS'}</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Plot number, Sector, Road, Landmark..."
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />

            {latitude && longitude && (
              <div className="mt-1.5 px-3 py-1.5 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between text-[11px] text-zinc-600 font-mono">
                <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                <a
                  href={`https://maps.google.com/?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans font-medium text-zinc-900 hover:underline flex items-center gap-0.5"
                >
                  View Map <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* GROUP 3: REQUIREMENTS & STAGE */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Requirements</span>
          </div>

          {/* Construction Stage */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Construction Stage
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((stg) => (
                <button
                  type="button"
                  key={stg}
                  onClick={() => setConstructionStage(stg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    constructionStage === stg
                      ? 'bg-zinc-900 text-white font-semibold'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          {/* Materials Chips */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Materials Needed
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_MATERIALS.map((mat) => {
                const isSelected = selectedMaterials.includes(mat);
                return (
                  <button
                    type="button"
                    key={mat}
                    onClick={() => toggleMaterial(mat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 font-semibold shadow-xs'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{mat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Field Notes for Caller (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Call in evening / needs 20 tons TMT by Friday"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base rounded-xl border border-zinc-200 bg-zinc-50/60 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>

        {/* Floating Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !!duplicateLead}
            className={`w-full py-3.5 rounded-2xl text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
              duplicateLead
                ? 'bg-zinc-300 cursor-not-allowed text-zinc-500'
                : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Submitting Site...</span>
              </>
            ) : (
              <>
                <span>Submit to Calling Pool</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl safe-area-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">My Submissions</h3>
                <p className="text-xs text-zinc-400">{myLeads.length} sites logged by you</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {myLeads.length === 0 ? (
                <p className="text-center text-xs text-zinc-400 py-8">No sites submitted yet.</p>
              ) : (
                myLeads.map((lead) => (
                  <div key={lead.id} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-zinc-900">{lead.project_name}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 uppercase">
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 mt-0.5">{lead.site_address}</p>
                    <div className="mt-2 pt-2 border-t border-zinc-200/50 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{lead.contact_name} (+91 {lead.contact_phone})</span>
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
