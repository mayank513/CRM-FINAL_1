import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Lead, LeadStatus, LeadSource, Activity } from '../types/database';

export const leadService = {
  async getLeads(): Promise<Lead[]> {
    if (!isSupabaseConfigured) {
      return getDemoLeads();
    }
    const { data, error } = await supabase
      .from('leads')
      .select('*, assigned_profile:profiles!leads_assigned_to_fkey(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
  },

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials in .env to save leads.');
    }
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.logActivity(data.id, 'created', `Lead created for ${data.full_name}`);
    return data as Lead;
  },

  async updateLead(id: string, updates: Partial<Lead>, previousStatus?: LeadStatus): Promise<Lead> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (updates.status && previousStatus && updates.status !== previousStatus) {
      await this.logActivity(
        id,
        'status_change',
        `Status changed from ${previousStatus} to ${updates.status}`,
        { from: previousStatus, to: updates.status }
      );
    }

    return data as Lead;
  },

  async logActivity(
    leadId: string,
    activityType: Activity['activity_type'],
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('activities').insert([
      {
        lead_id: leadId,
        actor_id: userData.user?.id || null,
        activity_type: activityType,
        description,
        metadata
      }
    ]);
  },

  async getActivities(leadId: string): Promise<Activity[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('activities')
      .select('*, actor_profile:profiles(*)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Activity[];
  }
};

// Fallback demo data for immediate UI testing before Supabase connection
function getDemoLeads(): Lead[] {
  return [
    {
      id: 'demo-1',
      full_name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      course_interest: 'Full Stack Web Development',
      source: 'Website',
      status: 'New',
      assigned_to: null,
      created_by: null,
      notes: 'Interested in the weekend batch.',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'demo-2',
      full_name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91 98234 56789',
      course_interest: 'Data Science & AI',
      source: 'Walk-in',
      status: 'Qualified',
      assigned_to: null,
      created_by: null,
      notes: 'Reviewed curriculum, scheduling a counselling call.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'demo-3',
      full_name: 'Rohan Verma',
      email: 'rohan.v@example.com',
      phone: '+91 91234 56780',
      course_interest: 'Cloud & DevOps Engineering',
      source: 'Referral',
      status: 'Converted',
      assigned_to: null,
      created_by: null,
      notes: 'Enrolled and completed registration fee.',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ];
}
