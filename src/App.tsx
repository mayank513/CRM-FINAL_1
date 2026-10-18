import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './features/dashboard/DashboardView';
import { LeadsView } from './features/leads/LeadsView';
import { LeadDetailView } from './features/leads/LeadDetailView';
import { CreateLeadModal } from './features/leads/CreateLeadModal';
import { AuthModal } from './features/auth/AuthModal';
import { leadService } from './services/leadService';
import { followUpService } from './services/followUpService';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import type { Lead, FollowUp, LeadStatus } from './types/database';
import { AlertCircle, CalendarClock, BarChart3, CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'leads' | 'followups' | 'reports'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string; id?: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Check initial auth session
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

  const handleUpdateStatus = async (id: string, newStatus: LeadStatus) => {
    const leadToUpdate = leads.find((l) => l.id === id);
    if (!leadToUpdate) return;
    const oldStatus = leadToUpdate.status;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }

    try {
      await leadService.updateLead(id, { status: newStatus }, oldStatus);
      showToast(`Status updated to ${newStatus}`);
    } catch (err: unknown) {
      // Revert if error
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: oldStatus } : l))
      );
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
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
        {/* Top bar with environment alert if not configured */}
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
            onUpdateStatus={handleUpdateStatus}
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
            onUpdateStatus={handleUpdateStatus}
          />
        ) : currentTab === 'followups' ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              All Scheduled Follow-ups
            </h2>
            <div className="divide-y divide-slate-100">
              {followUps.map((fu) => (
                <div key={fu.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{fu.lead?.full_name || 'Inquiry'}</p>
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">Admissions Conversion Reports</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Live conversion metrics are aggregated on your main dashboard according to the master specification.
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLead}
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
