import React, { useState, useEffect } from 'react';
import {
  Car, Cpu, AlertTriangle, TrendingUp,
  RefreshCw, Search, Bell, MoreVertical, LogIn, Eye, LogOut, DollarSign, QrCode
} from 'lucide-react';
import { useProfile } from '../../../shared/hooks/useProfile';
import { supabase } from '../../../shared/supabase';
import LiveVehicles from './LiveVehicles';
import OverrideGateModal from './OverrideGateModal';
import LostCardModal from './LostCardModal';
import ManualEntryModal from './ManualEntryModal';
import GateStatusPanel from './GateStatusPanel';
import IncidentAlerts from './IncidentAlerts';
import TicketScannerModal from './TicketScannerModal';
import GatewayStatusBanner from './GatewayStatusBanner';
import QuickStatsPanel from './QuickStatsPanel';

export default function Dashboard() {
  const { profile } = useProfile();

  // KPI Data
  const [totalSlots, setTotalSlots] = useState(0);
  const [occupiedSlots, setOccupiedSlots] = useState(0);
  const [zones, setZones] = useState<any[]>([]);
  
  // Occupied Slots Table
  const [occupiedList, setOccupiedList] = useState<any[]>([]);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [openSlotMenuId, setOpenSlotMenuId] = useState<string | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showLostCardModal, setShowLostCardModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showTicketScannerModal, setShowTicketScannerModal] = useState(false);
  const [manualAction, setManualAction] = useState<'entry' | 'exit'>('entry');
  const [selectedGate, setSelectedGate] = useState<{ id: string; name: string } | null>(null);

  // Fetch dữ liệu thật
  const fetchData = async () => {
    setLoading(true);

    // 1. Tổng số slot
    const { count: total } = await supabase
      .from('parking_slots')
      .select('*', { count: 'exact', head: true });

    // 2. Số slot đang occupied
    const { count: occupied } = await supabase
      .from('parking_slots')
      .select('*', { count: 'exact', head: true })
      .eq('is_occupied', true);

    // 3. Zone summary
    const { data: zoneData } = await supabase
      .from('parking_slots')
      .select('zone, is_occupied');

    // 4. Danh sách slot đang đỗ (cho Recent Logs)
    let query = supabase
      .from('parking_slots')
      .select('slot_number, zone')
      .eq('is_occupied', true);
    
    // Limit to 4 unless showAllSlots is true
    if (!showAllSlots) {
      query = query.limit(4);
    }
    
    const { data: occupiedData } = await query;

    setTotalSlots(total || 0);
    setOccupiedSlots(occupied || 0);
    setZones(zoneData || []);
    setOccupiedList(occupiedData || []);
    setLoading(false);
  };

  // Realtime: khi có xe vào/ra (bất kỳ slot nào thay đổi) → tự update
  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('parking-slots-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        () => {
          fetchData(); // tự refresh ngay lập tức
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showAllSlots]);

  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  // KPI Cards - Real Data
  const kpis = [
    {
      title: 'Total Occupancy',
      value: `${occupiedSlots} / ${totalSlots}`,
      trend: `${occupancyRate}%`,
      icon: Car,
      color: 'primary',
      progress: occupancyRate
    },
    {
      title: 'Total Slots',
      value: `${totalSlots}`,
      trend: 'All zones',
      icon: Cpu,
      color: 'emerald',
      sub: 'Updated realtime'
    },
    {
      title: 'Empty Slots',
      value: `${totalSlots - occupiedSlots}`,
      trend: 'Available now',
      icon: AlertTriangle,
      color: 'orange'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Topbar */}
      <header className="flex items-center justify-between mb-8">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search plates, ticket ID, or card ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTicketScannerModal(true)}
            title="Scan visitor tickets"
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <QrCode size={16} /> Ticket Scanner
          </button>
          <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{profile?.full_name || 'Operator'}</p>
              <p className="text-xs text-slate-500">{profile?.role || 'Operator'}</p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden flex items-center justify-center bg-primary/10 text-primary">
              {profile?.full_name ? (
                <span className="font-bold text-sm">
                  {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              ) : (
                <img src="https://picsum.photos/seed/avatar/100/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* System Status Banner */}
      <GatewayStatusBanner />

      {/* Quick Action Stats */}
      <QuickStatsPanel />

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <kpi.icon size={20} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${kpi.trend.includes('%') ? 'text-emerald-500' : 'text-slate-500'}`}>
                {kpi.trend.includes('%') && <TrendingUp size={12} />} {kpi.trend}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{kpi.title}</p>
            <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
            {kpi.progress !== undefined ? (
              <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${kpi.progress}%` }}></div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Gate Status & Incidents Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GateStatusPanel
          onRefresh={fetchData}
          onOverride={(gateId, gateName) => {
            setSelectedGate({ id: gateId, name: gateName });
            setShowOverrideModal(true);
          }}
        />
        <IncidentAlerts onRefresh={fetchData} />
      </div>

      {/* Live Vehicles */}
      <LiveVehicles
        searchQuery={searchQuery}
        onSelectVehicle={(vehicle) => console.log('Selected vehicle:', vehicle)}
        onManualEntry={() => {
          setManualAction('entry');
          setShowManualEntryModal(true);
        }}
        onManualExit={() => {
          setManualAction('exit');
          setShowManualEntryModal(true);
        }}
        onLostCard={() => setShowLostCardModal(true)}
      />

      {/* Live Zone Occupancy */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Live Zone Occupancy</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time parking availability by zone. Red indicates &gt;80% full (high alert).</p>
          </div>
          <button onClick={fetchData} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from(new Set(zones.map(z => z.zone))).map((zoneName, idx) => {
            const zoneSlots = zones.filter(z => z.zone === zoneName);
            const occ = zoneSlots.filter(z => z.is_occupied).length;
            const rate = zoneSlots.length > 0 ? Math.round((occ / zoneSlots.length) * 100) : 0;
            return (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
                <div className="relative aspect-video bg-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <Car size={48} className="mx-auto text-primary/30" />
                    <p className="mt-2 font-bold text-slate-700">{zoneName}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-bold">Zone {zoneName}</h4>
                    <span className={`text-xs font-bold ${rate > 80 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {rate}% occupied
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{occ} / {zoneSlots.length} slots</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currently Occupied Slots Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">Currently Occupied Slots</h2>
          <button
            onClick={() => setShowAllSlots(!showAllSlots)}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            {showAllSlots ? 'Show Limited (4)' : 'View All Slots'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Slot Number</th>
                <th className="px-6 py-4">Zone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {occupiedList.length > 0 ? (
                occupiedList.map((slot, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-slate-800">{slot.slot_number}</td>
                    <td className="px-6 py-4 text-slate-500">{slot.zone}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <LogIn size={14} /> Occupied
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenSlotMenuId(openSlotMenuId === slot.slot_number ? null : slot.slot_number);
                        }}
                        className="text-slate-400 hover:text-primary transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu for Slots */}
                      {openSlotMenuId === slot.slot_number && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Slot ${slot.slot_number} in Zone ${slot.zone}\nStatus: Occupied\nView details in system`);
                              setOpenSlotMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"
                          >
                            <Eye size={16} /> View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualAction('exit');
                              setShowManualEntryModal(true);
                              setOpenSlotMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-orange-600"
                          >
                            <LogOut size={16} /> Force Exit
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Payment Status for Slot ${slot.slot_number}:\nZone: ${slot.zone}\nAmount: Pending\nDuration: Calculate from parking_sessions`);
                              setOpenSlotMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-600"
                          >
                            <DollarSign size={16} /> Check Payment
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No occupied slots right now</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TicketScannerModal
        isOpen={showTicketScannerModal}
        onClose={() => setShowTicketScannerModal(false)}
      />
      <OverrideGateModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        gateId={selectedGate?.id}
        gateName={selectedGate?.name}
      />
      <LostCardModal isOpen={showLostCardModal} onClose={() => setShowLostCardModal(false)} />
      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        defaultAction={manualAction}
      />
    </div>
  );
}