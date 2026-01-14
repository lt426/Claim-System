
import React, { useState, useEffect } from 'react';
import { User, ExpenseReport, ExpenseCategory, ApproverMatrix, ClaimStatus, Signature } from './types';
import { DEFAULT_USERS, DEFAULT_CATEGORIES, INITIAL_APPROVER_MATRIX } from './constants';
import Dashboard from './components/Dashboard';
import ClaimForm from './components/ClaimForm';
import Settings from './components/Settings';
import Approvals from './components/Approvals';
import Export from './components/Export';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingReport, setEditingReport] = useState<ExpenseReport | null>(null);
  
  // Persistent State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fs_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  
  const [currentUser, setCurrentUser] = useState<User>(users[3]); // Defaulting to Admin for demo
  
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem('fs_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [reports, setReports] = useState<ExpenseReport[]>(() => {
    const saved = localStorage.getItem('fs_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [matrix, setMatrix] = useState<ApproverMatrix[]>(() => {
    const saved = localStorage.getItem('fs_matrix');
    return saved ? JSON.parse(saved) : INITIAL_APPROVER_MATRIX;
  });

  const [nextIdSeq, setNextIdSeq] = useState<number>(() => {
    const saved = localStorage.getItem('fs_next_id');
    return saved ? parseInt(saved) : 1;
  });

  // Sync to Storage
  useEffect(() => localStorage.setItem('fs_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('fs_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('fs_reports', JSON.stringify(reports)), [reports]);
  useEffect(() => localStorage.setItem('fs_matrix', JSON.stringify(matrix)), [matrix]);
  useEffect(() => localStorage.setItem('fs_next_id', nextIdSeq.toString()), [nextIdSeq]);

  const addOrUpdateReport = (report: ExpenseReport) => {
    setReports(prev => {
      const exists = prev.find(r => r.id === report.id);
      
      // If the report was rejected and is being resubmitted, assign a NEW unique ID
      if (exists && exists.status === ClaimStatus.REJECTED) {
        const newId = `REQ-${nextIdSeq.toString().padStart(4, '0')}`;
        const newReport = { 
          ...report, 
          id: newId, 
          status: ClaimStatus.PENDING,
          signatureLog: [], 
          approvedBy: [],
          createdAt: Date.now()
        };
        setNextIdSeq(prevId => prevId + 1);
        return [newReport, ...prev];
      }

      if (exists) {
        // Normal update for Drafts or editing non-rejected reports
        return prev.map(r => r.id === report.id ? { ...report, approvedBy: [], rejectionComment: undefined } : r);
      }

      // Brand new report
      const newId = `REQ-${nextIdSeq.toString().padStart(4, '0')}`;
      const newReport = { ...report, id: newId };
      setNextIdSeq(prevId => prevId + 1);
      return [newReport, ...prev];
    });
    setEditingReport(null);
    setActiveTab('dashboard');
  };

  const updateReportStatus = (id: string, action: 'APPROVE' | 'REJECT', userId: string, remark: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.role === 'Admin') return;

    setReports(prev => prev.map(r => {
      if (r.id === id) {
        const newApprovedBy = action === 'APPROVE' 
          ? Array.from(new Set([...(r.approvedBy || []), userId]))
          : [];

        const currentStep = action === 'APPROVE' ? (newApprovedBy.length) : 0;
        const totalSteps = r.approvers.length;

        const newSignature: Signature = {
          signerId: userId,
          signerName: user?.name || 'Unknown',
          timestamp: Date.now(),
          action: action === 'APPROVE' ? 'Approved' : 'Rejected',
          remark: remark || (action === 'APPROVE' ? 'Approved' : 'Rejected'),
          progress: action === 'APPROVE' ? `${currentStep} of ${totalSteps}` : 'Rejected'
        };

        const updatedLog = [...(r.signatureLog || []), newSignature];

        if (action === 'REJECT') {
          return { 
            ...r, 
            status: ClaimStatus.REJECTED, 
            rejectionComment: remark, 
            approvedBy: [],
            signatureLog: updatedLog
          };
        }
        if (action === 'APPROVE') {
          const isFullyApproved = currentStep >= totalSteps;
          return {
            ...r,
            approvedBy: newApprovedBy,
            status: isFullyApproved ? ClaimStatus.APPROVED : ClaimStatus.PENDING,
            rejectionComment: undefined,
            signatureLog: updatedLog
          };
        }
      }
      return r;
    }));
  };

  const handleEditReport = (report: ExpenseReport) => {
    setEditingReport(report);
    setActiveTab('new-claim');
  };

  const pendingApprovalsCount = reports.filter(r => 
    (r.approvers.includes(currentUser.id) && currentUser.role !== 'Admin') && 
    r.status === ClaimStatus.PENDING &&
    !(r.approvedBy || []).includes(currentUser.id)
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'new-claim', label: 'Submit Claim', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'approvals', label: 'Approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', badge: pendingApprovalsCount },
    { id: 'export', label: 'ERP Export', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ].filter(item => currentUser.accessibleModules.includes(item.id));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F5F7]">
      <nav className="w-full md:w-72 apple-blur border-b md:border-b-0 md:border-r border-[#E5E5E7] p-8 flex flex-col gap-2 z-10 sticky top-0 h-screen">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#1D1D1F]">FinanceStream</span>
        </div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'new-claim') setEditingReport(null);
            }}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-white text-blue-600 shadow-sm border border-[#E5E5E7]' 
                : 'text-[#86868B] hover:bg-white/50 hover:text-[#1D1D1F]'
            }`}
          >
            <div className="flex items-center gap-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                </svg>
                <span className="font-semibold text-[15px]">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === item.id ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
                    {item.badge}
                </span>
            )}
          </button>
        ))}

        <div className="mt-auto pt-8">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden border border-blue-100">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} alt="profile" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-bold text-[#1D1D1F] truncate">{currentUser.name}</span>
              <span className="text-[12px] text-[#86868B] font-medium">{currentUser.role}</span>
            </div>
          </div>
          <div className="mt-4 px-2">
            <select 
              className="w-full bg-transparent text-xs font-bold text-[#86868B] uppercase tracking-wider cursor-pointer focus:outline-none"
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) setCurrentUser(selected);
              }}
              value={currentUser.id}
            >
              {users.map(u => <option key={u.id} value={u.id}>Login as {u.name}</option>)}
            </select>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard reports={reports} currentUser={currentUser} onEditReport={handleEditReport} />}
          {activeTab === 'new-claim' && (
            <ClaimForm 
              categories={categories} 
              userList={users} 
              onSubmit={addOrUpdateReport} 
              currentUser={currentUser}
              initialData={editingReport}
              matrix={matrix}
            />
          )}
          {activeTab === 'approvals' && (
            <Approvals 
              reports={reports} 
              onUpdateStatus={updateReportStatus} 
              currentUser={currentUser} 
              categories={categories}
            />
          )}
          {activeTab === 'settings' && (
            <Settings 
              users={users} 
              setUsers={setUsers} 
              categories={categories} 
              setCategories={setCategories} 
              matrix={matrix} 
              setMatrix={setMatrix} 
            />
          )}
          {activeTab === 'export' && (
            <Export reports={reports} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
