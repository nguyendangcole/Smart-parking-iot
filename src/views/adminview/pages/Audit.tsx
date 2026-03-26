import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../shared/supabase';

interface AuditLog {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  ip_address: string;
  status: 'SUCCESS' | 'FAILED' | 'WARN';
  created_at: string;
}

const MOCK_LOGS: AuditLog[] = [
  { id: '1', actor_email: 'admin@hcmut.edu.vn', action: 'Database Export', entity_type: 'System', ip_address: '192.168.1.45', status: 'SUCCESS', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', actor_email: 'operator_A@hcmut.edu.vn', action: 'Manual Gate Override', entity_type: 'Gate Control', ip_address: '10.0.4.122', status: 'WARN', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', actor_email: 'admin@hcmut.edu.vn', action: 'Pricing Policy Update', entity_type: 'Pricing', ip_address: '192.168.1.45', status: 'SUCCESS', created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '4', actor_email: 'stranger@abroad.com', action: 'Admin Login Attempt', entity_type: 'Auth', ip_address: '45.22.19.8', status: 'FAILED', created_at: new Date(Date.now() - 28800000).toISOString() },
  { id: '5', actor_email: 'admin@hcmut.edu.vn', action: 'Exempt Payment Granted', entity_type: 'Profiles', ip_address: '192.168.1.45', status: 'SUCCESS', created_at: new Date(Date.now() - 86400000).toISOString() }
];

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);

    try {
      // Base query
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

      // Apply DB-level Date Filtering if specified
      if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query = query.lte('created_at', to.toISOString());
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        setLogs(MOCK_LOGS);
      } else {
        setLogs(data as AuditLog[]);
      }
    } catch {
      setLogs(MOCK_LOGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFrom, dateTo]);

  // Client side filtering for text and dropdowns
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = (log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ip_address?.includes(searchTerm) || false);
      const matchAction = filterAction === 'All' || log.entity_type === filterAction;
      const matchStatus = filterStatus === 'All' || log.status === filterStatus;

      return matchSearch && matchAction && matchStatus;
    });
  }, [logs, searchTerm, filterAction, filterStatus]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ['Timestamp', 'Actor/User', 'Action', 'Entity Type', 'IP Address', 'Status'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.actor_email || 'System',
      log.action,
      log.entity_type || 'N/A',
      log.ip_address || 'N/A',
      log.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `HCMUT_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract unique action types for filter dropdown
  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity_type).filter(Boolean)));

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (status === 'FAILED') return 'bg-rose-50 text-rose-600 border-rose-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  };

  // Mock charts stats data
  const successRate = logs.length > 0 ? Math.round((logs.filter(l => l.status === 'SUCCESS').length / logs.length) * 100) : 0;
  const criticalCount = logs.filter(l => l.status === 'FAILED' || l.action.includes('Admin') || l.action.includes('Override')).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Audits & Reports</h2>
          <p className="text-slate-500 mt-1">Monitor system integrity and analyze performance metrics across the infrastructure.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:border-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">sync</span> Sync Remote
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> New Audit Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">calendar_month</span> Generate Report
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Export detailed CSV log reports for compliance checking.</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportCSV} className="col-span-2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">download</span> Download Detailed Audit (CSV)
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">monitoring</span> Reliability Metrics
          </h3>
          <div className="mt-8 flex items-baseline gap-2">
            <span className="text-5xl font-black text-slate-900">{successRate}%</span>
            <span className="text-sm font-bold text-emerald-500 flex items-center drop-shadow-sm"><span className="material-symbols-outlined text-sm">trending_up</span> SUCCESS</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Valid requests processed over loaded timeframe.</p>

          {/* Fake bar chart background */}
          <div className="absolute -bottom-4 right-0 opacity-10 flex items-end gap-1 w-full h-24 justify-end pr-4 pointer-events-none">
            <div className="w-8 bg-slate-800 h-[40%] rounded-t-sm"></div>
            <div className="w-8 bg-slate-800 h-[70%] rounded-t-sm"></div>
            <div className="w-8 bg-slate-800 h-[30%] rounded-t-sm"></div>
            <div className="w-8 bg-slate-800 h-[90%] rounded-t-sm"></div>
            <div className="w-8 bg-primary h-[100%] rounded-t-sm drop-shadow-lg opacity-80"></div>
            <div className="w-8 bg-slate-800 h-[60%] rounded-t-sm"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500">warning</span> Critical Highlights
          </h3>
          <div className="space-y-4 cursor-default">
            <div className="flex items-center justify-between group">
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">Critical Actions Flagged</p>
                <p className="text-xs text-slate-500">Overrides, Deletions, Admin assigns.</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold border border-amber-200 rounded-lg text-sm">{criticalCount}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (criticalCount / Math.max(logs.length, 1)) * 100)}%` }}></div>
            </div>

            <p className="text-[10px] text-slate-400 italic mt-4 pt-4 border-t border-slate-100">
              Insight: Flagged actions represent high privilege operations that should be manually reviewed monthly.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50/80 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30">
          <h3 className="font-bold text-lg text-slate-800">System Audit Logs</h3>
          <div className="flex gap-3 items-center">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none focus:ring-2 ring-primary/20"
            >
              <option value="All">All Status</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none focus:ring-2 ring-primary/20"
            >
              <option value="All">All Entities</option>
              {uniqueEntities.map(eng => <option key={eng} value={eng}>{eng}</option>)}
            </select>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-64 transition-all font-medium text-slate-700"
                placeholder="Search user, action or IP..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor & IP</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Target</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Performed</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-sm">
              {filteredLogs.map((log) => {
                const isCritical = log.status === 'FAILED' || log.action.includes('Admin') || log.action.includes('Override');
                return (
                  <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors ${isCritical ? 'bg-orange-50/10' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-600">{new Date(log.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{log.actor_email}</p>
                          <p className="text-[10px] font-mono text-slate-400">{log.ip_address || 'Internal Server'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded shadow-sm border border-slate-200/50 tracking-wide uppercase">
                        {log.entity_type || 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${isCritical ? 'text-amber-600' : 'text-slate-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 text-[10px] font-black tracking-widest rounded-full uppercase border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && !isLoading && (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-medium bg-slate-50/30">No logs found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
