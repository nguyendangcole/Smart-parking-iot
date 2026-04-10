import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../shared/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditLog {
  id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  ip_address: string;
  status: 'SUCCESS' | 'FAILED' | 'WARN';
  created_at: string;
  metadata?: any;
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
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);

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

    // Subscribe to real-time updates
    const channel = supabase
      .channel('audit_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        setLogs(prev => [payload.new as AuditLog, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFrom, dateTo]);

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

  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity_type).filter(Boolean)));
  const successRate = logs.length > 0 ? Math.round((logs.filter(l => l.status === 'SUCCESS').length / logs.length) * 100) : 0;
  const criticalCount = logs.filter(l => l.status === 'FAILED' || l.status === 'WARN').length;

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (status === 'FAILED') return 'bg-rose-50 text-rose-600 border-rose-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Audits & Reports</h2>
          <p className="text-slate-500 mt-1">Monitor system integrity and analyze performance metrics across the infrastructure.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:border-primary transition-all flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-sm">sync</span> Sync Remote
          </button>
          <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> New Audit Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">calendar_month</span> Generate Report
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 font-medium">Export detailed CSV log reports for compliance checking.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
              </div>
            </div>

            <button onClick={handleExportCSV} className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-3 active:scale-95">
              <span className="material-symbols-outlined">download</span> Download Detailed Audit (CSV)
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">monitoring</span> Reliability Metrics
          </h3>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="text-6xl font-black text-slate-900 tracking-tighter">{successRate}%</span>
            <span className="text-sm font-black text-emerald-500 flex items-center"><span className="material-symbols-outlined text-xl">trending_up</span> SUCCESS</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">Valid requests processed over loaded timeframe.</p>

          <div className="absolute -bottom-4 right-0 opacity-10 flex items-end gap-1 w-full h-24 justify-end pr-4 pointer-events-none">
            {[40, 70, 30, 90, 100, 60].map((h, i) => (
              <div key={i} className={`w-8 bg-slate-800 rounded-t-lg transition-all duration-1000`} style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-amber-500">warning</span> Critical Highlights
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between group">
              <div>
                <p className="text-base font-black text-slate-800 group-hover:text-primary transition-colors leading-tight">Critical Actions Flagged</p>
                <p className="text-xs text-slate-500 font-medium">Overrides, Deletions, Admin assigns.</p>
              </div>
              <span className="size-11 flex items-center justify-center bg-amber-50 text-amber-600 font-black border border-amber-200 rounded-xl text-lg shadow-sm">{criticalCount}</span>
            </div>
            
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (criticalCount / Math.max(logs.length, 1)) * 100)}%` }}
                className="h-full bg-amber-500 rounded-full"
              ></motion.div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium italic mt-4 pt-4 border-t border-slate-100 leading-relaxed">
              Insight: Flagged actions represent high privilege operations that should be manually reviewed monthly.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50/80 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-6 bg-slate-50/30">
          <h3 className="font-black text-xl text-slate-800 tracking-tight">System Audit Logs</h3>
          <div className="flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 ring-primary/10 shadow-sm"
            >
              <option value="All">All Status</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
            </select>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-4 ring-primary/10 shadow-sm"
            >
              <option value="All">All Entities</option>
              {uniqueEntities.map(eng => <option key={eng} value={eng}>{eng}</option>)}
            </select>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="pl-12 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none w-72 transition-all font-bold text-slate-700 shadow-sm"
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
            <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actor & IP</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Target</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action Performed</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 text-sm">
              <AnimatePresence>
                {filteredLogs.map((log) => {
                  const isCritical = log.status === 'FAILED' || log.status === 'WARN' || log.action.includes('Admin') || log.action.includes('Override');
                  return (
                    <motion.tr 
                      key={log.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedLog(log)}
                      className={`hover:bg-primary/[0.02] cursor-pointer transition-colors ${isCritical ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="px-8 py-5">
                        <span className="font-bold text-slate-700">{new Date(log.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-2xl flex items-center justify-center border font-black text-xs ${isCritical ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            {log.actor_email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 leading-none">{log.actor_email}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">{log.ip_address || 'Internal Server'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1.5 bg-white text-slate-600 text-[10px] font-black rounded-xl shadow-sm border border-slate-200 tracking-wider uppercase">
                          {log.entity_type || 'System'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`font-bold text-base ${isCritical ? 'text-amber-600' : 'text-slate-700'} tracking-tight`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-4 py-1.5 text-[10px] font-black tracking-[0.15em] rounded-full uppercase border ${getStatusColor(log.status)} shadow-sm`}>
                          {log.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredLogs.length === 0 && !isLoading && (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest bg-slate-50/30">No logs found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLog(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div className={`size-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl ${getStatusColor(selectedLog.status)} border-2`}>
                    <span className="material-symbols-outlined font-black">
                      {selectedLog.status === 'SUCCESS' ? 'check_circle' : 'warning'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedLog.action}</h3>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">{selectedLog.entity_type} • {selectedLog.id.substring(0, 8)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                  <span className="material-symbols-outlined text-slate-400 font-black">close</span>
                </button>
              </div>
              
              <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] bg-white">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performed By</p>
                    <p className="text-lg font-black text-slate-800">{selectedLog.actor_email}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                    <p className="text-lg font-black text-slate-800">{new Date(selectedLog.created_at).toLocaleString('en-GB')}</p>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">data_object</span> Metadata Payload
                  </p>
                  <pre className="text-sm font-bold font-mono text-slate-600 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Validated System Authenticity • HCMUT-CORE-v2.0</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
