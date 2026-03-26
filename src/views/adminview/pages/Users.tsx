import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../shared/supabase';

type UserRole = 'student' | 'graduate' | 'doctoral' | 'faculty' | 'staff' | 'visitor' | 'operator' | 'admin';
type UserStatus = 'active' | 'inactive' | 'blocked' | 'suspended';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  status: UserStatus;
  reserved_slot_eligible: boolean;
  exempt_payment: boolean;
  preferred_zone: string | null;
  package_status: string;
  package_expires_at: string | null;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Forms state
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [createForm, setCreateForm] = useState({ email: '', password: '', fullName: '', role: 'student' as UserRole, status: 'active' as UserStatus });
  const [errorText, setErrorText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else if (data) {
      setUsers(data as UserProfile[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      status: user.status || 'active',
      reserved_slot_eligible: user.reserved_slot_eligible || false,
      exempt_payment: user.exempt_payment || false,
      preferred_zone: user.preferred_zone || '',
    });
    setErrorText('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        role: editForm.role,
        status: editForm.status,
        reserved_slot_eligible: editForm.reserved_slot_eligible,
        exempt_payment: editForm.exempt_payment,
        preferred_zone: editForm.preferred_zone || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedUser.id);

    if (error) {
      setErrorText(error.message);
      return;
    }

    fetchUsers();
    setIsEditModalOpen(false);
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.fullName) {
      setErrorText("Email, Password, and Full Name are strictly required.");
      return;
    }
    setErrorText('');
    setIsCreating(true);

    // Call custom postgres function (RPC) to bypass RLS and create directly in auth.users
    const { data, error } = await supabase.rpc('create_user_admin', {
      new_email: createForm.email,
      new_password: createForm.password,
      new_full_name: createForm.fullName,
      new_role: createForm.role,
      new_status: createForm.status
    });

    setIsCreating(false);

    if (error) {
      setErrorText(JSON.stringify(error.message));
      return;
    }

    if (data && data.success === false) {
      setErrorText(data.message);
      return;
    }

    setCreateForm({ email: '', password: '', fullName: '', role: 'student', status: 'active' });
    setIsCreateModalOpen(false);
    fetchUsers();
  };

  const forceRenewPackage = async () => {
    if (!selectedUser) return;

    // Add 30 days to current date or package_expires_at if it's in the future
    const now = new Date();
    const expiresAtDate = selectedUser.package_expires_at ? new Date(selectedUser.package_expires_at) : now;
    const baseDate = expiresAtDate > now ? expiresAtDate : now;
    baseDate.setDate(baseDate.getDate() + 30); // Renew for 30 days

    const { error } = await supabase
      .from('profiles')
      .update({
        package_status: 'Active',
        package_expires_at: baseDate.toISOString(),
        status: 'active'
      })
      .eq('id', selectedUser.id);

    if (error) {
      setErrorText(error.message);
    } else {
      fetchUsers();
      setIsEditModalOpen(false);
      alert('Package manually renewed successfully for ' + selectedUser.email);
    }
  };

  const toggleBlockStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
    if (!error) fetchUsers();
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (user.id.includes(searchTerm))
    );
  }, [users, searchTerm]);

  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (role === 'operator') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (role === 'faculty' || role === 'staff') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const adminsCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Users & Privileges</h2>
          <p className="text-slate-500 mt-1">Manage system access, roles, and administrative permissions synced with DataCore.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchUsers} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:border-primary transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">sync</span> Sync
          </button>
          <button onClick={() => { setErrorText(''); setIsCreateModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person_add</span> Add New User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg">System Active Users</h3>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-600 uppercase">{users.length} Total Synced</span>
              </div>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-64 md:w-80 transition-all font-medium text-slate-700"
                placeholder="Search ID, email or name..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Profile</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Zone</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Package / Privileges</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${user.status === 'blocked' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 w-1/3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border ${user.status === 'blocked' ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-primary/10 text-primary border-primary/20'}`}>
                          {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.full_name || 'Unregistered Name'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase">ID: {user.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        {user.preferred_zone && (
                          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <span className="material-symbols-outlined text-[12px]">location_on</span> {user.preferred_zone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {user.package_status === 'Active' ? (
                          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active till {user.package_expires_at ? new Date(user.package_expires_at).toLocaleDateString() : 'N/A'}
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            No Active Sub
                          </div>
                        )}
                        <div className="flex gap-1 mt-1">
                          {user.exempt_payment && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Exempt</span>}
                          {user.reserved_slot_eligible && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">Reserved Slot</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase border ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          user.status === 'blocked' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors mr-1"
                        title="Edit Privileges"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => toggleBlockStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${user.status === 'blocked' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                        title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                      >
                        <span className="material-symbols-outlined text-lg">{user.status === 'blocked' ? 'lock_open' : 'block'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !isLoading && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found matching query.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
            <span className="material-symbols-outlined text-3xl mb-4 text-white/80">admin_panel_settings</span>
            <h4 className="font-bold text-lg leading-tight">System Administrators</h4>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-black">{adminsCount}</span>
              <span className="text-sm text-white/60 mb-1 font-medium">Active</span>
            </div>
            <p className="text-xs text-white/70 mt-4 leading-relaxed border-t border-white/10 pt-4">Admin accounts have root access to alter policies, manually renew gates and assign operator roles.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Permission Hierarchy</h3>
            <div className="space-y-3">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-rose-500">key</span>
                  <p className="text-sm font-bold text-rose-700">Admin</p>
                </div>
                <p className="text-[10px] text-slate-500 ml-6">Full write access to system, logs, and user assignment.</p>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-amber-500">support_agent</span>
                  <p className="text-sm font-bold text-amber-700">Operator</p>
                </div>
                <p className="text-[10px] text-slate-500 ml-6">Dashboard viewer, can manually open gates and control devices.</p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-blue-500">directions_car</span>
                  <p className="text-sm font-bold text-blue-700">Member</p>
                </div>
                <p className="text-[10px] text-slate-500 ml-6">General users (Staff, Student) bound to active subscription logic.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person_add</span> Create New User
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Instantly provision account via Admin Override</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {errorText && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span> {errorText}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      placeholder="user@hcmut.edu.vn"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temporary Password</label>
                    <input
                      type="password"
                      placeholder="Enter minimum 6 characters..."
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Nguyen Van A"
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Role</label>
                      <select
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="staff">Staff</option>
                        <option value="visitor">Visitor</option>
                        <option value="operator">Operator (Staff)</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Status</label>
                      <select
                        value={createForm.status}
                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as UserStatus })}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-primary hover:brightness-110 text-white shadow-lg shadow-primary/30 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : 'Provision Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                    {selectedUser.full_name ? selectedUser.full_name[0].toUpperCase() : selectedUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-800">{selectedUser.full_name || 'No Name Set'}</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {errorText && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span> {errorText}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="staff">Staff</option>
                        <option value="visitor">Visitor</option>
                        <option value="operator">Operator (Staff)</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                      >
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preferred Zone Assignment</label>
                    <select
                      value={editForm.preferred_zone || ''}
                      onChange={(e) => setEditForm({ ...editForm, preferred_zone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-semibold text-slate-700"
                    >
                      <option value="">No Preference / Open Parking</option>
                      <option value="Khu A">Khu A (Central Area)</option>
                      <option value="Khu B">Khu B (East Wing)</option>
                      <option value="Khu C">Khu C (Underground VIP)</option>
                    </select>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Override Privileges</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5">
                          <input
                            type="checkbox"
                            checked={editForm.reserved_slot_eligible}
                            onChange={(e) => setEditForm({ ...editForm, reserved_slot_eligible: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">Reserved Slot Eligible</p>
                          <p className="text-xs text-slate-500 leading-relaxed">User bypasses "Full Capacity" limits and is eligible to enter VIP/Reserved Zones.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5">
                          <input
                            type="checkbox"
                            checked={editForm.exempt_payment}
                            onChange={(e) => setEditForm({ ...editForm, exempt_payment: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-700 group-hover:text-rose-600 transition-colors">Exempt from Payment</p>
                          <p className="text-xs text-slate-500 leading-relaxed">Exempts user from subscription checks / hourly fees (usually for Faculty or Admin level drops).</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Subscription Control</p>
                      <p className="text-xs text-slate-500 mt-0.5">Force renew active package for exactly 30 days securely from server side.</p>
                    </div>
                    <button
                      onClick={forceRenewPackage}
                      className="shrink-0 px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 shadow-sm"
                    >
                      Force Renew
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
