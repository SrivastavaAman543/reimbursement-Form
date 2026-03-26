import React, { useState, useRef } from 'react';
import axios from 'axios';
import ChipSelector from './ChipSelector';
import ActionPop from './ActionPop';

const API_URL = "http://localhost:8000/api/expenses";

const ExpenseForm = ({ t, currentLang, token }) => {
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_email: '',
    title: '',
    description: '',
    amount: '',
    category: '',
    payment_mode: '',
    date: ''
  });
  const [customCategory, setCustomCategory] = useState('');
  const [customPayment, setCustomPayment] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionPop, setActionPop] = useState({ show: false, message: '', type: 'success', title: '' });
  const [showReceiptErr, setShowReceiptErr] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const categories = [
    { value: 'Travel', label: t.categories?.Travel || 'Travel' },
    { value: 'Food', label: t.categories?.Food || 'Food' },
    { value: 'Accommodation', label: t.categories?.Accommodation || 'Accommodation' },
    { value: 'Other', label: t.categories?.Other || 'Other' }
  ];

  const paymentModes = [
    { value: 'UPI', label: t.payment_modes?.UPI || 'UPI' },
    { value: 'Card', label: t.payment_modes?.Card || 'Card' },
    { value: 'Net Banking', label: t.payment_modes?.['Net Banking'] || 'Net Banking' },
    { value: 'Cash', label: t.payment_modes?.Cash || 'Cash' },
    { value: 'Wallet', label: t.payment_modes?.Wallet || 'Wallet' },
    { value: 'Other', label: t.categories?.Other || 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (newFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(newFile.type)) {
      alert("Invalid file type. Only JPG, PNG, and PDF allowed.");
      return;
    }
    if (newFile.size > 2 * 1024 * 1024) {
      alert("File too large. Maximum size is 2MB.");
      return;
    }
    setFile(newFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger native browser tooltips
    if (!e.target.checkValidity()) {
      e.target.reportValidity();
      return;
    }

    // Secondary check for file
    if (!file) {
      setShowReceiptErr(true);
      setTimeout(() => setShowReceiptErr(false), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      const finalData = { ...formData };
      if (finalData.category === 'Other') {
        finalData.category = customCategory || 'Other';
      }
      if (finalData.payment_mode === 'Other') {
        finalData.payment_mode = customPayment || 'Other';
      }

      Object.keys(finalData).forEach(key => {
        data.append(key, finalData[key]);
      });
      data.append('receipt', file);

      await axios.post(API_URL, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setFormData({
        employee_name: '', employee_email: '', title: '', description: '', amount: '', category: '', payment_mode: '', date: ''
      });
      setCustomCategory(''); setCustomPayment(''); setFile(null);
      window.dispatchEvent(new CustomEvent('expense-submitted'));
      setActionPop({ show: true, message: t.success || "Expense submitted successfully", type: 'success', title: 'SUBMITTED' });

    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-expired'));
      } else {
        alert(error.response?.data?.detail || "Failed to submit expense");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700/50 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";
  const iconClass = "absolute left-3.5 top-3.5 text-slate-600 dark:text-slate-500 dark:text-slate-500 pointer-events-none";
  const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider";

  const getInputClass = (fieldName) => {
    const base = "w-full pl-10 pr-4 py-3 bg-white dark:bg-navy-900 border rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";
    return `${base} border-slate-200 dark:border-navy-700/50`;
  };

  return (
    <div className="max-w-[1280px] mx-auto p-6 lg:p-8 bg-slate-50 dark:bg-navy-800 rounded-3xl border border-white dark:border-navy-700/50 shadow-[0_15px_40px_rgba(30,41,59,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* Row 1: 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelClass}>{t.employee_name || 'Employee Name'} *</label>
            <div className="relative">
              <svg className={`w-4 h-4 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input type="text" name="employee_name" value={formData.employee_name} onChange={handleInputChange} required className={getInputClass('employee_name')} placeholder={t.full_name || 'Full Name'} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t.employee_email || 'Email'} *</label>
            <div className="relative">
              <svg className={`w-4 h-4 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input type="email" name="employee_email" value={formData.employee_email} onChange={handleInputChange} required className={getInputClass('employee_email')} placeholder={t.email_placeholder_short || "employee@company.com"} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t.date || 'Date'} *</label>
            <div className="relative">
              <svg className={`w-4 h-4 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} onClick={e => e.target.showPicker && e.target.showPicker()} required className={`${getInputClass('date')} cursor-pointer [&::-webkit-calendar-picker-indicator]:brightness-50 [&::-webkit-calendar-picker-indicator]:invert`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t.amount || 'Amount'} (INR) *</label>
            <div className="relative">
              <span className={`text-sm font-semibold ${iconClass}`}>₹</span>
              <input type="number" name="amount" min="1" step="0.01" value={formData.amount} onChange={handleInputChange} required className={`${getInputClass('amount')} font-semibold`} placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Row 2: Expense Title */}
        <div>
          <label className={labelClass}>{t.expense_title || 'Expense Title'} *</label>
          <div className="relative">
            <svg className={`w-4 h-4 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className={getInputClass('title')} placeholder={t.placeholder_title || 'e.g., Client Dinner at Downtown'} />
          </div>
        </div>

        {/* Row 3: Category + Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>{t.category || 'Category'} *</label>
            <ChipSelector options={categories} selected={formData.category} onChange={(val) => setFormData(p => ({ ...p, category: val }))} />
            {formData.category === 'Other' && (
              <div className="relative mt-4">
                <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} required className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm" placeholder={t.custom_category || "Specify Category"} />
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>{t.payment_mode || 'Payment Mode'} *</label>
            <ChipSelector options={paymentModes} selected={formData.payment_mode} onChange={(val) => setFormData(p => ({ ...p, payment_mode: val }))} />
            {formData.payment_mode === 'Other' && (
              <div className="relative mt-4">
                <input type="text" value={customPayment} onChange={(e) => setCustomPayment(e.target.value)} required className="w-full px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm" placeholder={t.custom_payment || "Specify Payment Mode"} />
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Description + Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="flex flex-col h-full">
            <label className={labelClass}>{t.description || 'Description'} *</label>
            <div className="relative flex-1 flex flex-col">
              <svg className={`w-4 h-4 mt-0 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <textarea name="description" value={formData.description} onChange={handleInputChange} required className={`${getInputClass('description')} flex-1 h-full min-h-[140px] resize-none pb-4`} placeholder={t.placeholder_desc || 'Provide more details...'} />
            </div>
          </div>
          <div className="flex flex-col h-full">
            <label className={labelClass}>{t.receipt || 'Receipt'} *</label>
            <div
              className={`flex-1 flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer min-h-[140px] h-full relative overflow-hidden group shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
                ${dragActive ? 'border-accent bg-accent/5' : 'border-slate-200 dark:border-navy-600 hover:border-accent/40 bg-white dark:bg-navy-900'}
              `}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleChange} accept=".jpg,.jpeg,.png,.pdf" className="hidden" />
              {file ? (
                <div className="text-center w-full px-4 z-10">
                  <div className="w-10 h-10 mx-auto bg-success/10 rounded-xl flex items-center justify-center mb-2 border border-success/20">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button type="button" className="text-xs font-semibold text-danger hover:text-danger-400 hover:underline mt-2" onClick={(e) => { e.stopPropagation(); setFile(null); }}>{t.remove_file || 'Remove File'}</button>
                </div>
              ) : (
                <div className="text-center text-slate-600 dark:text-slate-500 z-10">
                  <div className="w-10 h-10 mx-auto bg-navy-700/50 border border-navy-700 rounded-xl flex items-center justify-center mb-3 text-slate-600 dark:text-slate-400 group-hover:text-accent group-hover:border-accent/20 group-hover:bg-accent/5 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.upload_drag_drop || "Upload or drag and drop"}</p>
                  <p className="text-xs font-medium mt-1 text-slate-600 dark:text-slate-500">{t.max_size || "JPG, PNG, PDF (Max 2MB)"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-6 mt-2 border-t border-navy-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-accent hover:bg-accent-600 text-navy-950 text-sm font-bold rounded-xl shadow-[0_8px_20px_rgba(var(--color-accent),0.25)] hover:shadow-[0_12px_30px_rgba(var(--color-accent),0.35)] hover:-translate-y-1 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t.submitting || 'Submitting...'}
              </>
            ) : (
              t.submit || 'Submit Expense'
            )}
          </button>
        </div>

      </form>
      {showReceiptErr && (
        <div className="fixed top-6 right-6 z-[110] bg-danger text-white px-5 py-2.5 rounded-xl shadow-lg shadow-danger/20 font-bold text-sm">
          Please Upload Receipt
        </div>
      )}
      <ActionPop
        show={actionPop.show}
        type={actionPop.type}
        message={actionPop.message}
        title={actionPop.title}
        onClose={() => setActionPop({ ...actionPop, show: false })}
      />
    </div>
  );
};

export default ExpenseForm;
