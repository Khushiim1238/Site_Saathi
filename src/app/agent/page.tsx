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
  FileText,
  Calendar,
  Layers,
  Sparkles,
  HardHat
} from 'lucide-react';

const CEMENT_BRANDS = [
  'JK PRO+',
  'JK Super',
  'UltraTech',
  'Wonder',
  'Shree Cement',
  'Other',
];

const TMT_BRANDS = [
  'Rathi',
  'Jindal Panther',
  'Tata Tiscon',
  'Kamdhenu',
  'Other',
];

const STAGES = [
  'Foundation',
  'Plinth',
  'Slab / Chhat Casting',
  'Brickwork',
  'Plastering',
  'Finishing',
];

const COVER_BLOCK_SIZES = [
  { id: 'Slab 20mm', label: 'Slab (20mm)' },
  { id: 'Beam 25mm', label: 'Beam (25mm)' },
  { id: 'Column 40mm', label: 'Column (40mm)' },
  { id: 'Footing 50mm', label: 'Footing (50mm)' },
];

const DRAFT_STORAGE_KEY = 'vardhman_site_visit_draft_v3';

interface SubmittedSiteInfo {
  id: string;
  projectName: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  constructionStage: string;
  siteArea: string;
  cementBrand: string;
  cementRate: string;
  tmtBrand: string;
  coverBlocks: string;
  timestamp: string;
}

export default function FieldAgentPage() {
  const { currentUser } = useUser();
  const [mounted, setMounted] = useState(false);

  // Form Fields mapped to Vardhman Site Visit Slip
  const [visitDate, setVisitDate] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  // Stakeholders
  const [ihbName, setIhbName] = useState('');
  const [ihbPhone, setIhbPhone] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [engineerName, setEngineerName] = useState('');
  const [engineerPhone, setEngineerPhone] = useState('');

  // Stage & Area
  const [constructionStage, setConstructionStage] = useState('Foundation');
  const [siteArea, setSiteArea] = useState('');

  // Materials & Brands
  const [cementBrand, setCementBrand] = useState('JK PRO+');
  const [customCementBrand, setCustomCementBrand] = useState('');
  const [cementRate, setCementRate] = useState('');
  const [tmtBrand, setTmtBrand] = useState('Rathi');
  const [customTmtBrand, setCustomTmtBrand] = useState('');

  // Veer Products (Cover Block) & Notes
  const [selectedCoverBlocks, setSelectedCoverBlocks] = useState<string[]>(['Slab 20mm']);
  const [notes, setNotes] = useState('');

  // GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingGps, setGettingGps] = useState(false);

  // Draft restored
  const [draftRestored, setDraftRestored] = useState(false);

  // Duplicate check
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<any | null>(null);

  // Submission state & confirmation
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [lastSubmittedSite, setLastSubmittedSite] = useState<SubmittedSiteInfo | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Past submissions history drawer
  const [showHistory, setShowHistory] = useState(false);
  const [myLeads, setMyLeads] = useState<any[]>([]);

  const LOCAL_SAVED_SITES_KEY = 'veer_local_logged_sites_v2';

  const fetchRecentSubmissions = async () => {
    let localList: any[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_SAVED_SITES_KEY);
      if (stored) {
        localList = JSON.parse(stored);
      }
    } catch {
      // silent
    }

    try {
      const url = currentUser?.id ? `/api/leads?captured_by_id=${currentUser.id}` : '/api/leads';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        // Merge server leads with local storage leads to guarantee zero data loss on Vercel
        const combined = [...data.leads];
        for (const loc of localList) {
          if (!combined.some((c) => c.id === loc.id || (c.contact_phone && c.contact_phone === loc.contact_phone))) {
            combined.unshift(loc);
          }
        }
        setRecentSubmissions(combined.slice(0, 8));
        return;
      }
    } catch (e) {
      // silent
    }

    if (localList.length > 0) {
      setRecentSubmissions(localList.slice(0, 8));
    }
  };

  useEffect(() => {
    setMounted(true);
    setVisitDate(new Date().toISOString().split('T')[0]);
    fetchRecentSubmissions();
  }, [currentUser?.id]);

  // Restore unsaved draft on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.siteAddress || d.ihbName || d.ihbPhone || d.contractorPhone) {
          if (d.siteAddress) setSiteAddress(d.siteAddress);
          if (d.ihbName) setIhbName(d.ihbName);
          if (d.ihbPhone) setIhbPhone(d.ihbPhone);
          if (d.contractorName) setContractorName(d.contractorName);
          if (d.contractorPhone) setContractorPhone(d.contractorPhone);
          if (d.engineerName) setEngineerName(d.engineerName);
          if (d.engineerPhone) setEngineerPhone(d.engineerPhone);
          if (d.constructionStage) setConstructionStage(d.constructionStage);
          if (d.siteArea) setSiteArea(d.siteArea);
          if (d.cementBrand) setCementBrand(d.cementBrand);
          if (d.cementRate) setCementRate(d.cementRate);
          if (d.tmtBrand) setTmtBrand(d.tmtBrand);
          if (Array.isArray(d.selectedCoverBlocks)) setSelectedCoverBlocks(d.selectedCoverBlocks);
          if (d.notes) setNotes(d.notes);
          if (d.latitude) setLatitude(d.latitude);
          if (d.longitude) setLongitude(d.longitude);
          setDraftRestored(true);
        }
      }
    } catch (e) {
      // silent
    }
  }, []);

  // Auto-save draft on every change
  useEffect(() => {
    const hasData = siteAddress || ihbName || ihbPhone || contractorName || contractorPhone || notes || latitude;
    if (hasData) {
      try {
        const draftObj = {
          visitDate,
          siteAddress,
          ihbName,
          ihbPhone,
          contractorName,
          contractorPhone,
          engineerName,
          engineerPhone,
          constructionStage,
          siteArea,
          cementBrand,
          cementRate,
          tmtBrand,
          selectedCoverBlocks,
          notes,
          latitude,
          longitude,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftObj));
      } catch (e) {
        // silent
      }
    }
  }, [
    visitDate,
    siteAddress,
    ihbName,
    ihbPhone,
    contractorName,
    contractorPhone,
    engineerName,
    engineerPhone,
    constructionStage,
    siteArea,
    cementBrand,
    cementRate,
    tmtBrand,
    selectedCoverBlocks,
    notes,
    latitude,
    longitude,
  ]);

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSiteAddress('');
    setIhbName('');
    setIhbPhone('');
    setContractorName('');
    setContractorPhone('');
    setEngineerName('');
    setEngineerPhone('');
    setSiteArea('');
    setCementRate('');
    setNotes('');
    setLatitude(null);
    setLongitude(null);
    setDraftRestored(false);
    setDuplicateLead(null);
  };

  // Instant Duplicate Check on any 10-digit phone number entered
  const primaryPhone = ihbPhone || contractorPhone || engineerPhone;
  useEffect(() => {
    const clean = primaryPhone.replace(/\D/g, '');
    if (clean.length === 10) {
      setCheckingPhone(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/leads/check-phone?phone=${clean}`);
          const data = await res.json();
          if (data.exists && data.lead) {
            setDuplicateLead(data.lead);
          } else {
            setDuplicateLead(null);
          }
        } catch (e) {
          // silent
        } finally {
          setCheckingPhone(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setDuplicateLead(null);
      setCheckingPhone(false);
    }
  }, [primaryPhone]);

  const handleFetchGps = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported on this browser.');
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

  const toggleCoverBlock = (sizeId: string) => {
    if (selectedCoverBlocks.includes(sizeId)) {
      setSelectedCoverBlocks(selectedCoverBlocks.filter((s) => s !== sizeId));
    } else {
      setSelectedCoverBlocks([...selectedCoverBlocks, sizeId]);
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

    const agentId = currentUser?.id || 'user_agent_1';

    if (!siteAddress.trim()) {
      setFormError('Please enter the Site Address / Location.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const cleanIhbPhone = ihbPhone.replace(/\D/g, '');
    const cleanContractorPhone = contractorPhone.replace(/\D/g, '');
    const cleanEngineerPhone = engineerPhone.replace(/\D/g, '');

    const effectivePhone = cleanIhbPhone || cleanContractorPhone || cleanEngineerPhone;
    if (!effectivePhone || effectivePhone.length !== 10) {
      setFormError('Please enter at least one valid 10-digit mobile number (IHB, Contractor, or Engineer).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (duplicateLead) {
      setFormError('A site with this mobile number has already been recorded.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    const finalCementBrand = cementBrand === 'Other' && customCementBrand.trim() ? customCementBrand.trim() : cementBrand;
    const finalTmtBrand = tmtBrand === 'Other' && customTmtBrand.trim() ? customTmtBrand.trim() : tmtBrand;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ihb_name: ihbName.trim(),
          ihb_phone: cleanIhbPhone,
          contractor_name: contractorName.trim(),
          contractor_phone: cleanContractorPhone,
          engineer_name: engineerName.trim(),
          engineer_phone: cleanEngineerPhone,
          site_address: siteAddress.trim(),
          construction_stage: constructionStage,
          site_area: siteArea.trim(),
          cement_brand: finalCementBrand,
          cement_rate: cementRate.trim(),
          tmt_brand: finalTmtBrand,
          cover_block_sizes: selectedCoverBlocks.join(', '),
          notes: notes.trim(),
          latitude,
          longitude,
          captured_by_id: agentId,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        const resolvedContactName = ihbName.trim() || contractorName.trim() || engineerName.trim() || 'Site Contact';
        const resolvedProject = ihbName.trim() ? `${ihbName.trim()} Site` : siteAddress.trim().split(',')[0] + ' Site';

        const submittedInfo: SubmittedSiteInfo = {
          id: data.leadId,
          projectName: resolvedProject,
          siteAddress: siteAddress.trim(),
          contactName: resolvedContactName,
          contactPhone: effectivePhone,
          constructionStage,
          siteArea: siteArea.trim(),
          cementBrand: finalCementBrand,
          cementRate: cementRate.trim(),
          tmtBrand: finalTmtBrand,
          coverBlocks: selectedCoverBlocks.join(', '),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setLastSubmittedSite(submittedInfo);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftRestored(false);
        setSuccessMessage(true);
        setFormError(null);

        const newEntry = {
          id: data.leadId,
          project_name: submittedInfo.projectName,
          site_address: submittedInfo.siteAddress,
          contact_name: submittedInfo.contactName,
          contact_phone: submittedInfo.contactPhone,
          status: 'UNCLAIMED',
          created_at: new Date().toISOString(),
        };

        // Persist on device localStorage so it NEVER disappears even if serverless restarts
        try {
          const stored = localStorage.getItem(LOCAL_SAVED_SITES_KEY);
          const list = stored ? JSON.parse(stored) : [];
          const updated = [newEntry, ...list.filter((x: any) => x.id !== data.leadId)].slice(0, 30);
          localStorage.setItem(LOCAL_SAVED_SITES_KEY, JSON.stringify(updated));
        } catch {
          // silent
        }

        // Prepend immediately to recent submissions list
        setRecentSubmissions((prev) => [newEntry, ...prev]);

        // Reset form fields
        setSiteAddress('');
        setIhbName('');
        setIhbPhone('');
        setContractorName('');
        setContractorPhone('');
        setEngineerName('');
        setEngineerPhone('');
        setSiteArea('');
        setCementRate('');
        setNotes('');
        setLatitude(null);
        setLongitude(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errMsg = data?.error || 'Failed to submit site visit. Please try again.';
        setFormError(errMsg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setFormError(err?.message || 'Network error. Please check your internet connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const agentDisplayName = mounted && currentUser?.name ? currentUser.name : 'Field Agent';

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 pb-28 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <div className="flex items-center gap-1.5 leading-none mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
              Vardhman Site Slip
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Site Visit Entry
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Field Agent: <span className="font-bold text-slate-800">{agentDisplayName}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadMyHistory}
          className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>My History</span>
        </button>
      </div>

      {/* Draft Restored Banner */}
      {draftRestored && (
        <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-700 shadow-2xs">
          <span>Restored unsaved visit details from this device</span>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="text-[11px] font-bold text-slate-900 underline hover:text-black ml-2 cursor-pointer"
          >
            Clear Draft
          </button>
        </div>
      )}

      {/* Prominent Site Saved Confirmation Card */}
      {lastSubmittedSite && (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-sm space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-black text-emerald-950 text-sm">Site Visit Successfully Saved!</h3>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Logged at {lastSubmittedSite.timestamp} • Lead ID: <span className="font-mono font-bold">{lastSubmittedSite.id}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastSubmittedSite(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Site Location</span>
              <span className="font-bold text-slate-900 truncate block">{lastSubmittedSite.siteAddress}</span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact &amp; Mobile</span>
              <span className="font-bold text-slate-900 truncate block">
                {lastSubmittedSite.contactName} (+91 {lastSubmittedSite.contactPhone})
              </span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Stage &amp; Area</span>
              <span className="font-bold text-slate-900 truncate block">
                {lastSubmittedSite.constructionStage} {lastSubmittedSite.siteArea ? `• ${lastSubmittedSite.siteArea} sq.ft` : ''}
              </span>
            </div>
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Brands &amp; Rate</span>
              <span className="font-bold text-slate-900 truncate block">
                {lastSubmittedSite.cementBrand} {lastSubmittedSite.cementRate ? `(₹${lastSubmittedSite.cementRate})` : ''} • {lastSubmittedSite.tmtBrand}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setLastSubmittedSite(null);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Another Site Visit</span>
            </button>
            <a
              href="/leads"
              className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Form Error Banner */}
      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in duration-100">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* CARD 1: SITE LOCATION & DATE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Site Location &amp; Date</h3>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Site Address & Landmark */}
          <div>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label className="text-xs font-bold text-slate-700">
                Address / Location <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFetchGps}
                disabled={gettingGps}
                className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
              >
                {gettingGps ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Tagging GPS...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>{latitude ? '✓ GPS Tagged' : 'Auto-Tag GPS'}</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="e.g. Railway Crossing, near Reliance Petrol Pump"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 font-medium transition-all"
            />

            {latitude && longitude && (
              <div className="mt-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                <span>GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
                <a
                  href={`https://maps.google.com/?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  View on Map <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: STAKEHOLDERS (IHB, CONTRACTOR, ENGINEER) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Site Contacts &amp; Numbers</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Min. 1 Mobile Required</span>
          </div>

          {/* 1. IHB (Owner) */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              1. IHB / Property Owner
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="IHB Name (e.g. Samir Bhai)"
                value={ihbName}
                onChange={(e) => setIhbName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-medium"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Mobile (10 Digits)"
                  value={ihbPhone}
                  onChange={(e) => setIhbPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* 2. Contractor */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              2. Contractor (Thekedar)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Contractor Name"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-medium"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Mobile (10 Digits)"
                  value={contractorPhone}
                  onChange={(e) => setContractorPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* 3. Site Engineer */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              3. Site Engineer (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Engineer Name"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-medium"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Mobile (10 Digits)"
                  value={engineerPhone}
                  onChange={(e) => setEngineerPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-slate-800 font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Duplicate phone warning */}
          {duplicateLead && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <strong>Duplicate Site Found:</strong> Phone already recorded for &quot;{duplicateLead.project_name}&quot; (Status: {duplicateLead.status}).
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: WORKING STAGE & SITE AREA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Working Stage &amp; Area</h3>
            </div>
          </div>

          {/* Working Stage Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Working Stage
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((stg) => (
                <button
                  type="button"
                  key={stg}
                  onClick={() => setConstructionStage(stg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${constructionStage === stg
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          {/* Site Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Site Area (Sq. Ft.)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. 1500"
                value={siteArea}
                onChange={(e) => setSiteArea(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 font-medium"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Sq. Ft.
              </span>
            </div>
          </div>
        </div>

        {/* CARD 4: MATERIALS, BRANDS & RATES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Brands In Use &amp; Rate</h3>
            </div>
          </div>

          {/* Cement Brand (USE BRAND) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cement Brand (USE BRAND)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CEMENT_BRANDS.map((brand) => (
                <button
                  type="button"
                  key={brand}
                  onClick={() => setCementBrand(brand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${cementBrand === brand
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {brand}
                </button>
              ))}
            </div>
            {cementBrand === 'Other' && (
              <input
                type="text"
                placeholder="Enter cement brand name"
                value={customCementBrand}
                onChange={(e) => setCustomCementBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            )}
          </div>

          {/* Cement Rate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cement Rate (₹ / Bag)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                placeholder="e.g. 360"
                value={cementRate}
                onChange={(e) => setCementRate(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 font-mono font-medium"
              />
            </div>
          </div>

          {/* TMT Brand */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              TMT Steel Brand (TMT BRAND)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {TMT_BRANDS.map((tmt) => (
                <button
                  type="button"
                  key={tmt}
                  onClick={() => setTmtBrand(tmt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tmtBrand === tmt
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {tmt}
                </button>
              ))}
            </div>
            {tmtBrand === 'Other' && (
              <input
                type="text"
                placeholder="Enter TMT brand name"
                value={customTmtBrand}
                onChange={(e) => setCustomTmtBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* CARD 5: VEER PRODUCTS & NOTES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Cover Block Requirements &amp; Notes</h3>
            </div>
          </div>

          {/* Cover Block Sizes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cover Block Sizes Needed
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COVER_BLOCK_SIZES.map((size) => {
                const isSelected = selectedCoverBlocks.includes(size.id);
                return (
                  <button
                    type="button"
                    key={size.id}
                    onClick={() => toggleCoverBlock(size.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <span>{size.label}</span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                      }`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field Notes / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Field Notes &amp; Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Needs 500 pcs 20mm by Monday / IHB requested quote"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800 font-medium"
            />
          </div>
        </div>

        {/* Inline Error Banner above submit button */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-bold animate-in fade-in duration-100">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || !!duplicateLead}
            className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer ${duplicateLead
                ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Submitting Visit...</span>
              </>
            ) : (
              <>
                <span>Submit to Calling Pool</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Recent Submissions Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Site Visits Logged</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {recentSubmissions.length} Sites
          </span>
        </div>

        {recentSubmissions.length === 0 ? (
          <p className="text-slate-400 text-xs italic text-center py-4">
            No visits logged yet today. Fill in the slip above and tap Submit.
          </p>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((lead) => (
              <div
                key={lead.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs space-y-1 transition-all"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="truncate max-w-[200px]">{lead.contact_name || lead.project_name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {lead.status === 'UNCLAIMED' ? 'Calling Pool' : lead.status}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] truncate">{lead.site_address}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                  <span>+91 {lead.contact_phone}</span>
                  <span>
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">My Logged Site Visits</h3>
                <p className="text-xs text-slate-500">Your recent submissions ({myLeads.length})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {myLeads.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-6">No site visits submitted yet.</p>
              ) : (
                myLeads.map((lead: any) => (
                  <div key={lead.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{lead.ihb_name || lead.project_name}</span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-blue-200">
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-slate-500">{lead.site_address}</p>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>{lead.ihb_phone ? `+91 ${lead.ihb_phone}` : ''}</span>
                      <span>{new Date(lead.created_at).toLocaleDateString('en-IN')}</span>
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
