import React from 'react';
import { 
  Users, 
  UserCheck, 
  ClockAlert, 
  Percent, 
  ArrowUpRight 
} from 'lucide-react';
import type { Lead, FollowUp } from '../../types/database';

interface DashboardViewProps {
  leads: Lead[];
  followUps: FollowUp[];
  onSelectLead: (lead: Lead) => void;
  onNavigateToLeads: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  followUps,
  onSelectLead,
  onNavigateToLeads,
}) => {
  // Metric calculations strictly as per Section 15 specifications
  const totalAccessibleLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
  
  // Overdue = status pending AND due_at < now
  const now = new Date();
  const overdueFollowUps = followUps.filter(
    (f) => f.status === 'pending' && new Date(f.due_at) < now
  ).length;

  const conversionRate = totalAccessibleLeads > 0 
    ? Math.round((convertedLeads / totalAccessibleLeads) * 100) 
    : 0;

  const kpis = [
    {
      title: 'Accessible Leads',
      value: totalAccessibleLeads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total active student inquiries',
    },
    {
      title: 'New Enquiries',
      value: newLeads,
      icon: ArrowUpRight,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Awaiting initial contact',
    },
    {
      title: 'Overdue Follow-ups',
      value: overdueFollowUps,
      icon: ClockAlert,
      color: overdueFollowUps > 0 ? 'text-rose-600' : 'text-slate-600',
      bgColor: overdueFollowUps > 0 ? 'bg-rose-50' : 'bg-slate-50',
      description: 'Requires immediate counsellor action',
    },
    {
      title: 'Enrolment Rate',
      value: `${conversionRate}%`,
      icon: Percent,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: `${convertedLeads} students converted`,
    },
  ];

  // Pipeline breakdown by status
  const statuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'] as const;
  const statusCounts = statuses.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admissions Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time coaching pipeline metrics and actionable follow-ups</p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</span>
                <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Status Overview */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Inquiry Pipeline Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {statusCounts.map((item) => (
            <div key={item.status} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500">{item.status}</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads & Immediate Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Student Enquiries</h3>
            <button
              onClick={onNavigateToLeads}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View All →
            </button>
          </div>
          {leads.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No leads recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{lead.full_name}</p>
                    <p className="text-xs text-slate-500">{lead.course_interest} • {lead.source}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-800' :
                    lead.status === 'Qualified' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'Lost' ? 'bg-slate-100 text-slate-600' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Immediate Follow-ups */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Pending & Overdue Follow-ups</h3>
          {followUps.filter((f) => f.status === 'pending').length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">All caught up! No pending follow-ups.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {followUps
                .filter((f) => f.status === 'pending')
                .slice(0, 5)
                .map((item) => {
                  const isOverdue = new Date(item.due_at) < now;
                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.lead?.full_name || 'Student Enquiry'}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.note}</p>
                        <span className={`text-[11px] font-medium mt-1 inline-block ${
                          isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}>
                          Due: {new Date(item.due_at).toLocaleDateString()} {new Date(item.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOverdue && ' (OVERDUE)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
