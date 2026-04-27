import React, { useState, useEffect } from 'react';
import {
  Car, Cpu, AlertTriangle,
  RefreshCw, Search, Bell, Plus, ChevronDown, ChevronUp,
  AlertCircle, Activity, Gauge
} from 'lucide-react';
import { useProfile } from '../../../shared/hooks/useProfile';
import { supabase } from '../../../shared/supabase';
import LiveVehicles from './LiveVehicles';
import OverrideGateModal from './OverrideGateModal';
import LostCardModal from './LostCardModal';
import ManualEntryModal from './ManualEntryModal';
import GatewayStatusBanner from './GatewayStatusBanner';
import QuickStatsPanel from './QuickStatsPanel';

interface Gate {
  id: string;
  name: string;
  zone: string;
  laneType: 'two-wheel' | 'four-wheel';
  direction: 'entry' | 'exit';
  status: 'Online' | 'Alert' | 'Offline';
  img: string;
  recTime?: string;
  alert?: string;
  lockState: 'open' | 'closed' | 'locked';
}

export default function Dashboard({ 
  onManualAction,
  gates
}: { 
  onManualAction?: (actionType: 'lost_card' | 'manual_entry' | 'manual_exit' | 'override_gate' | 'manual_handling', actionData?: any) => void;
  gates?: Gate[];
}) {
  const { profile } = useProfile();

  // KPI Data
  const [totalSlots, setTotalSlots] = useState(0);
  const [occupiedSlots, setOccupiedSlots] = useState(0);
  const [zones, setZones] = useState<any[]>([]);
  
  // Occupied Slots Table
  const [occupiedList, setOccupiedList] = useState<any[]>([]);
  const [showOccupiedSlots, setShowOccupiedSlots] = useState(false);
  
  // Card Stock & Transactions
  const CARD_STOCK_THRESHOLDS = {
    CRITICAL: 5,
    WARNING: 10,
    HEALTHY: 100
  };
  const [cardStockRemaining, setCardStockRemaining] = useState(20);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  // Card Stock Status Helper
  const getCardStockStatus = () => {
    if (cardStockRemaining <= 0) {
      return { level: 'critical', label: 'CRITICAL - OUT OF STOCK', color: 'red' };
    }
    if (cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL) {
      return { level: 'critical', label: 'CRITICAL - OUT OF STOCK SOON', color: 'red' };
    } else if (cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING) {
      return { level: 'warning', label: 'WARNING - LOW STOCK', color: 'yellow' };
    } else if (cardStockRemaining < 20) {
      return { level: 'notice', label: 'NOTICE - MONITOR STOCK', color: 'amber' };
    }
    return { level: 'healthy', label: 'Stock Level: Healthy', color: 'green' };
  };
  const cardStockStatus = getCardStockStatus();

  // Alerts & Operations Data
  const [pendingCases] = useState([
    { id: 1, type: 'LOST_CARD', vehicle: '59P1-998.23', time: '47 min' },
    { id: 2, type: 'SCAN_FAIL', vehicle: '51H-123.45', time: '12 min' },
  ]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showManualHandlingModal, setShowManualHandlingModal] = useState(false);
  
  // Collapsible Sections
  const [showAlertsOperations, setShowAlertsOperations] = useState(true);
  
  // Issue Temp Card Modal (renamed to Visitor Pass)
  const [showVisitorPassModal, setShowVisitorPassModal] = useState(false);
  const [visitorPassTab, setVisitorPassTab] = useState<'issue' | 'return'>('issue');
  
  // System Intervention Modals
  const [showLostCardModal, setShowLostCardModal] = useState(false);
  const [showEmergencyOverrideModal, setShowEmergencyOverrideModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedGate, setSelectedGate] = useState<{ id: string; name: string } | null>(null);
  
  // Notification States
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'alert',
      title: 'Zone A - High Occupancy',
      message: 'Zone A is now 85% full',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false
    },
    {
      id: '2',
      type: 'incident',
      title: 'Gate 2 Offline',
      message: 'Exit gate 2 connection lost - manual override may be needed',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false
    },
    {
      id: '3',
      type: 'info',
      title: 'System Update',
      message: 'Routine maintenance completed successfully',
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: true
    },
  ]);

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

    // 4. Danh sách slot đang đỗ
    const { data: occupiedData } = await supabase
      .from('parking_slots')
      .select('slot_number, zone')
      .eq('is_occupied', true);

    setTotalSlots(total || 0);
    setOccupiedSlots(occupied || 0);
    setZones(zoneData || []);
    setOccupiedList(occupiedData || []);
    setLoading(false);
  };

  // Realtime: khi có xe vào/ra (bất kỳ slot nào thay đổi) → tự update
  useEffect(() => {
    fetchData();
    
    // Initialize recent transactions
    setRecentTransactions([
      { id: 1, plate: 'AAA-0001', exitTime: '11:30 AM', cardType: 'Registered', vehicleType: 'Car', amount: '₫10,000', status: 'Paid' },
      { id: 2, plate: 'BBB-0002', exitTime: '11:15 AM', cardType: 'Temporary', vehicleType: 'Motorbike', amount: '₫5,000', status: 'Paid' },
      { id: 3, plate: 'CCC-0003', exitTime: '11:00 AM', cardType: 'Registered', vehicleType: 'Motorbike', amount: '₫5,000', status: 'Paid' },
      { id: 4, plate: 'DDD-0004', exitTime: '10:50 AM', cardType: 'Temporary', vehicleType: 'Car', amount: 'Refunded', status: 'Returned' },
      { id: 5, plate: 'EEE-0005', exitTime: '10:35 AM', cardType: 'Registered', vehicleType: 'Car', amount: '₫10,000', status: 'Pending' },
      { id: 6, plate: 'FFF-0006', exitTime: '10:20 AM', cardType: 'Temporary', vehicleType: 'Motorbike', amount: '₫5,000', status: 'Paid' },
      { id: 7, plate: 'GGG-0007', exitTime: '10:05 AM', cardType: 'Registered', vehicleType: 'Car', amount: '₫10,000', status: 'Paid' },
    ]);

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
  }, []);

  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
  const occupiedByZone = zones.reduce<Record<string, number>>((acc, slot) => {
    if (!slot.is_occupied) return acc;
    const zone = slot.zone || 'Unknown';
    acc[zone] = (acc[zone] || 0) + 1;
    return acc;
  }, {});
  const occupiedZoneEntries = Object.entries(occupiedByZone).sort(([a], [b]) => a.localeCompare(b));
  const gateList = gates || [];
  const totalGates = gateList.length;
  const gateOfflineCount = gateList.filter(g => g.status === 'Offline').length;
  const gateAlertCount = gateList.filter(g => g.status === 'Alert').length;
  const gateOnlineCount = gateList.filter(g => g.status !== 'Offline').length;
  const pendingCasesCount = pendingCases.length;
  const systemHealth = totalGates > 0 ? Math.round((gateOnlineCount / totalGates) * 100) : 100;

  const gateIncidents = gateList.flatMap((gate) => {
    if (gate.status === 'Offline') {
      return [{
        id: `offline-${gate.id}`,
        type: 'gate_offline',
        severity: 'high',
        message: `${gate.name} (Gate ${gate.id}) is offline`,
        gate: gate.id,
        time: 'Live status'
      }];
    }

    if (gate.status === 'Alert') {
      return [{
        id: `alert-${gate.id}`,
        type: 'gate_alert',
        severity: 'medium',
        message: `${gate.name} (Gate ${gate.id}) alert: ${gate.alert || 'Operator attention required'}`,
        gate: gate.id,
        time: 'Live status'
      }];
    }

    return [];
  });

  const occupancyIncidents = occupiedZoneEntries
    .map(([zone, occupied]) => {
      const zoneTotal = zones.filter(z => z.zone === zone).length;
      const rate = zoneTotal > 0 ? Math.round((occupied / zoneTotal) * 100) : 0;
      return { zone, rate };
    })
    .filter(({ rate }) => rate >= 85)
    .map(({ zone, rate }) => ({
      id: `occupancy-${zone}`,
      type: 'high_occupancy',
      severity: 'medium',
      message: `Zone ${zone} high occupancy (${rate}%)`,
      zone,
      time: 'Live status'
    }));

  const activeIncidents = [...gateIncidents, ...occupancyIncidents];
  const incidentCount = activeIncidents.length;

  // Notification Handlers
  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    if (type === 'alert') return <AlertTriangle size={16} className="text-orange-500" />;
    if (type === 'incident') return <AlertTriangle size={16} className="text-red-500" />;
    return <Bell size={16} className="text-blue-500" />;
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Close notification panel when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const notificationButton = document.querySelector('[aria-label="notification-button"]');
      const notificationPanel = document.querySelector('[aria-label="notification-panel"]');
      
      if (
        showNotifications &&
        !notificationButton?.contains(event.target as Node) &&
        !notificationPanel?.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

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
      {/* CRITICAL ALERT BANNER - Shows at top if stock is critical */}
      {cardStockStatus.level === 'critical' && (
        <div className="bg-red-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-red-600/30 animate-pulse border-l-4 border-red-700">
          <AlertTriangle size={28} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-lg">CRITICAL ALERT: Parking Cards Stock</p>
            <p className="text-sm mt-1">
              {cardStockRemaining <= 0 ? (
                <>System is <span className="font-bold">OUT OF STOCK</span>. Issue of new temporary cards is blocked until restock.</>
              ) : (
                <>Only <span className="font-bold">{cardStockRemaining} cards</span> remaining. Immediate restock required to maintain operations!</>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              alert(`URGENT Restock request sent! Current stock: ${cardStockRemaining} cards.`);
              setNotifications([{
                id: Date.now().toString(),
                type: 'critical',
                title: 'URGENT: Card Stock Critical',
                message: cardStockRemaining <= 0
                  ? 'CRITICAL: OUT OF STOCK. Restock requested immediately.'
                  : `CRITICAL: Only ${cardStockRemaining} cards left! Restock requested.`,
                timestamp: new Date(),
                read: false
              }, ...notifications]);
            }}
            className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 whitespace-nowrap transition-colors"
          >
            Send Urgent Request
          </button>
        </div>
      )}

      {/* WARNING ALERT BANNER - Shows at top if stock is low */}
      {cardStockStatus.level === 'warning' && (
        <div className="bg-yellow-500 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-yellow-500/30 border-l-4 border-yellow-600">
          <AlertTriangle size={28} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-lg">WARNING: Parking Cards Stock Low</p>
            <p className="text-sm mt-1">
              <span className="font-bold">{cardStockRemaining} cards</span> remaining. Please restock soon to avoid service interruption.
            </p>
          </div>
          <button
            onClick={() => {
              alert(`Restock request sent! Current stock: ${cardStockRemaining} cards.`);
              setNotifications([{
                id: Date.now().toString(),
                type: 'warning',
                title: 'Card Stock Low',
                message: `Only ${cardStockRemaining} cards remaining. Restock request sent to procurement.`,
                timestamp: new Date(),
                read: false
              }, ...notifications]);
            }}
            className="px-4 py-2 bg-white text-yellow-700 rounded-lg font-bold hover:bg-yellow-50 whitespace-nowrap transition-colors"
          >
            Send Restock Request
          </button>
        </div>
      )}
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
          {/* Card Stock Alert Badge with Status Indicator */}
          <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 font-bold animate-pulse ${
            cardStockStatus.level === 'critical' 
              ? 'bg-red-50 border-red-300 shadow-lg shadow-red-100' 
              : cardStockStatus.level === 'warning' 
              ? 'bg-yellow-50 border-yellow-300 shadow-lg shadow-yellow-100' 
              : cardStockStatus.level === 'notice'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="text-sm">
              <p className={`text-xs font-bold uppercase tracking-wider ${
                cardStockStatus.level === 'critical' 
                  ? 'text-red-700' 
                  : cardStockStatus.level === 'warning' 
                  ? 'text-yellow-700' 
                  : cardStockStatus.level === 'notice'
                  ? 'text-amber-700'
                  : 'text-slate-600'
              }`}>{cardStockStatus.label}</p>
              <p className={`text-lg font-bold ${
                cardStockStatus.level === 'critical' 
                  ? 'text-red-600' 
                  : cardStockStatus.level === 'warning' 
                  ? 'text-yellow-600' 
                  : cardStockStatus.level === 'notice'
                  ? 'text-amber-600'
                  : 'text-purple-600'
              }`}>{cardStockRemaining} Cards</p>
            </div>
          </div>
          <button 
            onClick={() => setShowVisitorPassModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
            title="Issue temporary parking card for guests/visitors"
          >
            <Plus size={18} /> Visitor Pass
          </button>
          
          <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="notification-button"
            onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden flex flex-col"
              aria-label="notification-panel"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{notif.title}</p>
                              <p className="text-sm text-slate-600 mt-0.5">{notif.message}</p>
                            </div>
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                              title="Dismiss notification"
                            >
                              <span className="text-lg leading-none">×</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatNotificationTime(notif.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setNotifications([]);
                      setShowNotifications(false);
                    }}
                    className="text-xs text-slate-600 hover:text-primary font-semibold transition-colors"
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </div>
          )}
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

      {/* Data Status Section - Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Gate Busy</p>
              <p className="text-2xl font-bold text-slate-800">{occupiedSlots}</p>
            </div>
            <Car className="text-red-200" size={34} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Currently occupied</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Gate Idle</p>
              <p className="text-2xl font-bold text-slate-800">{totalSlots - occupiedSlots}</p>
            </div>
            <Cpu className="text-emerald-200" size={34} />
          </div>
          <p className="text-xs text-slate-500 mt-2">Available slots</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Occupancy Rate</p>
              <p className="text-2xl font-bold text-slate-800">{occupancyRate}%</p>
            </div>
            <Gauge className="text-blue-200" size={34} />
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full rounded-full transition-all ${occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <GatewayStatusBanner gates={gates} />

      {/* Live Zone Occupancy */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gauge className="text-blue-600" size={20} />
            <div>
              <h2 className="text-xl font-bold">Live Zone Occupancy</h2>
              <p className="text-sm text-slate-500 mt-1">Quick overview of parking availability by zone</p>
            </div>
          </div>
          <button onClick={fetchData} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from(new Set(zones.map(z => z.zone))).slice(0, 2).map((zoneName, idx) => {
            const zoneSlots = zones.filter(z => z.zone === zoneName);
            const occ = zoneSlots.filter(z => z.is_occupied).length;
            const empty = zoneSlots.length - occ;
            const rate = zoneSlots.length > 0 ? Math.round((occ / zoneSlots.length) * 100) : 0;
            const isHighOccupancy = rate > 80;
            
            return (
              <div key={idx} className={`rounded-2xl shadow-sm border overflow-hidden ${
                isHighOccupancy 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${isHighOccupancy ? 'text-red-700' : 'text-slate-800'}`}>Zone {zoneName}</h3>
                    <span className={`text-3xl font-bold ${isHighOccupancy ? 'text-red-600' : 'text-emerald-600'}`}>
                      {rate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full rounded-full transition-all ${isHighOccupancy ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                  <p className={`text-sm font-semibold ${isHighOccupancy ? 'text-red-700' : 'text-slate-700'}`}>
                    {occ}/{zoneSlots.length} slots • {empty} empty
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts & Operations - Merged Section with Quick Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with Quick Summary - Always Visible */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={20} />
              <h2 className="text-lg font-bold">Alerts & Operations</h2>
            </div>
            <button
              onClick={() => setShowAlertsOperations(!showAlertsOperations)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {showAlertsOperations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              <span className="text-xs font-semibold text-slate-600">
                {showAlertsOperations ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>
          
          {/* Quick Status Bar - Shows Without Expanding */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3 rounded-lg border text-center ${
              incidentCount > 0 
                ? 'bg-red-50 border-red-200' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className="text-xs font-bold text-slate-600 uppercase">Alerts</p>
              <p className={`text-2xl font-bold ${
                incidentCount > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}>{incidentCount}</p>
            </div>
            <div className={`p-3 rounded-lg border text-center ${
              gateOfflineCount > 0 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className="text-xs font-bold text-slate-600 uppercase">Gates</p>
              <p className={`text-2xl font-bold ${
                gateOfflineCount > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}>{gateOnlineCount}/{totalGates || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Online</p>
            </div>
            <div className={`p-3 rounded-lg border text-center ${
              pendingCasesCount > 0 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className="text-xs font-bold text-slate-600 uppercase">Pending</p>
              <p className={`text-2xl font-bold ${
                pendingCasesCount > 0 ? 'text-orange-600' : 'text-emerald-600'
              }`}>{pendingCasesCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Cases</p>
            </div>
            <div className={`p-3 rounded-lg border text-center ${
              cardStockRemaining < 10 
                ? 'bg-red-50 border-red-200' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className="text-xs font-bold text-slate-600 uppercase">Card Stock</p>
              <p className={`text-2xl font-bold ${
                cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL ? 'text-red-600' :
                cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING ? 'text-orange-600' :
                cardStockRemaining < 20 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>{cardStockRemaining}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL ? 'text-red-600' :
                cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING ? 'text-orange-600' :
                cardStockRemaining < 20 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                {cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL ? 'CRITICAL' :
                 cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING ? 'WARNING' :
                 cardStockRemaining < 20 ? 'MONITOR' :
                 'HEALTHY'}
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {showAlertsOperations && (
          <div className="p-6 space-y-6 border-t border-slate-100">
            {/* Incident Type Pills */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Alert Breakdown</h3>
              <div className="flex flex-wrap gap-2">
                {gateOfflineCount > 0 && (
                  <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Gate Offline ({gateOfflineCount})
                  </div>
                )}
                {gateAlertCount > 0 && (
                  <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                    Gate Alert ({gateAlertCount})
                  </div>
                )}
                {activeIncidents.filter(i => i.type === 'high_occupancy').length > 0 && (
                  <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                    High Occupancy ({activeIncidents.filter(i => i.type === 'high_occupancy').length})
                  </div>
                )}
                {incidentCount === 0 && (
                  <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                    All Systems Normal
                  </div>
                )}
              </div>
            </div>

            {/* Active Incidents List */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-orange-600" />
                Active Incidents ({incidentCount})
              </h3>
              {incidentCount > 0 ? (
                <div className="space-y-2">
                  {activeIncidents.map((incident) => (
                    <div key={incident.id} className={`p-3 rounded-lg border flex items-start justify-between ${
                      incident.severity === 'high' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${
                          incident.severity === 'high' ? 'text-red-800' : 'text-yellow-800'
                        }`}>{incident.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{incident.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                  <p className="text-sm font-semibold text-emerald-700">No active incidents</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100"></div>

            {/* System Status Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                <Gauge size={16} className="text-green-600" />
                System Health: {systemHealth}% Operational
              </h3>
              <QuickStatsPanel />
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100"></div>

            {/* Manual Operations Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                Manual Operations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lost Card Operation - Shows context */}
                <button
                  onClick={() => setShowLostCardModal(true)}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all hover:shadow-md text-left group"
                  title="Report lost/damaged parking card and issue temporary pass"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="text-red-700" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-800 group-hover:text-red-900">Lost Card Report</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          pendingCasesCount > 0 
                            ? 'bg-red-200 text-red-700' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {pendingCasesCount} pending
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-red-600 mt-2">Report lost/damaged card & issue temporary pass</p>
                  <p className="text-[10px] text-red-500 mt-2 font-semibold">Fee: ₫20,000</p>
                </button>

                {/* Emergency Override - Links to GateControl */}
                <button
                  onClick={() => {
                    if (gateOfflineCount > 0) {
                      alert('Gate issues detected. Switch to Gate Control tab to manually override gates.');
                    } else {
                      setShowEmergencyOverrideModal(true);
                    }
                  }}
                  className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all hover:shadow-md text-left group relative"
                  title="Override gate during emergency only - requires supervisor code"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="text-orange-700" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-orange-800 group-hover:text-orange-900">Emergency Override</p>
                      {gateOfflineCount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-200 text-orange-700">
                            {gateOfflineCount} gates down
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">Force gate open in emergencies only (fire, obstruction, safety)</p>
                  <p className="text-[10px] text-orange-500 mt-2 font-semibold">Requires supervisor code</p>
                  {gateOfflineCount > 0 && (
                    <p className="text-[10px] text-orange-600 mt-2 font-bold">Use GateControl tab for manual operations</p>
                  )}
                </button>

                {/* Manual Exit - Shows card stock with threshold warnings */}
                <button
                  onClick={() => {
                    if (cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL) {
                      alert(
                        cardStockRemaining <= 0
                          ? 'OUT OF STOCK: No cards remaining. Request restock before issuing new cards.'
                          : `CRITICAL: Only ${cardStockRemaining} cards remaining! Request restock before issuing new cards.`
                      );
                    } else if (cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING) {
                      alert(`WARNING: Card stock is low (${cardStockRemaining} remaining). Monitor closely.`);
                    }
                    setShowManualHandlingModal(true);
                  }}
                  className={`p-4 rounded-lg hover:shadow-md text-left group border transition-all ${
                    cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL
                      ? 'bg-red-50 border-red-200 hover:bg-red-100'
                      : cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING
                      ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                      : cardStockRemaining < 20
                      ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                      : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="Create manual exit when card reader or plate scanner fails"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Activity className="text-amber-700" size={20} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${
                        cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL
                          ? 'text-red-800 group-hover:text-red-900'
                          : cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING
                          ? 'text-orange-800 group-hover:text-orange-900'
                          : 'text-amber-800 group-hover:text-amber-900'
                      }`}>Manual Exit</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL
                            ? 'bg-red-200 text-red-700'
                            : cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING
                            ? 'bg-orange-200 text-orange-700'
                            : cardStockRemaining < 20
                            ? 'bg-amber-200 text-amber-700'
                            : 'bg-amber-200 text-amber-700'
                        }`}>
                          {cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL ? 'Critical' : cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING ? 'Warning' : cardStockRemaining < 20 ? 'Monitor' : 'Healthy'} Stock: {cardStockRemaining}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs mt-2 ${
                    cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL
                      ? 'text-red-600'
                      : cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING
                      ? 'text-orange-600'
                      : 'text-amber-600'
                  }`}>Create exit when card reader or plate scanner fails</p>
                  <p className={`text-[10px] font-semibold mt-2 ${
                    cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL
                      ? 'text-red-500'
                      : cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING
                      ? 'text-orange-500'
                      : 'text-amber-500'
                  }`}>Charge: Motorbike ₫5k / Car ₫10k</p>
                  {cardStockRemaining <= CARD_STOCK_THRESHOLDS.CRITICAL && (
                    <p className="text-[10px] text-red-600 mt-2 font-bold">CRITICAL: Request restock immediately!</p>
                  )}
                  {cardStockRemaining < CARD_STOCK_THRESHOLDS.WARNING && cardStockRemaining > CARD_STOCK_THRESHOLDS.CRITICAL && (
                    <p className="text-[10px] text-orange-600 mt-2 font-bold">WARNING: Low stock - monitor closely!</p>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Vehicles */}
      <LiveVehicles
        searchQuery={searchQuery}
        onSelectVehicle={(vehicle) => console.log('Selected vehicle:', vehicle)}
      />

      {/* Compact Occupied Slots Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button 
          onClick={() => setShowOccupiedSlots(!showOccupiedSlots)}
          className="w-full p-5 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Car className="text-slate-600" size={20} />
            <div>
              <h2 className="text-lg font-bold text-left">Occupied Slots Overview</h2>
              <p className="text-xs text-slate-500 text-left">Compact infrastructure snapshot by zone</p>
            </div>
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {occupiedList.length} slots
            </span>
          </div>
          {showOccupiedSlots ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            {occupiedZoneEntries.length > 0 ? (
              occupiedZoneEntries.map(([zone, count]) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                >
                  Zone {zone}
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">{count}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No occupied zones right now</span>
            )}
          </div>
        </div>

        {showOccupiedSlots && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {occupiedList.length > 0 ? (
                occupiedList.map((slot, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between"
                  >
                    <p className="text-sm font-bold text-slate-800">{slot.slot_number}</p>
                    <span className="text-xs font-semibold text-slate-500">Zone {slot.zone}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No occupied slots right now</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions - LIMITED TO 5 ROWS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Activity className="text-purple-600" size={20} />
            <div>
              <h2 className="text-lg font-bold mb-1">Recent Transactions</h2>
              <p className="text-sm text-slate-500">Latest 5 vehicles exited, cards returned, payments collected</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">License Plate</th>
                <th className="px-6 py-4">Exit Time</th>
                <th className="px-6 py-4">Card Type</th>
                <th className="px-6 py-4">Vehicle Type</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 5).map((txn, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-bold text-slate-800">{txn.plate}</td>
                    <td className="px-6 py-4 text-slate-600">{txn.exitTime}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        txn.cardType === 'Registered'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {txn.cardType === 'Registered' ? '👤 Registered' : '👤 Temporary'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="text-sm font-semibold">{txn.vehicleType}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{txn.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        txn.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : txn.status === 'Returned'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => alert(`Action for ${txn.plate}`)}
                        className="text-primary hover:text-primary-dark transition-colors"
                        title="View details"
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <OverrideGateModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        gateId={selectedGate?.id}
        gateName={selectedGate?.name}
      />
      <LostCardModal isOpen={showLostCardModal} onClose={() => setShowLostCardModal(false)} />
      <ManualEntryModal
        isOpen={showManualHandlingModal}
        onClose={() => setShowManualHandlingModal(false)}
        onSuccess={(data) => {
          // Add transaction to recent transactions list (max 7 items)
          const newTransaction = {
            id: recentTransactions.length + 1,
            plate: data.plate,
            exitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cardType: 'Manual Exit',
            vehicleType: data.vehicleType === 'motorbike' ? 'Motorbike' : 'Car',
            amount: `₫${data.fee.toLocaleString()}`,
            status: 'Paid'
          };
          setRecentTransactions([newTransaction, ...recentTransactions.slice(0, 6)]);
          
          if (onManualAction) onManualAction('manual_exit', data);
          setShowManualHandlingModal(false);
        }}
      />

      {/* Visitor Pass Modal (renamed from Issue Temp Card) */}
      {showVisitorPassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Visitor Pass</h2>
                  <p className="text-sm text-slate-500 mt-1">Auto-issued temporary parking card</p>
                </div>
                <div className={`text-center px-3 py-2 rounded-lg ${
                  cardStockRemaining < 5 
                    ? 'bg-red-100 text-red-700' 
                    : cardStockRemaining < 10 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  <p className="text-xs uppercase font-semibold">Available</p>
                  <p className="text-lg font-bold">{cardStockRemaining}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0">
              <button
                onClick={() => setVisitorPassTab('issue')}
                className={`flex-1 py-4 px-4 font-semibold text-center transition-colors border-b-2 ${
                  visitorPassTab === 'issue'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
              >
                Issue Card
              </button>
              <button
                onClick={() => setVisitorPassTab('return')}
                className={`flex-1 py-4 px-4 font-semibold text-center transition-colors border-b-2 ${
                  visitorPassTab === 'return'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-800'
                }`}
              >
                Return Card
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {visitorPassTab === 'issue' ? (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <strong>License Plate:</strong> AAA-0001 (Scanned)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Vehicle Type</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Motorbike / E-Motorbike - ₫5,000</option>
                      <option>Car - ₫10,000</option>
                    </select>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs text-emerald-700">
                      <strong>Fee:</strong> One-time payment per visit (entry to exit)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <strong>License Plate:</strong> AAA-0001 (Scanned)
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Fee Paid:</strong> ₫5,000 (Motorbike)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Refund Method</label>
                    <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>Mobile Payment</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowVisitorPassModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (visitorPassTab === 'issue') {
                    if (cardStockRemaining > 0) {
                      setCardStockRemaining(cardStockRemaining - 1);
                      alert(`✓ Visitor pass issued! Remaining stock: ${cardStockRemaining - 1}`);
                      setShowVisitorPassModal(false);
                    } else {
                      alert('⚠ No cards available in stock!');
                    }
                  } else {
                    setCardStockRemaining(cardStockRemaining + 1);
                    alert(`✓ Card returned successfully! Stock updated: ${cardStockRemaining + 1}`);
                    setShowVisitorPassModal(false);
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  visitorPassTab === 'issue' && cardStockRemaining === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={visitorPassTab === 'issue' && cardStockRemaining === 0}
              >
                {visitorPassTab === 'issue' ? 'Issue Pass' : 'Return Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Card Modal */}
      {showLostCardModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 text-red-700">Lost Card Report</h2>
              <p className="text-sm text-slate-500 mt-1">Process refund & issue new card</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-slate-600"><strong>License Plate:</strong> AAA-0001 (Scanned)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vehicle Type</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none">
                  <option>Motorbike / E-Motorbike - ₫5,000</option>
                  <option>Car - ₫10,000</option>
                </select>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700"><strong>Action:</strong> Auto-refund + Issue new card (no charge)</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowLostCardModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Lost card processed: Refund issued ₫5,000-10,000 + New card issued');
                  setShowLostCardModal(false);
                }}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Gate Override Modal */}
      {showEmergencyOverrideModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 text-orange-700">Emergency Override</h2>
              <p className="text-sm text-slate-500 mt-1">Manual gate control</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Gate</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
                  <option>Gate 1 (Entry)</option>
                  <option>Gate 2 (Exit)</option>
                  <option>Gate 3 (Entry)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
                  <option>Power Loss</option>
                  <option>Equipment Malfunction</option>
                  <option>Emergency Exit</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700"><strong>Note:</strong> Action logged with timestamp for audit trail</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowEmergencyOverrideModal(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Gate opened manually - Event logged for audit');
                  setShowEmergencyOverrideModal(false);
                }}
                className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Open Gate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Exit Modal - REMOVED, now using ManualEntryModal simplified version */}
    </div>
  );
}