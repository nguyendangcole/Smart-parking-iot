import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  MapPin,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../shared/supabase';
import { useProfile } from '../../../shared/hooks/useProfile';

interface ParkingSession {
  id: string;
  entry_time: string;
  exit_time: string | null;
  vehicle_plate: string;
  zone_name: string;
  fee: number;
  status: string;
}

export default function History() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [stats, setStats] = useState({
    totalSpent: 0,
    totalHours: 0,
    mostVisitedZone: 'N/A'
  });

  const fetchHistory = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('parking_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', profile.id)
        .order('entry_time', { ascending: false });

      // Apply Filters
      if (searchTerm) {
        query = query.ilike('vehicle_plate', `%${searchTerm}%`);
      }
      if (filterStatus !== 'All') {
        query = query.eq('status', filterStatus);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;
      setSessions((data as any) || []);
      setTotalCount(count || 0);

      // Fetch Stats (for current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: statsData } = await supabase
        .from('parking_sessions')
        .select('fee, entry_time, exit_time, zone_name')
        .eq('user_id', profile.id)
        .gte('entry_time', startOfMonth.toISOString());

      if (statsData) {
        const total = statsData.reduce((acc, curr) => acc + (curr.fee || 0), 0);

        let hours = 0;
        const zones: Record<string, number> = {};

        statsData.forEach(s => {
          if (s.entry_time && s.exit_time) {
            const diff = new Date(s.exit_time).getTime() - new Date(s.entry_time).getTime();
            hours += diff / (1000 * 60 * 60);
          }
          if (s.zone_name) {
            zones[s.zone_name] = (zones[s.zone_name] || 0) + 1;
          }
        });

        const topZone = Object.entries(zones).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        setStats({
          totalSpent: total,
          totalHours: Math.round(hours),
          mostVisitedZone: topZone
        });
      }

    } catch (err: any) {
      console.error("Error fetching parking history:", err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, currentPage, itemsPerPage, searchTerm, filterStatus]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Ongoing';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto flex flex-col gap-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Parking History</h1>
          <p className="text-slate-500">Review your past parking sessions and manage receipts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <input
              className="w-full pl-11 pr-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary text-sm shadow-sm"
              placeholder="Search by plate..."
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium border-none shadow-sm hover:bg-slate-50">
            <Calendar size={18} />
            <span>{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium border-none shadow-sm hover:bg-slate-50">
              <Filter size={18} />
              <span>{filterStatus === 'All' ? 'Filters' : filterStatus}</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="py-2">
                {['All', 'Completed', 'Ongoing', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterStatus === status ? 'font-bold text-primary bg-primary/5' : 'text-slate-700'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Zone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Duration</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cost</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary size-8" />
                        <p className="text-slate-400 text-sm font-medium">Fetching your parking story...</p>
                      </div>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="text-slate-200 size-12" />
                        <p className="text-slate-500 font-bold">No sessions found</p>
                        <p className="text-slate-400 text-xs">Try adjusting your filters or search term.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <motion.tr
                      key={session.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">
                          {new Date(session.entry_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(session.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {session.exit_time ? ` - ${new Date(session.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' - Now'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{session.vehicle_plate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {session.zone_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {formatDuration(session.entry_time, session.exit_time)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold ${session.status === 'Ongoing' ? 'text-primary' : 'text-slate-700'}`}>
                        {session.fee === 0 ? '0 VND' : `${(session.fee || 0).toLocaleString()} VND`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${session.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            session.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-500'
                          }`}>
                          <span className={`size-1.5 rounded-full ${session.status === 'Completed' ? 'bg-green-500' :
                              session.status === 'Ongoing' ? 'bg-blue-500' :
                                'bg-slate-400'
                            }`}></span>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          disabled={session.status !== 'Completed'}
                          className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${session.status === 'Completed' ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                          <Download size={14} />
                          Receipt
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Showing {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className={`size-9 rounded-xl border border-slate-200 flex items-center justify-center transition-all ${currentPage === 1 || loading ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50 shadow-sm'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center px-3 text-sm font-bold text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className={`size-9 rounded-xl border border-slate-200 flex items-center justify-center transition-all ${currentPage === totalPages || loading ? 'opacity-50 cursor-not-allowed' : 'bg-white hover:bg-slate-50 shadow-sm'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary group p-6 rounded-3xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Total Spent this Month</p>
          <h3 className="text-3xl font-black text-white">{stats.totalSpent.toLocaleString()} VND</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-600 w-fit mb-4">
            <Clock size={20} />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Hours Parked</p>
          <h3 className="text-3xl font-black text-slate-800">{stats.totalHours}h</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-600 w-fit mb-4">
            <MapPin size={20} />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Most Visited Zone</p>
          <h3 className="text-3xl font-black text-slate-800">{stats.mostVisitedZone}</h3>
        </div>
      </div>
    </motion.div>
  );
}
