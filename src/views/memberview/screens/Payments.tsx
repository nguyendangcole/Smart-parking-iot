import React from 'react';
import {
  Bell,
  QrCode,
  Bike,
  Car,
  Edit2,
  LogIn,
  LogOut,
  CreditCard,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../shared/supabase';
import { useProfile } from '../../../shared/hooks/useProfile';

export default function Payments() {
  const { profile, refreshProfile } = useProfile();
  const [policies, setPolicies] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [activityHistory, setActivityHistory] = React.useState<any[]>([]);

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newVehicle, setNewVehicle] = React.useState({ type: 'bike', name: '', plate: '', isPrimary: false });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications] = React.useState([
    { id: 1, title: 'Plan Expiring Soon', desc: 'Your monthly pass expires in 2 days.', time: '10 mins ago', unread: true },
    { id: 2, title: 'Vehicle Added', desc: 'Honda Winner X was successfully added.', time: '2 hours ago', unread: false },
    { id: 3, title: 'Payment Successful', desc: 'Renewal for Central Lot A completed.', time: 'Yesterday', unread: false },
  ]);
  const unreadCount = notifications.filter(n => n.unread).length;

  const [showAllHistory, setShowAllHistory] = React.useState(false);

  // Fetch Vehicles & Activity
  const fetchData = React.useCallback(async () => {
    if (!profile?.id) return;

    // 1. Fetch Vehicles
    const { data: vehData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', profile.id)
      .order('is_primary', { ascending: false });

    if (vehData) {
      setVehicles(vehData.map(v => ({
        id: v.id,
        type: v.vehicle_type === 'car' ? 'car' : 'bike',
        name: v.model_name,
        plate: v.plate_number,
        isPrimary: v.is_primary
      })));
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

  const handleExtendPlan = async () => {
    if (!profile?.id) return;

    // Check if user has enough balance (unless they are exempt like some Faculty)
    if (userBalance < activePolicy.price && !profile.exempt_payment) {
      alert(`Insufficient balance. You need ${activePolicy.price.toLocaleString()} VND to renew.`);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Calculate new expiry date
      const currentExpiry = profile.package_expires_at ? new Date(profile.package_expires_at) : new Date();
      // If the plan is already expired, we start 30 days from today
      const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;

      const newExpiry = new Date(startDate);
      newExpiry.setDate(newExpiry.getDate() + 30);

      // 2. Perform Transaction (Update balance and expiry)
      const { error } = await supabase
        .from('profiles')
        .update({
          balance: profile.exempt_payment ? userBalance : (userBalance - activePolicy.price),
          package_expires_at: newExpiry.toISOString(),
          package_status: 'Active'
        })
        .eq('id', profile.id);

      if (error) throw error;

      // 3. Add to local history for immediate UI feedback
      setActivityHistory(prev => [
        {
          type: 'Plan Renewal',
          loc: activePolicy.name || '30 Days',
          time: 'Just now',
          status: profile.exempt_payment ? 'FREE (Exempt)' : `- ₫ ${activePolicy.price.toLocaleString()}`,
          icon: CreditCard,
          color: 'green'
        },
        ...prev
      ]);

      alert(profile.exempt_payment ? 'Plan renewed for FREE (Exempted)!' : 'Parking plan extended successfully! Balance deducted.');
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      alert("Failed to extend plan: " + err.message);
    } finally {
      setIsLoading(false);
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
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) {
        alert("Error deleting: " + error.message);
      } else {
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
        placeholder="License Plate (e.g. 59-X3 123.45)"
        className="w-full p-2 border border-slate-300 rounded-lg"
        value={newVehicle.plate}
        onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value })}
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
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parking & Vehicles</h2>
          <p className="text-slate-500 text-sm">Manage your parking plans and vehicle information.</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 relative hover:bg-slate-50 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  <button className="text-xs text-primary font-medium hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${notif.unread ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${notif.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{notif.title}</p>
                        {notif.unread && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{notif.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Plan Card */}
        <div className="xl:col-span-2 relative overflow-hidden rounded-3xl bg-primary p-8 text-white shadow-2xl shadow-primary/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
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
              <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/30">
                <Car size={36} />
              </div>
            </div>
            <div className="mt-12">
              <button
                onClick={handleExtendPlan}
                disabled={isLoading}
                className={`group w-full bg-white text-primary font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-all shadow-lg active:scale-95 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                ) : (
                  <>
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    Extend Plan (30 Days)
                  </>
                )}
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
                      <LogOut size={18} className="rotate-90" />
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
            <button
              className="text-slate-500 text-sm font-bold hover:text-primary transition-colors"
              onClick={() => setShowAllHistory(!showAllHistory)}
            >
              {showAllHistory ? 'Show Less' : 'See Full History'}
            </button>
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
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More activity in History tab</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
