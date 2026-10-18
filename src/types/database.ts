export type UserRole = 'admin' | 'manager' | 'counsellor';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

export type LeadSource = 'Website' | 'Walk-in' | 'Phone Call' | 'Referral' | 'Social Media' | 'Other';

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  course_interest: string;
  source: LeadSource;
  status: LeadStatus;
  assigned_to: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields for display
  assigned_profile?: Profile | null;
  creator_profile?: Profile | null;
}

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export interface FollowUp {
  id: string;
  lead_id: string;
  assigned_to: string | null;
  due_at: string;
  note: string;
  status: FollowUpStatus;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  lead?: Lead | null;
  assigned_profile?: Profile | null;
}

export interface Activity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  activity_type: 'created' | 'status_change' | 'note_added' | 'followup_created' | 'followup_completed';
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  actor_profile?: Profile | null;
}

export interface DashboardMetrics {
  totalAccessibleLeads: number;
  newLeads: number;
  convertedLeads: number;
  overdueFollowUps: number;
  conversionRate: number;
}
