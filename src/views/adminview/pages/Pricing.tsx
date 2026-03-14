import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Plan {
  id: string;
  name: string;
  type: 'Subscription' | 'Pay-as-you-go' | 'One-time';
  rate: string;
  level: 'Standard' | 'Premium' | 'Limited' | 'Visitor';
  users: string;
  status: 'Published' | 'Draft';
  color: string;
}

export const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([
    { id: '1', name: 'Student Monthly', type: 'Subscription', rate: '$15.00/mo', level: 'Standard', users: '4,201', status: 'Published', color: 'blue' },
    { id: '2', name: 'Staff Monthly', type: 'Subscription', rate: '$30.00/mo', level: 'Premium', users: '8,542', status: 'Published', color: 'purple' },
    { id: '3', name: 'Visitor Hourly', type: 'Pay-as-you-go', rate: '$1.50/hr', level: 'Limited', users: '2,086', status: 'Published', color: 'slate' },
    { id: '4', name: 'Guest Daily', type: 'One-time', rate: '$10.00', level: 'Visitor', users: '0', status: 'Draft', color: 'slate' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: '',
    type: 'Subscription',
    rate: '',
    level: 'Standard',
    status: 'Draft',
  });

  const handleCreatePlan = () => {
    if (!newPlan.name || !newPlan.rate) return;

    const formattedRate = newPlan.rate?.includes('$') ? newPlan.rate : `$${newPlan.rate}`;
    const rateSuffix = newPlan.type === 'Subscription' ? '/mo' : newPlan.type === 'Pay-as-you-go' ? '/hr' : '';

    const plan: Plan = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlan.name!,
      type: newPlan.type as any,
      rate: `${formattedRate}${rateSuffix}`,
      level: newPlan.level as any,
      users: '0',
      status: newPlan.status as any,
      color: newPlan.level === 'Premium' ? 'purple' : newPlan.level === 'Standard' ? 'blue' : 'slate',
    };

    setPlans([...plans, plan]);
    setIsModalOpen(false);
    setNewPlan({
      name: '',
      type: 'Subscription',
      rate: '',
      level: 'Standard',
      status: 'Draft',
    });
  };

  const deletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pricing Plans</h1>
          <p className="text-slate-500 mt-1">Configure your subscription tiers and dynamic rate rules.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">add</span>
          Create New Plan
        </button>
      </div>

      {/* Stats Section */}
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

      {/* Dynamic Pricing Banner */}
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

      {/* Table Section */}
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
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
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
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Plan Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight">Create New Plan</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
                <p className="text-slate-500 mt-1">Define the parameters for your new pricing tier.</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Name</label>
                  <input
                    type="text"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    placeholder="e.g. VIP Yearly"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Type</label>
                    <select
                      value={newPlan.type}
                      onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="Subscription">Subscription</option>
                      <option value="Pay-as-you-go">Pay-as-you-go</option>
                      <option value="One-time">One-time</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Rate</label>
                    <input
                      type="text"
                      value={newPlan.rate}
                      onChange={(e) => setNewPlan({ ...newPlan, rate: e.target.value })}
                      placeholder="$0.00"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Level</label>
                    <select
                      value={newPlan.level}
                      onChange={(e) => setNewPlan({ ...newPlan, level: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Limited">Limited</option>
                      <option value="Visitor">Visitor</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Status</label>
                    <select
                      value={newPlan.status}
                      onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="Draft">Draft (Hidden)</option>
                      <option value="Published">Published (Public)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  Create Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
