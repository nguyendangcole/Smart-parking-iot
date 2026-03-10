import React from 'react';

export const IoTMonitoring: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">IoT Monitoring</h2>
          <p className="text-slate-500 mt-1">Real-time health and connectivity status of all campus hardware nodes.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:border-primary transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh Nodes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">add</span>
            Register New Device
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">sensors</span>
            </div>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-2 py-1 rounded-full">98% ONLINE</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Sensors</p>
          <p className="text-2xl font-black mt-1">1,248</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">videocam</span>
            </div>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-2 py-1 rounded-full">100% ONLINE</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">IP Cameras</p>
          <p className="text-2xl font-black mt-1">84</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
              <span className="material-symbols-outlined">door_front</span>
            </div>
            <span className="text-amber-600 text-[10px] font-bold bg-amber-500/10 px-2 py-1 rounded-full">2 ISSUES</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Barriers & Gates</p>
          <p className="text-2xl font-black mt-1">16</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
              <span className="material-symbols-outlined">router</span>
            </div>
            <span className="text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-2 py-1 rounded-full">STABLE</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Gate Controllers</p>
          <p className="text-2xl font-black mt-1">32</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Campus Map Overview</h3>
              <div className="flex gap-2">
                <button className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-primary/10 hover:text-primary transition-all"><span className="material-symbols-outlined text-sm">zoom_in</span></button>
                <button className="p-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-primary/10 hover:text-primary transition-all"><span className="material-symbols-outlined text-sm">zoom_out</span></button>
              </div>
            </div>
            <div className="relative h-[400px] bg-slate-100 overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute top-1/4 left-1/3 w-48 h-32 bg-white/80 border-2 border-primary/20 rounded-xl flex items-center justify-center font-bold text-primary/40 text-xs uppercase tracking-widest">Zone A</div>
              <div className="absolute top-1/2 left-1/2 w-64 h-40 bg-white/80 border-2 border-primary/20 rounded-xl flex items-center justify-center font-bold text-primary/40 text-xs uppercase tracking-widest">Zone B</div>
              <div className="absolute top-10 left-10 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-200">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-bold">Node #1042</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-slate-200">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-bold">Node #1043</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-rose-500/30">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-rose-600">Node #1044</span>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-xl max-w-[180px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Selected Node</p>
                  <p className="text-xs font-bold">Barrier Gate #02</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500">Status</span>
                    <span className="text-[10px] font-bold text-rose-500">MALFUNCTION</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-500">Last Ping</span>
                    <span className="text-[10px] font-bold text-slate-700">12:44:02 PM</span>
                  </div>
                  <button className="w-full mt-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg">Run Diagnostics</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Hardware Malfunctions</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex-shrink-0 w-10 h-10 bg-rose-500/20 text-rose-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">door_front</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold">Barrier Gate #02</p>
                    <span className="text-[9px] font-bold text-rose-500 uppercase">Critical</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Motor failure detected. Manual override engaged.</p>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-lg">Dispatch Tech</button>
                    <button className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg">Ignore</button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500/20 text-amber-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">sensors</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold">IoT Node #1044</p>
                    <span className="text-[9px] font-bold text-amber-600 uppercase">Warning</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Intermittent connectivity. Signal strength at -84dBm.</p>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg">Reboot Node</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
            <h3 className="font-bold text-lg mb-4">Connectivity Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Network Latency</span>
                <span className="text-xs font-bold text-emerald-400">12ms</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: '15%' }}></div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">Data Throughput</span>
                <span className="text-xs font-bold">1.2 GB/hr</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '65%' }}></div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <span className="material-symbols-outlined text-sm">wifi</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Campus Mesh Network</p>
                    <p className="text-[10px] text-slate-500">Connected to 124 nodes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
