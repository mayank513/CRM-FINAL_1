import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { FollowUp } from '../types/database';
import { leadService } from './leadService';

export const followUpService = {
  async getFollowUps(): Promise<FollowUp[]> {
    if (!isSupabaseConfigured) {
      return getDemoFollowUps();
    }
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*, lead:leads(*), assigned_profile:profiles!follow_ups_assigned_to_fkey(*)')
      .order('due_at', { ascending: true });

    if (error) throw error;
    return data as FollowUp[];
  },

  async createFollowUp(
    followUp: Omit<FollowUp, 'id' | 'created_at' | 'completed_at'>
  ): Promise<FollowUp> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase
      .from('follow_ups')
      .insert([followUp])
      .select()
      .single();

    if (error) throw error;

    await leadService.logActivity(
      followUp.lead_id,
      'followup_created',
      `Follow-up scheduled for ${new Date(followUp.due_at).toLocaleDateString()}: ${followUp.note}`
    );

    return data as FollowUp;
  },

  async markComplete(id: string, leadId: string): Promise<FollowUp> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('follow_ups')
      .update({ status: 'completed', completed_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await leadService.logActivity(
      leadId,
      'followup_completed',
      `Follow-up marked as completed.`
    );

    return data as FollowUp;
  }
};

function getDemoFollowUps(): FollowUp[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();

  return [
    {
      id: 'fu-1',
      lead_id: 'demo-1',
      assigned_to: null,
      due_at: yesterday, // Overdue demo
      note: 'Call student to explain syllabus and scholarship options.',
      status: 'pending',
      completed_at: null,
      created_by: null,
      created_at: new Date().toISOString(),
      lead: {
        id: 'demo-1',
        full_name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 43210',
        course_interest: 'Full Stack Web Development',
        source: 'Website',
        status: 'New',
        assigned_to: null,
        created_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    {
      id: 'fu-2',
      lead_id: 'demo-2',
      assigned_to: null,
      due_at: tomorrow, // Upcoming demo
      note: 'Send course timetable and demo class registration link.',
      status: 'pending',
      completed_at: null,
      created_by: null,
      created_at: new Date().toISOString(),
      lead: {
        id: 'demo-2',
        full_name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+91 98234 56789',
        course_interest: 'Data Science & AI',
        source: 'Walk-in',
        status: 'Qualified',
        assigned_to: null,
        created_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  ];
}
