import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Mail, 
  BookOpen, 
  ChevronRight, 
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import type { Lead, LeadStatus, LeadSource } from '../../types/database';

interface LeadsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenCreateModal: () => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onSelectLead,
  onOpenCreateModal,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Filter
  const filtered = leads.filter((lead) => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.course_interest.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Sort
  const sortedLeads = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === 'name') {
      return a.full_name.localeCompare(b.full_name);
    }
    return 0;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setSortBy('newest');
  };

  const statusColors: Record<LeadStatus, string> = {
    New: 'bg-amber-100 text-amber-800 border-amber-200',
    Contacted: 'bg-blue-100 text-blue-800 border-blue-200',
    Qualified: 'bg-purple-100 text-purple-800 border-purple-200',
    Converted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Lost: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Enquiries</h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse, sort, filter, and convert prospective students
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Student Lead</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, phone, email or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="all">All Sources</option>
            <option value="Website">Website</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
              className="bg-transparent focus:outline-none text-slate-700 text-sm cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || sortBy !== 'newest') && (
            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {sortedLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No matching student leads found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining search criteria or reset your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Course Interest</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectLead(lead)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{lead.full_name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                        {lead.course_interest}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {lead.source}
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                          statusColors[lead.status]
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
