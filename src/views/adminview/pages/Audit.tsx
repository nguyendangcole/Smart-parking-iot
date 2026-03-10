import React from 'react';

export const Audit: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Audits & Reports</h2>
          <p className="text-slate-500">Monitor system integrity and analyze performance metrics across the infrastructure.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:border-primary transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filter View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">add</span>
            New Audit Request
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-primary/5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            <h3 className="text-lg font-bold">Generate Report</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-sm font-medium">
                  <button className="p-1 hover:text-primary"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <span>October 2023</span>
                  <button className="p-1 hover:text-primary"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                </div>
                <div className="grid grid-cols-7 text-[10px] text-center font-bold text-slate-400 py-1">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  <div className="h-6 flex items-center justify-center text-xs opacity-0">.</div>
                  <div className="h-6 flex items-center justify-center text-xs opacity-0">.</div>
                  <div className="h-6 flex items-center justify-center text-xs opacity-0">.</div>
                  <div className="h-6 flex items-center justify-center text-xs">1</div>
                  <div className="h-6 flex items-center justify-center text-xs">2</div>
                  <div className="h-6 flex items-center justify-center text-xs">3</div>
                  <div className="h-6 flex items-center justify-center text-xs">4</div>
                  <div className="h-6 flex items-center justify-center text-xs bg-primary/20 text-primary rounded-l-full">5</div>
                  <div className="h-6 flex items-center justify-center text-xs bg-primary/20 text-primary">6</div>
                  <div className="h-6 flex items-center justify-center text-xs bg-primary/20 text-primary">7</div>
                  <div className="h-6 flex items-center justify-center text-xs bg-primary/20 text-primary">8</div>
                  <div className="h-6 flex items-center justify-center text-xs bg-primary/20 text-primary">9</div>
                  <div className="h-6 flex items-center justify-center text-xs bg-primary/20 text-primary rounded-r-full">10</div>
                  <div className="h-6 flex items-center justify-center text-xs">11</div>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-primary/20 rounded-xl hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                  <span className="text-xs font-bold">PDF</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-slate-100 rounded-xl hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-green-600">table_chart</span>
                  <span className="text-xs font-bold">CSV</span>
                </button>
              </div>
            </div>
            <button className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm mt-2 shadow-lg shadow-primary/20">
              Download Detailed Audit
            </button>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-primary/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">show_chart</span>
              <h3 className="text-lg font-bold">Transaction Vol.</h3>
            </div>
            <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">+12.4%</span>
          </div>
          <div className="flex-1 flex items-end gap-2 pb-2">
            <div className="w-full bg-primary/10 rounded-t-lg h-[40%]"></div>
            <div className="w-full bg-primary/10 rounded-t-lg h-[65%]"></div>
            <div className="w-full bg-primary/20 rounded-t-lg h-[50%]"></div>
            <div className="w-full bg-primary/30 rounded-t-lg h-[85%]"></div>
            <div className="w-full bg-primary/20 rounded-t-lg h-[60%]"></div>
            <div className="w-full bg-primary rounded-t-lg h-[95%]"></div>
            <div className="w-full bg-primary/10 rounded-t-lg h-[45%]"></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-primary/5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary">schedule</span>
            <h3 className="text-lg font-bold">Peak Traffic Times</h3>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Morning (08:00 - 12:00)</span>
                <span className="text-primary">82%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div className="relative">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Afternoon (13:00 - 17:00)</span>
                <span className="text-primary">94%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            <div className="relative">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Evening (18:00 - 22:00)</span>
                <span className="text-primary">45%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="mt-6 p-3 bg-primary/5 rounded-xl">
              <p className="text-[11px] leading-relaxed italic text-slate-600">
                <span className="font-bold text-primary">Insight:</span> Highest system load detected at 14:30 daily. Recommend scheduling maintenance after 23:00.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <h3 className="text-lg font-bold">System Audit Logs</h3>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
            <input className="bg-transparent border-none text-xs focus:ring-0 p-0 w-48" placeholder="Search by user or IP..." type="text" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { time: 'Oct 24, 2023 - 14:22:05', user: 'j.smith@shell4.io', action: 'Database Export', ip: '192.168.1.45', status: 'Success' },
                { time: 'Oct 24, 2023 - 13:45:12', user: 'root_admin', action: 'Config Modified', ip: '10.0.4.122', status: 'Success' },
                { time: 'Oct 24, 2023 - 11:10:00', user: 'l.chen@shell4.io', action: 'Login Attempt', ip: '45.22.19.8', status: 'Failed' },
                { time: 'Oct 24, 2023 - 09:30:44', user: 'system_daemon', action: 'API Key Rotated', ip: 'localhost', status: 'Success' },
                { time: 'Oct 23, 2023 - 23:55:01', user: 'm.garcia@shell4.io', action: 'User Deleted', ip: '192.168.1.12', status: 'Warning' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{log.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-slate-200"></div>
                      <span className="text-sm">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{log.action}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{log.ip}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${log.status === 'Success' ? 'bg-green-500/10 text-green-500' :
                        log.status === 'Failed' ? 'bg-red-500/10 text-red-500' :
                          'bg-orange-500/10 text-orange-500'
                      }`}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Showing 5 of 1,248 entries</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold hover:bg-white">Prev</button>
            <button className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
