import React from 'react';
import {
  Bell,
  Calendar,
  TrendingUp,
  Wallet,
  Timer,
  Star,
  PlusCircle,
  Search,
  History,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useProfile } from '../../../shared/hooks/useProfile';

export default function Dashboard() {
  const { profile } = useProfile();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Topbar */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Good morning, {profile?.full_name?.split(' ')[0] || 'Member'}! 👋
          </h2>
          <p className="text-slate-500 font-medium">Here's what's happening with your parking today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="size-12 rounded-2xl glass flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary transition-all border border-slate-200 relative">
            <Bell size={20} />
            <span className="absolute top-3 right-3 size-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <Calendar size={18} className="text-primary" />
            <span className="text-sm font-bold text-slate-700">Oct 24, 2023</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl shadow-primary/20">
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
            <h3 className="text-3xl font-black mb-4">250,000 <span className="text-lg font-medium">VND</span></h3>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp size={14} />
              <span>+15% from last month</span>
            </div>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 text-white/10 size-32" />
        </div>

        {/* Active Session Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Session</p>
              <h3 className="text-3xl font-black text-slate-900">01:45:22</h3>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Timer size={24} className="animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-sm font-bold">B2 Building - Slot #42</span>
          </div>
        </div>

        {/* Points Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Rewards</p>
              <h3 className="text-3xl font-black text-slate-900">1,240 <span className="text-lg font-medium">pts</span></h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-3/4"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-bold">260 pts to Gold Tier</p>
        </div>
      </div>

      {/* Quick Actions & Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-lg font-bold text-slate-800">Quick Actions</h4>
          <button className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-primary hover:text-white transition-all group border-slate-200 shadow-sm">
            <div className="size-12 rounded-xl bg-primary/10 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white transition-colors">
              <PlusCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Top-up Balance</p>
              <p className="text-xs opacity-70">Add funds instantly</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-indigo-600 hover:text-white transition-all group border-slate-200 shadow-sm">
            <div className="size-12 rounded-xl bg-indigo-600/10 group-hover:bg-white/20 flex items-center justify-center text-indigo-600 group-hover:text-white transition-colors">
              <Search size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Find Slot</p>
              <p className="text-xs opacity-70">Locate available spots</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-slate-800 hover:text-white transition-all group border-slate-200 shadow-sm">
            <div className="size-12 rounded-xl bg-slate-800/10 group-hover:bg-white/20 flex items-center justify-center text-slate-800 group-hover:text-white transition-colors">
              <History size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Extend Session</p>
              <p className="text-xs opacity-70">Add more time remotely</p>
            </div>
          </button>
        </div>

        {/* Usage Chart Placeholder */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-slate-800">Parking Activity</h4>
            <select className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-1 focus:ring-primary/20">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-56 w-full flex items-end justify-between gap-2">
            {[
              { day: 'Mon', height: '60%' },
              { day: 'Tue', height: '80%' },
              { day: 'Wed', height: '50%' },
              { day: 'Thu', height: '100%', active: true },
              { day: 'Fri', height: '75%' },
              { day: 'Sat', height: '30%' },
              { day: 'Sun', height: '40%' },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-t-lg relative group h-full">
                  <div
                    style={{ height: item.height }}
                    className={`absolute bottom-0 w-full transition-all rounded-t-lg ${item.active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/40 group-hover:bg-primary'}`}
                  ></div>
                </div>
                <span className={`text-[10px] font-bold ${item.active ? 'text-slate-800' : 'text-slate-400'}`}>{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-800">Recent Parking Sessions</h4>
          <button className="text-primary text-xs font-bold hover:underline">View All</button>
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
              {[
                { loc: 'A1 Building', time: 'Oct 23, 2023 • 08:30 AM', dur: '04h 12m', cost: '15,000 VND', status: 'Completed', color: 'indigo' },
                { loc: 'Central Library', time: 'Oct 22, 2023 • 01:15 PM', dur: '02h 45m', cost: '10,000 VND', status: 'Completed', color: 'violet' },
                { loc: 'H6 Building', time: 'Oct 21, 2023 • 09:00 AM', dur: '08h 00m', cost: '30,000 VND', status: 'Completed', color: 'blue' },
              ].map((row, i) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
