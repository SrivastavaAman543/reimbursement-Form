import React, { useState } from 'react';
import axios from 'axios';
import ActionPop from './ActionPop';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = "http://localhost:8000/api/expenses";

const ExpenseForm = ({ t, currentLang, token }) => {
  const [employeeInfo, setEmployeeInfo] = useState({
    employee_name: '',
    employee_email: ''
  });

  const [requestType, setRequestType] = useState('claim'); // claim or expense_approval
  
  const [groups, setGroups] = useState([
    { 
      category: '', 
      customCategory: '', 
      date: new Date().toISOString().split('T')[0], 
      items: [{ title: '', description: '', approx_amount: 0 }] 
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionPop, setActionPop] = useState({ show: false, message: '', type: 'success', title: '' });

  const categories = [
    { value: 'Travel', label: t.categories?.Travel || 'Travel' },
    { value: 'Food', label: t.categories?.Food || 'Food' },
    { value: 'Accommodation', label: t.categories?.Accommodation || 'Accommodation' },
    { value: 'Office Supplies', label: t.categories?.OfficeSupplies || 'Office Supplies' },
    { value: 'Other', label: t.categories?.Other || 'Other' }
  ];

  const addGroup = () => {
    setGroups([...groups, { 
      category: '', 
      customCategory: '', 
      date: new Date().toISOString().split('T')[0], 
      items: [{ title: '', description: '', approx_amount: 0 }] 
    }]);
  };

  const removeGroup = (index) => {
    if (groups.length > 1) {
      setGroups(groups.filter((_, i) => i !== index));
    }
  };

  const addItem = (groupIndex) => {
    const newGroups = [...groups];
    newGroups[groupIndex].items.push({ title: '', description: '', approx_amount: 0 });
    setGroups(newGroups);
  };

  const removeItem = (groupIndex, itemIndex) => {
    const newGroups = [...groups];
    if (newGroups[groupIndex].items.length > 1) {
      newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
      setGroups(newGroups);
    }
  };

  const handleGroupChange = (groupIndex, field, value) => {
    const newGroups = [...groups];
    newGroups[groupIndex][field] = value;
    setGroups(newGroups);
  };

  const handleItemChange = (groupIndex, itemIndex, field, value) => {
    const newGroups = [...groups];
    newGroups[groupIndex].items[itemIndex][field] = value;
    setGroups(newGroups);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Flatten the nested structure for the API
      const flattenedItems = [];
      groups.forEach(group => {
        const finalCategory = group.category === 'Other' ? (group.customCategory || 'Other') : group.category;
        group.items.forEach(item => {
          flattenedItems.push({
            ...item,
            category: finalCategory,
            date: group.date
          });
        });
      });

      const payload = {
        ...employeeInfo,
        request_type: requestType,
        items: flattenedItems
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setEmployeeInfo({ employee_name: '', employee_email: '' });
      setGroups([{ 
        category: '', 
        customCategory: '', 
        date: new Date().toISOString().split('T')[0], 
        items: [{ title: '', description: '', approx_amount: 0 }] 
      }]);
      
      window.dispatchEvent(new CustomEvent('expense-submitted'));
      setActionPop({ 
        show: true, 
        message: "Request submitted for manager approval", 
        type: 'success', 
        title: 'PENDING APPROVAL' 
      });

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2 bg-white dark:bg-navy-950 border-t border-x border-slate-100 dark:border-navy-800 border-b-2 border-b-slate-200 dark:border-b-navy-700/50 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";
  const selectClass = "w-full px-4 py-2 bg-white dark:bg-navy-950 border-t border-x border-slate-100 dark:border-navy-800 border-b-2 border-b-slate-200 dark:border-b-navy-700/50 rounded-xl text-slate-800 dark:text-slate-200 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-xs cursor-pointer shadow-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]";
  const labelClass = "block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-[0.2em]";

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row gap-6 items-center bg-white dark:bg-navy-950/40 p-4 rounded-3xl border border-slate-100 dark:border-navy-800 shadow-sm">
            {/* Request Type Sliding Toggle */}
            <div className="w-fit flex items-center gap-4 border-r border-slate-100 dark:border-navy-800 pr-6 mr-2">
                <div className="relative p-1 bg-slate-100 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-navy-800 shadow-inner flex items-center gap-0.5 w-[220px]">
                    <motion.div 
                        layout
                        initial={false}
                        animate={{ x: requestType === 'expense_approval' ? 0 : '100%' }}
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white dark:bg-navy-800 rounded-lg shadow-md border border-slate-200 dark:border-navy-700/50"
                    />
                    <button
                        type="button"
                        onClick={() => setRequestType('expense_approval')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-colors duration-300 ${requestType === 'expense_approval' ? 'text-accent' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Approval</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRequestType('claim')}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-colors duration-300 ${requestType === 'claim' ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Claim</span>
                    </button>
                </div>
            </div>

            {/* Employee Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="flex items-center gap-3">
                    <label className={`${labelClass} mb-0 min-w-fit`}>Name</label>
                    <input
                        type="text"
                        required
                        className={`${inputClass} !py-2`}
                        value={employeeInfo.employee_name}
                        onChange={(e) => setEmployeeInfo({ ...employeeInfo, employee_name: e.target.value })}
                        placeholder="Requester Full Name"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <label className={`${labelClass} mb-0 min-w-fit`}>Email</label>
                    <input
                        type="email"
                        required
                        className={`${inputClass} !py-2`}
                        value={employeeInfo.employee_email}
                        onChange={(e) => setEmployeeInfo({ ...employeeInfo, employee_email: e.target.value })}
                        placeholder="work@company.com"
                    />
                </div>
            </div>
        </div>

        {/* Expense Groups */}
        <div className="space-y-10">
            {groups.map((group, gIdx) => (
                <div key={gIdx} className="relative group/card">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-accent rounded-full opacity-30 group-hover/card:opacity-100 transition-opacity" />
                    
                    <div className="bg-white dark:bg-navy-900/50 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300">
                        {/* Group Header */}
                        <div className="p-4 bg-slate-50/50 dark:bg-navy-950/40 border-b border-slate-100 dark:border-navy-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700/50 shadow-inner flex items-center justify-center text-[10px] font-black text-slate-400">
                                        {gIdx + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <label className={labelClass}>Main Category</label>
                                        <select
                                            className={`${selectClass} min-w-[170px] h-[38px] !py-1`}
                                            value={group.category}
                                            onChange={(e) => handleGroupChange(gIdx, 'category', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelClass}>Date of Spends</label>
                                    <input
                                        type="date"
                                        required
                                        className={`${inputClass} h-[38px] min-w-[160px] !py-1`}
                                        value={group.date}
                                        onChange={(e) => handleGroupChange(gIdx, 'date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {groups.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeGroup(gIdx)}
                                        className="p-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all flex items-center gap-2 group/del"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span className="text-[10px] font-black uppercase hidden group-hover/del:inline">Remove Group</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Group Items Table */}
                        <div className="p-4">
                            {group.category === 'Other' && (
                                <div className="mb-8 p-4 bg-accent/5 rounded-xl border border-accent/20">
                                    <label className={labelClass}>Manual Category Name *</label>
                                    <input 
                                        type="text" 
                                        className={inputClass} 
                                        placeholder="Type manual category..."
                                        value={group.customCategory}
                                        onChange={(e) => handleGroupChange(gIdx, 'customCategory', e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {/* Table Header */}
                            <div className="grid grid-cols-[40px_1fr_1.5fr_100px_40px] gap-4 px-4 mb-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">#</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Item Title</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Detailed Description</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                                    Approx Amt {requestType === 'claim' && <span className="lowercase font-normal opacity-60">(optional)</span>}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Delete</span>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence initial={false}>
                                    {group.items.map((item, iIdx) => (
                                        <motion.div 
                                            key={iIdx}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="grid grid-cols-[40px_1fr_1.5fr_100px_40px] gap-4 items-center bg-slate-50/50 dark:bg-navy-950/20 p-1.5 rounded-xl transition-all border border-transparent"
                                        >
                                            <div className="flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {gIdx + 1}.{iIdx + 1}
                                            </div>
                                            
                                            <input
                                                type="text"
                                                required
                                                placeholder="What did you buy? (e.g., Train Ticket)"
                                                className={`${inputClass} !py-1.5 !h-[36px] border-transparent bg-white dark:bg-navy-900 shadow-none focus:border-accent`}
                                                value={item.title}
                                                onChange={(e) => handleItemChange(gIdx, iIdx, 'title', e.target.value)}
                                            />

                                            <input
                                                type="text"
                                                required
                                                placeholder="Add extra details..."
                                                className={`${inputClass} !py-1.5 !h-[36px] border-transparent bg-white dark:bg-navy-900 shadow-none focus:border-accent`}
                                                value={item.description}
                                                onChange={(e) => handleItemChange(gIdx, iIdx, 'description', e.target.value)}
                                            />

                                            <input
                                                type="number"
                                                required={requestType === 'expense_approval'}
                                                min="0"
                                                placeholder="0"
                                                className={`${inputClass} !py-1.5 !h-[36px] border-transparent bg-white dark:bg-navy-900 shadow-none focus:border-accent text-right font-bold no-spinner`}
                                                value={item.approx_amount || ''}
                                                onChange={(e) => handleItemChange(gIdx, iIdx, 'approx_amount', parseFloat(e.target.value) || 0)}
                                            />

                                            <div className="flex items-center justify-center">
                                                {group.items.length > 1 ? (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeItem(gIdx, iIdx)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                ) : <div className="w-8" />}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <button
                                type="button"
                                onClick={() => addItem(gIdx)}
                                className="w-fit px-6 py-2 rounded-xl text-accent hover:bg-accent/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-4 ml-14"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-center p-8 bg-slate-100/50 dark:bg-navy-950/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-navy-800">
                <button
                    type="button"
                    onClick={() => addGroup()}
                    className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700/50 shadow-sm hover:border-accent hover:text-accent transition-all group/btn"
                >
                    <div className="w-8 h-8 rounded-full bg-accent text-navy-950 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Create New Group (New Category/Date)</span>
                </button>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center bg-white dark:bg-navy-950/60 p-6 rounded-[2rem] border border-slate-200 dark:border-navy-800 shadow-lg">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total Approx</span>
                <span className="text-xl font-black text-accent">₹{groups.reduce((acc, g) => acc + g.items.reduce((sum, i) => sum + (i.approx_amount || 0), 0), 0).toLocaleString()} <span className="text-sm text-slate-400">({groups.reduce((acc, g) => acc + g.items.length, 0)} Items)</span></span>
            </div>
            
            <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-accent hover:bg-accent-600 text-navy-900 text-xs font-black rounded-2xl shadow-xl shadow-accent/20 hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 uppercase tracking-widest flex items-center gap-3"
            >
                {isSubmitting ? "Processing..." : "Submit for Manager Review"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
        </div>
      </form>

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
