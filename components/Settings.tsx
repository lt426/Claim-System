
import React, { useState } from 'react';
import { User, ExpenseCategory, ApproverMatrix, UserRole } from '../types';
import { CURRENCIES } from '../constants';

interface Props {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  categories: ExpenseCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  matrix: ApproverMatrix[];
  setMatrix: React.Dispatch<React.SetStateAction<ApproverMatrix[]>>;
}

const Settings: React.FC<Props> = ({ users, setUsers, categories, setCategories, matrix, setMatrix }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'categories' | 'matrix'>('categories');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', glCode: '' });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({ name: '', email: '', role: 'Employee' as UserRole });

  const handleSaveCategory = () => {
    if (newCat.name && newCat.glCode) {
      setCategories([...categories, { id: `c${Date.now()}`, ...newCat }]);
      setNewCat({ name: '', glCode: '' });
      setIsAddingCat(false);
    }
  };

  const handleSaveUser = () => {
    if (userFormData.name && userFormData.email) {
      if (editingUserId) {
        setUsers(users.map(u => u.id === editingUserId ? { ...u, ...userFormData } : u));
      } else {
        setUsers([...users, { id: `u${Date.now()}`, ...userFormData, isActive: true, accessibleModules: ['dashboard', 'new-claim'] }]);
      }
      setIsUserModalOpen(false);
    }
  };

  const toggleModuleAccess = (userId: string, module: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const hasAccess = u.accessibleModules.includes(module);
        return {
          ...u,
          accessibleModules: hasAccess 
            ? u.accessibleModules.filter(m => m !== module)
            : [...u.accessibleModules, module]
        };
      }
      return u;
    }));
  };

  const handleUpdateMatrixTier = (id: string, field: keyof ApproverMatrix, value: any) => {
    setMatrix(matrix.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleToggleRoleInMatrix = (id: string, role: UserRole) => {
    setMatrix(matrix.map(m => {
      if (m.id === id) {
        const hasRole = m.requiredApproverRoles.includes(role);
        return { ...m, requiredApproverRoles: hasRole ? m.requiredApproverRoles.filter(r => r !== role) : [...m.requiredApproverRoles, role] };
      }
      return m;
    }));
  };

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F] mb-3">Enterprise Controls</h1>
        <p className="text-[#86868B] font-medium">Manage system users, financial categories, and approval governance.</p>
      </header>

      <div className="flex bg-[#E5E5E7]/50 p-1.5 rounded-[1.5rem] w-fit mb-10">
        {[{ id: 'categories', label: 'Categories' }, { id: 'users', label: 'Users' }, { id: 'matrix', label: 'Approval Matrix' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`px-8 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${activeSubTab === tab.id ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>{tab.label}</button>
        ))}
      </div>

      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-[#E5E5E7] shadow-sm animate-in fade-in">
          <div className="flex justify-between items-center mb-10"><div><h2 className="text-2xl font-bold">ERP General Ledger Mapping</h2><p className="text-[#86868B] text-sm font-medium">Map expense types to Oracle GL segments.</p></div><button onClick={() => setIsAddingCat(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95">+ New Category</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAddingCat && <div className="p-6 bg-blue-50/50 rounded-3xl border-2 border-dashed border-blue-200 flex flex-col gap-4 animate-in zoom-in-95"><input placeholder="Category Name" className="px-4 py-2 rounded-xl border border-blue-100 font-bold" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} /><input placeholder="GL Code" className="px-4 py-2 rounded-xl border border-blue-100 font-mono font-bold" value={newCat.glCode} onChange={e => setNewCat({...newCat, glCode: e.target.value})} /><div className="flex gap-2"><button onClick={handleSaveCategory} className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold">Save</button><button onClick={() => setIsAddingCat(false)} className="flex-1 border py-2 rounded-xl font-bold">Cancel</button></div></div>}
            {categories.map(cat => <div key={cat.id} className="group flex items-center justify-between p-6 bg-[#F5F5F7] rounded-3xl border border-transparent hover:border-blue-200 transition-all"><div><div className="font-bold text-[#1D1D1F] mb-1">{cat.name}</div><div className="text-[11px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">GL: {cat.glCode}</div></div><button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="p-2 text-red-400 hover:text-red-600 bg-white rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>)}
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-[#E5E5E7] shadow-sm animate-in fade-in">
          <div className="flex justify-between items-center mb-10"><div><h2 className="text-2xl font-bold">System Users</h2><p className="text-[#86868B] text-sm font-medium">Control module visibility and security profiles.</p></div><button onClick={() => { setEditingUserId(null); setUserFormData({ name: '', email: '', role: 'Employee' }); setIsUserModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95">+ Add User</button></div>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className={`p-8 rounded-3xl transition-all ${user.isActive ? 'bg-[#F5F5F7]' : 'bg-gray-50 opacity-60'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-[#E5E5E7] overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="av" /></div>
                    <div>
                        <div className="font-bold lg:text-lg text-[#1D1D1F] flex items-center gap-2">{user.name} <button onClick={() => { setEditingUserId(user.id); setUserFormData({ name: user.name, email: user.email, role: user.role }); setIsUserModalOpen(true); }} className="text-blue-500 p-1 hover:bg-white rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button></div>
                        <div className="text-xs text-[#86868B] font-bold uppercase tracking-wider">{user.role} • {user.email}</div>
                    </div>
                  </div>
                  <button onClick={() => setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.isActive ? 'Active' : 'Deactivated'}</button>
                </div>
                
                <div className="pt-6 border-t border-[#E5E5E7] flex flex-wrap gap-4">
                  {['dashboard', 'new-claim', 'approvals', 'export', 'settings'].map(mod => (
                    <label key={mod} className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => toggleModuleAccess(user.id, mod)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          user.accessibleModules.includes(mod) ? 'bg-blue-600 border-blue-600' : 'border-[#E5E5E7] bg-white group-hover:border-blue-400'
                        }`}
                      >
                        {user.accessibleModules.includes(mod) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        user.accessibleModules.includes(mod) ? 'text-[#1D1D1F]' : 'text-[#86868B]'
                      }`}>
                        {mod.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-[#E5E5E7] shadow-sm animate-in fade-in">
           <div className="flex justify-between items-center mb-10"><div><h2 className="text-2xl font-bold">Approval Governance</h2><p className="text-[#86868B] text-sm font-medium">Define mandatory sign-off roles per amount threshold and currency.</p></div><button onClick={() => setMatrix([...matrix, { id: `m${Date.now()}`, minAmount: 0, maxAmount: 1000, currency: 'USD', requiredApproverRoles: ['Manager'] }])} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all">+ Add Rule Tier</button></div>
          <div className="overflow-hidden rounded-3xl border border-[#E5E5E7]">
            <table className="w-full text-left">
              <thead><tr className="bg-[#F5F5F7] text-[10px] font-bold text-[#86868B] uppercase tracking-widest"><th className="px-8 py-5">Min - Max Range</th><th className="px-8 py-5">Currency</th><th className="px-8 py-5">Required Steps</th><th className="px-8 py-5 text-right">Delete</th></tr></thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {matrix.map(m => (
                  <tr key={m.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="px-8 py-5 flex items-center gap-2">
                      <input type="number" className="w-24 bg-transparent border-b border-transparent focus:border-blue-400 font-bold" value={m.minAmount} onChange={e => handleUpdateMatrixTier(m.id, 'minAmount', parseFloat(e.target.value) || 0)} />
                      <span className="text-gray-400 font-black">→</span>
                      <input type="text" className="w-24 bg-transparent border-b border-transparent focus:border-blue-400 font-bold" value={m.maxAmount === Infinity ? 'Inf' : m.maxAmount} onChange={e => handleUpdateMatrixTier(m.id, 'maxAmount', e.target.value === 'Inf' ? Infinity : parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="px-8 py-5">
                        <select className="bg-transparent font-bold focus:outline-none appearance-none cursor-pointer text-blue-600 underline" value={m.currency} onChange={e => handleUpdateMatrixTier(m.id, 'currency', e.target.value)}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2">
                        {['Manager', 'Finance'].map(role => (
                          <button key={role} onClick={() => handleToggleRoleInMatrix(m.id, role as UserRole)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${m.requiredApproverRoles.includes(role as UserRole) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-blue-200'}`}>{role}</button>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right"><button onClick={() => setMatrix(matrix.filter(item => item.id !== m.id))} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-bold mb-8">{editingUserId ? 'Edit Profile' : 'New System User'}</h3>
            <div className="space-y-6">
              <div><label className="block text-xs font-bold text-[#86868B] mb-2 uppercase tracking-widest">Name</label><input type="text" className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] font-bold" value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-[#86868B] mb-2 uppercase tracking-widest">Email</label><input type="email" className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] font-bold" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-[#86868B] mb-2 uppercase tracking-widest">Role</label><select className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] font-bold" value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value as UserRole})}><option value="Employee">Employee</option><option value="Manager">Manager</option><option value="Finance">Finance</option><option value="Admin">Admin</option></select></div>
            </div>
            <div className="mt-10 flex gap-4"><button onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 border rounded-2xl font-bold hover:bg-gray-50">Cancel</button><button onClick={handleSaveUser} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
