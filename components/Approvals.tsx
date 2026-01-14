
import React, { useState } from 'react';
import { ExpenseReport, ClaimStatus, User, Signature, ExpenseCategory } from '../types';

interface Props {
  reports: ExpenseReport[];
  onUpdateStatus: (id: string, action: 'APPROVE' | 'REJECT', userId: string, remark: string) => void;
  currentUser: User;
  categories: ExpenseCategory[];
}

const Approvals: React.FC<Props> = ({ reports, onUpdateStatus, currentUser, categories }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [activeRemark, setActiveRemark] = useState<{ id: string, text: string }>({ id: '', text: '' });
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<ExpenseReport | null>(null);

  const pendingApprovals = reports.filter(r => 
    (r.approvers.includes(currentUser.id) || currentUser.role === 'Admin') && 
    r.status === ClaimStatus.PENDING &&
    !(r.approvedBy || []).includes(currentUser.id)
  );

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    onUpdateStatus(id, action, currentUser.id, activeRemark.text);
    setActiveRemark({ id: '', text: '' });
  };

  const openAttachment = (dataUrl: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  const downloadSignatureLog = () => {
    const headers = [
      'Report ID', 
      'Title', 
      'Current Request Status',
      'Signer Name', 
      'Signer ID', 
      'Action Taken', 
      'Total Required Approvals', 
      'Signing Step Sequence', 
      'Timestamp', 
      'Remark'
    ];
    
    const rows: any[] = [];
    reports.forEach(report => {
      (report.signatureLog || []).forEach(sig => {
        rows.push([
          `"${report.id}"`,
          `"${report.title.replace(/"/g, '""')}"`,
          `"${report.status}"`,
          `"${sig.signerName.replace(/"/g, '""')}"`,
          `"${sig.signerId}"`,
          `"${sig.action}"`,
          `"${report.approvers.length}"`,
          `"${sig.progress || 'N/A'}"`,
          `"${new Date(sig.timestamp).toLocaleString().replace(/"/g, '""')}"`,
          `"${(sig.remark || '').replace(/"/g, '""')}"`
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Finance_Signature_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasExportAccess = currentUser.accessibleModules.includes('settings');

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F] mb-3">Approval Center</h1>
          <p className="text-[#86868B] font-medium">Verify claims or review your signature history.</p>
        </div>
        {activeTab === 'history' && hasExportAccess && (
           <button 
            onClick={downloadSignatureLog}
            className="bg-[#1D1D1F] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-2"
           >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export Signature Log
           </button>
        )}
      </header>

      <div className="flex bg-[#E5E5E7]/50 p-1.5 rounded-[1.5rem] w-fit mb-10">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-8 py-3 rounded-[1.2rem] font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Pending Review
          {pendingApprovals.length > 0 && <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px]">{pendingApprovals.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-8 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${
            activeTab === 'history' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          Audit History
        </button>
      </div>

      {activeTab === 'pending' ? (
        pendingApprovals.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-24 flex flex-col items-center justify-center border-2 border-dashed border-[#E5E5E7] shadow-sm">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-[#1D1D1F] mb-2">Queue Clear</h3>
            <p className="text-[#86868B] font-medium">No reports waiting for your signature at this time.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingApprovals.map(report => (
              <div key={report.id} className="bg-white rounded-[2.5rem] border border-[#E5E5E7] shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="p-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{report.id}</span>
                        <span className="text-[#86868B] font-bold text-xs uppercase tracking-widest">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-3xl font-black text-[#1D1D1F] mb-1">{report.title}</h3>
                      <p className="text-lg text-[#86868B] font-medium">Requested by <span className="text-blue-600 font-bold">{report.userName}</span></p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-1">Total Claim</div>
                      <div className="text-4xl font-black text-[#1D1D1F]">{report.claimCurrency} {report.totalClaimAmount.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-[#F5F5F7] rounded-3xl p-8 mb-8 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-[#1D1D1F] mb-1">Verify Audit Items</h4>
                        <p className="text-xs text-[#86868B] font-medium">Approval Progress: {report.approvedBy.length} of {report.approvers.length} completed</p>
                    </div>
                    <button onClick={() => setSelectedReportForDetail(report)} className="bg-white border text-blue-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-blue-50">View Detail & Sign</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-[#E5E5E7] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F5F7] border-b border-[#E5E5E7]">
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Signer / ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Report & Action</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Remark</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Date Signed</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-widest text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E7]">
              {reports.filter(r => (r.signatureLog || []).some(s => s.signerId === currentUser.id || currentUser.role === 'Admin')).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-[#86868B] font-medium italic">Audit log is empty.</td>
                </tr>
              ) : (
                reports.flatMap(r => (r.signatureLog || []).filter(s => currentUser.role === 'Admin' || s.signerId === currentUser.id).map((sig, idx) => (
                  <tr key={`${r.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                        <div className="font-bold text-[#1D1D1F] text-sm">{sig.signerName}</div>
                        <div className="text-[10px] font-mono text-blue-500">{sig.signerId}</div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="font-bold text-[#1D1D1F] text-sm truncate max-w-xs">{r.title}</div>
                        <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded w-fit inline-block mr-2 ${sig.action === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sig.action}</div>
                        <span className="text-[9px] text-[#86868B] font-black">{sig.progress}</span>
                    </td>
                    <td className="px-8 py-6 text-[12px] text-[#86868B] italic max-w-xs truncate">
                        {sig.remark}
                    </td>
                    <td className="px-8 py-6 text-xs text-[#86868B]">
                        {new Date(sig.timestamp).toLocaleString()}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-[#1D1D1F]">
                        {r.claimCurrency} {r.totalClaimAmount.toLocaleString()}
                    </td>
                  </tr>
                )))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedReportForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-md mb-2 inline-block">Report Details</span>
                <h2 className="text-3xl font-black text-[#1D1D1F]">{selectedReportForDetail.title}</h2>
                <p className="text-[#86868B] font-bold">{selectedReportForDetail.userName} • {selectedReportForDetail.id}</p>
              </div>
              <button onClick={() => setSelectedReportForDetail(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all text-[#86868B]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h4 className="text-xs font-black uppercase text-[#86868B] tracking-widest mb-4">Line Items ({selectedReportForDetail.items.length})</h4>
                <div className="space-y-4">
                  {selectedReportForDetail.items.map(item => (
                    <div key={item.id} className="bg-[#F5F5F7] p-5 rounded-2xl flex justify-between items-center border border-white">
                      <div>
                        <div className="text-[9px] font-black uppercase text-blue-600 mb-1">{item.date} • GL:{categories.find(c => c.id === item.categoryId)?.glCode}</div>
                        <div className="font-bold text-[#1D1D1F] text-sm">{item.description}</div>
                        <div className="text-[10px] text-[#86868B] font-medium">Orig: {item.expenseCurrency} {item.baseAmount + item.taxAmount}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#1D1D1F]">{selectedReportForDetail.claimCurrency} {item.claimAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                   <h4 className="text-xs font-black uppercase text-[#86868B] tracking-widest mb-4">Actions</h4>
                   <textarea 
                      className="w-full p-4 rounded-2xl bg-[#F5F5F7] border-2 border-transparent focus:bg-white focus:border-blue-500 min-h-[120px] mb-6"
                      placeholder="Enter remarks (Optional)..."
                      value={activeRemark.text}
                      onChange={(e) => setActiveRemark({ id: selectedReportForDetail.id, text: e.target.value })}
                   />
                   <div className="flex flex-wrap gap-3">
                      {selectedReportForDetail.attachments.map(att => (
                        <button key={att.id} onClick={() => openAttachment(att.dataUrl)} className="text-xs font-bold text-blue-600 hover:underline">View {att.name}</button>
                      ))}
                   </div>
                </div>
                {currentUser.role !== 'Admin' ? (
                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => { handleAction(selectedReportForDetail.id, 'REJECT'); setSelectedReportForDetail(null); }}
                      className="flex-1 py-5 bg-white border-2 border-red-50 text-red-500 rounded-3xl font-bold hover:bg-red-50 transition-all text-lg"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => { handleAction(selectedReportForDetail.id, 'APPROVE'); setSelectedReportForDetail(null); }}
                      className="flex-[2] py-5 bg-blue-600 text-white rounded-3xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-100 text-lg"
                    >
                      Sign & Approve
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 bg-orange-50 p-6 rounded-3xl border border-orange-200 text-center">
                    <p className="text-orange-700 font-bold text-sm">Admins are restricted from signing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
