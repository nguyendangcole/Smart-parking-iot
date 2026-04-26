import React from 'react';
import {
  QrCode,
  Bike,
  Car,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  CreditCard,
  Calendar,
  RefreshCw,
  ChevronRight,
  X,
  Check,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../shared/supabase';
import { useProfile } from '../../../shared/hooks/useProfile';
import SubscriptionDrawer from '../components/SubscriptionDrawer';
import TopUpDrawer from '../components/TopUpDrawer';
import { LOW_BALANCE_THRESHOLD } from '../../../shared/utils/notifications';

const DURATION_OPTIONS = [
  { days: 30, label: '30 Days', discount: 0, tag: '' },
  { days: 90, label: '90 Days', discount: 10, tag: '10% Off' },
  { days: 180, label: '180 Days', discount: 15, tag: 'Best Value' },
];

const calculateExtendPrice = (basePricePerMonth: number, days: number, discountPercent: number) => {
  const months = days / 30;
  const subtotal = basePricePerMonth * months;
  const discountAmount = Math.round(subtotal * discountPercent / 100);
  return { subtotal, discountAmount, total: subtotal - discountAmount };
};

export default function Payments() {
  const { profile, refreshProfile } = useProfile();
  const [policies, setPolicies] = React.useState<any[]>([]);

  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [activityHistory, setActivityHistory] = React.useState<any[]>([]);

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newVehicle, setNewVehicle] = React.useState({ type: 'bike', name: '', plate: '', isPrimary: false });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [showAllHistory, setShowAllHistory] = React.useState(false);
  const [showSubscriptionDrawer, setShowSubscriptionDrawer] = React.useState(false);
  const [showTopUpDrawer, setShowTopUpDrawer] = React.useState(false);

  const [showExtendModal, setShowExtendModal] = React.useState(false);
  const [selectedDuration, setSelectedDuration] = React.useState(0);
  const [extendLoading, setExtendLoading] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastTitle, setToastTitle] = React.useState('Plan Extended Successfully!');
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');
  const [cardGlow, setCardGlow] = React.useState(false);
  const confettiPieces = React.useRef<Array<{
    id: number; color: string; left: string; delay: number;
    duration: number; width: number; height: number;
    xDrift: number; rotation: number; isCircle: boolean;
  }>>([]);

  // Fetch Vehicles & Activity
  const fetchData = React.useCallback(async () => {
    if (!profile?.id) return;

    // 1. Fetch Vehicles
    const { data: vehData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', profile.id)
      .order('is_primary', { ascending: false });

    if (vehData && vehData.length > 0) {
      setVehicles(vehData.map(v => ({
        id: v.id,
        type: v.vehicle_type === 'car' ? 'car' : 'bike',
        name: v.model_name,
        plate: v.plate_number,
        isPrimary: v.is_primary
      })));
    } else if (vehData && vehData.length === 0) {
      // Seed mock data directly to database if the user has no vehicles
      const mockVehicles = [
        { user_id: profile.id, vehicle_type: 'bike', model_name: 'Honda Winner X', plate_number: '59-X3 123.45', is_primary: true },
        { user_id: profile.id, vehicle_type: 'car', model_name: 'Toyota Vios', plate_number: '51A-678.90', is_primary: false }
      ];
      
      const { data: insertedData } = await supabase.from('vehicles').insert(mockVehicles).select('*');
      
      if (insertedData) {
        setVehicles(insertedData.map(v => ({
          id: v.id,
          type: v.vehicle_type === 'car' ? 'car' : 'bike',
          name: v.model_name,
          plate: v.plate_number,
          isPrimary: v.is_primary
        })));
      }
    }

    // 2. Fetch Recent Activity (Top 5)
    const { data: sessData } = await supabase
      .from('parking_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('entry_time', { ascending: false })
      .limit(5);

    if (sessData) {
      setActivityHistory(sessData.map(s => ({
        type: s.exit_time ? 'Exit' : 'Entry',
        loc: s.zone_name || 'Central Lot A',
        time: new Date(s.exit_time || s.entry_time).toLocaleString('en-GB', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }),
        status: s.exit_time ? 'Closed' : 'Parked',
        icon: s.exit_time ? LogOut : LogIn,
        color: s.exit_time ? 'slate' : 'blue'
      })));
    }
  }, [profile?.id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Policies from Database based on user Role
  React.useEffect(() => {
    const fetchPolicies = async () => {
      if (!profile?.role) return;

      // Map profiles.role to a list of potential pricing_role enums
      let userRole = (profile.role || '').toLowerCase();
      let potentialRoles = ['visitor_car', 'visitor_motorcycle'];

      if (userRole.includes('faculty') || userRole.includes('giảng viên')) {
        potentialRoles = ['faculty', 'phd', 'graduate', 'special_role'];
      } else if (userRole.includes('staff') || userRole.includes('nhân viên')) {
        potentialRoles = ['staff', 'faculty'];
      } else if (userRole.includes('student') || userRole.includes('sinh viên')) {
        potentialRoles = ['undergraduate', 'graduate'];
      }

      console.log("Checking policies for roles:", potentialRoles);

      const { data, error } = await supabase
        .from('pricing_policies')
        .select('*')
        .in('role', potentialRoles);

      if (error) {
        console.error("Database error fetching policies:", error);
      }

      if (!error && data) {
        // Filter manually to handle case-insensitivity for 'active' or 'Draft'
        const filtered = data.filter(p =>
          p.status?.toLowerCase() === 'active' ||
          p.status?.toLowerCase() === 'draft'
        );
        console.log("Found policies:", filtered);
        setPolicies(filtered);
      }
    };
    fetchPolicies();
  }, [profile?.role]);

  const activePolicy = policies.find(p => p.type === 'monthly') || { name: 'Active Plan', price: 150000 };
  const userBalance = (profile as any)?.balance || 0;

  const triggerSuccess = (message: string, title = 'Plan Extended Successfully!') => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    confettiPieces.current = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 2,
      width: 6 + Math.random() * 8,
      height: 4 + Math.random() * 6,
      xDrift: (Math.random() - 0.5) * 200,
      rotation: Math.random() * 720 - 360,
      isCircle: Math.random() > 0.5,
    }));
    setShowConfetti(true);
    setToastTitle(title);
    setToastMessage(message);
    setToastType('success');
    setShowSuccessToast(true);
    setCardGlow(true);
  };

  const triggerError = (message: string, title = 'Payment Failed') => {
    setToastTitle(title);
    setToastMessage(message);
    setToastType('error');
    setShowSuccessToast(true);
  };

  React.useEffect(() => {
    if (showSuccessToast) {
      const t = setTimeout(() => setShowSuccessToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showSuccessToast]);

  React.useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  React.useEffect(() => {
    if (cardGlow) {
      const t = setTimeout(() => setCardGlow(false), 2000);
      return () => clearTimeout(t);
    }
  }, [cardGlow]);

  React.useEffect(() => {
    if (!showExtendModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !extendLoading) setShowExtendModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [showExtendModal, extendLoading]);

  const handleConfirmExtend = async () => {
    // --- Pre-flight validation ---
    if (extendLoading) return;

    if (!profile?.id) {
      triggerError('User profile not loaded. Please refresh the page.');
      return;
    }

    const option = DURATION_OPTIONS[selectedDuration];
    if (!option) {
      triggerError('Invalid duration selected.');
      return;
    }

    const basePrice = activePolicy.price || 0;
    if (!profile.exempt_payment && basePrice <= 0) {
      triggerError('No pricing is configured for your plan. Contact support.');
      return;
    }

    const { total } = calculateExtendPrice(basePrice, option.days, option.discount);

    // Client-side balance guard mirrors the RPC's server-side check so the
    // user gets an instant, friendlier error instead of a round-trip to a
    // Postgres exception.
    if (!profile.exempt_payment && userBalance < total) {
      const shortfall = total - userBalance;
      triggerError(
        `You need ${shortfall.toLocaleString()} ₫ more to complete this payment. Please top up your balance.`,
        'Insufficient Balance'
      );
      return;
    }

    setExtendLoading(true);

    try {
      // Single atomic server-side call. `member_extend_plan` (see
      // sql_scripts/06_member_plan_renewal.sql) reads exempt_payment,
      // debits the balance, extends package_expires_at, and writes the
      // PLAN_RENEWAL ledger row in one transaction. If any step fails,
      // the whole thing rolls back — no more stuck PENDING rows.
      const { data, error } = await supabase.rpc('member_extend_plan', {
        p_duration_days: option.days,
        p_amount: total,
        p_plan_name: activePolicy.name || 'Parking Plan',
        p_payment_method: 'E-Wallet',
      });

      if (error) throw new Error(error.message);

      const row = Array.isArray(data) ? data[0] : data;
      const serverExpiry = row?.new_expires_at ? new Date(row.new_expires_at) : null;
      const serverCharged = Number(row?.amount_charged) || 0;
      const serverExempt = Boolean(row?.is_exempt);

      setActivityHistory(prev => [
        {
          type: 'Plan Renewal',
          loc: `${activePolicy.name || 'Plan'} · ${option.label}`,
          time: 'Just now',
          status: serverExempt ? 'FREE (Exempt)' : `- ₫ ${serverCharged.toLocaleString()}`,
          icon: CreditCard,
          color: 'green',
        },
        ...prev,
      ]);

      setShowExtendModal(false);
      setSelectedDuration(0);

      const formattedExpiry = (serverExpiry ?? new Date()).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      triggerSuccess(
        serverExempt
          ? `Plan renewed for FREE! Valid until ${formattedExpiry}`
          : `Paid ${serverCharged.toLocaleString()} ₫ · Valid until ${formattedExpiry}`
      );
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      triggerError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleSaveVehicle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile?.id) return;
    if (newVehicle.name && newVehicle.plate) {

      const payload = {
        user_id: profile.id,
        model_name: newVehicle.name,
        plate_number: newVehicle.plate,
        vehicle_type: newVehicle.type,
        is_primary: newVehicle.isPrimary
      };

      try {
        if (newVehicle.isPrimary) {
          // Unset other primary vehicles first
          await supabase.from('vehicles').update({ is_primary: false }).eq('user_id', profile.id);
        }

        if (editingId) {
          const { error } = await supabase.from('vehicles').update(payload).eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('vehicles').insert([payload]);
          if (error) throw error;
        }

        fetchData();
        setNewVehicle({ type: 'bike', name: '', plate: '', isPrimary: false });
        setShowAddForm(false);
        setEditingId(null);
      } catch (err: any) {
        alert("Error saving vehicle: " + err.message);
      }
    }
  };

  const deleteVehicle = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      const currentIndex = vehicles.findIndex(v => v.id === id);
      const vehicleToDelete = vehicles[currentIndex];
      
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) {
        alert("Error deleting: " + error.message);
      } else {
        // If we deleted the primary vehicle, automatically assign the previous one as primary
        if (vehicleToDelete?.isPrimary) {
          const remainingVehicles = vehicles.filter(v => v.id !== id);
          if (remainingVehicles.length > 0) {
            // Strictly follow the rule: get the previous vehicle in the list (if it was the first, get the newly promoted first)
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
            const nextVehicle = remainingVehicles[prevIndex];
            
            await supabase.from('vehicles').update({ is_primary: true }).eq('id', nextVehicle.id);
          }
        }
        fetchData();
      }
    }
  };

  const renderVehicleForm = () => (
    <form
      onSubmit={handleSaveVehicle}
      className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 shadow-inner"
    >
      <div className="flex gap-2">
        <select
          className="p-2 border border-slate-300 rounded-lg bg-white"
          value={newVehicle.type}
          onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value })}
        >
          <option value="bike">Bike</option>
          <option value="car">Car</option>
        </select>
        <input
          type="text"
          placeholder="Vehicle Name"
          className="flex-1 p-2 border border-slate-300 rounded-lg"
          value={newVehicle.name}
          onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
          required
        />
      </div>
      <input
        type="text"
        placeholder="License Plate (e.g. 59-X3 123.45 or 51A-123.45)"
        className="w-full p-2 border border-slate-300 rounded-lg"
        value={newVehicle.plate}
        onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
        pattern="^[0-9]{2}[A-Z0-9]{1,2}-[0-9]{3}\.?[0-9]{2}$|^[0-9]{2}-[A-Z0-9]{2}\s[0-9]{3}\.?[0-9]{2}$"
        title="Format: e.g. 51A-123.45 or 59-X3 123.45"
        required
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={newVehicle.isPrimary}
          onChange={e => setNewVehicle({ ...newVehicle, isPrimary: e.target.checked })}
          className="rounded border-slate-300 text-primary focus:ring-primary"
        />
        Set as primary vehicle
      </label>
      <button
        type="submit"
        className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:bg-opacity-90 transition-colors"
      >
        {editingId !== null ? 'Update Vehicle' : 'Save Vehicle'}
      </button>
    </form>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-8"
    >
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Parking & Vehicles</h2>
        <p className="text-slate-500 text-sm">Manage your parking plans and vehicle information.</p>
      </header>

      {/* Low-balance alert. Renders only when the member has opted in
          (Settings -> Notifications -> Low Balance Alerts) AND the
          wallet has dipped below the threshold. AnimatePresence keeps
          the entry/exit smooth as the balance crosses the line. */}
      <AnimatePresence>
        {profile?.notify_low_balance !== false && userBalance < LOW_BALANCE_THRESHOLD && (
          <motion.div
            key="low-balance-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-red-200 bg-red-50/80 shadow-sm"
            role="alert"
          >
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertCircle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">Low wallet balance</p>
              <p className="text-xs text-red-600/80">
                Your balance is{' '}
                <span className="font-bold">{userBalance.toLocaleString()} VND</span>
                , below the {LOW_BALANCE_THRESHOLD.toLocaleString()} VND alert threshold. Top up to avoid service interruptions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTopUpDrawer(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
            >
              Top Up Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Plan Card - click anywhere on the card (except the Extend
            button) to open the Subscription Details drawer. The outer
            element is a div-role-button so we can nest a real <button> for
            the renewal action; nesting button-in-button is invalid HTML. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowSubscriptionDrawer(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowSubscriptionDrawer(true);
            }
          }}
          aria-label="View subscription details"
          className={`group xl:col-span-2 relative overflow-hidden rounded-3xl bg-primary p-8 text-white shadow-2xl shadow-primary/30 cursor-pointer hover:shadow-primary/40 transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 ${cardGlow ? 'ring-4 ring-emerald-400/60 shadow-emerald-500/40 shadow-3xl' : ''}`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/15 group-hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors pointer-events-none">
            View Details
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-widest">Active Parking Plan</p>
                <h3 className="text-4xl font-extrabold tracking-tight">
                  {activePolicy.name || 'Standard Monthly Pass'}
                </h3>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold border border-white/10">
                    {profile?.exempt_payment ? 'FREE (Exempted)' : `Price: ${activePolicy.price?.toLocaleString()} VND`}
                  </div>
                  <div className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold border border-white/10">
                    Balance: {userBalance.toLocaleString()} VND
                  </div>
                </div>
                <p className="text-blue-100/80 text-sm mt-8 flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="font-semibold">
                    {profile?.package_expires_at
                      ? `Valid until: ${new Date(profile.package_expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'No active plan - Please renew'}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-12">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExtendModal(true);
                }}
                className="group/extend w-full bg-white text-primary font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-lg active:scale-95"
              >
                <RefreshCw size={20} className="group-hover/extend:rotate-180 transition-transform duration-500" />
                Extend Plan
              </button>
            </div>
          </div>
        </div>

        {/* QR Quick Renewal Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <QrCode size={22} className="text-primary" /> Quick Renewal
          </h3>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-44 h-44 bg-white p-3 rounded-2xl border-4 border-primary/5 shadow-inner">
              <img
                alt="QR Code"
                className="w-full h-full"
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HCMUT-SMART-PARKING-RENEWAL"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs text-center text-slate-500 leading-relaxed px-4">Scan our QR to top-up parking balance or quick-renew your current plan instantly.</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked Wallets</p>
            <div className="flex gap-2">
              <div className="flex-1 h-12 bg-pink-50 rounded-xl flex items-center justify-center border border-pink-100 cursor-pointer hover:bg-pink-100 transition-colors">
                <div className="w-7 h-7 bg-pink-600 rounded flex items-center justify-center text-white font-black text-[10px]">MoMo</div>
              </div>
              <div className="flex-1 h-12 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100 cursor-pointer hover:bg-sky-100 transition-colors">
                <div className="w-7 h-7 bg-sky-500 rounded flex items-center justify-center text-white font-black text-[10px]">ZP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicles Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">My Vehicles</h3>
            <button
              className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
              onClick={() => {
                if (showAddForm && editingId === null) {
                  setShowAddForm(false);
                } else {
                  setShowAddForm(true);
                  setEditingId(null);
                  setNewVehicle({ type: 'bike', name: '', plate: '', isPrimary: false });
                }
              }}
            >
              {showAddForm && editingId === null ? 'Cancel' : '+ Add Vehicle'}
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && editingId === null && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {renderVehicleForm()}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="flex flex-col gap-2">
                <div className={`group flex items-center gap-4 bg-white p-5 rounded-2xl border ${v.isPrimary ? 'border-primary/40 shadow-lg' : 'border-slate-200 hover:border-primary/20 transition-all cursor-pointer shadow-sm'}`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${v.isPrimary ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                    {v.type === 'bike' ? <Bike size={32} /> : <Car size={32} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-slate-800">{v.name}</p>
                      {v.isPrimary && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-tighter">Primary</span>}
                    </div>
                    <p className={`text-lg font-mono font-bold tracking-tight ${v.isPrimary ? 'text-primary' : 'text-slate-500'}`}>{v.plate}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-lg transition-all"
                      onClick={() => {
                        if (showAddForm && editingId === v.id) {
                          setShowAddForm(false);
                          setEditingId(null);
                        } else {
                          setNewVehicle({ type: v.type, name: v.name, plate: v.plate, isPrimary: v.isPrimary });
                          setEditingId(v.id);
                          setShowAddForm(true);
                        }
                      }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all" onClick={() => deleteVehicle(v.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {showAddForm && editingId === v.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      {renderVehicleForm()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Recent Activity</h3>
            <div className="flex items-center gap-3">
              <button
                className="text-primary text-sm font-bold hover:text-primary-dark transition-colors inline-flex items-center gap-1"
                onClick={() => setShowSubscriptionDrawer(true)}
              >
                Subscription Details
                <ChevronRight size={14} />
              </button>
              <span className="text-slate-200">|</span>
              <button
                className="text-slate-500 text-sm font-bold hover:text-primary transition-colors"
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? 'Show Less' : 'See Full History'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="divide-y divide-slate-100">
              {(showAllHistory ? activityHistory : activityHistory.slice(0, 4)).map((act, i) => (
                <div key={i} className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-11 h-11 rounded-2xl bg-${act.color}-50 text-${act.color}-600 flex items-center justify-center border border-${act.color}-100`}>
                    <act.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{act.type}: {act.loc}</p>
                    <p className="text-xs text-slate-400 font-medium">{act.time}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${act.color === 'green' ? 'text-emerald-600' : act.color === 'blue' ? 'text-blue-600' : 'text-slate-500'}`}>
                      {act.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {!showAllHistory && activityHistory.length > 4 && (
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More activity in See Full History</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Extend Plan Drawer */}
      <AnimatePresence>
        {showExtendModal && (
          <>
            <motion.div
              key="extend-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !extendLoading && setShowExtendModal(false)}
            />
            <motion.aside
              key="extend-drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-[520px] bg-slate-50 shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="extend-drawer-title"
            >
              <header className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Renewal</p>
                    <h2 id="extend-drawer-title" className="text-base font-bold text-slate-800">
                      Extend Your Plan
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => !extendLoading && setShowExtendModal(false)}
                  aria-label="Close panel"
                  className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="px-6 pt-6 pb-2 shrink-0">
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-4 shadow-md shadow-primary/15"
                >
                  <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <p className="text-[10px] text-blue-100/70 font-bold uppercase tracking-widest">Current Plan</p>
                      <h3 className="text-xl font-extrabold tracking-tight leading-[1.4] break-words">
                        {activePolicy.name || 'Standard Monthly Pass'}
                      </h3>
                    </div>
                    {(() => {
                      const opt = DURATION_OPTIONS[selectedDuration];
                      const months = opt.days / 30;
                      const subtotal = (activePolicy.price || 0) * months;
                      const unit = months === 1 ? 'month' : `${months} months`;
                      return (
                        <span className="shrink-0 bg-white/15 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/10 whitespace-nowrap">
                          {profile?.exempt_payment ? 'Free' : `${subtotal.toLocaleString()} ₫ / ${unit}`}
                        </span>
                      );
                    })()}
                  </div>
                </motion.section>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 flex flex-col gap-6">
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Duration</p>
                  <div className="flex flex-col gap-4">
                    {DURATION_OPTIONS.map((opt, i) => {
                      const isSelected = selectedDuration === i;
                      const { total } = calculateExtendPrice(activePolicy.price || 0, opt.days, opt.discount);
                      return (
                        <button
                          key={opt.days}
                          onClick={() => setSelectedDuration(i)}
                          disabled={extendLoading}
                          className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300'
                          } ${extendLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-primary bg-primary' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <div className="text-left">
                              <p className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{opt.label}</p>
                              {opt.discount > 0 && (
                                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                  <Tag size={10} />
                                  Save {opt.discount}%
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                              {profile?.exempt_payment ? 'FREE' : `${total.toLocaleString()} VND`}
                            </p>
                            {opt.discount > 0 && !profile?.exempt_payment && (
                              <p className="text-[10px] text-slate-400 line-through">
                                {((activePolicy.price || 0) * (opt.days / 30)).toLocaleString()} VND
                              </p>
                            )}
                          </div>
                          {opt.tag && (
                            <span className="absolute -top-2 right-3 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase tracking-tight">
                              {opt.tag}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3"
                >
                  {(() => {
                    const opt = DURATION_OPTIONS[selectedDuration];
                    const { subtotal, discountAmount, total } = calculateExtendPrice(activePolicy.price || 0, opt.days, opt.discount);
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Subtotal ({opt.days / 30} month{opt.days > 30 ? 's' : ''})</span>
                          <span className="font-bold text-slate-700">
                            {profile?.exempt_payment ? 'FREE' : `${subtotal.toLocaleString()} VND`}
                          </span>
                        </div>
                        {discountAmount > 0 && !profile?.exempt_payment && (
                          <div className="flex justify-between text-sm">
                            <span className="text-emerald-600">Discount ({opt.discount}%)</span>
                            <span className="font-bold text-emerald-600">- {discountAmount.toLocaleString()} VND</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                          <span className="font-bold text-slate-800">Total</span>
                          <span className="text-lg font-black text-primary">
                            {profile?.exempt_payment ? 'FREE' : `${total.toLocaleString()} VND`}
                          </span>
                        </div>
                        {!profile?.exempt_payment && (
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Your balance</span>
                            <span className={userBalance >= total ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                              {userBalance.toLocaleString()} VND
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.section>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <Clock size={18} className="text-primary shrink-0" />
                  <div className="text-sm">
                    <span className="text-slate-500">New expiry: </span>
                    <span className="font-bold text-slate-800">
                      {(() => {
                        const opt = DURATION_OPTIONS[selectedDuration];
                        const currentExpiry = profile?.package_expires_at ? new Date(profile.package_expires_at) : new Date();
                        const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;
                        const newExpiry = new Date(startDate);
                        newExpiry.setDate(newExpiry.getDate() + opt.days);
                        return newExpiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      })()}
                    </span>
                  </div>
                </motion.div>
              </div>

              {(() => {
                const opt = DURATION_OPTIONS[selectedDuration];
                const { total: dueTotal } = calculateExtendPrice(activePolicy.price || 0, opt.days, opt.discount);
                const canAfford = !!profile?.exempt_payment || userBalance >= dueTotal;
                const isDisabled = extendLoading || !canAfford;
                return (
                  <footer className="border-t border-slate-200 bg-white">
                    {!canAfford && !extendLoading && (
                      <div className="px-6 pt-3 pb-1 flex items-start gap-2 text-xs text-red-600">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>
                          Insufficient balance. You need{' '}
                          <span className="font-bold">{(dueTotal - userBalance).toLocaleString()} ₫</span> more.
                        </span>
                      </div>
                    )}
                    <div className="px-6 py-4 flex gap-3">
                      <button
                        onClick={() => setShowExtendModal(false)}
                        disabled={extendLoading}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmExtend}
                        disabled={isDisabled}
                        aria-label={`Confirm payment of ${dueTotal.toLocaleString()} VND`}
                        className={`flex-[2] py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                          extendLoading
                            ? 'bg-primary/70 cursor-wait'
                            : 'bg-primary hover:bg-primary-dark active:scale-[0.98] shadow-md shadow-primary/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {extendLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={18} />
                            {profile?.exempt_payment
                              ? 'Confirm (Free)'
                              : `Pay ${dueTotal.toLocaleString()} ₫`}
                          </>
                        )}
                      </button>
                    </div>
                  </footer>
                );
              })()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[60] bg-white rounded-2xl shadow-2xl border p-4 flex items-center gap-3 max-w-sm ${
              toastType === 'success' ? 'border-emerald-200' : 'border-red-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toastType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {toastType === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm">{toastTitle}</p>
              <p className="text-xs text-slate-500 mt-0.5">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="confetti-container"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          >
            {confettiPieces.current.map(p => (
              <motion.div
                key={p.id}
                initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 50 : 1000,
                  opacity: 0,
                  rotate: p.rotation,
                  x: p.xDrift,
                  scale: 0.5,
                }}
                transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  position: 'absolute',
                  left: p.left,
                  width: p.width,
                  height: p.height,
                  backgroundColor: p.color,
                  borderRadius: p.isCircle ? '50%' : '2px',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <SubscriptionDrawer
        open={showSubscriptionDrawer}
        onClose={() => setShowSubscriptionDrawer(false)}
        profile={profile}
        activePolicy={activePolicy}
        onManagePlan={() => {
          setShowSubscriptionDrawer(false);
          setShowExtendModal(true);
        }}
      />

      <TopUpDrawer
        open={showTopUpDrawer}
        onClose={() => setShowTopUpDrawer(false)}
        profile={profile}
        refreshProfile={refreshProfile}
      />
    </motion.div>
  );
}
 