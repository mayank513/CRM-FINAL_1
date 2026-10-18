import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Globe, 
  Users, 
  ArrowUpRight 
} from 'lucide-react';
import type { Lead, FollowUp } from '../../types/database';

interface ReportsViewProps {
  leads: Lead[];
  followUps: FollowUp[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ leads, followUps }) => {
  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
  const lostLeads = leads.filter((l) => l.status === 'Lost').length;
  const overallConversion = totalLeads > 0 
    ? Math.round((convertedLeads / totalLeads) * 100) 
    : 0;

  // Source breakdown
  const sources = ['Website', 'Walk-in', 'Phone Call', 'Referral', 'Social Media', 'Other'] as const;
  const sourceStats = sources.map((source) => {
    const total = leads.filter((l) => l.source === source).length;
    const converted = leads.filter((l) => l.source === source && l.status === 'Converted').length;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const percentageOfTotal = totalLeads > 0 ? Math.round((total / totalLeads) * 100) : 0;
    return { source, total, converted, rate, percentageOfTotal };
  });

  // Course interest breakdown
  const courses = Array.from(new Set(leads.map((l) => l.course_interest)));
  const courseStats = courses.map((course) => {
    const total = leads.filter((l) => l.course_interest === course).length;
    const converted = leads.filter((l) => l.course_interest === course && l.status === 'Converted').length;
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { course, total, converted, rate };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admissions Performance Reports</h2>
        <p className="text-sm text-slate-500 mt-1">
          Detailed metrics across student acquisition channels and course interest
        </p>
      </div>

      {/* Top summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <span>Overall Conversion</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{overallConversion}%</span>
            <span className="text-xs text-slate-500">({convertedLeads} converted)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <span>Enquiry Volume</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{totalLeads}</span>
            <span className="text-xs text-slate-500">total records</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm">
            <span>Lost Enquiries</span>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{lostLeads}</span>
            <span className="text-xs text-slate-500">
              ({totalLeads > 0 ? Math.round((lostLeads / totalLeads) * 100) : 0}% of inquiries)
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown by Enquiry Source */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Performance by Lead Channel / Source
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Which enquiry channels generate the highest conversion</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Channel / Source</th>
                <th className="py-3 px-4">Share of Enquiries</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">Converted</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sourceStats.map((item) => (
                <tr key={item.source} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.source}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentageOfTotal}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{item.percentageOfTotal}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{item.total}</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">{item.converted}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.rate >= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Course Interest */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-600" />
          Enquiries by Coaching Course
        </h3>

        {courseStats.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No course records available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseStats.map((c) => (
              <div key={c.course} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <p className="font-semibold text-slate-900 text-sm">{c.course}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Enquiries: <strong className="text-slate-800">{c.total}</strong></span>
                  <span>Enrolled: <strong className="text-emerald-600">{c.converted}</strong></span>
                  <span className="font-bold text-blue-600">{c.rate}% rate</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
