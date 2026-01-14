
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ExpenseReport, ClaimItem, ExpenseCategory, User, Attachment, ClaimStatus, ApproverMatrix, UserRole } from '../types';
import { CURRENCIES } from '../constants';

interface Props {
  categories: ExpenseCategory[];
  userList: User[];
  onSubmit: (report: ExpenseReport) => void;
  currentUser: User;
  initialData?: ExpenseReport | null;
  matrix: ApproverMatrix[];
}

const ClaimForm: React.FC<Props> = ({ categories, userList, onSubmit, currentUser, initialData, matrix }) => {
  const [step, setStep] = useState(1);
  const [reportTitle, setReportTitle] = useState(`${currentUser.name}'s Expense Report - ${new Date().toLocaleDateString()}`);
  const [items, setItems] = useState<ClaimItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [claimCurrency, setClaimCurrency] = useState('USD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: categories[0]?.id || '',
    description: '',
    baseAmount: 0,
    taxAmount: 0,
    expenseCurrency: 'USD',
    exchangeRate: 1.0,
  });

  useEffect(() => {
    if (initialData) {
      setReportTitle(initialData.title);
      setItems(initialData.items);
      setAttachments(initialData.attachments);
      setSelectedApprovers(initialData.approvers);
      setClaimCurrency(initialData.claimCurrency);
    }
  }, [initialData]);

  const totalReportAmount = items.reduce((sum, item) => sum + item.claimAmount, 0);

  // Approval Matrix Enforcement Logic
  const requiredRoles = useMemo(() => {
    const matchingTier = matrix.find(m => 
        m.currency === claimCurrency && 
        totalReportAmount >= m.minAmount && 
        totalReportAmount <= m.maxAmount
    ) || matrix.find(m => totalReportAmount >= m.minAmount && totalReportAmount <= m.maxAmount) // Fallback if no direct currency match
      || matrix[0];
    return matchingTier?.requiredApproverRoles || [];
  }, [totalReportAmount, claimCurrency, matrix]);

  const satisfiesMatrix = useMemo(() => {
    if (requiredRoles.length === 0) return true;
    const selectedUsers = userList.filter(u => selectedApprovers.includes(u.id));
    const selectedRoles = selectedUsers.map(u => u.role);
    return requiredRoles.every(role => selectedRoles.includes(role));
  }, [requiredRoles, selectedApprovers, userList]);

  const handleOpenItemModal = (item?: ClaimItem) => {
    if (item) {
      setEditingItemId(item.id);
      setNewItem({
        date: item.date,
        categoryId: item.categoryId,
        description: item.description,
        baseAmount: item.baseAmount,
        taxAmount: item.taxAmount,
        expenseCurrency: item.expenseCurrency,
        exchangeRate: item.exchangeRate,
      });
    } else {
      setEditingItemId(null);
      setNewItem({
        date: new Date().toISOString().split('T')[0],
        categoryId: categories[0]?.id || '',
        description: '',
        baseAmount: 0,
        taxAmount: 0,
        expenseCurrency: 'USD',
        exchangeRate: 1.0,
      });
    }
    setIsAddingItem(true);
  };

  const handleSaveItem = () => {
    const claimAmount = (Number(newItem.baseAmount) + Number(newItem.taxAmount)) * Number(newItem.exchangeRate);
    if (editingItemId) {
      setItems(items.map(i => i.id === editingItemId ? { ...newItem, id: editingItemId, claimAmount } : i));
    } else {
      const item: ClaimItem = {
        id: `ITM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...newItem,
        claimAmount
      };
      setItems([...items, item]);
    }
    setIsAddingItem(false);
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [...prev, {
          id: `ATT-${Date.now()}-${file.name}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: event.target?.result as string,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const submitReport = () => {
    if (items.length === 0) return alert("Please add at least one expense item.");
    if (!satisfiesMatrix) return alert(`Incomplete Selection: Matrix requires ${requiredRoles.join(' & ')} sign-off for this amount.`);

    const report: ExpenseReport = {
      id: initialData?.id || '', 
      userId: currentUser.id,
      userName: currentUser.name,
      title: reportTitle,
      items,
      totalClaimAmount: totalReportAmount,
      claimCurrency,
      attachments,
      approvers: selectedApprovers,
      approvedBy: [], 
      status: ClaimStatus.PENDING,
      createdAt: initialData?.createdAt || Date.now(),
      signatureLog: initialData?.signatureLog || []
    };
    onSubmit(report);
  };

  if (step === 1) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-[#1D1D1F] tracking-tight mb-3">
                {initialData ? 'Edit Expense Report' : 'Create Expense Report'}
            </h1>
            <input 
              className="text-2xl font-semibold text-blue-600 bg-transparent border-b-2 border-transparent hover:border-blue-100 focus:border-blue-500 focus:outline-none w-full max-w-xl transition-all"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={claimCurrency}
              onChange={(e) => setClaimCurrency(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-[#E5E5E7] bg-white font-bold text-sm shadow-sm"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>Claim in {c}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-10 border border-[#E5E5E7] shadow-sm mb-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-[#1D1D1F]">Line Items</h2>
            <button 
              onClick={() => handleOpenItemModal()}
              className="bg-[#1D1D1F] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg active:scale-95"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-[#F5F5F7] rounded-3xl">
                <p className="text-[#86868B] font-medium italic">No items added to this report yet.</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="group flex items-center justify-between p-6 bg-[#F5F5F7] rounded-3xl border border-transparent hover:border-blue-200 transition-all">
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Date & ID</div>
                      <div className="font-bold text-[#1D1D1F] text-sm">{item.date}</div>
                      <div className="text-[11px] font-mono text-blue-500 truncate w-24 block">{item.id}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Description</div>
                      <div className="font-semibold text-[#1D1D1F] text-sm truncate pr-4">{item.description}</div>
                      <div className="text-[11px] text-[#86868B]">{categories.find(c => c.id === item.categoryId)?.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Original Expense</div>
                      <div className="font-bold text-[#1D1D1F] text-sm">{item.expenseCurrency} {(item.baseAmount + item.taxAmount).toLocaleString()}</div>
                      <div className="text-[11px] text-[#86868B]">Rate: {item.exchangeRate}</div>
                    </div>
                    <div className="text-right pr-4">
                      <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Claim ({claimCurrency})</div>
                      <div className="font-extrabold text-[#1D1D1F] text-lg">{item.claimAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenItemModal(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-10 pt-10 border-t border-[#E5E5E7] flex justify-between items-end">
               <div>
                <label className="block text-sm font-bold text-[#86868B] uppercase tracking-widest mb-4">Receipts & Docs</label>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-2xl border-2 border-dashed border-[#E5E5E7] flex items-center justify-center text-[#86868B] hover:border-blue-500 hover:text-blue-500 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  </button>
                  {attachments.map(att => (
                    <div key={att.id} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-100">
                      <span className="truncate max-w-[120px]">{att.name}</span>
                      <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}>×</button>
                    </div>
                  ))}
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                </div>
               </div>
               <div className="text-right">
                <div className="text-sm font-bold text-[#86868B] uppercase tracking-widest mb-1">Grand Total ({claimCurrency})</div>
                <div className="text-5xl font-black text-[#1D1D1F]">{totalReportAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
               </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button 
            disabled={items.length === 0}
            onClick={() => setStep(2)}
            className={`px-10 py-5 rounded-3xl font-bold transition-all shadow-xl ${
              items.length > 0 ? 'bg-[#1D1D1F] text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Review Workflow →
          </button>
        </div>

        {isAddingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <h3 className="text-2xl font-bold mb-8">{editingItemId ? 'Edit Item' : 'Add Expense Line Item'}</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Description</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-blue-500 transition-all font-medium"
                    placeholder="Lunch with client, Taxi fare, etc."
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent"
                    value={newItem.date}
                    onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Category</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent appearance-none"
                    value={newItem.categoryId}
                    onChange={(e) => setNewItem({...newItem, categoryId: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Base Amount</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7]"
                    value={newItem.baseAmount}
                    onChange={(e) => setNewItem({...newItem, baseAmount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Tax Amount</label>
                  <input 
                    type="number" 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7]"
                    value={newItem.taxAmount}
                    onChange={(e) => setNewItem({...newItem, taxAmount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Currency</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7]"
                    value={newItem.expenseCurrency}
                    onChange={(e) => setNewItem({...newItem, expenseCurrency: e.target.value})}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Exchange Rate (vs {claimCurrency})</label>
                  <input 
                    type="number" step="0.0001"
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7]"
                    value={newItem.exchangeRate}
                    onChange={(e) => setNewItem({...newItem, exchangeRate: parseFloat(e.target.value) || 1})}
                  />
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button onClick={() => setIsAddingItem(false)} className="flex-1 py-4 rounded-2xl border border-[#E5E5E7] font-bold text-[#1D1D1F] hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSaveItem} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all">
                  {editingItemId ? 'Update Item' : 'Add Line Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1D1D1F] tracking-tight mb-3">Workflow Routing</h1>
          <p className="text-[#86868B] font-medium">Select approvers for {claimCurrency} {totalReportAmount.toLocaleString()}.</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-200">
            <span className="text-[10px] font-black uppercase text-orange-700 block mb-2 tracking-widest">Matrix Requirements</span>
            <div className="text-sm font-bold text-orange-900">Sign-off required by: {requiredRoles.join(' & ')}</div>
            {!satisfiesMatrix && <div className="text-[10px] text-red-500 font-bold mt-2 uppercase">Please select users with the required roles.</div>}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-[#E5E5E7] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userList.filter(u => u.id !== currentUser.id && u.role !== 'Admin').map(user => (
            <div 
              key={user.id}
              onClick={() => {
                setSelectedApprovers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]);
              }}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                selectedApprovers.includes(user.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-[#F5F5F7] hover:border-blue-200'
              }`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5E7] flex items-center justify-center overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="av" />
                </div>
                <div>
                  <div className="font-bold text-[#1D1D1F]">{user.name}</div>
                  <div className="text-xs text-[#86868B] font-semibold">{user.role} • {user.email}</div>
                </div>
              </div>
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedApprovers.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-[#E5E5E7]'
              }`}>
                {selectedApprovers.includes(user.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-between">
        <button onClick={() => setStep(1)} className="px-10 py-5 bg-white border border-[#E5E5E7] text-[#1D1D1F] rounded-3xl font-bold hover:bg-gray-50 transition-all">← Edit Items</button>
        <button 
          onClick={submitReport} 
          className={`px-10 py-5 rounded-3xl font-bold transition-all shadow-xl shadow-blue-100 ${
            satisfiesMatrix ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Submit for Approval
        </button>
      </div>
    </div>
  );
};

export default ClaimForm;
