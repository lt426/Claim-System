
import React, { useState, useMemo } from 'react';
import { ExpenseReport, ClaimStatus, User } from '../types';

interface Props {
  reports: ExpenseReport[];
  currentUser: User;
  onEditReport: (report: ExpenseReport) => void;
}

const Dashboard: React.FC<Props> = ({ reports, currentUser, onEditReport }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const date = new Date(r.createdAt);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const isMyReport = r.userId === currentUser.id || currentUser.role === 'Admin';
      return period === selectedPeriod && isMyReport;
    });
  }, [reports, selectedPeriod, currentUser]);

  const pending = filteredReports.filter(r => r.status === ClaimStatus.PENDING).length;
  const approved = filteredReports.filter(r => r.status === ClaimStatus.APPROVED).length;
  const rejected = filteredReports.filter(r => r.status === ClaimStatus.REJECTED).length;

  const signedCount = useMemo(() => {
    return reports.filter(r => {
      const date = new Date(r.createdAt);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (period !== selectedPeriod) return false;
      return (r.signatureLog || []).some(s => s.signerId === currentUser.id && s.action === 'Approved');
    }).length;
  }, [reports, selectedPeriod, currentUser]);

  const totalsByCurrency = useMemo(() => {
    const approvedReports = filteredReports.filter(r => r.status === ClaimStatus.APPROVED);
    return approvedReports.reduce((acc, report) => {
      acc[report.claimCurrency] = (acc[report.claimCurrency] || 0) + report.totalClaimAmount;
      return acc;
    }, {} as Record<string, number>);
  }, [filteredReports]);

  const currencyEntries = Object.entries(totalsByCurrency);

  return (
    <div className="animate-in fade-in duration-1000">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-[#1D1D1F] mb-3">Claim System</h1>
          <p className="text-xl text-[#86868B] font-medium">Performance summary for {new Date(selectedPeriod + "-01").toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-[#E5E5E7] shadow-sm flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-[#86868B] ml-2">Period</span>
          <input 
            type="month" 
            className="bg-transparent border-none font-bold text-[#1D1D1F] focus:ring-0 cursor-pointer"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <div className="bg-white p-8 rounded-[2rem] border border-[#E5E5E7] shadow-sm">
          <span className="text-xs font-bold text-[#86868B] uppercase tracking-[0.1em] block mb-4">In Review</span>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-[#1D1D1F] leading-none">{pending}</span>
            <span className="text-[#86868B] font-bold mb-1 uppercase text-[10px]">Active</span>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] border border-[#E5E5E7] shadow-sm">
          <span className="text-xs font-bold text-[#86868B] uppercase tracking-[0.1em] block mb-4">Rejected</span>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-red-500 leading-none">{rejected}</span>
            <span className="text-[#86868B] font-bold mb-1 uppercase text-[10px]">Action Req</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-[#E5E5E7] shadow-sm">
          <span className="text-xs font-bold text-[#86868B] uppercase tracking-[0.1em] block mb-4">Approved</span>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black text-green-500 leading-none">{signedCount}</span>
            <span className="text-[#86868B] font-bold mb-1 uppercase text-[10px]">Signed By You</span>
          </div>
        </div>

        <div className="bg-[#1D1D1F] p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <span className="text-xs font-bold opacity-70 uppercase tracking-[0.1em] block mb-4">Reimbursed</span>
            <div className="space-y-1 overflow-y-auto max-h-[60px] scrollbar-hide">
              {currencyEntries.length === 0 ? (
                <span className="text-xl font-black text-white/40 italic">None</span>
              ) : (
                currencyEntries.map(([curr, amt]) => (
                  <div key={curr} className="flex justify-between items-end border-b border-white/10 pb-1">
                    <span className="text-[10px] font-black text-white/50">{curr}</span>
                    <span className="text-lg font-black">{amt.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#1D1D1F]">Period Activity</h2>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-[#E5E5E7] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F5F5F7] border-b border-[#E5E5E7]">
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-[0.1em]">Date & ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-[0.1em]">Report Title</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-[0.1em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-[#86868B] uppercase tracking-[0.1em] text-right">Action / Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E7]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-[#86868B] font-medium italic">No activity for this period.</td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="group hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-[#1D1D1F] mb-0.5">{new Date(report.createdAt).toLocaleDateString()}</div>
                      <div className="text-[11px] font-mono text-blue-500 uppercase">{report.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-[#1D1D1F] max-w-sm truncate mb-0.5">{report.title}</div>
                      <div className="text-[11px] text-[#86868B] font-semibold">{report.items.length} Line Items</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.status === ClaimStatus.PENDING ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                        report.status === ClaimStatus.APPROVED ? 'bg-green-50 text-green-600 border border-green-100' : 
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                        {report.status === ClaimStatus.REJECTED && report.userId === currentUser.id ? (
                            <button 
                                onClick={() => onEditReport(report)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                Edit & Re-submit
                            </button>
                        ) : (
                            <div className="text-lg font-black text-[#1D1D1F]">{report.claimCurrency} {report.totalClaimAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
