import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Toast from '../components/Toast';

const API_URL = "http://localhost:8000/api/expenses";

const RequestsList = ({ t, token, user }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setProcessingId(id);
    try {
      await axios.patch(`${API_URL}/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expenses.map(exp => exp.id === id ? { ...exp, status: newStatus } : exp));
      setToast({ 
        show: true, 
        message: `${t.request || 'Request'} ${newStatus === 'approved' ? (t.approved || 'Approved') : (t.rejected || 'Rejected')} ${t.successfully || 'Successfully'}`,
        type: newStatus === 'approved' ? 'success' : 'error'
      });
    } catch (error) {
      console.error("Error updating status", error);
      setToast({ 
        show: true, 
        message: t.update_failed || "Failed to update status",
        type: 'error'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openReceipt = (path) => {
    if (!path) return;
    const filename = path.split('\\').pop().split('/').pop();
    window.open(`http://localhost:8000/uploads/${filename}`, '_blank');
  };

  const getStatusBadge = (status) => {
    const styles = { 
      approved: 'bg-success/20 text-success-600 dark:text-success border-success/30', 
      rejected: 'bg-danger/20 text-danger-600 dark:text-danger border-danger/30', 
      pending: 'bg-accent/20 text-accent-600 dark:text-accent border-accent/30' 
    };
    const labels = { approved: 'Approved', rejected: 'Rejected', pending: 'Pending' };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wider ${styles[status] || styles.pending}`}>{labels[status] || 'Pending'}</span>;
  };

  const filteredExpenses = expenses.filter(exp => {
    const term = (searchTerm || '').toLowerCase();
    const name = exp.employee_name || '';
    const title = exp.title || '';
    
    const matchesSearch = name.toLowerCase().includes(term) || 
                          title.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (filteredExpenses.length === 0) {
      alert(t.no_requests || "No data to export");
      return;
    }
    const headers = ['Employee Name', 'Email', 'Title', 'Description', 'Amount (INR)', 'Date', 'Category', 'Status'];
    const csvRows = filteredExpenses.map(exp => {
      const escape = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
      return [
        escape(exp.employee_name), escape(exp.employee_email), escape(exp.title), escape(exp.description), 
        exp.amount, format(new Date(exp.date), 'yyyy-MM-dd'), escape(t.categories?.[exp.category] || exp.category), exp.status
      ].join(',');
    });
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expense_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-5 py-4"><div className="h-4 bg-navy-700 rounded w-3/4" /></td>
      ))}
    </tr>
  );

  return (
    <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden flex flex-col min-h-[600px]">
      
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-navy-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t.all_form_requests || 'All Form Requests'}</h2>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-grow sm:flex-grow-0">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-600 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={t.search_requests || "Search requests..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full sm:w-56 rounded-xl border border-navy-700 bg-navy-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder-slate-500"
            />
          </div>
          
          {/* Status filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-navy-700 bg-navy-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-accent/20 outline-none cursor-pointer"
          >
            <option value="all">{t.all_statuses || 'All Status'}</option>
            <option value="pending">{t.pending || 'Pending'}</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          {/* Refresh */}
          <button 
            onClick={fetchExpenses} 
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white border border-navy-700 hover:bg-navy-700/50 dark:hover:bg-white/5 rounded-xl transition-all bg-navy-900"
            title={t.refresh || "Refresh Data"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Export */}
          <button 
           onClick={handleExport} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-accent hover:bg-accent-600 text-slate-900 dark:text-slate-900 shadow-glow-amber">
          
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t.export_btn || 'Export'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <table className="min-w-full text-sm">
            <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-20 px-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-navy-700/50 rounded-2xl flex items-center justify-center mb-4 border border-navy-700">
              <svg className="h-7 w-7 text-slate-600 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t.no_requests || "No expenses found"}</h3>
            <p className="text-slate-600 dark:text-slate-500 text-xs font-medium">{t.empty_msg || "There are no records matching your criteria."}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-navy-700 text-sm">
            <thead className="bg-navy-900/50 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">{t.employee_name || "Employee"}</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">{t.expense_title || "Details"}</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">{t.category || "Category"}</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">{t.amount || "Amount"}</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">{t.status || "Status"}</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-wider">{t.action || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-navy-700/50 transition-colors group">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{expense.employee_name || '—'}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-500 mt-0.5">{expense.employee_email || ''}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{expense.title}</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-500 mt-0.5">{format(new Date(expense.date), 'MMM dd, yyyy')}</div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-navy-700/50 text-slate-700 dark:text-slate-300 border border-navy-700">
                      {t.categories?.[expense.category] || expense.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(expense.amount)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    {processingId === expense.id ? (
                      <div className="flex justify-end pr-2">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {expense.receipt_path && (
                          <button 
                            onClick={() => openReceipt(expense.receipt_path)}
                            className="p-1.5 text-slate-600 dark:text-slate-500 hover:text-accent hover:bg-accent/5 rounded-lg transition-all"
                            title={t.view_receipt || "View Receipt"}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        {user.user_role === 'ADMIN' && expense.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(expense.id, 'approved')}
                              className="p-1.5 text-slate-600 dark:text-slate-500 hover:text-success hover:bg-success/5 rounded-lg transition-all"
                              title={t.approve || "Approve"}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleStatusChange(expense.id, 'rejected')}
                              className="p-1.5 text-slate-600 dark:text-slate-500 hover:text-danger hover:bg-danger/5 rounded-lg transition-all"
                              title={t.reject || "Reject"}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
};

export default RequestsList;
