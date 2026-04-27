import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bell,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  Star,
  PlusCircle,
  Search,
  Building2,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfile } from '../../../shared/hooks/useProfile';
import { supabase } from '../../../shared/supabase';
import { Screen } from '../types';
import TopUpDrawer from '../components/TopUpDrawer';
import FindSlotDrawer from '../components/FindSlotDrawer';
import {
  LOW_BALANCE_THRESHOLD,
  PROMOTIONAL_NOTIFICATIONS,
} from '../../../shared/utils/notifications';

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

interface ActivityBar {
  day: string;
  height: string;
  hours: number;
  fullDate: string;
  active: boolean;
}

// Local YYYY-MM-DD key; avoids UTC off-by-one that `toISOString().slice(0,10)` hits
// for users east/west of UTC around midnight.
const formatDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---- Loyalty / rewards configuration --------------------------------------
// We do not (yet) have a `rewards` table in the schema, so points are
// *derived* from each member's existing spend ledger:
//   1 point per REWARDS_VND_PER_POINT VND of qualifying spend.
//   Integer-only — leftover VND below the rate is discarded (Math.floor).
//   So 1,500 VND -> 1 pt, 1,999 VND -> 1 pt, 2,000 VND -> 2 pts.
//
// "Qualifying spend" is parking usage only — `parking_sessions.fee`
// (excluding cancelled sessions) plus `parking_transactions.amount` for
// SESSION_PAYMENT / PLAN_RENEWAL with status = SUCCESS. Top-ups, refunds
// and failed transactions are intentionally excluded so the program
// rewards *using* the lot, not topping the wallet up.
//
// If a `rewards` table is introduced later, the only thing that changes is
// the data source inside `fetchRewards`; the tier math below stays the same.
const REWARDS_VND_PER_POINT = 1000;

// Sub-Iron placeholder for members with 0 points. The spec defines tiers
// from 1 pt upwards, so brand-new members literally have no rank yet —
// "Unranked" makes that explicit and gives the UI a clean next-tier goal
// ("1 pt to Iron Tier") instead of pretending they're already Iron.
const UNRANKED_LABEL = 'Unranked';

// Membership-rank thresholds (inclusive lower bounds). Members rank up
// the instant they cross the next minPoints, which is what the spec
// means by "automatically upgrade their rank as soon as they cross the
// threshold for the next tier". Auto-upgrade comes for free from the
// fetchRewards realtime subscriptions — every session close / plan
// renewal triggers a refetch, which reruns this table.
//
// Spec ranges (right-hand side is implied by the next row's minPoints):
//   Iron       1 –     100 pts
//   Bronze   101 –     500 pts
//   Silver   501 –   2,000 pts
//   Gold   2,001 –   5,000 pts
//   Platinum 5,001 –  10,000 pts
//   Diamond 10,001 +
//
// Keep these in sync with any tier names referenced in member-facing copy
// (notifications, Settings page, marketing emails). The array MUST stay
// sorted ascending — computeRewardsFromPoints relies on that.
const REWARDS_TIERS = [
  { name: 'Iron',     minPoints: 1 },
  { name: 'Bronze',   minPoints: 101 },
  { name: 'Silver',   minPoints: 501 },
  { name: 'Gold',     minPoints: 2001 },
  { name: 'Platinum', minPoints: 5001 },
  { name: 'Diamond',  minPoints: 10001 },
] as const;

// Tier-specific colour palette used by the rank-table popover. Kept as a
// separate map (not baked into REWARDS_TIERS) so tier *data* stays pure
// and a future restyle never has to risk touching the math. Class names
// must appear as plain string literals so Tailwind's JIT can detect them.
const TIER_VISUALS: Record<string, { ring: string; icon: string; label: string }> = {
  Iron:     { ring: 'bg-zinc-100',   icon: 'text-zinc-500',   label: 'text-zinc-700' },
  Bronze:   { ring: 'bg-orange-100', icon: 'text-orange-600', label: 'text-orange-700' },
  Silver:   { ring: 'bg-slate-100',  icon: 'text-slate-500',  label: 'text-slate-700' },
  Gold:     { ring: 'bg-amber-100',  icon: 'text-amber-600',  label: 'text-amber-700' },
  Platinum: { ring: 'bg-cyan-100',   icon: 'text-cyan-600',   label: 'text-cyan-700' },
  Diamond:  { ring: 'bg-indigo-100', icon: 'text-indigo-600', label: 'text-indigo-700' },
};
const TIER_VISUAL_FALLBACK = { ring: 'bg-slate-100', icon: 'text-slate-400', label: 'text-slate-500' };

interface RewardsState {
  total: number;            // total points earned (floored)
  tier: string;             // current tier name
  nextTier: string | null;  // null when the member is already at top tier
  toNextTier: number;       // points still needed for nextTier (0 at top)
  progressPercent: number;  // 0–100, width of the progress bar
}

// Pure helper: maps a raw point total to the public-facing tier metadata
// rendered by the Total Rewards card.
//
// Three regimes:
//   1. Below the first tier (Iron starts at 1 pt) -> "Unranked", with the
//      next-tier goal pointing at Iron. This is the brand-new-member case.
//   2. Inside the table -> the *last* row whose minPoints <= safeTotal,
//      with progress measured against the next row's minPoints.
//   3. At the highest tier (Diamond, 10,001+) -> nextTier=null and a
//      flat 100% bar so the UI can show "Max tier reached" instead of
//      an unreachable goal.
const computeRewardsFromPoints = (totalPoints: number): RewardsState => {
  const safeTotal = Math.max(0, Math.floor(totalPoints));

  // Regime 1: sub-Iron. Aim the progress bar at the first tier so the
  // user has a concrete first goal even before they earn anything.
  const firstTier = REWARDS_TIERS[0];
  if (safeTotal < firstTier.minPoints) {
    return {
      total: safeTotal,
      tier: UNRANKED_LABEL,
      nextTier: firstTier.name,
      toNextTier: firstTier.minPoints - safeTotal,
      progressPercent: 0,
    };
  }

  // Regime 2/3: walk the sorted tier table and pick the last row whose
  // threshold has been crossed. O(n) on a 6-element array is fine and
  // keeps the array order as the single source of truth.
  let currentIdx = 0;
  for (let i = 0; i < REWARDS_TIERS.length; i++) {
    if (safeTotal >= REWARDS_TIERS[i].minPoints) currentIdx = i;
  }
  const current = REWARDS_TIERS[currentIdx];
  const next = REWARDS_TIERS[currentIdx + 1] ?? null;

  if (!next) {
    return {
      total: safeTotal,
      tier: current.name,
      nextTier: null,
      toNextTier: 0,
      progressPercent: 100,
    };
  }

  const span = next.minPoints - current.minPoints;
  const within = Math.max(0, safeTotal - current.minPoints);
  const progressPercent =
    span > 0 ? Math.min(100, Math.round((within / span) * 100)) : 0;

  return {
    total: safeTotal,
    tier: current.name,
    nextTier: next.name,
    toNextTier: Math.max(0, next.minPoints - safeTotal),
    progressPercent,
  };
};

// Builds the per-day buckets for the bar chart. Hours are attributed to the
// session's entry day (overnight sessions are not split across days — the
// dashboard is a glanceable overview, not an accounting report). Ongoing
// sessions count from entry_time to "now". Cancelled sessions are ignored.
const buildActivityChart = (
  sessions: Array<{ entry_time: string; exit_time: string | null; status?: string | null }>,
  days: number
): { bars: ActivityBar[]; totalHours: number; sessionCount: number } => {
  const now = new Date();
  const todayKey = formatDayKey(now);

  const slots: Array<{ key: string; date: Date; hours: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    slots.push({ key: formatDayKey(d), date: d, hours: 0 });
  }
  const indexByKey = new Map(slots.map((s, idx) => [s.key, idx]));

  let totalHours = 0;
  let sessionCount = 0;

  sessions.forEach(s => {
    const status = String(s.status || '').toLowerCase().trim();
    if (status === 'cancelled' || status === 'canceled') return;

    const entry = new Date(s.entry_time);
    if (isNaN(entry.getTime())) return;
    const exit = s.exit_time ? new Date(s.exit_time) : now;

    const idx = indexByKey.get(formatDayKey(entry));
    if (idx === undefined) return; // session outside the rendered window

    const hours = Math.max(0, (exit.getTime() - entry.getTime()) / (1000 * 60 * 60));
    slots[idx].hours += hours;
    totalHours += hours;
    sessionCount += 1;
  });

  const max = slots.reduce((m, s) => Math.max(m, s.hours), 0);
  const safeMax = max > 0 ? max : 1;

  const bars: ActivityBar[] = slots.map(({ key, date, hours }) => ({
    hours: Math.round(hours * 10) / 10,
    // Floor non-zero bars at 4% so tiny (but real) sessions stay visible next
    // to a much larger day; zero days render as empty slots.
    height: hours > 0 ? `${Math.max(4, (hours / safeMax) * 100)}%` : '0%',
    active: key === todayKey,
    fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    day:
      days === 7
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.getDate() % 5 === 0 || key === todayKey
        ? String(date.getDate())
        : '',
  }));

  return {
    bars,
    totalHours: Math.round(totalHours * 10) / 10,
    sessionCount,
  };
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, refreshProfile } = useProfile();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRankTable, setShowRankTable] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data states
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ActivityBar[]>([]);
  const [chartStats, setChartStats] = useState({ totalHours: 0, sessionCount: 0 });
  const [balanceStats, setBalanceStats] = useState({
    spentThisMonth: 0,
    spentLastMonth: 0,
    trendPercent: 0, // positive = spending up vs last month, negative = down
  });
  // Lazy init from the same helper fetchRewards uses, so the placeholder
  // shown before the first fetch lands ("Unranked / 1 pt to Iron Tier") is
  // always consistent with the tier table — no manual sync needed.
  const [rewards, setRewards] = useState<RewardsState>(() => computeRewardsFromPoints(0));
  const [isLoading, setIsLoading] = useState(true);
  const [activityPeriod, setActivityPeriod] = useState('7');
  const [showTopUpDrawer, setShowTopUpDrawer] = useState(false);
  const [showFindSlotDrawer, setShowFindSlotDrawer] = useState(false);
  // Static "system" notifications (mock data for now). Their read state
  // lives here. Dynamic entries (low-balance, promotions) are computed
  // from `profile` further down and tracked separately so toggling a
  // pref in Settings makes them appear/disappear in real time.
  const [staticNotifications, setStaticNotifications] = useState<
    Array<{ id: string; title: string; message: string; time: string; unread: boolean }>
  >([
    { id: 'session-ending', title: 'Session Ending Soon', message: 'Your parking session at B2 Building will end in 15 minutes.', time: '10 mins ago', unread: true },
    { id: 'payment-success', title: 'Payment Successful', message: 'Successfully topped up 50,000 VND to your wallet.', time: '2 hours ago', unread: false },
    { id: 'reward-tier',    title: 'New Reward Tier',    message: 'Congratulations! You are only 260 points away from Gold tier.', time: '1 day ago', unread: false },
  ]);

  // Read-state for dynamic entries. Resets on reload, which is fine —
  // a low balance that returns BELOW the threshold should re-alert the
  // member, and refreshed promo content should be considered new.
  const [readDynamicIds, setReadDynamicIds] = useState<Set<string>>(new Set());

  const notificationRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const rankTableRef = useRef<HTMLDivElement>(null);

  // Compose the displayed notification list. Order: a low-balance
  // alert first (most actionable), then static system notifications,
  // then promotional offers — so urgent items are visible at the top
  // of the dropdown without scrolling.
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      unread: boolean;
    }> = [];

    const balance = Number(profile?.balance ?? 0);
    // `notify_low_balance` defaults to TRUE so members on a DB without
    // the 08_member_notification_prefs migration still get alerted.
    const lowBalanceOn = profile?.notify_low_balance !== false;
    if (lowBalanceOn && balance < LOW_BALANCE_THRESHOLD) {
      list.push({
        id: 'low-balance',
        title: 'Low Wallet Balance',
        message: `Your balance is ${balance.toLocaleString()} VND, below the ${LOW_BALANCE_THRESHOLD.toLocaleString()} VND alert threshold. Top up to keep parking.`,
        time: 'Just now',
        unread: !readDynamicIds.has('low-balance'),
      });
    }

    list.push(...staticNotifications);

    // Promotions are opt-in; default FALSE.
    if (profile?.notify_promotions === true) {
      PROMOTIONAL_NOTIFICATIONS.forEach((p) => {
        list.push({
          id: p.id,
          title: p.title,
          message: p.message,
          time: p.time,
          unread: !readDynamicIds.has(p.id),
        });
      });
    }

    return list;
  }, [
    profile?.balance,
    profile?.notify_low_balance,
    profile?.notify_promotions,
    staticNotifications,
    readDynamicIds,
  ]);

  // Single click handler that routes by source: dynamic entries
  // (low-balance, promos) are tracked in the Set, static entries are
  // updated in place via setStaticNotifications.
  const handleNotificationClick = (id: string) => {
    const isStatic = staticNotifications.some((n) => n.id === id);
    if (isStatic) {
      setStaticNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      return;
    }
    setReadDynamicIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // "Mark all as read" must clear unread state across both sources so
  // the bell-dot disappears and stays gone until something new arrives.
  const handleMarkAllRead = () => {
    setStaticNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setReadDynamicIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (rankTableRef.current && !rankTableRef.current.contains(event.target as Node)) {
        setShowRankTable(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sums *all* outgoing spend for the current and previous calendar month
  // so the balance card can show a real trend. Spend has two sources:
  //   1. parking_sessions.fee — populated when a session closes
  //   2. parking_transactions.amount — plan renewals (PLAN_RENEWAL) and any
  //      future session ledger rows (SESSION_PAYMENT), both SUCCESS-only.
  // TOP_UP / REFUND are money *into* the wallet and are intentionally
  // excluded. The two sources never overlap today (session-close writes only
  // sessions.fee, member_extend_plan writes only parking_transactions), so
  // naively summing both is safe.
  const fetchBalanceTrend = useCallback(async () => {
    if (!profile?.id) return;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [sessionRes, txRes] = await Promise.all([
      supabase
        .from('parking_sessions')
        .select('fee, entry_time')
        .eq('user_id', profile.id)
        .gte('entry_time', startOfLastMonth.toISOString())
        .lt('entry_time', startOfNextMonth.toISOString()),
      supabase
        .from('parking_transactions')
        .select('amount, transaction_type, created_at')
        .eq('profile_id', profile.id)
        .eq('status', 'SUCCESS')
        .in('transaction_type', ['PLAN_RENEWAL', 'SESSION_PAYMENT'])
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfNextMonth.toISOString()),
    ]);

    if (sessionRes.error) {
      console.warn('Failed to load session spend', sessionRes.error);
    }
    if (txRes.error) {
      // `transaction_type` might not exist on very old DBs (pre-05_member_wallet.sql);
      // fall through silently so the sessions-only number still renders.
      console.warn('Failed to load transaction spend', txRes.error);
    }

    let thisMonth = 0;
    let lastMonth = 0;

    (sessionRes.data || []).forEach((row: any) => {
      const t = new Date(row.entry_time);
      const fee = Number(row.fee) || 0;
      if (t >= startOfThisMonth) thisMonth += fee;
      else if (t >= startOfLastMonth) lastMonth += fee;
    });

    (txRes.data || []).forEach((row: any) => {
      const t = new Date(row.created_at);
      const amount = Number(row.amount) || 0;
      if (t >= startOfThisMonth) thisMonth += amount;
      else if (t >= startOfLastMonth) lastMonth += amount;
    });

    // Percentage change of this month's spend vs last month's. Guarded so a
    // 0 → non-zero comparison doesn't explode to Infinity; instead we cap
    // growth at +100% and show the raw numbers in the secondary copy.
    let trendPercent = 0;
    if (lastMonth > 0) {
      trendPercent = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    } else if (thisMonth > 0) {
      trendPercent = 100;
    }

    setBalanceStats({ spentThisMonth: thisMonth, spentLastMonth: lastMonth, trendPercent });
  }, [profile?.id]);

  // Total Rewards: derive lifetime points from the same two ledgers
  // fetchBalanceTrend reads, but summed across *all* time (no month
  // boundary) so a member's points never reset. Each REWARDS_VND_PER_POINT
  // VND of qualifying spend earns one point.
  //
  // Filtering rules (must match the comment block on REWARDS_TIERS):
  //   - parking_sessions: skip rows whose status is cancelled/canceled
  //     (the gate may write either spelling depending on locale).
  //   - parking_transactions: only SUCCESS rows of type SESSION_PAYMENT
  //     or PLAN_RENEWAL. TOP_UP and REFUND are wallet-side movements and
  //     are intentionally not earnings.
  //
  // The two ledgers do not overlap today (session-close writes only
  // sessions.fee, member_extend_plan writes only parking_transactions),
  // so summing both is safe and matches fetchBalanceTrend exactly.
  const fetchRewards = useCallback(async () => {
    if (!profile?.id) {
      setRewards(computeRewardsFromPoints(0));
      return;
    }

    const [sessionRes, txRes] = await Promise.all([
      supabase
        .from('parking_sessions')
        .select('fee, status')
        .eq('user_id', profile.id),
      supabase
        .from('parking_transactions')
        .select('amount, transaction_type')
        .eq('profile_id', profile.id)
        .eq('status', 'SUCCESS')
        .in('transaction_type', ['PLAN_RENEWAL', 'SESSION_PAYMENT']),
    ]);

    if (sessionRes.error) {
      console.warn('Failed to load session spend for rewards', sessionRes.error);
    }
    if (txRes.error) {
      // `transaction_type` may not exist on very old DBs (pre-05_member_wallet.sql);
      // fall through silently so the sessions-only number still renders.
      console.warn('Failed to load transaction spend for rewards', txRes.error);
    }

    let totalSpend = 0;

    (sessionRes.data || []).forEach((row: any) => {
      const status = String(row.status || '').toLowerCase().trim();
      if (status === 'cancelled' || status === 'canceled') return;
      totalSpend += Number(row.fee) || 0;
    });

    (txRes.data || []).forEach((row: any) => {
      totalSpend += Number(row.amount) || 0;
    });

    const totalPoints = Math.floor(totalSpend / REWARDS_VND_PER_POINT);
    setRewards(computeRewardsFromPoints(totalPoints));
  }, [profile?.id]);

  // Realtime: a session close changes the balance/spend trend, so refresh
  // the trend whenever this user's parking_sessions rows change.
  useEffect(() => {
    if (!profile?.id) return;
    const sessionsChannel = supabase
      .channel(`member-parking-sessions-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_sessions',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          fetchBalanceTrend();
          fetchRewards();
        }
      )
      .subscribe();

    // Watch the user's profile row for balance/package changes (e.g. an
    // admin top-up or a plan renewal from another tab).
    const profileChannel = supabase
      .channel(`member-profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        () => {
          if (refreshProfile) refreshProfile();
        }
      )
      .subscribe();

    // Watch the ledger so the "spent this month" badge repaints the
    // instant a PLAN_RENEWAL or SESSION_PAYMENT row lands — the member
    // does not have to reload to see the new total after paying.
    const transactionsChannel = supabase
      .channel(`member-parking-transactions-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parking_transactions',
          filter: `profile_id=eq.${profile.id}`,
        },
        () => {
          fetchBalanceTrend();
          fetchRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [profile?.id, fetchBalanceTrend, fetchRewards, refreshProfile]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        await Promise.all([fetchBalanceTrend(), fetchRewards()]);

        // Parking Activity chart: pull every session whose entry falls inside
        // the visible window, then bucket locally so we can correctly count
        // ongoing sessions and respect the user's timezone.
        const periodDays = Math.max(1, parseInt(activityPeriod, 10) || 7);
        const chartStart = new Date();
        chartStart.setHours(0, 0, 0, 0);
        chartStart.setDate(chartStart.getDate() - (periodDays - 1));

        const { data: activityRows, error: activityError } = await supabase
          .from('parking_sessions')
          .select('entry_time, exit_time, status')
          .eq('user_id', profile.id)
          .gte('entry_time', chartStart.toISOString())
          .order('entry_time', { ascending: true });

        if (activityError) throw activityError;

        const { bars, totalHours, sessionCount } = buildActivityChart(
          activityRows || [],
          periodDays
        );
        setChartData(bars);
        setChartStats({ totalHours, sessionCount });

        // Fetch recent parking sessions from Supabase
        const { data: sessionData, error } = await supabase
          .from('parking_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .order('entry_time', { ascending: false })
          .limit(5);

        if (error) throw error;

        if (sessionData) {
          const formattedSessions = sessionData.map((session: any) => {
            const entryTime = new Date(session.entry_time);
            const timeString = entryTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + entryTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            // Calculate duration if exit_time exists
            let dur = '--';
            if (session.exit_time) {
              const exitTime = new Date(session.exit_time);
              const diffMs = exitTime.getTime() - entryTime.getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              dur = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
            } else {
              // Active session
              const now = new Date();
              const diffMs = now.getTime() - entryTime.getTime();
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              dur = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m (Running)`;
            }

            const isCompleted = !!session.exit_time;

            return {
              loc: session.zone_name || 'Campus Parking',
              time: timeString,
              dur,
              cost: session.fee ? `${session.fee.toLocaleString()} VND` : (isCompleted ? '0 VND' : 'Active'),
              status: isCompleted ? 'Completed' : 'Active',
              color: isCompleted ? 'indigo' : 'green'
            };
          });
          setRecentSessions(formattedSessions);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDate, activityPeriod, profile?.id, fetchBalanceTrend, fetchRewards]);

  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day));
    setShowCalendar(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentViewDate(today);
    setShowCalendar(false);
  };

  const displayDate = selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Topbar */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {profile?.full_name?.split(' ')[0] || 'Member'}! 👋
          </h2>
          <p className="text-slate-500 font-medium">Here's what's happening with your parking today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="size-12 rounded-2xl glass flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary transition-all border border-slate-200 relative"
            >
              <Bell size={20} />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-3 right-3 size-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 w-80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-xl border transition-colors ${notification.unread ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-bold ${notification.unread ? 'text-slate-900' : 'text-slate-700'}`}>{notification.title}</h4>
                        <span className="text-[10px] whitespace-nowrap text-slate-400 font-medium">{notification.time}</span>
                      </div>
                      <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-slate-500 text-sm">No notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={calendarRef}>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <Calendar size={18} className="text-primary" />
              <span className="text-sm font-bold text-slate-700">{displayDate}</span>
            </button>

            {showCalendar && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 w-72">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={handlePrevMonth} className="text-slate-400 hover:text-primary p-1">&lt;</button>
                  <span className="font-bold text-sm text-slate-700">
                    {currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="text-slate-400 hover:text-primary p-1">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-slate-700">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-1"></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = 
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentViewDate.getMonth() &&
                      selectedDate.getFullYear() === currentViewDate.getFullYear();
                    const isToday = 
                      new Date().getDate() === day &&
                      new Date().getMonth() === currentViewDate.getMonth() &&
                      new Date().getFullYear() === currentViewDate.getFullYear();

                    return (
                      <div 
                        key={day} 
                        onClick={() => handleDateSelect(day)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary text-white font-bold shadow-sm' 
                            : isToday
                            ? 'bg-primary/10 text-primary font-bold hover:bg-slate-100'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center">
                  <button 
                    onClick={handleToday} 
                    className="text-xs font-bold text-primary hover:underline transition-all"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Balance Card */}
        {(() => {
          const balance = Number(profile?.balance) || 0;
          const { spentThisMonth, spentLastMonth, trendPercent } = balanceStats;
          const hasHistory = spentThisMonth > 0 || spentLastMonth > 0;

          // "Spending down month-over-month" is the user's win — render it
          // green/down. Spending up is amber/up (not red; a parking app
          // shouldn't shame a user for using it). No-history and flat months
          // render neutrally.
          let TrendIcon = Minus;
          let badgeClasses = 'bg-white/15';
          let trendLabel = 'No spending history yet';

          if (hasHistory) {
            if (spentLastMonth === 0) {
              TrendIcon = TrendingUp;
              badgeClasses = 'bg-white/20';
              trendLabel = `${spentThisMonth.toLocaleString()} VND spent this month`;
            } else if (trendPercent < 0) {
              TrendIcon = TrendingDown;
              badgeClasses = 'bg-emerald-400/30';
              trendLabel = `${Math.abs(trendPercent)}% less spent vs last month`;
            } else if (trendPercent > 0) {
              TrendIcon = TrendingUp;
              badgeClasses = 'bg-amber-400/30';
              trendLabel = `${trendPercent}% more spent vs last month`;
            } else {
              TrendIcon = Minus;
              badgeClasses = 'bg-white/20';
              trendLabel = 'Same as last month';
            }
          }

          return (
            <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl shadow-primary/20">
              <div className="relative z-10">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
                <h3 className="text-3xl font-black mb-4 tabular-nums">
                  {balance.toLocaleString()} <span className="text-lg font-medium">VND</span>
                </h3>
                <div className={`flex items-center gap-2 ${badgeClasses} backdrop-blur-md w-fit px-3 py-1 rounded-full text-xs font-bold`}>
                  <TrendIcon size={14} />
                  <span>{trendLabel}</span>
                </div>
                {hasHistory && spentLastMonth > 0 && (
                  <p className="text-[11px] font-semibold text-blue-100 mt-2 tabular-nums">
                    {spentThisMonth.toLocaleString()} this month · {spentLastMonth.toLocaleString()} last month
                  </p>
                )}
              </div>
              <Wallet className="absolute -right-4 -bottom-4 text-white/10 size-32" />
            </div>
          );
        })()}

        {/* Points Card */}
        {/* `overflow-hidden` is intentionally NOT set on the card so the
            rank-table popover anchored to the Star button can extend below
            the card without being clipped. */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Rewards</p>
              <h3 className="text-3xl font-black text-slate-900">
                {rewards.total.toLocaleString()} <span className="text-lg font-medium">pts</span>
              </h3>
            </div>

            {/* Tier badge column doubles as the popover anchor — the ref
                wraps both the trigger AND the popover so the click-outside
                handler treats them as one unit (same trick as the bell /
                calendar dropdowns above). */}
            <div className="relative" ref={rankTableRef}>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowRankTable(prev => !prev)}
                  aria-label="View membership tiers"
                  aria-expanded={showRankTable}
                  className="size-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 active:bg-amber-200 transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <Star size={24} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                  {rewards.tier}
                </span>
              </div>

              {showRankTable && (
                <div className="absolute top-full mt-3 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 w-80">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">Membership Tiers</h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 tabular-nums">
                        You · {rewards.total.toLocaleString()} pts ·{' '}
                        <span className="font-bold text-slate-600">{rewards.tier}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRankTable(false)}
                      aria-label="Close membership tiers"
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 -mr-1">
                    {REWARDS_TIERS.map((tier, i) => {
                      const isCurrent = tier.name === rewards.tier;
                      const nextMin = REWARDS_TIERS[i + 1]?.minPoints;
                      // Right-hand bound is implied by the next tier's
                      // lower bound; the top tier (Diamond) is "X+ pts".
                      const range = nextMin
                        ? `${tier.minPoints.toLocaleString()} – ${(nextMin - 1).toLocaleString()} pts`
                        : `${tier.minPoints.toLocaleString()}+ pts`;
                      const visuals = TIER_VISUALS[tier.name] ?? TIER_VISUAL_FALLBACK;

                      return (
                        <div
                          key={tier.name}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                            isCurrent
                              ? 'bg-primary/5 border-primary/30 shadow-sm'
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`size-9 rounded-lg ${visuals.ring} ${visuals.icon} flex items-center justify-center shrink-0`}>
                            <Star size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${visuals.label}`}>{tier.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium tabular-nums">{range}</p>
                          </div>
                          {isCurrent && (
                            <span className="text-[9px] font-black tracking-wider uppercase text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                              You
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contextual footer: only renders for sub-Iron members
                      so the popover gives them a concrete first goal. */}
                  {rewards.tier === UNRANKED_LABEL && (
                    <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
                      Earn{' '}
                      <span className="font-bold text-primary">
                        {rewards.toNextTier.toLocaleString()} pt{rewards.toNextTier === 1 ? '' : 's'}
                      </span>{' '}
                      to unlock the Iron Tier.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${rewards.progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-bold">
            {rewards.nextTier
              ? `${rewards.toNextTier.toLocaleString()} pts to ${rewards.nextTier} Tier`
              : `${rewards.tier} Tier · Max reached`}
          </p>
        </div>
      </div>

      {/* Quick Actions & Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-lg font-bold text-slate-800">Quick Actions</h4>
          <button 
            onClick={() => setShowTopUpDrawer(true)}
            disabled={!profile?.id}
            className={`w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-primary hover:text-white transition-all group border-slate-200 shadow-sm ${!profile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="size-12 rounded-xl bg-primary/10 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white transition-colors">
              <PlusCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Top-up Balance</p>
              <p className="text-xs opacity-70">Add funds instantly</p>
            </div>
          </button>
          <button
            onClick={() => setShowFindSlotDrawer(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-indigo-600 hover:text-white transition-all group border-slate-200 shadow-sm"
          >
            <div className="size-12 rounded-xl bg-indigo-600/10 group-hover:bg-white/20 flex items-center justify-center text-indigo-600 group-hover:text-white transition-colors">
              <Search size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Find Slot</p>
              <p className="text-xs opacity-70">Locate available spots</p>
            </div>
          </button>
        </div>

        {/* Parking Activity */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6 gap-4">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Parking Activity</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {chartStats.sessionCount > 0 ? (
                  <>
                    <span className="font-bold text-slate-600">{chartStats.totalHours}h</span> parked across{' '}
                    <span className="font-bold text-slate-600">{chartStats.sessionCount}</span>{' '}
                    {chartStats.sessionCount === 1 ? 'session' : 'sessions'}
                  </>
                ) : (
                  <>No parking activity in this period</>
                )}
              </p>
            </div>
            <select
              value={activityPeriod}
              onChange={(e) => setActivityPeriod(e.target.value)}
              className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-1 focus:ring-primary/20"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          <div className="h-56 w-full flex items-end justify-between gap-2">
            {chartData.length === 0 && isLoading ? (
              Array.from({ length: activityPeriod === '7' ? 7 : 30 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full min-w-0">
                  <div className="w-full bg-slate-100 rounded-t-lg animate-pulse h-full" />
                  <span className="text-[10px] font-bold text-transparent">·</span>
                </div>
              ))
            ) : (
              chartData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full min-w-0">
                  <div className="w-full bg-slate-100 rounded-t-lg relative group h-full">
                    <div
                      style={{ height: item.height }}
                      className={`absolute bottom-0 w-full transition-all rounded-t-lg ${
                        item.active
                          ? 'bg-primary shadow-lg shadow-primary/20'
                          : item.hours > 0
                          ? 'bg-primary/40 group-hover:bg-primary'
                          : 'bg-transparent'
                      }`}
                    />
                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                      <div>{item.fullDate}</div>
                      <div className="text-primary-container text-[10px] font-black">
                        {item.hours > 0 ? `${item.hours}h parked` : 'No activity'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${item.active ? 'text-slate-800' : 'text-slate-400'}`}>
                    {item.day || '\u00A0'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-800">Recent Parking Sessions</h4>
          <button 
            onClick={() => onNavigate && onNavigate('history')}
            className="text-primary text-xs font-bold hover:underline"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400">
              <tr>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSessions.length > 0 ? recentSessions.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg bg-${row.color}-50 text-${row.color}-600 flex items-center justify-center`}>
                        <Building2 size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{row.loc}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{row.time}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-bold">{row.dur}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-black">{row.cost}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      {row.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No recent sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>

    {/* Drawers render as siblings of (not inside) the dashboard's motion.div.
        A parent with `transform` becomes the containing block for `fixed`
        descendants, so a backdrop placed inside motion.div would only cover
        the motion.div's box (clipping vertically when content fits within
        the viewport). Hoisting them out anchors `fixed inset-0` to the
        actual viewport. */}
    <TopUpDrawer
      open={showTopUpDrawer}
      onClose={() => setShowTopUpDrawer(false)}
      profile={profile}
      refreshProfile={refreshProfile}
      onNavigateToPayments={
        onNavigate ? () => { setShowTopUpDrawer(false); onNavigate('payments'); } : undefined
      }
    />

    <FindSlotDrawer
      open={showFindSlotDrawer}
      onClose={() => setShowFindSlotDrawer(false)}
    />
    </>
  );
}
