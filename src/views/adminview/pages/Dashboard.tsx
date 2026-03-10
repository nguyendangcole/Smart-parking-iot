import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Real-time status of HCMUT Smart Parking infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">+12.5%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
          <p className="text-2xl font-bold mt-1">$12,450.00</p>
        </div>
        <div className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded-full">-2.1%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Active Users</p>
          <p className="text-2xl font-bold mt-1">3,240</p>
        </div>
        <div className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">Stable</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">System Health</p>
          <p className="text-2xl font-bold mt-1">99.8%</p>
        </div>
        <div className="glass p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">directions_car</span>
            </div>
            <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-full">High</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Current Occupancy</p>
          <p className="text-2xl font-bold mt-1">72%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-6 rounded-2xl border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Revenue Analytics</h3>
              <select className="bg-slate-100 border-none rounded-lg text-xs font-semibold px-3 py-1.5 focus:ring-0">
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Daily</option>
              </select>
            </div>
            <div className="relative h-64 w-full bg-slate-50 rounded-xl overflow-hidden flex items-end justify-between px-6 pb-4">
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '45%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '60%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '80%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '55%' }}></div>
              <div className="w-8 bg-primary rounded-t-lg transition-all" style={{ height: '95%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '70%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '50%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '65%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '40%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '85%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '30%' }}></div>
              <div className="w-8 bg-primary/30 rounded-t-lg transition-all hover:bg-primary" style={{ height: '75%' }}></div>
            </div>
            <div className="flex justify-between mt-2 px-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-slate-200/50 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Zone Occupancy Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Zone A (Ground)</p>
                <p className="text-xl font-bold text-primary mt-1">92%</p>
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Zone B (Level 1)</p>
                <p className="text-xl font-bold text-primary mt-1">64%</p>
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Zone C (Level 2)</p>
                <p className="text-xl font-bold text-primary mt-1">45%</p>
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Zone D (Level 3)</p>
                <p className="text-xl font-bold text-primary mt-1">12%</p>
                <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
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
              <div className="flex gap-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex-shrink-0 w-8 h-8 bg-rose-500/20 text-rose-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">warning</span>
                </div>
                <div>
                  <p className="text-xs font-bold">Barrier Gate Failure</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Zone A - Gate 02 sensor unresponsive.</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">2 mins ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 text-amber-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">battery_alert</span>
                </div>
                <div>
                  <p className="text-xs font-bold">Low Battery Sensor</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">IoT Node #142 (Zone C) at 12% power.</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">14 mins ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 text-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">info</span>
                </div>
                <div>
                  <p className="text-xs font-bold">Peak Occupancy Reached</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Ground floor has reached 100% capacity.</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">45 mins ago</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">person_add</span>
                </div>
                <div>
                  <p className="text-xs font-bold">New Subscriptions</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">12 new monthly passes registered today.</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">1 hour ago</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors bg-slate-100 rounded-xl">View All System Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};
