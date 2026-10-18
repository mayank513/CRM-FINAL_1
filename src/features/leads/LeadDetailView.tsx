import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  FileText, 
  Activity as ActivityIcon,
  Edit3
} from 'lucide-react';
import type { Lead, FollowUp, Activity, LeadStatus } from '../../types/database';
import { leadService } from '../../services/leadService';
import { followUpService } from '../../services/followUpService';
import { EditLeadModal } from './EditLeadModal';

interface LeadDetailViewProps {
  lead: Lead;
  onBack: () => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
}

export const LeadDetailView: React.FC<LeadDetailViewProps> = ({
  lead,
  onBack,
  onUpdateStatus,
  onUpdateLead,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeadDetails();
  }, [lead.id]);

  const loadLeadDetails = async () => {
    setIsLoading(true);
    try {
      const [acts, fus] = await Promise.all([
        leadService.getActivities(lead.id),
        followUpService.getFollowUps()
      ]);
      setActivities(acts);
      setFollowUps(fus.filter((f) => f.lead_id === lead.id));
    } catch (e) {
      console.error('Error fetching lead details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await leadService.logActivity(lead.id, 'note_added', newNote.trim());
      setNewNote('');
      await loadLeadDetails();
    } catch (e) {
      console.error('Error recording note:', e);
    }
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate || !followUpNote.trim()) return;
    try {
      await followUpService.createFollowUp({
        lead_id: lead.id,
        due_at: new Date(followUpDate).toISOString(),
        note: followUpNote.trim(),
        status: 'pending',
        assigned_to: null,
        created_by: null,
      });
      setFollowUpDate('');
      setFollowUpNote('');
      setIsAddingFollowUp(false);
      await loadLeadDetails();
    } catch (e) {
      console.error('Error creating follow-up:', e);
    }
  };

  const handleCompleteFollowUp = async (fuId: string) => {
    try {
      await followUpService.markComplete(fuId, lead.id);
      await loadLeadDetails();
    } catch (e) {
      console.error('Error completing follow up:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and status controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to all leads
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
            Edit Details
          </button>

          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
          <select
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-2xs"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Main Card with Lead Attributes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{lead.full_name}</h1>
            <p className="text-sm font-medium text-blue-600 mt-0.5">{lead.course_interest}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>{lead.phone}</span>
            </a>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <Mail className="h-4 w-4 text-blue-600" />
                <span>{lead.email}</span>
              </a>
            )}
            <span className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-500">
              Source: <strong className="text-slate-700 font-medium">{lead.source}</strong>
            </span>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 text-slate-800 text-sm">
            <span className="font-semibold text-amber-900 text-xs uppercase block mb-1">
              Admission Counselling Notes
            </span>
            {lead.notes}
          </div>
        )}
      </div>

      {/* Grid: Follow-ups & Activity History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Follow-ups */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Follow-ups & Next Actions
            </h3>
            <button
              onClick={() => setIsAddingFollowUp(!isAddingFollowUp)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Follow-up
            </button>
          </div>

          {isAddingFollowUp && (
            <form onSubmit={handleCreateFollowUp} className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Action Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call back regarding batch timings"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingFollowUp(false)}
                  className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {followUps.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No follow-ups recorded.</p>
            ) : (
              followUps.map((fu) => {
                const isOverdue = fu.status === 'pending' && new Date(fu.due_at) < new Date();
                return (
                  <div
                    key={fu.id}
                    className={`p-3 rounded-xl border flex items-start justify-between ${
                      fu.status === 'completed'
                        ? 'bg-slate-50/50 border-slate-100 opacity-60'
                        : isOverdue
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`text-sm ${fu.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {fu.note}
                      </p>
                      <span className={`text-xs mt-1 inline-block ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                        Due: {new Date(fu.due_at).toLocaleDateString()} {new Date(fu.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOverdue && ' (OVERDUE)'}
                      </span>
                    </div>
                    {fu.status === 'pending' && (
                      <button
                        onClick={() => handleCompleteFollowUp(fu.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity & Counsellor Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ActivityIcon className="h-4 w-4 text-blue-600" />
            Audit & Interaction History
          </h3>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              placeholder="Add counsellor interaction notes..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium"
            >
              Add Note
            </button>
          </form>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No past activities.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                  <p className="font-medium text-slate-800">{act.description}</p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <EditLeadModal
        isOpen={isEditModalOpen}
        lead={lead}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={async (id, updates) => {
          await onUpdateLead(id, updates);
          await loadLeadDetails();
        }}
      />
    </div>
  );
};
