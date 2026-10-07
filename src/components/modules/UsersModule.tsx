import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, X, User } from 'lucide-react';
import { SystemUser, CompanyRecord } from '../../types';
import { StorageService } from '../../utils/storage';

interface Props {
  companies: CompanyRecord[];
  theme: 'dark' | 'light';
}

export const UsersModule: React.FC<Props> = ({ companies, theme }) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

  useEffect(() => {
    const load = () => setUsers(StorageService.getUsers());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const openAdd = () => {
    setCurrentUser({
      srNo: users.length + 1,
      userId: '',
      password: '',
      userName: '',
      mobile: '',
      email: '',
      role: 'Supervisor',
      department: 'Operations',
      accessLevel: 'Partial Access',
      assignedPlant: companies[0]?.plant || 'All Plants',
      status: 'Active',
      remark: 'Active user',
    });
    setModalOpen(true);
  };

  const openEdit = (user: SystemUser) => {
    setCurrentUser({ ...user });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!currentUser || !currentUser.userId.trim() || !currentUser.userName.trim()) {
      alert('User ID and User Name are required!');
      return;
    }
    StorageService.saveOrUpdateUser(currentUser);
    setModalOpen(false);
    setCurrentUser(null);
  };

  const handleDelete = (userId: string) => {
    if (userId.toLowerCase() === 'admin') {
      alert('Cannot delete the root System Administrator!');
      return;
    }
    if (confirm(`Delete user account ${userId}?`)) {
      StorageService.deleteUser(userId);
    }
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500] shadow-2xs';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span>System Users & Role-Based Access</span>
        </h3>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-xs shadow-md cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <table className="w-full min-w-[1000px] text-xs text-left">
          <thead className="bg-[#1A365D] text-white font-bold uppercase text-[11px]">
            <tr>
              <th className="p-2.5 text-center w-12">Sr</th>
              <th className="p-2.5 w-28">User ID</th>
              <th className="p-2.5 w-44">User Name</th>
              <th className="p-2.5 w-28">Mobile</th>
              <th className="p-2.5 w-28">Role</th>
              <th className="p-2.5 w-28">Access Level</th>
              <th className="p-2.5 w-36">Assigned Plant</th>
              <th className="p-2.5 text-center w-20">Status</th>
              <th className="p-2.5 w-28">Last Login</th>
              <th className="p-2.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
            {users.map((u, i) => (
              <tr key={i} className={isDark ? 'hover:bg-slate-800/40 transition-colors' : 'hover:bg-amber-50/50 transition-colors'}>
                <td className={`p-2.5 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{i + 1}</td>
                <td className="p-2.5 font-mono font-bold text-[#FF8500]">{u.userId}</td>
                <td className={`p-2.5 font-bold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.userName}</td>
                <td className="p-2.5 font-mono">{u.mobile}</td>
                <td className="p-2.5 text-sky-500 font-semibold">{u.role}</td>
                <td className={`p-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{u.accessLevel}</td>
                <td className={`p-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{u.assignedPlant}</td>
                <td className="p-2.5 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status.toLowerCase() === 'active'
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className={`p-2.5 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{u.lastLogin || 'Today'}</td>
                <td className="p-2.5 text-center space-x-1">
                  <button
                    onClick={() => openEdit(u)}
                    className={`p-1.5 rounded transition-colors text-amber-500 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'}`}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {u.userId.toLowerCase() !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.userId)}
                      className={`p-1.5 rounded transition-colors text-rose-500 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-rose-50'}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {modalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl text-xs transition-colors ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{currentUser.rowIndex ? 'Edit System User' : 'Create System User'}</span>
              </h4>
              <button onClick={() => setModalOpen(false)} className={`p-1 rounded cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={`block mb-1 ${labelClass}`}>User ID *</label>
                <input
                  type="text"
                  value={currentUser.userId}
                  onChange={(e) => setCurrentUser({ ...currentUser, userId: e.target.value })}
                  placeholder="e.g. 1002"
                  className={`w-full p-2 border rounded-lg font-mono ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Password *</label>
                <input
                  type="password"
                  value={currentUser.password || ''}
                  onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  placeholder="Enter password"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block mb-1 ${labelClass}`}>Full Name *</label>
                <input
                  type="text"
                  value={currentUser.userName}
                  onChange={(e) => setCurrentUser({ ...currentUser, userName: e.target.value })}
                  placeholder="e.g. Rahul Sambhaji More"
                  className={`w-full p-2 border rounded-lg font-bold capitalize ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Mobile (10 Digits)</label>
                <input
                  type="text"
                  maxLength={10}
                  value={currentUser.mobile}
                  onChange={(e) => setCurrentUser({ ...currentUser, mobile: e.target.value.replace(/\D/g, '') })}
                  className={`w-full p-2 border rounded-lg font-mono ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Email ID</label>
                <input
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Role</label>
                <select
                  value={currentUser.role}
                  onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="HR">HR</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Access Level</label>
                <select
                  value={currentUser.accessLevel}
                  onChange={(e) => setCurrentUser({ ...currentUser, accessLevel: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                >
                  <option value="Full Access">Full Access</option>
                  <option value="Supervisor Access">Supervisor Access</option>
                  <option value="Read Only">Read Only</option>
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Assigned Plant</label>
                <input
                  type="text"
                  value={currentUser.assignedPlant}
                  onChange={(e) => setCurrentUser({ ...currentUser, assignedPlant: e.target.value })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Account Status</label>
                <select
                  value={currentUser.status}
                  onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value as any })}
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className={`flex justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                onClick={() => setModalOpen(false)}
                className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold cursor-pointer transition-colors"
              >
                Save User Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
