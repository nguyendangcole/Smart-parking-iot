import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../shared/supabase';

type Role = 'Undergraduate' | 'Graduate' | 'PhD' | 'Faculty' | 'Staff' | 'Visitor Motorcycle' | 'Visitor Car';
type PlanType = 'monthly' | 'per-entry' | 'handling fee';
type PlanStatus = 'Draft' | 'Active' | 'Inactive' | 'Scheduled';

interface Plan {
  id: string;
  name: string;
  role: Role;
  type: PlanType;
  price: number;
  isExemption: boolean;
  status: PlanStatus;
  effectiveFrom: string;
  effectiveTo: string;
  version: number;
  parentPolicyId?: string;
  color: string;
  activeUsers: number; // For demo purpose only since this requires transaction data
}

// Maps JS friendly Role to Database Enum
const mapRoleToDB = (role: Role) => {
  return role.toLowerCase().replace(' ', '_');
};

const mapDBToRole = (dbRole: string): Role => {
  const map: Record<string, Role> = {
    'undergraduate': 'Undergraduate',
    'graduate': 'Graduate',
    'phd': 'PhD',
    'faculty': 'Faculty',
    'staff': 'Staff',
    'visitor_motorcycle': 'Visitor Motorcycle',
    'visitor_car': 'Visitor Car',
  };
  return map[dbRole] || 'Visitor Car';
};

const mapTypeToDB = (type: PlanType) => type.replace('-', '_');
const mapDBToType = (dbType: string): PlanType => dbType.replace('_', '-') as PlanType;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'clone'>('create');
  const [showHistory, setShowHistory] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDynamicPeakActive, setIsDynamicPeakActive] = useState(false);

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'Undergraduate':
      case 'Graduate':
      case 'PhD': return 'blue';
      case 'Faculty':
      case 'Staff': return 'purple';
      case 'Visitor Motorcycle':
      case 'Visitor Car': return 'slate';
      default: return 'slate';
    }
  };

  const fetchPolicies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('pricing_policies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching policies', error);
      // Fallback dummy data format if DB isn't seeded correctly
      if (plans.length === 0) {
        setPlans([{ id: '1', name: 'Student Monthly', role: 'Undergraduate', type: 'monthly', price: 15.0, isExemption: false, status: 'Active', effectiveFrom: '2024-01-01', effectiveTo: '2025-01-01', version: 1, color: 'blue', activeUsers: 8201 }]);
      }
    } else if (data) {
      const fetchedPlans: Plan[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        role: mapDBToRole(d.role),
        type: mapDBToType(d.type),
        price: Number(d.price),
        isExemption: d.is_exemption,
        status: capitalize(d.status) as PlanStatus,
        effectiveFrom: d.effective_from ? new Date(d.effective_from).toISOString().split('T')[0] : '',
        effectiveTo: d.effective_to ? new Date(d.effective_to).toISOString().split('T')[0] : '',
        version: d.version || 1,
        parentPolicyId: d.parent_policy_id,
        color: getRoleColor(mapDBToRole(d.role)),
        activeUsers: d.status === 'active' ? Math.floor(Math.random() * 5000) : 0, // Mock users stats
      }));
      setPlans(fetchedPlans);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const { totalActiveSubscriptions, mostPopularPlan, avgRevenue } = useMemo(() => {
    let activeSubs = 0;
    let revenue = 0;
    let popularPlan = plans[0];

    plans.forEach(p => {
      if (p.activeUsers > (popularPlan?.activeUsers || 0)) {
        popularPlan = p;
      }
      if (p.type === 'monthly' && p.status === 'Active') {
        activeSubs += p.activeUsers;
        revenue += (p.price * p.activeUsers);
      }
    });

    return {
      totalActiveSubscriptions: activeSubs,
      mostPopularPlan: popularPlan,
      avgRevenue: activeSubs > 0 ? (revenue / activeSubs) : 0
    };
  }, [plans]);

  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: '',
    role: 'Undergraduate',
    type: 'monthly',
    price: 0,
    isExemption: false,
    status: 'Draft',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    activeUsers: 0,
  });

  const handleCreatePlan = async () => {
    if (!newPlan.name || newPlan.price === undefined || newPlan.price < 0) {
      setErrorText('Name is required and price must be >= 0.');
      return;
    }
    if (newPlan.effectiveTo && newPlan.effectiveFrom! > newPlan.effectiveTo) {
      setErrorText('Effective From must be before Effective To.');
      return;
    }

    const dbPayload = {
      name: newPlan.name,
      role: mapRoleToDB(newPlan.role as Role),
      type: mapTypeToDB(newPlan.type as PlanType),
      price: newPlan.price,
      is_exemption: newPlan.isExemption,
      status: (newPlan.status || 'Draft').toLowerCase(),
      effective_from: new Date(newPlan.effectiveFrom!).toISOString(),
      effective_to: newPlan.effectiveTo ? new Date(newPlan.effectiveTo).toISOString() : null,
      version: modalMode === 'clone' ? ((newPlan.version || 1) + 1) : 1,
      parent_policy_id: modalMode === 'clone' ? newPlan.parentPolicyId : null,
    };

    const { error } = await supabase.from('pricing_policies').insert([dbPayload]);
    if (error) {
      setErrorText(error.message);
      return;
    }

    // Refresh policies
    fetchPolicies();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setErrorText('');
    setModalMode('create');
    setNewPlan({
      name: '',
      role: 'Undergraduate',
      type: 'monthly',
      price: 0,
      isExemption: false,
      status: 'Draft',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      activeUsers: 0,
    });
  };

  const deleteOrDeactivatePlan = async (id: string, status: PlanStatus) => {
    if (status === 'Draft') {
      const { error } = await supabase.from('pricing_policies').delete().eq('id', id);
      if (!error) fetchPolicies();
    } else {
      const { error } = await supabase.from('pricing_policies').update({ status: 'inactive' }).eq('id', id);
      if (!error) fetchPolicies();
    }
  };

  const toggleStatus = async (plan: Plan) => {
    const newStatus = plan.status === 'Active' ? 'inactive' : 'active';
    const { error } = await supabase.from('pricing_policies').update({ status: newStatus }).eq('id', plan.id);
    if (!error) {
      fetchPolicies();
    } else {
      alert('Error toggling policy: ' + error.message);
    }
  };

  const clonePlan = (plan: Plan) => {
    setNewPlan({
      ...plan,
      name: `${plan.name} (Clone)`,
      status: 'Draft',
      parentPolicyId: plan.id,
      version: plan.version,
    });
    setModalMode('clone');
    setIsModalOpen(true);
  };

  const displayedPlans = showHistory ? plans : plans.filter(p => p.status !== 'Inactive');

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pricing & Policies</h1>
          <p className="text-slate-500 mt-1">Configure your role-based pricing and dynamic rate rules.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">add</span>
          Create New Policy
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Most Popular Plan</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">trending_up</span>
          </div>
          <h3 className="text-2xl font-bold">{mostPopularPlan?.name || 'N/A'}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-green-600 text-sm font-bold flex items-center"><span className="material-symbols-outlined text-sm">group</span> {mostPopularPlan?.activeUsers?.toLocaleString() || 0} users</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Active Subscriptions</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">group</span>
          </div>
          <h3 className="text-2xl font-bold">{totalActiveSubscriptions.toLocaleString()}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-green-600 text-sm font-bold flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span> active only</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 font-medium text-sm">Avg. Revenue / User</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">payments</span>
          </div>
          <h3 className="text-2xl font-bold">${avgRevenue.toFixed(2)}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-slate-500 text-sm font-bold flex items-center">per monthly sub</span>
          </div>
        </div>
      </div>

      {/* Dynamic Pricing Banner */}
      <div className={`border p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${isDynamicPeakActive ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full text-white transition-colors ${isDynamicPeakActive ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-slate-300'}`}>
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div>
            <h4 className="font-bold text-lg">Dynamic Peak Pricing</h4>
            <p className="text-sm text-slate-600">Automatically adjust Visitor Hourly rates during high-occupancy hours (10:00 AM - 4:00 PM).</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${!isDynamicPeakActive ? 'text-slate-700' : 'text-slate-400'}`}>Inactive</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDynamicPeakActive}
              onChange={() => setIsDynamicPeakActive(!isDynamicPeakActive)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span className={`text-sm font-bold ${isDynamicPeakActive ? 'text-primary' : 'text-slate-400'}`}>Active</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-bold text-lg">Current Policies</h3>
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-slate-600 mr-4 cursor-pointer">
              <input type="checkbox" checked={showHistory} onChange={(e) => setShowHistory(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
              Show Inactive History
            </label>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Filter</button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Policy Name</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Type / Rate</th>
                <th className="px-6 py-4 font-semibold">Effective Period</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPlans.map((plan) => (
                <tr key={plan.id} className={`hover:bg-slate-50/50 transition-colors ${plan.status === 'Inactive' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold">{plan.name}</div>
                    <div className="text-xs text-slate-400">v{plan.version} {plan.isExemption && '• Exemption'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${plan.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        plan.color === 'green' ? 'bg-green-100 text-green-600' :
                          'bg-slate-100 text-slate-600'
                      }`}>{plan.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">${plan.price.toFixed(2)}</div>
                    <div className="text-xs text-slate-500 capitalize">{plan.type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div>{plan.effectiveFrom}</div>
                    <div className="text-slate-400">to {plan.effectiveTo || '∞'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'Active' ? 'bg-green-100 text-green-800' :
                      plan.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' :
                        plan.status === 'Draft' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => toggleStatus(plan)} title={plan.status === 'Active' ? 'Deactivate' : 'Activate'} className="p-2 text-slate-400 hover:text-green-600 transition-colors">
                      <span className="material-symbols-outlined text-xl">{plan.status === 'Active' ? 'block' : 'check_circle'}</span>
                    </button>
                    <button onClick={() => clonePlan(plan)} title="Clone Policy" className="p-2 text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">content_copy</span>
                    </button>
                    <button
                      onClick={() => deleteOrDeactivatePlan(plan.id, plan.status)}
                      title={plan.status === 'Draft' ? 'Delete Draft' : 'Deactivate Policy'}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {displayedPlans.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No policies found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Clone Plan Modal */}
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
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
            >
              <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{modalMode === 'clone' ? 'Clone & Update Policy' : 'Create New Policy'}</h3>
                  <p className="text-slate-500 mt-1 text-sm">Define pricing rules and validation conditions.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                {errorText && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {errorText}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Name</label>
                      <input
                        type="text"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        placeholder="e.g. VIP Yearly"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applicable Role</label>
                      <select
                        value={newPlan.role}
                        onChange={(e) => setNewPlan({ ...newPlan, role: e.target.value as Role })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      >
                        <option value="Undergraduate">Undergraduate</option>
                        <option value="Graduate">Graduate</option>
                        <option value="PhD">PhD</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff</option>
                        <option value="Visitor Motorcycle">Visitor Motorcycle</option>
                        <option value="Visitor Car">Visitor Car</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Type</label>
                        <select
                          value={newPlan.type}
                          onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value as PlanType })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="per-entry">Per-entry</option>
                          <option value="handling fee">Handling Fee</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newPlan.price}
                          onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Dates</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase">From</label>
                          <input
                            type="date"
                            value={newPlan.effectiveFrom}
                            onChange={(e) => setNewPlan({ ...newPlan, effectiveFrom: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase">To (Optional)</label>
                          <input
                            type="date"
                            value={newPlan.effectiveTo}
                            onChange={(e) => setNewPlan({ ...newPlan, effectiveTo: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                      <select
                        value={newPlan.status}
                        onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value as PlanStatus })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      >
                        <option value="Draft">Draft (Preview)</option>
                        <option value="Scheduled">Scheduled (Future)</option>
                        <option value="Active">Active (Publish)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={newPlan.isExemption}
                        onChange={(e) => setNewPlan({ ...newPlan, isExemption: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-700">Special Exemption</p>
                        <p className="text-xs text-slate-500">Flag this policy as a special case (e.g., Faculty Free, Discounts).</p>
                      </div>
                    </label>

                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 p-6 border-t border-slate-100 flex gap-4 mt-auto">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">{modalMode === 'clone' ? 'save_as' : 'add'}</span>
                  {modalMode === 'clone' ? 'Save Cloned Policy' : 'Create Policy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

