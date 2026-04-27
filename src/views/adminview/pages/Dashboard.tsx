import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/supabase';
import { motion } from 'motion/react';

interface DashboardStats {
  revenue: number;
  revenueStatus: string; // e.g. +12.5%
  activeUsers: number;
  userStatus: string; // e.g. -2.1%
  systemHealth: string; // e.g. 99.8%
  healthStatus: 'Stable' | 'Critical' | 'Warning';
  occupancy: number; // e.g. 72%
  occupancyStatus: 'High' | 'Low' | 'Moderate';
}

interface ZoneOccupancy {
  name: string;
  count: number;
  total: number;
  percent: number;
}

interface SystemAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  time: string;
}

export const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    revenueStatus: '+0%',
    activeUsers: 0,
    userStatus: '+0%',
    systemHealth: '100%',
    healthStatus: 'Stable',
    occupancy: 0,
    occupancyStatus: 'Moderate'
  });

  const [zones, setZones] = useState<ZoneOccupancy[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<'Monthly' | 'Weekly' | 'Daily'>('Monthly');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Real-time Occupancy
      const { data: slots } = await supabase.from('parking_slots').select('*');

      // 2. Fetch Total Profiles
      const { data: profiles } = await supabase.from('profiles').select('id, created_at');

      // 3. Fetch System Health (IoT)
      const { data: devices } = await supabase.from('iot_devices').select('status');

      // 4. Fetch Incidents (Alerts)
      const { data: incidents } = await supabase.from('iot_incidents').select(`
        id, severity, description, created_at, iot_devices(name)
      `).eq('status', 'OPEN').order('created_at', { ascending: false }).limit(5);

      // 5. Fetch Revenue (Payments)
      const { data: payments } = await supabase
        .from('parking_transactions')
        .select('amount, created_at')
        .eq('status', 'SUCCESS');

      // --- CALCULATIONS ---
      const now = new Date();
      
      // Revenue Chart Logic
      let dataPoints: number[] = [];
      if (timeRange === 'Daily') {
        dataPoints = new Array(24).fill(0);
        payments?.forEach(p => {
          const d = new Date(p.created_at);
          if (d.toDateString() === now.toDateString()) {
            dataPoints[d.getHours()] += Number(p.amount);
          }
        });
      } else if (timeRange === 'Weekly') {
        dataPoints = new Array(7).fill(0);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        payments?.forEach(p => {
          const d = new Date(p.created_at);
          if (d >= startOfWeek) {
            const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
            dataPoints[dayIdx] += Number(p.amount);
          }
        });
      } else {
        dataPoints = new Array(12).fill(0);
        payments?.forEach(p => {
          const d = new Date(p.created_at);
          if (d.getFullYear() === now.getFullYear()) {
            dataPoints[d.getMonth()] += Number(p.amount);
          }
        });
      }
      setRevenueData(dataPoints);

      // Revenue Growth Calculation
      const currentMonth = now.getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      let thisMonthTotal = 0;
      let lastMonthTotal = 0;
      let totalRev = 0;

      payments?.forEach(p => {
        const d = new Date(p.created_at);
        const m = d.getMonth();
        const amt = Number(p.amount);
        totalRev += amt;
        if (d.getFullYear() === now.getFullYear()) {
          if (m === currentMonth) thisMonthTotal += amt;
          if (m === lastMonth) lastMonthTotal += amt;
        }
      });
      const revGrowth = lastMonthTotal === 0 ? 0 : Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);

      // Occupancy & Health
      const totalSlots = slots?.length || 0;
      const occupiedSlots = slots?.filter(s => s.is_occupied).length || 0;
      const occupancyRate = totalSlots === 0 ? 0 : Math.round((occupiedSlots / totalSlots) * 100);

      const totalDevices = devices?.length || 0;
      const errorDevices = devices?.filter(d => d.status === 'ERROR' || d.status === 'OFFLINE').length || 0;
      const healthRate = totalDevices === 0 ? 100 : Math.round(((totalDevices - errorDevices) / totalDevices) * 100);

      // Zones
      const zoneMap: Record<string, { count: number, total: number }> = {};
      slots?.forEach(slot => {
        const z = slot.zone || 'Unknown';
        if (!zoneMap[z]) zoneMap[z] = { count: 0, total: 0 };
        zoneMap[z].total++;
        if (slot.is_occupied) zoneMap[z].count++;
      });
      const zoneData = Object.entries(zoneMap).map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
        percent: Math.round((data.count / data.total) * 100)
      }));

      // Updates
      setStats({
        revenue: totalRev,
        revenueStatus: `${revGrowth >= 0 ? '+' : ''}${revGrowth}%`,
        activeUsers: profiles?.length || 0,
        userStatus: '+5.4%',
        systemHealth: `${healthRate}%`,
        healthStatus: healthRate > 95 ? 'Stable' : healthRate > 80 ? 'Warning' : 'Critical',
        occupancy: occupancyRate,
        occupancyStatus: occupancyRate > 85 ? 'High' : occupancyRate < 30 ? 'Low' : 'Moderate'
      });
      setZones(zoneData);
      setAlerts(incidents?.map((inc: any) => ({
        id: inc.id,
        severity: inc.severity,
        title: inc.severity === 'CRITICAL' ? 'Major System Failure' : 'System Notice',
        description: `${inc.iot_devices?.name}: ${inc.description}`,
        time: new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })) || []);

    } catch (e) {
      console.error('Dashboard Fetch failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getChartLabels = () => {
    if (timeRange === 'Daily') return ['00h', '04h', '08h', '12h', '16h', '20h', '23h'];
    if (timeRange === 'Weekly') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Real-time status of HCMUT Smart Parking infrastructure.</p>
        </div>
        <button onClick={fetchDashboardData} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-all">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
          ) : (
            <span className="material-symbols-outlined text-sm">refresh</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><span className="material-symbols-outlined">payments</span></div>
            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">{stats.revenueStatus}</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">${stats.revenue.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><span className="material-symbols-outlined">group</span></div>
            <span className="text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded-full">{stats.userStatus}</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Active Users</p>
          <p className="text-2xl font-bold mt-1">{stats.activeUsers.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${stats.healthStatus === 'Stable' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}><span className="material-symbols-outlined">health_and_safety</span></div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.healthStatus === 'Stable' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{stats.healthStatus}</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">System Health</p>
          <p className="text-2xl font-bold mt-1">{stats.systemHealth}</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><span className="material-symbols-outlined">directions_car</span></div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.occupancyStatus === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>{stats.occupancyStatus}</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Current Occupancy</p>
          <p className="text-2xl font-bold mt-1">{stats.occupancy}%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-6 rounded-2xl border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Revenue Analytics</h3>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} className="bg-slate-100 border-none rounded-lg text-xs font-semibold px-3 py-1.5 focus:ring-0 outline-none cursor-pointer">
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>
            <div className="relative h-64 w-full bg-slate-50 rounded-xl overflow-hidden flex items-end justify-between px-6 pb-4 gap-1">
              {revenueData.map((val, idx) => {
                const max = Math.max(...revenueData, 1);
                const height = Math.max((val / max) * 100, 5);
                const isCurrent = timeRange === 'Daily' ? idx === new Date().getHours() : timeRange === 'Weekly' ? idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) : idx === new Date().getMonth();
                return (
                  <div key={idx} className={`rounded-t-lg transition-all hover:brightness-110 flex-1 ${isCurrent ? 'bg-primary' : 'bg-primary/30'}`} style={{ height: `${height}%` }} title={`${val.toLocaleString()} VND`}></div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 px-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {getChartLabels().map(label => <span key={label}>{label}</span>)}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-200/50 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Zone Occupancy Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {zones.map((zone, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase truncate" title={zone.name}>{zone.name}</p>
                  <p className="text-xl font-bold text-primary mt-1">{zone.percent}%</p>
                  <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${zone.percent > 90 ? 'bg-rose-500' : zone.percent > 70 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${zone.percent}%` }}></div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">{zone.count}/{zone.total} Slots</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border border-slate-200/50 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">System Alerts</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</span>
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? alerts.map((alert) => (
                <div key={alert.id} className={`flex gap-4 p-3 rounded-xl border ${alert.severity === 'CRITICAL' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-600' : 'bg-amber-500/20 text-amber-600'}`}>
                    <span className="material-symbols-outlined text-sm">{alert.severity === 'CRITICAL' ? 'warning' : 'info'}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">{alert.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{alert.description}</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{alert.time}</p>
                  </div>
                </div>
              )) : <div className="text-center py-10 opacity-40"><p className="text-sm font-bold">No active alerts</p></div>}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors bg-slate-100 rounded-xl">View All System Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};
