import React from 'react';

export const Pricing: React.FC = () => {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pricing Plans</h1>
          <p className="text-slate-500 mt-1">Configure your subscription tiers and dynamic rate rules.</p>
        </div>
        <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Most Popular Plan</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">trending_up</span>
          </div>
          <h3 className="text-2xl font-bold">Student Monthly</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-green-600 text-sm font-bold flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span> 8.4%</span>
            <span className="text-slate-400 text-xs">vs last month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Active Subscriptions</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">group</span>
          </div>
          <h3 className="text-2xl font-bold">14,829</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-green-600 text-sm font-bold flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span> 12.1%</span>
            <span className="text-slate-400 text-xs">vs last month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Avg. Revenue / User</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">payments</span>
          </div>
          <h3 className="text-2xl font-bold">$42.50</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-red-600 text-sm font-bold flex items-center"><span className="material-symbols-outlined text-sm">arrow_downward</span> 1.2%</span>
            <span className="text-slate-400 text-xs">vs last month</span>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary p-3 rounded-full text-white">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div>
            <h4 className="font-bold text-lg">Dynamic Peak Pricing</h4>
            <p className="text-sm text-slate-600">Automatically adjust Visitor Hourly rates during high-occupancy hours (10:00 AM - 4:00 PM).</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500">Inactive</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input defaultChecked className="sr-only peer" type="checkbox" />
            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span className="text-sm font-bold text-primary">Active</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-lg">Current Tiers</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Filter</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Plan Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Base Rate</th>
                <th className="px-6 py-4 font-semibold">Access Level</th>
                <th className="px-6 py-4 font-semibold">Active Users</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Student Monthly', type: 'Subscription', rate: '$15.00/mo', level: 'Standard', users: '4,201', status: 'Published', color: 'blue' },
                { name: 'Staff Monthly', type: 'Subscription', rate: '$30.00/mo', level: 'Premium', users: '8,542', status: 'Published', color: 'purple' },
                { name: 'Visitor Hourly', type: 'Pay-as-you-go', rate: '$1.50/hr', level: 'Limited', users: '2,086', status: 'Published', color: 'slate' },
                { name: 'Guest Daily', type: 'One-time', rate: '$10.00', level: 'Visitor', users: '0', status: 'Draft', color: 'slate' },
              ].map((plan, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-bold">{plan.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{plan.type}</td>
                  <td className="px-6 py-4 font-medium">{plan.rate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                          'bg-slate-100 text-slate-600'
                      }`}>{plan.level}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{plan.users}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>{plan.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-xl">edit</span></button>
                    <button className="p-2 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-xl">delete</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
