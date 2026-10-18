import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './features/dashboard/DashboardView';
import { LeadsView } from './features/leads/LeadsView';
import { LeadDetailView } from './features/leads/LeadDetailView';
import { CreateLeadModal } from './features/leads/CreateLeadModal';
import { LostReasonModal } from './features/leads/LostReasonModal';
import { ReportsView } from './features/dashboard/ReportsView';
import { AuthModal } from './features/auth/AuthModal';
import { leadService } from './services/leadService';
import { followUpService } from './services/followUpService';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import type { Lead, FollowUp, LeadStatus } from './types/database';
import { AlertCircle, CalendarClock, CheckCircle2, ChevronRight } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'leads' | 'followups' | 'reports'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingLostLead, setPendingLostLead] = useState<{ id: string; name: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email?: string; id?: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser({ email: session.user.email, id: session.user.id });
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUser({ email: session.user.email, id: session.user.id });
        } else {
          setCurrentUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const loadData = async () => {
    try {
      const [leadsData, followUpsData] = await Promise.all([
        leadService.getLeads(),
        followUpService.getFollowUps()
      ]);
      setLeads(leadsData);
      setFollowUps(followUpsData);
    } catch (e) {
      console.error('Failed to load CRM data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const newLead = await leadService.createLead({
      ...leadData,
      created_by: currentUser?.id || null,
    });
    setLeads((prev) => [newLead, ...prev]);
    showToast(`Lead for ${newLead.full_name} created successfully.`);
    loadData();
  };

  const handleUpdateLeadDetails = async (id: string, updates: Partial<Lead>) => {
    const updated = await leadService.updateLead(id, updates);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, ...updated });
    }
    showToast(`Lead details updated for ${updated.full_name}.`);
    loadData();
  };

  const handleStatusChangeRequest = (id: string, newStatus: LeadStatus) => {
    if (newStatus === 'Lost') {
      const target = leads.find((l) => l.id === id);
      setPendingLostLead({ id, name: target ? target.full_name : 'Student' });
    } else {
      executeStatusUpdate(id, newStatus);
    }
  };

  const executeStatusUpdate = async (id: string, newStatus: LeadStatus, lostReason?: string) => {
    const leadToUpdate = leads.find((l) => l.id === id);
    if (!leadToUpdate) return;
    const oldStatus = leadToUpdate.status;

    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }

    try {
      const updates: Partial<Lead> = { status: newStatus };
      if (lostReason) {
        updates.notes = leadToUpdate.notes 
          ? `${leadToUpdate.notes}\n[Lost Reason]: ${lostReason}` 
          : `[Lost Reason]: ${lostReason}`;
      }
      await leadService.updateLead(id, updates, oldStatus);
      if (lostReason) {
        await leadService.logActivity(id, 'status_change', `Marked Lost: ${lostReason}`);
      }
      showToast(`Status updated to ${newStatus}`);
      loadData();
    } catch (err: unknown) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: oldStatus } : l))
      );
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  };

  const handleNavigateToLeadFromFollowUp = (leadId: string) => {
    const target = leads.find((l) => l.id === leadId);
    if (target) {
      setSelectedLead(target);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    showToast('Signed out successfully.');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2 ${
            notification.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-blue-400" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedLead(null);
          setCurrentTab(tab);
        }}
        userEmail={currentUser?.email}
        onSignOut={currentUser ? handleSignOut : () => setIsAuthModalOpen(true)}
      />

      {/* Primary Workspace Content Area */}
      <main className="flex-1 p-8 max-w-7xl mx-auto overflow-y-auto">
        {!isSupabaseConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Ready to connect your Supabase database:</span> Add{' '}
                <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">VITE_SUPABASE_URL</code> and{' '}
                <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">VITE_SUPABASE_ANON_KEY</code> to{' '}
                <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">.env</code>.
              </div>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"
            >
              Sign In / Auth
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        {selectedLead ? (
          <LeadDetailView
            lead={selectedLead}
            onBack={() => setSelectedLead(null)}
            onUpdateStatus={handleStatusChangeRequest}
            onUpdateLead={handleUpdateLeadDetails}
          />
        ) : currentTab === 'dashboard' ? (
          <DashboardView
            leads={leads}
            followUps={followUps}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onNavigateToLeads={() => setCurrentTab('leads')}
          />
        ) : currentTab === 'leads' ? (
          <LeadsView
            leads={leads}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onUpdateStatus={handleStatusChangeRequest}
          />
        ) : currentTab === 'followups' ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              All Scheduled Follow-ups
            </h2>
            <p className="text-xs text-slate-500">Click any follow-up task to jump straight to that student record</p>
            <div className="divide-y divide-slate-100">
              {followUps.map((fu) => (
                <div
                  key={fu.id}
                  onClick={() => handleNavigateToLeadFromFollowUp(fu.lead_id)}
                  className="py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 px-2 rounded-lg transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600">
                        {fu.lead?.full_name || 'Student Enquiry'}
                      </p>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{fu.note}</p>
                    <span className="text-xs text-blue-600 mt-1 inline-block">
                      Due: {new Date(fu.due_at).toLocaleDateString()} at{' '}
                      {new Date(fu.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      fu.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {fu.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ReportsView leads={leads} followUps={followUps} />
        )}
      </main>

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
      />

      <LostReasonModal
        isOpen={Boolean(pendingLostLead)}
        leadName={pendingLostLead?.name || 'Student'}
        onClose={() => setPendingLostLead(null)}
        onConfirm={async (reason) => {
          if (pendingLostLead) {
            await executeStatusUpdate(pendingLostLead.id, 'Lost', reason);
            setPendingLostLead(null);
          }
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => {
          showToast('Authenticated successfully.');
          loadData();
        }}
      />
    </div>
  );
}

export default App;
