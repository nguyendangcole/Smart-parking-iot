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
import { motion } from 'motion/react';

export default function Payments() {
  const [vehicles, setVehicles] = React.useState([
    { id: 1, type: 'bike', name: 'Honda Winner X', plate: '59-X3 123.45', isPrimary: true },
    { id: 2, type: 'car', name: 'Toyota Vios', plate: '51-A 999.99', isPrimary: false }
  ]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newVehicle, setNewVehicle] = React.useState({ type: 'bike', name: '', plate: '', isPrimary: false });
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications] = React.useState([
    { id: 1, title: 'Plan Expiring Soon', desc: 'Your monthly pass expires in 2 days.', time: '10 mins ago', unread: true },
    { id: 2, title: 'Vehicle Added', desc: 'Honda Winner X was successfully added.', time: '2 hours ago', unread: false },
    { id: 3, title: 'Payment Successful', desc: 'Renewal for Central Lot A completed.', time: 'Yesterday', unread: false },
  ]);
  const unreadCount = notifications.filter(n => n.unread).length;

  const [showAllHistory, setShowAllHistory] = React.useState(false);
  const [activityHistory, setActivityHistory] = React.useState([
    { type: 'Entry', loc: 'Central Lot A', time: 'Today, 07:30 AM', status: 'Parked', icon: LogIn, color: 'blue' },
    { type: 'Exit', loc: 'Central Lot A', time: 'Yesterday, 05:45 PM', status: 'Closed', icon: LogOut, color: 'slate' },
    { type: 'Plan Renewal', loc: '30 Days', time: 'Aug 30, 10:20 AM', status: '- ₫ 150.000', icon: CreditCard, color: 'green' },
    { type: 'Entry', loc: 'Central Lot B', time: 'Aug 28, 08:15 AM', status: 'Closed', icon: LogIn, color: 'slate' },
    { type: 'Exit', loc: 'Central Lot B', time: 'Aug 28, 05:30 PM', status: 'Closed', icon: LogOut, color: 'slate' },
  ]);

  const [planValidUntil, setPlanValidUntil] = React.useState(new Date('2024-09-30'));

  const handleExtendPlan = () => {
    // Add 30 days to existing date
    const newDate = new Date(planValidUntil);
    newDate.setDate(newDate.getDate() + 30);
    setPlanValidUntil(newDate);

    // Add activity log
    const now = new Date();
    setActivityHistory(prev => [
      {
        type: 'Plan Renewal',
        loc: '30 Days',
        time: 'Just now',
        status: '- ₫ 150.000',
        icon: CreditCard,
        color: 'green'
      },
      ...prev
    ]);
    
    alert('Parking plan extended by 30 days successfully!');
  };

  const handleSaveVehicle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newVehicle.name && newVehicle.plate) {
      let updatedVehicles = [...vehicles];
      
      if (newVehicle.isPrimary) {
        updatedVehicles = updatedVehicles.map(v => ({ ...v, isPrimary: false }));
      }

      if (editingId !== null) {
        setVehicles(updatedVehicles.map(v => v.id === editingId ? { ...v, ...newVehicle } : v));
        setEditingId(null);
      } else {
        const isFirstVehicle = updatedVehicles.length === 0;
        setVehicles([
          ...updatedVehicles,
          {
            id: Date.now(),
            ...newVehicle,
            isPrimary: newVehicle.isPrimary || isFirstVehicle
          }
        ]);
      }
      setNewVehicle({ type: 'bike', name: '', plate: '', isPrimary: false });
      setShowAddForm(false);
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
          onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
        >
          <option value="bike">Bike</option>
          <option value="car">Car</option>
        </select>
        <input 
          type="text" 
          placeholder="Vehicle Name" 
          className="flex-1 p-2 border border-slate-300 rounded-lg"
          value={newVehicle.name}
          onChange={e => setNewVehicle({...newVehicle, name: e.target.value})}
          required
        />
      </div>
      <input 
        type="text" 
        placeholder="License Plate (e.g. 59-X3 123.45)" 
        className="w-full p-2 border border-slate-300 rounded-lg"
        value={newVehicle.plate}
        onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
        required
        pattern="^[0-9]{2}-[A-Z0-9]{1,2}\s?[0-9]{3}\.[0-9]{2}$"
        title="Format: XX-XX XXX.XX (e.g., 59-X3 123.45)"
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input 
          type="checkbox" 
          checked={newVehicle.isPrimary}
          onChange={e => setNewVehicle({...newVehicle, isPrimary: e.target.checked})}
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
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
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
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 relative overflow-hidden rounded-2xl bg-primary p-8 text-white shadow-2xl shadow-primary/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-widest">Active Parking Plan</p>
                <h3 className="text-4xl font-extrabold tracking-tight">Monthly Pass</h3>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs">Zone: Central Lot A</div>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">59-X3 123.45</div>
                </div>
                <p className="text-blue-100/80 text-sm mt-6 flex items-center gap-1">
                  <Calendar size={14} /> Valid until: {planValidUntil.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                <Car size={32} />
              </div>
            </div>
            <div className="mt-10">
              <button 
                onClick={handleExtendPlan}
                className="w-full bg-white text-primary font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg"
              >
                <RefreshCw size={20} /> Extend Plan Now
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <QrCode size={20} className="text-primary" /> Quick Renewal
          </h3>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-40 h-40 bg-white p-2 rounded-xl border-4 border-primary/10">
              <img 
                alt="QR Code" 
                className="w-full h-full" 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HCMUT-SMART-PARKING-RENEWAL" 
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs text-center text-slate-500">Scan to top-up parking balance or quick-renew your current plan</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Linked Wallets</p>
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-pink-50 rounded-lg flex items-center justify-center border border-pink-100 cursor-pointer">
                <div className="w-6 h-6 bg-pink-600 rounded flex items-center justify-center text-white font-black text-[8px]">MoMo</div>
              </div>
              <div className="flex-1 h-10 bg-sky-50 rounded-lg flex items-center justify-center border border-sky-100 cursor-pointer">
                <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center text-white font-black text-[8px]">ZP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">My Vehicles</h3>
            <button 
              className="text-primary text-sm font-bold hover:underline"
              onClick={() => {
                if (showAddForm && editingId === null) {
                  setShowAddForm(false);
                  setNewVehicle({ type: 'bike', name: '', plate: '', isPrimary: false });
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
          
          {showAddForm && editingId === null && renderVehicleForm()}

          <div className="flex flex-col gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="flex flex-col gap-3">
                <div className={`group flex items-center gap-4 bg-white p-4 rounded-xl border ${v.isPrimary ? 'border-primary/30 shadow-md' : 'border-slate-200 hover:border-primary/20 transition-all cursor-pointer shadow-sm'}`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${v.isPrimary ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                    {v.type === 'bike' ? <Bike size={30} /> : <Car size={30} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{v.name}</p>
                      {v.isPrimary && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">PRIMARY</span>}
                    </div>
                    <p className={`text-lg font-mono font-bold ${v.isPrimary ? 'text-primary' : 'text-slate-500'}`}>{v.plate}</p>
                  </div>
                  <button 
                    className="p-2 text-slate-400 hover:text-primary transition-colors"
                    onClick={() => {
                      if (showAddForm && editingId === v.id) {
                        setShowAddForm(false);
                        setEditingId(null);
                        setNewVehicle({ type: 'bike', name: '', plate: '', isPrimary: false });
                      } else {
                        setNewVehicle({ type: v.type, name: v.name, plate: v.plate, isPrimary: v.isPrimary });
                        setEditingId(v.id);
                        setShowAddForm(true);
                      }
                    }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setVehicles(vehicles.filter(vehicle => vehicle.id !== v.id))}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
                {showAddForm && editingId === v.id && renderVehicleForm()}
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            <button 
              className="text-slate-500 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setShowAllHistory(!showAllHistory)}
            >
              {showAllHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {(showAllHistory ? activityHistory : activityHistory.slice(0, 3)).map((act, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className={`w-10 h-10 rounded-full bg-${act.color}-100 text-${act.color}-600 flex items-center justify-center`}>
                    <act.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{act.type}: {act.loc}</p>
                    <p className="text-xs text-slate-500">{act.time}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${act.color === 'green' ? 'text-green-600' : act.color === 'blue' ? 'text-blue-600' : 'text-slate-400'}`}>
                      {act.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
