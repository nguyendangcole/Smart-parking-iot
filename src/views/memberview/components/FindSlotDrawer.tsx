import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  MapPin,
  Shuffle,
  Navigation,
  Check,
  AlertCircle,
  RefreshCw,
  ParkingSquare,
  Footprints,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';

interface FindSlotDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface ParkingSlot {
  id: number;
  slot_number: string;
  zone: string;
}

// Mocked walking time (minutes) per zone, from the main entrance. Kept as a
// flat lookup so adding a zone (e.g. "Khu C") is a one-line change. Unknown
// zones fall through to ZONE_WALK_FALLBACK so the UI still renders sanely.
const ZONE_WALK_TIMES: Record<string, number> = {
  'Khu A': 2,
  'Khu B': 5,
  'Khu C': 4,
};
const ZONE_WALK_FALLBACK = 4;

// Mocked turn-by-turn directions. Same fallback strategy as walk times so an
// uncatalogued zone just shows a generic 3-step path instead of breaking.
const ZONE_DIRECTIONS: Record<string, string[]> = {
  'Khu A': [
    'Enter through Main Gate',
    'Turn left into the East Wing',
    'Khu A is straight ahead — slot on your right',
  ],
  'Khu B': [
    'Enter through Main Gate',
    'Continue straight past the lobby',
    'Khu B is on your left — follow signage',
  ],
  'Khu C': [
    'Enter through Main Gate',
    'Take the ramp down to the basement',
    'Khu C entrance is on your right',
  ],
};
const ZONE_DIRECTIONS_FALLBACK = [
  'Enter through Main Gate',
  'Follow zone signage',
  'Your slot will be marked on the floor',
];

const ALTERNATES_COUNT = 4;

// Fisher–Yates shuffle. Returns a *new* array so React state updates trigger
// re-renders cleanly even when the source pool is identical between rolls.
const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const walkTimeFor = (zone: string) =>
  ZONE_WALK_TIMES[zone] ?? ZONE_WALK_FALLBACK;

const directionsFor = (zone: string) =>
  ZONE_DIRECTIONS[zone] ?? ZONE_DIRECTIONS_FALLBACK;

export default function FindSlotDrawer({ open, onClose }: FindSlotDrawerProps) {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);

  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Body scroll lock + ESC close. Mirrors TopUpDrawer/SubscriptionDrawer so
  // the three drawers feel identical to the user.
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

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('parking_slots')
        .select('id, slot_number, zone')
        .eq('is_occupied', false)
        .order('zone', { ascending: true })
        .order('slot_number', { ascending: true });

      if (dbError) throw new Error(dbError.message);

      const list = (data || []) as ParkingSlot[];
      setSlots(list);
      // Initial roll: shuffle once so the recommended pick is random the
      // first time the drawer opens. Subsequent rolls go through `roll()`
      // which re-shuffles the *current* pool without re-fetching.
      setOrderedIds(shuffle(list).map(s => s.id));
    } catch (err: any) {
      setError(err?.message || 'Failed to load available slots.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch and reset the directions panel each time the drawer opens, so a
  // user reopening it doesn't see stale availability (a slot they picked
  // earlier may now be occupied) or a leftover directions card.
  useEffect(() => {
    if (!open) return;
    setShowDirections(false);
    fetchSlots();
  }, [open, fetchSlots]);

  // Realtime: if any parking_slots row flips while the drawer is open, the
  // pool may now contain a slot the user is staring at as "available" but is
  // already taken. Re-fetch so the UI reflects truth without the user
  // having to hit Refresh manually.
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel('member-find-slot-availability')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parking_slots',
        },
        () => {
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, fetchSlots]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const slotById = useMemo(() => {
    const map = new Map<number, ParkingSlot>();
    slots.forEach(s => map.set(s.id, s));
    return map;
  }, [slots]);

  const recommended = useMemo<ParkingSlot | null>(() => {
    const id = orderedIds[0];
    return id !== undefined ? slotById.get(id) ?? null : null;
  }, [orderedIds, slotById]);

  const alternates = useMemo<ParkingSlot[]>(() => {
    return orderedIds
      .slice(1, 1 + ALTERNATES_COUNT)
      .map(id => slotById.get(id))
      .filter((s): s is ParkingSlot => !!s);
  }, [orderedIds, slotById]);

  // Aggregate counts per zone for the stats banner. We compute from the full
  // pool (`slots`) rather than the visible 5 so the user sees a real picture
  // of campus-wide availability, not just what's displayed below.
  const zoneCounts = useMemo(() => {
    const counts = new Map<string, number>();
    slots.forEach(s => {
      counts.set(s.zone, (counts.get(s.zone) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [slots]);

  const totalAvailable = slots.length;
  const isEmpty = !loading && !error && totalAvailable === 0;

  const handleShuffle = () => {
    if (slots.length === 0) return;
    setOrderedIds(prev => {
      // Re-shuffle until the head differs from the previous head when
      // possible — a "Shuffle" button that occasionally picks the same slot
      // feels broken even if it's mathematically valid. With pools of size
      // 1 we can't avoid it; otherwise a few retries is enough.
      const previousTopId = prev[0];
      for (let attempt = 0; attempt < 5; attempt++) {
        const next = shuffle(slots).map(s => s.id);
        if (next[0] !== previousTopId || slots.length <= 1) return next;
      }
      return shuffle(slots).map(s => s.id);
    });
  };

  // Promote a slot from the alternates list into the recommended hero slot.
  // We do this by reordering the id list — the previous recommended slides
  // back into the alternates so the user can swap freely without losing
  // their previous candidate.
  const handlePromote = (id: number) => {
    setOrderedIds(prev => {
      const without = prev.filter(x => x !== id);
      return [id, ...without];
    });
  };

  const handleGetDirections = () => {
    if (!recommended) return;
    setShowDirections(true);
  };

  const handleConfirmDirections = () => {
    if (!recommended) return;
    setToast({
      title: `Slot ${recommended.slot_number} selected`,
      message: `Heading to ${recommended.zone} — see you there!`,
      type: 'success',
    });
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="find-slot-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              key="find-slot-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] bg-slate-50 shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="find-slot-drawer-title"
            >
              <header className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                    <Search size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parking</p>
                    <h2 id="find-slot-drawer-title" className="text-base font-bold text-slate-800">
                      {showDirections ? 'Slot Directions' : 'Find a Parking Slot'}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!showDirections && (
                    <button
                      onClick={fetchSlots}
                      aria-label="Refresh availability"
                      disabled={loading}
                      className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    aria-label="Close panel"
                    className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </header>

              {/* Body switches between the picker view and the directions
                  view. Keeping both inside the same motion.aside so the
                  drawer position/animation isn't disturbed by the swap. */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {showDirections ? (
                  <DirectionsView
                    slot={recommended}
                    onBack={() => setShowDirections(false)}
                  />
                ) : (
                  <PickerView
                    loading={loading}
                    error={error}
                    isEmpty={isEmpty}
                    totalAvailable={totalAvailable}
                    zoneCounts={zoneCounts}
                    recommended={recommended}
                    alternates={alternates}
                    onShuffle={handleShuffle}
                    onRefresh={fetchSlots}
                    onPromote={handlePromote}
                  />
                )}
              </div>

              <footer className="border-t border-slate-200 bg-white px-6 py-4 flex gap-3">
                {showDirections ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDirections(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDirections}
                      className="flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Got it
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGetDirections}
                      disabled={!recommended || loading}
                      className="flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Navigation size={18} />
                      {recommended ? `Get Directions` : 'No slot selected'}
                    </button>
                  </>
                )}
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Toast lives outside the drawer panel's AnimatePresence so it
          survives the panel closing. The component is always mounted by
          the parent so setToast state persists across open/close. */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="find-slot-toast"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[60] bg-white rounded-2xl shadow-2xl border p-4 flex items-center gap-3 max-w-sm ${
              toast.type === 'success' ? 'border-emerald-200' : 'border-red-200'
            }`}
            role="status"
            aria-live="polite"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm">{toast.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* PickerView                                                                 */
/* -------------------------------------------------------------------------- */

interface PickerViewProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  totalAvailable: number;
  zoneCounts: [string, number][];
  recommended: ParkingSlot | null;
  alternates: ParkingSlot[];
  onShuffle: () => void;
  onRefresh: () => void;
  onPromote: (id: number) => void;
}

function PickerView({
  loading,
  error,
  isEmpty,
  totalAvailable,
  zoneCounts,
  recommended,
  alternates,
  onShuffle,
  onRefresh,
  onPromote,
}: PickerViewProps) {
  return (
    <div className="px-6 pt-6 pb-6 flex flex-col gap-5">
      {/* Stats banner — campus-wide availability snapshot. Hidden in error/empty
          states so it doesn't contradict the prominent message below. */}
      {!error && !isEmpty && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-5 py-4 shadow-md"
        >
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                Available Now
              </p>
              <p className="text-2xl font-black tracking-tight tabular-nums">
                {loading ? '—' : totalAvailable}{' '}
                <span className="text-sm font-bold text-slate-300">
                  {totalAvailable === 1 ? 'slot' : 'slots'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
              {zoneCounts.map(([zone, count]) => (
                <span
                  key={zone}
                  className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider"
                >
                  {zone} · {count}
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Error */}
      {error && (
        <section className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Couldn't load availability</p>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </section>
      )}

      {/* Empty */}
      {isEmpty && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ParkingSquare size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">All zones are full right now</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
              Try again in a few minutes — slots free up as cars exit. We'll keep this view live.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </section>
      )}

      {/* Loading skeleton — only when we have nothing to show yet. Once we
          have slots, refreshing keeps the previous render in place to avoid
          a jarring flash. */}
      {loading && totalAvailable === 0 && !error && (
        <>
          <div className="rounded-2xl bg-slate-200/70 animate-pulse h-44" />
          <div className="space-y-2">
            {Array.from({ length: ALTERNATES_COUNT }).map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-200/70 animate-pulse h-16" />
            ))}
          </div>
        </>
      )}

      {/* Recommended hero */}
      {!error && !isEmpty && recommended && (
        <motion.section
          key={`hero-${recommended.id}`}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 22 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-primary to-indigo-700 text-white p-6 shadow-xl shadow-indigo-600/20"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Recommended Pick
                </p>
                <h3 className="text-5xl font-black tracking-tight leading-none tabular-nums">
                  {recommended.slot_number}
                </h3>
                <p className="text-sm font-bold text-blue-100/90 mt-2 flex items-center gap-1.5">
                  <MapPin size={14} />
                  {recommended.zone}
                </p>
              </div>
              <div className="text-right shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                  <Footprints size={10} />
                  Walk
                </p>
                <p className="text-xl font-black leading-none">
                  {walkTimeFor(recommended.zone)}
                  <span className="text-xs font-bold text-blue-100/80"> min</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onShuffle}
              className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm text-xs font-bold transition-colors"
            >
              <Shuffle size={14} />
              Shuffle
            </button>
          </div>
        </motion.section>
      )}

      {/* Alternates list */}
      {!error && !isEmpty && alternates.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Other available spots
            </h4>
            <span className="text-[10px] font-black text-slate-400">
              Tap to swap
            </span>
          </header>
          <div className="divide-y divide-slate-100">
            {alternates.map(slot => (
              <button
                key={slot.id}
                type="button"
                onClick={() => onPromote(slot.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm tabular-nums group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  {slot.slot_number.split('-')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 tabular-nums">
                    {slot.slot_number}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {slot.zone}
                    <span className="text-slate-300 mx-1">·</span>
                    <Footprints size={10} />
                    {walkTimeFor(slot.zone)} min
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DirectionsView                                                             */
/* -------------------------------------------------------------------------- */

interface DirectionsViewProps {
  slot: ParkingSlot | null;
  onBack: () => void;
}

function DirectionsView({ slot, onBack }: DirectionsViewProps) {
  if (!slot) {
    return (
      <div className="px-6 pt-6 pb-6">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-4"
        >
          <ArrowRight size={12} className="rotate-180" />
          Back
        </button>
        <p className="text-sm text-slate-500">No slot selected.</p>
      </div>
    );
  }

  const steps = directionsFor(slot.zone);
  const walkMinutes = walkTimeFor(slot.zone);

  return (
    <div className="px-6 pt-6 pb-6 flex flex-col gap-5">
      {/* Slot summary */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-primary to-indigo-700 text-white p-6 shadow-xl shadow-indigo-600/20"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mb-1">
              Heading to
            </p>
            <h3 className="text-4xl font-black tracking-tight leading-none tabular-nums">
              {slot.slot_number}
            </h3>
            <p className="text-sm font-bold text-blue-100/90 mt-2 flex items-center gap-1.5">
              <MapPin size={14} />
              {slot.zone}
            </p>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] text-blue-100/80 font-bold uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
              <Footprints size={10} />
              Walk
            </p>
            <p className="text-xl font-black leading-none">
              ≈{walkMinutes}
              <span className="text-xs font-bold text-blue-100/80"> min</span>
            </p>
          </div>
        </div>
      </motion.section>

      {/* Mini map placeholder. Pure SVG so it scales without a runtime
          dependency. The grid is fixed (8 cols × 5 rows) and the slot
          position is derived from the slot_number suffix so the highlight
          *feels* like it tracks reality even though it's mocked. */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
      >
        <header className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Zone Layout
          </h4>
          <span className="text-[10px] font-black text-slate-400">{slot.zone}</span>
        </header>
        <ZoneMiniMap slot={slot} />
      </motion.section>

      {/* Step-by-step directions */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <header className="px-5 py-3.5 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            How to get there
          </h4>
        </header>
        <ol className="divide-y divide-slate-100">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug pt-1">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </motion.section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ZoneMiniMap — purely decorative SVG of the slot's zone with the picked    */
/* slot highlighted. Position is derived deterministically from the slot     */
/* number so re-renders don't visually "jump".                                */
/* -------------------------------------------------------------------------- */

function ZoneMiniMap({ slot }: { slot: ParkingSlot }) {
  const COLS = 8;
  const ROWS = 5;
  // Extract the trailing digits from "A-007" → 7. Fall back to 0 so a
  // weirdly-shaped slot number renders without crashing.
  const numericPart = parseInt(slot.slot_number.split('-')[1] || '0', 10) || 0;
  const idx = (numericPart - 1 + COLS * ROWS) % (COLS * ROWS);
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);

  const cellW = 32;
  const cellH = 22;
  const gap = 4;
  const padX = 12;
  const padY = 28;
  const width = padX * 2 + COLS * cellW + (COLS - 1) * gap;
  const height = padY * 2 + ROWS * cellH + (ROWS - 1) * gap + 18;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto rounded-xl bg-slate-50"
      role="img"
      aria-label={`Mini map of ${slot.zone} highlighting slot ${slot.slot_number}`}
    >
      {/* Driveway label at top */}
      <text
        x={width / 2}
        y={16}
        textAnchor="middle"
        className="fill-slate-400"
        style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}
      >
        ENTRANCE
      </text>
      <line
        x1={padX}
        x2={width - padX}
        y1={22}
        y2={22}
        stroke="#cbd5e1"
        strokeDasharray="4 4"
        strokeWidth={1}
      />

      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((_, c) => {
          const x = padX + c * (cellW + gap);
          const y = padY + r * (cellH + gap);
          const isPicked = r === row && c === col;
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x}
                y={y}
                width={cellW}
                height={cellH}
                rx={4}
                ry={4}
                fill={isPicked ? '#4f46e5' : '#e2e8f0'}
                stroke={isPicked ? '#4338ca' : 'transparent'}
                strokeWidth={isPicked ? 2 : 0}
              />
              {isPicked && (
                <text
                  x={x + cellW / 2}
                  y={y + cellH / 2 + 3}
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: 8, fontWeight: 800 }}
                >
                  {slot.slot_number}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Pulsing halo so the highlighted slot reads as "you are here" */}
      {(() => {
        const x = padX + col * (cellW + gap) + cellW / 2;
        const y = padY + row * (cellH + gap) + cellH / 2;
        return (
          <circle
            cx={x}
            cy={y}
            r={cellW * 0.7}
            fill="none"
            stroke="#4f46e5"
            strokeOpacity={0.4}
            strokeWidth={2}
          >
            <animate
              attributeName="r"
              values={`${cellW * 0.6};${cellW * 1.1};${cellW * 0.6}`}
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.6;0;0.6"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        );
      })()}
    </svg>
  );
}
