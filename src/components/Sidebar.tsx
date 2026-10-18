import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  BarChart3, 
  LogOut, 
  GraduationCap, 
  AlertCircle 
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface SidebarProps {
  currentTab: 'dashboard' | 'leads' | 'followups' | 'reports';
  setCurrentTab: (tab: 'dashboard' | 'leads' | 'followups' | 'reports') => void;
  userEmail?: string | null;
  userRole?: string;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  userEmail,
  userRole = 'counsellor',
  onSignOut,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Enquiries & Leads', icon: Users },
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white leading-tight">BrightPath</h1>
          <p className="text-xs text-blue-400 font-medium">Coaching Academy CRM</p>
        </div>
      </div>

      {/* Database Status Alert */}
      {!isSupabaseConfigured && (
        <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold">Demo Sandbox Mode</p>
            <p className="text-amber-200/80 mt-0.5">Supabase not configured in .env. Fictional data shown.</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-200 truncate">{userEmail || 'Demo Staff'}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {userRole}
            </span>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
