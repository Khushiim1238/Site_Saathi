export type UserRole = 'ADMIN' | 'MANAGER' | 'CALLER' | 'FIELD_AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  pin: string;
  is_active: number;
  created_at: string;
}

export type LeadStatus =
  | 'UNCLAIMED'
  | 'CLAIMED'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'QUOTE_SENT'
  | 'WON'
  | 'LOST'
  | 'INVALID';

export type ContactRole =
  | 'OWNER'
  | 'CONTRACTOR'
  | 'BUILDER'
  | 'ARCHITECT'
  | 'SITE_ENGINEER'
  | 'OTHER';

export type ConstructionStage =
  | 'EXCAVATION'
  | 'FOUNDATION'
  | 'BRICKWORK'
  | 'PLASTERING'
  | 'FINISHING'
  | 'INTERIOR'
  | 'OTHER';

export interface Lead {
  id: string;
  project_name: string;
  contact_name: string;
  contact_phone: string;
  contact_role: ContactRole;
  site_address: string;
  latitude: number | null;
  longitude: number | null;
  maps_url: string | null;
  construction_stage: ConstructionStage;
  material_requirements: string | null;
  estimated_budget: string | null;
  notes: string | null;
  photo_url: string | null;
  status: LeadStatus;
  lost_reason: string | null;
  captured_by_id: string;
  captured_by_name?: string;
  claimed_by_id: string | null;
  claimed_by_name?: string;
  claimed_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CallStatus =
  | 'INTERESTED'
  | 'CALLBACK_REQUESTED'
  | 'QUOTE_SENT'
  | 'WON'
  | 'NOT_INTERESTED'
  | 'UNREACHABLE'
  | 'INVALID_NUMBER';

export interface CallLog {
  id: string;
  lead_id: string;
  caller_id: string;
  caller_name?: string;
  call_status: CallStatus;
  notes: string | null;
  duration_seconds: number;
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  lead_project_name?: string;
  lead_contact_name?: string;
  lead_contact_phone?: string;
  caller_id: string;
  caller_name?: string;
  scheduled_at: string;
  reason: string | null;
  status: 'PENDING' | 'COMPLETED' | 'MISSED';
  completed_at: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  description: string;
  metadata: string | null;
  created_at: string;
}

