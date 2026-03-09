import React from 'react';
import {
  Car,
  Cpu,
  AlertTriangle,
  CircleDollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  Bell,
  MoreVertical,
  LogIn,
  LogOut
} from 'lucide-react';
import { useProfile } from '../../../shared/hooks/useProfile';

export default function Dashboard() {
  const { profile } = useProfile();
  const kpis = [
    {
      title: 'Total Occupancy',
      value: '856 / 1,000',
      trend: '+2.4%',
      icon: Car,
      color: 'primary',
      progress: 85.6
    },
    {
      title: 'Active Gates',
      value: '12 / 12',
      trend: 'Stable',
      icon: Cpu,
      color: 'emerald',
      sub: 'Last checked 2 mins ago'
    },
    {
      title: 'Recent Alerts',
      value: '3 Pending',
      trend: '-12%',
      icon: AlertTriangle,
      color: 'orange',
      sub: '1 Critical, 2 Maintenance'
    },
    {
      title: 'Revenue Today',
      value: '14.5M VND',
      trend: '+15%',
      icon: CircleDollarSign,
      color: 'emerald',
      sub: 'Target: 18.0M VND'
    },
  ];

  const gates = [
    { id: 'A', name: 'Entrance', status: 'Open', lastEvent: '51A-123.45 Entry', img: 'https://picsum.photos/seed/gateA/400/225' },
    { id: 'B', name: 'Entrance', status: 'Closed', lastEvent: 'Status: Standby', img: 'https://picsum.photos/seed/gateB/400/225' },
    { id: 'C', name: 'Exit', status: 'Open', lastEvent: '59G-789.01 Exit', img: 'https://picsum.photos/seed/gateC/400/225' },
    { id: 'D', name: 'Exit', status: 'Open', lastEvent: '51H-445.56 Exit', img: 'https://picsum.photos/seed/gateD/400/225' },
  ];

  const logs = [
    { plate: '51A-123.45', gate: 'Gate A', action: 'Entry', time: 'Today, 10:42 AM', confidence: 98, color: 'emerald' },
    { plate: '59G-789.01', gate: 'Gate C', action: 'Exit', time: 'Today, 10:38 AM', confidence: 95, color: 'orange' },
    { plate: '51H-445.56', gate: 'Gate D', action: 'Exit', time: 'Today, 10:35 AM', confidence: 99, color: 'orange' },
    { plate: '30E-222.11', gate: 'Gate A', action: 'Entry', time: 'Today, 10:30 AM', confidence: 82, color: 'emerald' },
  ];

  return (
    <div className="space-y-8">
      {/* Topbar */}
      <header className="flex items-center justify-between mb-8">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search plates, transactions, or gates..."
            className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{profile?.full_name || 'Nguyen Van A'}</p>
              <p className="text-xs text-slate-500">{profile?.role || 'Chief Operator'}</p>
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

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <kpi.icon size={20} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${kpi.trend.startsWith('+') ? 'text-emerald-500' : kpi.trend === 'Stable' ? 'text-slate-500' : 'text-orange-500'}`}>
                {kpi.trend.includes('%') && <TrendingUp size={12} />} {kpi.trend}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{kpi.title}</p>
            <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
            {kpi.progress ? (
              <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${kpi.progress}%` }}></div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Live Gate Monitoring */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Live Gate Status</h2>
          <button className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
            <RefreshCw size={14} /> Refresh Feeds
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gates.map((gate) => (
            <div key={gate.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
              <div className="relative aspect-video bg-slate-200 overflow-hidden">
                <img
                  src={gate.img}
                  alt={gate.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">REC 01:24:00</div>
                {gate.status === 'Open' && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <div className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800">Gate {gate.id} - {gate.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${gate.status === 'Open' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {gate.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{gate.lastEvent}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Entry/Exit Logs</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-slate-50 text-xs font-semibold hover:bg-slate-100 transition-colors">Export CSV</button>
            <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all">View All</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">License Plate</th>
                <th className="px-6 py-4">Gate ID</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Confidence</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors text-sm">
                  <td className="px-6 py-4 font-bold text-slate-800">{log.plate}</td>
                  <td className="px-6 py-4 text-slate-500">{log.gate}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 ${log.action === 'Entry' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {log.action === 'Entry' ? <LogIn size={14} /> : <LogOut size={14} />} {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{log.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${log.confidence > 90 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${log.confidence}%` }}></div>
                      </div>
                      <span className="text-xs font-medium">{log.confidence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
