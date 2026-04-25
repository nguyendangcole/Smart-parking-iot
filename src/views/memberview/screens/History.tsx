import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  CreditCard,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../shared/supabase';
import { useProfile } from '../../../shared/hooks/useProfile';
import { generateReceiptPDF } from '../../../shared/utils/receipt';

interface ParkingSession {
  id: string;
  entry_time: string;
  exit_time: string | null;
  vehicle_plate: string;
  zone_name: string;
  fee: number;
  status: string;
}

// Canonical status keys used by the UI
type StatusKey = 'Completed' | 'Ongoing' | 'Cancelled' | 'Unknown';
type StatusFilter = 'All' | 'Completed' | 'Ongoing' | 'Cancelled';

// Maps each canonical status to every variant that might appear in the DB.
// The parking_sessions table is written to by several flows (member schema,
// visitor flow, older master schema, legacy mocks) so raw status values come
// in mixed case and with different aliases. We normalize on both read
// (display) and write (query) paths so the filter actually matches reality.
const STATUS_VARIANTS: Record<Exclude<StatusFilter, 'All'>, string[]> = {
  Completed: ['Completed', 'completed', 'COMPLETED', 'Paid', 'paid', 'PAID'],
  Ongoing: [
    'Ongoing', 'ongoing', 'ONGOING',
    'Active', 'active', 'ACTIVE',
    'In Progress', 'in progress',
    'unpaid', 'Unpaid', 'UNPAID'
  ],
  Cancelled: ['Cancelled', 'cancelled', 'CANCELLED', 'Canceled', 'canceled']
};

const normalizeStatus = (raw?: string | null): StatusKey => {
  if (!raw) return 'Unknown';
  const v = String(raw).toLowerCase().trim();
  if (['completed', 'paid'].includes(v)) return 'Completed';
  if (['ongoing', 'active', 'in progress', 'unpaid'].includes(v)) return 'Ongoing';
  if (['cancelled', 'canceled'].includes(v)) return 'Cancelled';
  return 'Unknown';
};

// Escapes characters that would break PostgREST's .or() / .ilike() syntax.
// Commas split or() arguments, percent signs are ilike wildcards, and
// parentheses can confuse the filter tree.
const sanitizeSearch = (raw: string): string =>
  raw.replace(/[,%()]/g, '').trim();

export default function History() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('All');
  const [filterMonth, setFilterMonth] = useState<Date | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Tracks which row is currently generating a PDF so we can show a spinner
  // on just that row (and disable its button) without blocking the rest of
  // the table.
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalSpent: 0,
    totalHours: 0,
    mostVisitedZone: 'N/A'
  });

  const monthOptions = useMemo(() => {
    const opts: Array<{ label: string; value: Date | null }> = [
      { label: 'All Time', value: null }
    ];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: d
      });
    }
    return opts;
  }, []);

  const filterMonthLabel = filterMonth
    ? filterMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'All Time';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target as Node)) {
        setShowMonthMenu(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('parking_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', profile.id)
        .order('entry_time', { ascending: false });

      // Search: match against plate OR zone, with sanitized input so
      // commas/parens/percents don't break PostgREST's .or() syntax.
      const term = sanitizeSearch(searchTerm);
      if (term) {
        query = query.or(
          `vehicle_plate.ilike.%${term}%,zone_name.ilike.%${term}%`
        );
      }

      // Status: match any variant that maps to the selected canonical status.
      // Using .in() keeps filtering server-side (so pagination/count stay
      // accurate) while tolerating mixed casing and alias values in the DB.
      if (filterStatus !== 'All') {
        query = query.in('status', STATUS_VARIANTS[filterStatus]);
      }

      // Month: limit to entries whose entry_time falls in the selected month.
      if (filterMonth) {
        const start = new Date(
          filterMonth.getFullYear(),
          filterMonth.getMonth(),
          1
        );
        const end = new Date(
          filterMonth.getFullYear(),
          filterMonth.getMonth() + 1,
          1
        );
        query = query
          .gte('entry_time', start.toISOString())
          .lt('entry_time', end.toISOString());
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;
      setSessions((data as any) || []);
      setTotalCount(count || 0);

      // Stats card always reflects the current calendar month, independent
      // of the filters applied to the table above.
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
  }, [profile?.id, currentPage, itemsPerPage, searchTerm, filterStatus, filterMonth]);

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

  const handleDownloadReceipt = useCallback(async (session: ParkingSession) => {
    if (downloadingId) return; // Ignore double-clicks while one is in flight.
    setDownloadingId(session.id);
    try {
      await generateReceiptPDF(session, profile);
    } catch (err: any) {
      console.error('Failed to generate receipt:', err);
      alert(`Could not generate receipt: ${err?.message || 'Unknown error'}`);
    } finally {
      setDownloadingId(null);
    }
  }, [profile, downloadingId]);

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
              className="w-full pl-11 pr-9 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary text-sm shadow-sm"
              placeholder="Search by plate or zone..."
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="relative" ref={monthMenuRef}>
            <button
              onClick={() => {
                setShowMonthMenu(v => !v);
                setShowStatusMenu(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-none shadow-sm transition-colors ${filterMonth ? 'bg-primary/10 text-primary' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <Calendar size={18} />
              <span>{filterMonthLabel}</span>
            </button>
            {showMonthMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-20">
                <div className="py-2 max-h-72 overflow-y-auto">
                  {monthOptions.map((opt, i) => {
                    const isActive = (!filterMonth && !opt.value) ||
                      (filterMonth && opt.value && filterMonth.getTime() === opt.value.getTime());
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setFilterMonth(opt.value);
                          setCurrentPage(1);
                          setShowMonthMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${isActive ? 'font-bold text-primary bg-primary/5' : 'text-slate-700'}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => {
                setShowStatusMenu(v => !v);
                setShowMonthMenu(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-none shadow-sm transition-colors ${filterStatus !== 'All' ? 'bg-primary/10 text-primary' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter size={18} />
              <span>{filterStatus === 'All' ? 'Filters' : filterStatus}</span>
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-20">
                <div className="py-2">
                  {(['All', 'Completed', 'Ongoing', 'Cancelled'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status);
                        setCurrentPage(1);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterStatus === status ? 'font-bold text-primary bg-primary/5' : 'text-slate-700'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {(filterStatus !== 'All' || filterMonth || searchTerm) && (
            <button
              onClick={() => {
                setFilterStatus('All');
                setFilterMonth(null);
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
            >
              <X size={14} />
              Clear all
            </button>
          )}
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
                  sessions.map((session) => {
                    const statusKey = normalizeStatus(session.status);
                    const isOngoing = statusKey === 'Ongoing';
                    const isCompleted = statusKey === 'Completed';
                    const isCancelled = statusKey === 'Cancelled';
                    return (
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
                        <td className={`px-6 py-4 text-sm font-bold ${isOngoing ? 'text-primary' : 'text-slate-700'}`}>
                          {session.fee === 0 ? '0 VND' : `${(session.fee || 0).toLocaleString()} VND`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isCompleted ? 'bg-green-100 text-green-700' :
                            isOngoing ? 'bg-blue-100 text-blue-700' :
                            isCancelled ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`size-1.5 rounded-full ${
                              isCompleted ? 'bg-green-500' :
                              isOngoing ? 'bg-blue-500' :
                              isCancelled ? 'bg-red-500' :
                              'bg-slate-400'
                            }`}></span>
                            {statusKey === 'Unknown' ? (session.status || 'N/A') : statusKey}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const isDownloading = downloadingId === session.id;
                            const disabled = !isCompleted || isDownloading || (!!downloadingId && !isDownloading);
                            return (
                              <button
                                disabled={disabled}
                                onClick={() => handleDownloadReceipt(session)}
                                title={
                                  !isCompleted
                                    ? 'Receipt available after the session is completed'
                                    : 'Download PDF receipt'
                                }
                                className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                  !isCompleted
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : isDownloading
                                      ? 'text-primary bg-primary/10 cursor-wait'
                                      : disabled
                                        ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                                        : 'text-primary bg-primary/5 hover:bg-primary/10'
                                }`}
                              >
                                {isDownloading ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Preparing...
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} />
                                    Receipt
                                  </>
                                )}
                              </button>
                            );
                          })()}
                        </td>
                      </motion.tr>
                    );
                  })
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
