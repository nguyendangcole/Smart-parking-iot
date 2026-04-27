import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  LogIn,
  LogOut,
  Sparkles,
  BarChart3,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';
import type { Profile } from '../../../shared/hooks/useProfile';

interface ActivePolicy {
  name?: string;
  price?: number;
  type?: string;
}

interface SubscriptionDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  activePolicy: ActivePolicy;
  onManagePlan?: () => void;
}

interface ParkingSessionRow {
  id: string;
  entry_time: string;
  exit_time: string | null;
  zone_name: string | null;
  fee: number | null;
  status: string | null;
  vehicle_plate: string | null;
}

interface DayBucket {
  key: string;
  date: Date;
  day: string;
  fullDate: string;
  count: number;
  hours: number;
  active: boolean;
}

type ChartMetric = 'count' | 'hours';

// Local YYYY-MM-DD key. Avoids the UTC off-by-one that
// `toISOString().slice(0, 10)` introduces around midnight in non-UTC zones.
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Bucket sessions into the trailing 7 days (oldest -> today). Cancelled
// sessions are dropped to match the Dashboard chart's accounting.
const buildSevenDayBuckets = (
  sessions: Array<Pick<ParkingSessionRow, 'entry_time' | 'exit_time' | 'status'>>,
): DayBucket[] => {
  const now = new Date();
  const todayKey = dayKey(now);

  const slots: DayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    slots.push({
      key: dayKey(d),
      date: d,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      count: 0,
      hours: 0,
      active: dayKey(d) === todayKey,
    });
  }
  const indexByKey = new Map(slots.map((s, i) => [s.key, i]));

  sessions.forEach(s => {
    const status = String(s.status || '').toLowerCase().trim();
    if (status === 'cancelled' || status === 'canceled') return;

    const entry = new Date(s.entry_time);
    if (isNaN(entry.getTime())) return;
    const idx = indexByKey.get(dayKey(entry));
    if (idx === undefined) return;

    slots[idx].count += 1;
    const exit = s.exit_time ? new Date(s.exit_time) : now;
    const hrs = Math.max(0, (exit.getTime() - entry.getTime()) / (1000 * 60 * 60));
    slots[idx].hours += hrs;
  });

  return slots.map(s => ({ ...s, hours: Math.round(s.hours * 10) / 10 }));
};

export default function SubscriptionDrawer({
  open,
  onClose,
  profile,
  activePolicy,
  onManagePlan,
}: SubscriptionDrawerProps) {
  const [sessions, setSessions] = useState<ParkingSessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('count');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Body scroll lock + ESC handler. Both effects share the same lifecycle so
  // they live in one block; the cleanup restores the previous overflow value
  // rather than hard-coding 'auto' (which would clobber a parent that had
  // intentionally hidden the body scroll for some other reason).
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Lazy-load sessions only when the drawer is actually opened. We pull the
  // last 30 days so the same query feeds both the 7-day chart and the 5-row
  // history table (sorted newest-first).
  useEffect(() => {
    if (!open || !profile?.id) return;
    let cancelled = false;
    setLoadingSessions(true);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    supabase
      .from('parking_sessions')
      .select('id, entry_time, exit_time, zone_name, fee, status, vehicle_plate')
      .eq('user_id', profile.id)
      .gte('entry_time', since.toISOString())
      .order('entry_time', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setSessions(data as ParkingSessionRow[]);
        setLoadingSessions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, profile?.id]);

  const buckets = useMemo(() => buildSevenDayBuckets(sessions), [sessions]);

  const totalThisWeek = useMemo(
    () => buckets.reduce((acc, b) => acc + (chartMetric === 'count' ? b.count : b.hours), 0),
    [buckets, chartMetric],
  );

  const peakDay = useMemo(() => {
    if (buckets.length === 0) return null;
    return buckets.reduce((a, b) => {
      const aVal = chartMetric === 'count' ? a.count : a.hours;
      const bVal = chartMetric === 'count' ? b.count : b.hours;
      return bVal > aVal ? b : a;
    });
  }, [buckets, chartMetric]);

  const maxValue = useMemo(
    () => Math.max(1, ...buckets.map(b => (chartMetric === 'count' ? b.count : b.hours))),
    [buckets, chartMetric],
  );

  const recentFive = sessions.slice(0, 5);

  // Days remaining is clamped at 0 so an expired plan doesn't render a
  // confusing negative number on the summary card.
  const daysRemaining = useMemo(() => {
    if (!profile?.package_expires_at) return null;
    const ms = new Date(profile.package_expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [profile?.package_expires_at]);

  const balance = profile?.balance ?? 0;
  const isExempt = !!profile?.exempt_payment;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="subscription-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            key="subscription-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] bg-slate-50 shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-drawer-title"
          >
            <header className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subscription</p>
                  <h2
                    id="subscription-drawer-title"
                    className="text-base font-bold text-slate-800"
                  >
                    Plan Details
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </header>

            {/* Body scroll fallback. The three sections below are each
                `shrink-0` (Active Plan / Parking Frequency / Usage History) so
                they stack at their natural heights and *look* fully fixed on
                tall viewports. When the drawer is shorter than their combined
                height, this wrapper kicks in and the user can scroll up/down
                through all three. `min-h-0` is required for `overflow-y-auto`
                to actually engage inside a flex column. */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Pinned plan summary - first of three stacked sections. */}
              <div className="shrink-0 px-6 pt-6 pb-3">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-dark text-white p-6 shadow-xl shadow-primary/20"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-cyan/20 rounded-full -ml-10 -mb-10 blur-2xl" />

                <div className="relative z-10 flex flex-col gap-5">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-blue-100/80 font-bold uppercase tracking-widest mb-1">
                        Active Plan
                      </p>
                      <h3 className="text-2xl font-extrabold tracking-tight leading-tight truncate">
                        {activePolicy.name || 'Standard Monthly Pass'}
                      </h3>
                    </div>
                    {daysRemaining !== null && (
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-black leading-none">{daysRemaining}</p>
                        <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mt-1">
                          Days Left
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                      <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mb-1">
                        Balance
                      </p>
                      <p className="text-lg font-extrabold">
                        {balance.toLocaleString()}{' '}
                        <span className="text-xs font-bold text-blue-100/80">VND</span>
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                      <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mb-1">
                        {isExempt ? 'Pricing' : 'Renewal'}
                      </p>
                      <p className="text-lg font-extrabold">
                        {isExempt
                          ? 'Free'
                          : (activePolicy.price || 0).toLocaleString()}
                        {!isExempt && (
                          <span className="text-xs font-bold text-blue-100/80"> VND</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {profile?.package_expires_at && (
                    <div className="flex items-center gap-2 text-xs text-blue-100/90 font-medium">
                      <Calendar size={14} />
                      <span>
                        Valid until{' '}
                        {new Date(profile.package_expires_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.section>
            </div>

            {/* Pinned parking frequency - sits between Active Plan and Usage
                History. With all three sections fixed the drawer body has no
                scrollable region; the chart itself is fixed-height (h-40) so
                nothing inside this card needs an internal scroll either. */}
            <div className="shrink-0 px-6 py-3">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-1 gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 size={16} className="text-primary" />
                      Parking Frequency
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Last 7 days</p>
                  </div>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-bold">
                    <button
                      onClick={() => setChartMetric('count')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        chartMetric === 'count'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      SESSIONS
                    </button>
                    <button
                      onClick={() => setChartMetric('hours')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        chartMetric === 'hours'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      HOURS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Total this week
                    </p>
                    <p className="text-2xl font-black text-slate-800">
                      {chartMetric === 'count'
                        ? totalThisWeek
                        : `${(totalThisWeek as number).toFixed(1)}h`}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Peak day
                    </p>
                    <p className="text-2xl font-black text-slate-800 truncate">
                      {peakDay && (chartMetric === 'count' ? peakDay.count : peakDay.hours) > 0
                        ? peakDay.day
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="h-40 w-full flex items-end justify-between gap-1.5 pt-4">
                  {loadingSessions ? (
                    Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-2 h-full min-w-0"
                      >
                        <div className="w-full bg-slate-100 rounded-t-lg animate-pulse h-full" />
                        <span className="text-[10px] font-bold text-transparent">·</span>
                      </div>
                    ))
                  ) : (
                    buckets.map((b, i) => {
                      const value = chartMetric === 'count' ? b.count : b.hours;
                      const heightPct = value > 0 ? Math.max(6, (value / maxValue) * 100) : 0;
                      const isHovered = hoveredBar === i;
                      return (
                        <div
                          key={b.key}
                          className="flex-1 flex flex-col items-center gap-2 h-full min-w-0"
                          onMouseEnter={() => setHoveredBar(i)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div className="w-full bg-slate-100 rounded-t-lg relative h-full">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPct}%` }}
                              transition={{ delay: 0.15 + i * 0.04, type: 'spring', damping: 18 }}
                              className={`absolute bottom-0 w-full rounded-t-lg transition-colors ${
                                b.active
                                  ? 'bg-primary shadow-lg shadow-primary/30'
                                  : value > 0
                                  ? isHovered
                                    ? 'bg-primary/80'
                                    : 'bg-primary/40'
                                  : 'bg-transparent'
                              }`}
                            />
                            {isHovered && value > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap shadow-lg z-10"
                              >
                                <div>{b.fullDate}</div>
                                <div className="text-primary-container text-[10px] font-black">
                                  {chartMetric === 'count'
                                    ? `${b.count} session${b.count === 1 ? '' : 's'}`
                                    : `${b.hours}h parked`}
                                </div>
                              </motion.div>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              b.active ? 'text-primary' : 'text-slate-400'
                            }`}
                          >
                            {b.day}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.section>
            </div>

            {/* Pinned usage history - third fixed section. The entry list
                inside is capped with `max-h-60 overflow-y-auto` so a long
                history can scroll internally without pushing the footer out
                of the drawer when the viewport is short. */}
            <div className="shrink-0 px-6 pt-3 pb-3">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    Usage History
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Last 5 entries
                  </span>
                </header>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {loadingSessions ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-5 py-3.5 animate-pulse"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="w-3/4 h-3 bg-slate-100 rounded" />
                          <div className="w-1/2 h-2.5 bg-slate-100 rounded" />
                        </div>
                      </div>
                    ))
                  ) : recentFive.length === 0 ? (
                    <div className="px-5 py-12 flex flex-col items-center gap-2 text-center">
                      <Clock className="text-slate-200" size={36} />
                      <p className="text-xs font-bold text-slate-500">No recent sessions</p>
                      <p className="text-[10px] text-slate-400">
                        Park anywhere on campus to start tracking your activity here.
                      </p>
                    </div>
                  ) : (
                    recentFive.map(s => {
                      const isOpen = !s.exit_time;
                      const Icon = isOpen ? LogIn : LogOut;
                      const dateLabel = new Date(s.entry_time).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      });
                      const timeLabel = new Date(s.entry_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isOpen
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {isOpen ? 'Entry' : 'Exit'} · {s.zone_name || 'Central Lot'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <MapPin size={10} />
                              {dateLabel} · {timeLabel}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`text-xs font-bold ${
                                isOpen ? 'text-blue-600' : 'text-slate-700'
                              }`}
                            >
                              {isOpen ? 'Active' : `${(s.fee || 0).toLocaleString()} ₫`}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.section>
            </div>
            </div>

            <footer className="px-6 py-4 border-t border-slate-200 bg-white flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (onManagePlan) onManagePlan();
                  else onClose();
                }}
                className="flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                Manage Plan
                <ArrowRight size={16} />
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
