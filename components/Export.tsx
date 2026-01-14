
import React, { useState } from 'react';
import { ExpenseReport, ClaimStatus } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

interface Props {
  reports: ExpenseReport[];
}

const Export: React.FC<Props> = ({ reports }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredReports = reports.filter(r => {
      const reportDate = new Date(r.createdAt).toISOString().split('T')[0];
      const matchFrom = fromDate ? reportDate >= fromDate : true;
      const matchTo = toDate ? reportDate <= toDate : true;
      const matchStatus = selectedStatus === 'ALL' ? true : r.status === selectedStatus;
      return matchFrom && matchTo && matchStatus;
  });

  const downloadCSV = () => {
    if (filteredReports.length === 0) return;

    const headers = [
      'LINE_ID',
      'REPORT_ID', 
      'STATUS',
      'EMPLOYEE_NAME', 
      'EXPENSE_DATE', 
      'GL_SEGMENT1', 
      'CATEGORY', 
      'DESCRIPTION', 
      'CURRENCY', 
      'CLAIM_AMOUNT', 
      'EXCHANGE_RATE', 
      'TAX_AMOUNT'
    ];
    
    const rows: any[] = [];
    filteredReports.forEach(report => {
      report.items.forEach(item => {
        const category = DEFAULT_CATEGORIES.find(cat => cat.id === item.categoryId);
        rows.push([
          `"${item.id}"`,
          `"${report.id}"`,
          `"${report.status}"`,
          `"${report.userName.replace(/"/g, '""')}"`,
          `"${item.date}"`,
          `"${category?.glCode || 'ERROR'}"`,
          `"${(category?.name || 'ERROR').replace(/"/g, '""')}"`,
          `"${item.description.replace(/"/g, '""')}"`,
          `"${report.claimCurrency}"`,
          `"${item.claimAmount.toFixed(2)}"`,
          `"${item.exchangeRate}"`,
          `"${item.taxAmount.toFixed(2)}"`
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Finance_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLines = filteredReports.reduce((sum, r) => sum + r.items.length, 0);

  return (
    <div className="animate-in fade-in duration-700">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F] mb-3">ERP Gateway</h1>
        <p className="text-[#86868B] font-medium">Generate financial reports and CSV exports with granular filtering.</p>
      </header>

      <div className="bg-white rounded-[3rem] p-12 border border-[#E5E5E7] shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-widest mb-3">Submission From</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-blue-500 transition-all font-medium"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-widest mb-3">Submission To</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-blue-500 transition-all font-medium"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-[#86868B] uppercase tracking-widest mb-3">Claim Status</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold appearance-none"
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                  >
                      <option value="ALL">All Statuses</option>
                      {Object.values(ClaimStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-[3rem] p-16 border border-[#E5E5E7] shadow-sm text-center">
        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
          <svg className="w-14 h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        
        <h2 className="text-3xl font-black text-[#1D1D1F] mb-4">Export Summary</h2>
        <p className="text-[#86868B] max-w-md mx-auto mb-12 text-lg font-medium">
          Found <span className="text-blue-600 font-bold">{filteredReports.length}</span> reports matching filters, containing <span className="text-blue-600 font-bold">{totalLines}</span> line items.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button 
            disabled={filteredReports.length === 0}
            onClick={downloadCSV}
            className={`px-12 py-6 rounded-3xl font-bold transition-all shadow-2xl flex items-center gap-4 text-lg ${
              filteredReports.length > 0 
                ? 'bg-[#1D1D1F] text-white hover:scale-105 active:scale-95' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-[#E5E5E7]'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Generate Filtered CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Export;
