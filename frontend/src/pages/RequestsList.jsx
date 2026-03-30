import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { format, isWithinInterval, startOfHour, endOfHour, startOfDay, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ActionPop from '../components/ActionPop';
import GlassySelect from '../components/GlassySelect';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_URL = "http://localhost:8000/api/expenses";

const RequestsList = ({ t, token, user }) => {
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // all, active, completed
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('date_desc');
    const [processingId, setProcessingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [completingRequest, setCompletingRequest] = useState(null);
    const [reviewingReceipt, setReviewingReceipt] = useState(null); // { requestId, itemIndex, filePath }
    const [actionPop, setActionPop] = useState({ show: false, message: '', type: 'success', title: '' });
    
    // Stage 3 Modal State
    const [completionItems, setCompletionItems] = useState([]);
    const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
    const [rejectionModal, setRejectionModal] = useState({ show: false, requestId: null, comment: '' });
    const [verifiedReceipts, setVerifiedReceipts] = useState(new Set());
    const [rejectedReceipts, setRejectedReceipts] = useState(new Set());

    const totalAmountToApprove = useMemo(() => {
        return completionItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    }, [completionItems]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error("Error fetching requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, newStatus, comment = "") => {
        setProcessingId(id);
        try {
            await axios.patch(`${API_URL}/${id}`, { 
                status: newStatus,
                rejection_comment: comment 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
            setActionPop({
                show: true,
                message: `Request status updated to ${newStatus.replace('_', ' ')}`,
                type: 'success',
                title: 'STATUS UPDATED'
            });
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleStartCompletion = (request) => {
        setCompletingRequest(request);
        setCompletionItems(request.items.map(item => ({
            id: item.id,
            title: item.title,
            amount: item.amount || '',
            payment_mode: item.payment_mode || '',
            receipt: null
        })));
    };

    const handleItemDataChange = (index, field, value) => {
        const next = [...completionItems];
        next[index][field] = value;
        setCompletionItems(next);
    };

    const handleSubmitCompletion = async (e) => {
        e.preventDefault();
        setIsSubmittingCompletion(true);
        try {
            const formData = new FormData();
            const itemData = completionItems.map(item => ({
                id: item.id,
                amount: parseFloat(item.amount),
                payment_mode: item.payment_mode
            }));
            
            formData.append('item_data', JSON.stringify(itemData));
            completionItems.forEach(item => {
                if (item.receipt) {
                    formData.append('receipts', item.receipt);
                }
            });

            await axios.patch(`${API_URL}/${completingRequest.id}/complete`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` 
                }
            });

            setCompletingRequest(null);
            fetchRequests();
            setActionPop({
                show: true,
                message: "Financial details submitted for final admin review",
                type: 'success',
                title: 'SUBMISSION SUCCESS'
            });
        } catch (error) {
            console.error(error);
            alert("Failed to submit financial details");
        } finally {
            setIsSubmittingCompletion(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            approved: 'bg-green-500/10 text-green-500 border-green-500/20',
            pending_final_approval: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            manager_approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
            receipt_rejected: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
        };
        const labels = {
            approved: 'Final Approved (Paid)',
            pending_final_approval: 'Waiting Admin Review',
            manager_approved: 'Manager Approved',
            pending: 'Pre-Approval Pending',
            rejected: 'Rejected',
            receipt_rejected: 'Receipt Correction Needed'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const uniqueCategories = useMemo(() => {
        const cats = requests.flatMap(r => r.items.map(i => i.category));
        return Array.from(new Set(cats));
    }, [requests]);

    const uniqueEmployees = useMemo(() => Array.from(new Set(requests.map(r => r.employee_name))), [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            // Search filter
            const matchesSearch = req.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                req.items.some(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
            if (!matchesSearch) return false;

            // Status filter
            if (statusFilter !== 'all' && req.status !== statusFilter) return false;

            // Category filter
            if (categoryFilter !== 'all' && !req.items.some(item => item.category === categoryFilter)) return false;

            // Employee filter
            if (employeeFilter !== 'all' && req.employee_name !== employeeFilter) return false;

            // Date Range filter
            const submittedDate = new Date(req.submitted_at);
            if (startDate && !endDate) {
                if (startOfDay(submittedDate).getTime() !== startOfDay(startDate).getTime()) return false;
            } else if (startDate && endDate) {
                if (!isWithinInterval(submittedDate, { start: startOfDay(startDate), end: endOfDay(endDate) })) return false;
            }

            // Tab filter
            if (activeTab === 'active' && req.status === 'approved') return false;
            if (activeTab === 'completed' && req.status !== 'approved') return false;

            return true;
        });
    }, [requests, searchTerm, statusFilter, categoryFilter, employeeFilter, startDate, endDate, activeTab]);

    const getReceiptUrl = (path) => {
        if (!path) return null;
        const filename = path.split('\\').pop().split('/').pop();
        return `http://localhost:8000/uploads/${filename}`;
    };

    const openReceiptForReview = (reqId, item, index) => {
        setReviewingReceipt({
            requestId: reqId,
            item: item,
            index: index,
            url: getReceiptUrl(item.receipt_path)
        });
    };

    const handleReceiptReview = async (decision) => {
        if (decision === 'reject') {
            setRejectionModal({ show: true, requestId: reviewingReceipt.requestId, comment: '' });
            return;
        } else {
            // Mark as verified
            const receiptKey = `${reviewingReceipt.requestId}_${reviewingReceipt.index}`;
            setVerifiedReceipts(prev => new Set(prev).add(receiptKey));
            setActionPop({ show: true, message: "Receipt verified. Proceed to final approval.", type: 'success', title: 'VERIFIED' });
        }
        setReviewingReceipt(null);
    };

    const confirmRejection = async () => {
        if (!rejectionModal.comment.trim()) return;
        
        // Mark as rejected in local state
        const receiptKey = `${rejectionModal.requestId}_${reviewingReceipt.index}`;
        setRejectedReceipts(prev => new Set(prev).add(receiptKey));
        setVerifiedReceipts(prev => {
            const next = new Set(prev);
            next.delete(receiptKey);
            return next;
        });

        await handleStatusUpdate(rejectionModal.requestId, 'receipt_rejected', rejectionModal.comment);
        setRejectionModal({ show: false, requestId: null, comment: '' });
        setReviewingReceipt(null);
    };

    return (
        <div className="bg-navy-800 rounded-3xl border border-navy-700/50 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
            
            {/* Toolbar */}
            <div className="p-6 border-b border-navy-700/50 flex flex-col gap-6 bg-navy-900/40">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Request List</h2>
                        <p className="text-xs text-slate-500 font-medium">Monitoring track from pre-approval to payment</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input 
                                type="text" 
                                placeholder="Search employees or items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-[280px] pl-10 pr-4 py-2 bg-navy-950 border border-navy-700/50 rounded-xl text-sm text-slate-200 outline-none focus:ring-2 focus:ring-accent/20 transition-all shadow-inner"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${showFilters ? 'bg-accent/10 border-accent text-accent' : 'bg-navy-950 border-navy-700 text-slate-400 hover:border-accent hover:text-accent'}`}
                        >
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            {showFilters ? 'Close' : 'Filter'}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-visible"
                        >
                            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-navy-700/30">
                                <GlassySelect
                                    label="STATUS"
                                    width="140px"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={[
                                        { value: 'all', label: 'All Status' },
                                        { value: 'pending', label: 'Manager' },
                                        { value: 'manager_approved', label: 'Receipt Upload' },
                                        { value: 'pending_final_approval', label: 'Admin' },
                                        { value: 'receipt_rejected', label: 'Correction' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'rejected', label: 'Rejected' },
                                    ]}
                                />
                                <GlassySelect
                                    label="CAT"
                                    width="130px"
                                    value={categoryFilter}
                                    onChange={setCategoryFilter}
                                    options={[
                                        { value: 'all', label: 'All Items' },
                                        ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
                                    ]}
                                />
                                {user.user_role === 'ADMIN' && (
                                    <GlassySelect
                                        label="EMP"
                                        width="150px"
                                        value={employeeFilter}
                                        onChange={setEmployeeFilter}
                                        options={[
                                            { value: 'all', label: 'All Employees' },
                                            ...uniqueEmployees.map(emp => ({ value: emp, label: emp }))
                                        ]}
                                    />
                                )}

                                <div className="h-6 w-px bg-navy-700/50 mx-1 hidden sm:block" />

                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">RANGE:</span>
                                    <DatePicker
                                        selectsRange={true}
                                        startDate={startDate}
                                        endDate={endDate}
                                        onChange={(update) => setDateRange(update)}
                                        isClearable={true}
                                        placeholderText="Select range"
                                        className="w-[160px] px-3 py-1.5 bg-navy-950 border border-navy-700/50 rounded-xl text-[10px] font-bold text-slate-200 outline-none focus:ring-2 focus:ring-accent/20"
                                    />
                                </div>

                                <GlassySelect
                                    label="FY"
                                    width="110px"
                                    value={(() => {
                                        if (!startDate || !endDate) return 'all';
                                        const sy = startDate.getFullYear();
                                        const sm = startDate.getMonth();
                                        const ey = endDate.getFullYear();
                                        const em = endDate.getMonth();
                                        if (sm === 3 && ey === sy + 1 && em === 2) return `FY${sy}-${(sy + 1).toString().slice(-2)}`;
                                        return 'all';
                                    })()}
                                    onChange={(val) => {
                                        if (val === 'all') {
                                            setDateRange([null, null]);
                                        } else {
                                            const year = parseInt(val.match(/\d+/)[0]);
                                            setDateRange([new Date(year, 3, 1), new Date(year + 1, 2, 31)]);
                                        }
                                    }}
                                    options={[
                                        { value: 'all', label: 'Custom' },
                                        { value: 'FY2023-24', label: 'FY 2023-24' },
                                        { value: 'FY2024-25', label: 'FY 2024-25' },
                                        { value: 'FY2025-26', label: 'FY 2025-26' },
                                    ]}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pipeline Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-navy-900/60 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-navy-700/50">
                            <th className="px-6 py-4 text-left w-12">#</th>
                            <th className="px-6 py-4 text-left w-24">Type</th>
                            <th className="px-6 py-4 text-left">Requester Info</th>
                            <th className="px-6 py-4 text-left">Summary</th>
                            {user.user_role === 'ADMIN' && (
                                <>
                                    <th className="px-6 py-4 text-left">Payment Mode</th>
                                    <th className="px-6 py-4 text-left">Receipts</th>
                                </>
                            )}
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700/30">
                        {filteredRequests.map((req, idx) => (
                            <React.Fragment key={req.id}>
                                <tr className={`hover:bg-white/5 transition-all group ${expandedId === req.id ? 'bg-white/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-400 font-medium">{idx + 1}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider w-fit ${req.request_type === 'expense_approval' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                {req.request_type === 'expense_approval' ? 'Approval' : 'Claim'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-[140px]">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-bold text-slate-200 truncate">{req.employee_name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium truncate">{req.employee_email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button 
                                            onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                                            className="text-accent hover:underline flex items-center gap-1 font-semibold"
                                        >
                                            {req.items?.length || 0} Item(s)
                                            <svg className={`w-3 h-3 transition-transform ${expandedId === req.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </td>
                                    {user.user_role === 'ADMIN' && (
                                        <>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1">
                                                    {[...new Set(req.items.map(i => i.payment_mode).filter(Boolean))].map(mode => (
                                                        <span key={mode} className="px-2 py-0.5 bg-navy-700 rounded text-[10px] text-slate-300 border border-navy-600 tracking-wider uppercase font-bold">{mode}</span>
                                                    ))}
                                                    {req.items.every(i => !i.payment_mode) && <span className="text-slate-600">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex gap-2">
                                                    {req.items.map((item, i) => {
                                                        const rKey = `${req.id}_${i}`;
                                                        const isVerified = verifiedReceipts.has(rKey);
                                                        const isRejected = rejectedReceipts.has(rKey);
                                                        
                                                        let colorClass = 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20';
                                                        if (isVerified) colorClass = 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20';
                                                        if (isRejected) colorClass = 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20';

                                                        return item.receipt_path && (
                                                            <button 
                                                                key={item.id}
                                                                onClick={() => openReceiptForReview(req.id, item, i)}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${colorClass}`}
                                                                title={`${isVerified ? 'Verified' : isRejected ? 'Rejected' : 'View'} Receipt ${i+1}`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </button>
                                                        );
                                                    })}
                                                    {req.items.every(i => !i.receipt_path) && <span className="text-slate-600">—</span>}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                    <td className="px-6 py-5 min-w-[180px]">
                                        {getStatusBadge(req.status)}
                                        {req.rejection_comment && (
                                            <div className="text-[10px] text-orange-400 mt-1 italic line-clamp-1 hover:line-clamp-none transition-all cursor-help" title={req.rejection_comment}>Note: {req.rejection_comment}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 font-bold text-white text-right">
                                        {req.total_amount > 0 ? `₹${req.total_amount.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-6 py-5 text-right w-fit">
                                        <div className="flex justify-end gap-2 items-center">
                                            {/* MANAGER APPROVAL */}
                                            {req.status === 'pending' && user.user_role === 'MANAGER' && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, 'manager_approved'); }}
                                                        className="px-3 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-all"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, 'rejected'); }}
                                                        className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}

                                            {/* REQUESTER COMPLETE/FIX */}
                                            {(req.status === 'manager_approved' || req.status === 'receipt_rejected') && user.user_role === 'REQUESTER' && (
                                                <button 
                                                    onClick={() => handleStartCompletion(req)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:-translate-y-0.5 transition-all ${req.status === 'receipt_rejected' ? 'bg-amber-500 text-white' : 'bg-accent text-navy-950'}`}
                                                >
                                                    {req.status === 'receipt_rejected' ? 'Fix & Resubmit' : 'Complete Request'}
                                                </button>
                                            )}

                                            {/* ADMIN ACTION */}
                                            {user.user_role === 'ADMIN' && req.status === 'pending_final_approval' && (
                                                <div className="flex gap-2">
                                                    {req.request_type === 'expense_approval' ? (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, 'approved'); }}
                                                                className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded-lg text-xs font-bold hover:bg-green-500/20 transition-all"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setRejectionModal({ show: true, requestId: req.id, comment: '' }); }}
                                                                className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setCompletingRequest(req); }}
                                                                className="px-4 py-1.5 bg-accent text-navy-950 text-xs font-bold rounded-lg shadow-lg hover:-translate-y-0.5 transition-all"
                                                            >
                                                                Verify & Close
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setRejectionModal({ show: true, requestId: req.id, comment: '' }); }}
                                                                className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all ml-2"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Generic Reject for other cases */}
                                            {req.status === 'pending_final_approval' && ['MANAGER'].includes(user.user_role) && req.request_type !== 'expense_approval' && (
                                                <button 
                                                    onClick={() => handleStatusUpdate(req.id, 'rejected')} 
                                                    className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                
                                {expandedId === req.id && (
                                    <tr className="bg-navy-900/40 border-b border-navy-700/50">
                                        <td colSpan={user.user_role === 'ADMIN' ? '8' : '6'} className="px-12 py-8">
                                            <div className="space-y-8 max-w-6xl">
                                                {Object.entries(
                                                    req.items.reduce((acc, item) => {
                                                        const groupKey = `${item.category}_${item.date}`;
                                                        if (!acc[groupKey]) acc[groupKey] = { category: item.category, date: item.date, items: [] };
                                                        acc[groupKey].items.push(item);
                                                        return acc;
                                                    }, {})
                                                ).map(([key, group], gIdx) => (
                                                    <div key={key} className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-xl bg-accent text-navy-950 flex items-center justify-center text-[10px] font-black shadow-lg shadow-accent/10">
                                                                {gIdx + 1}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Group Details</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-bold text-white">{group.category}</span>
                                                                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                                    <span className="text-xs font-medium text-accent">{format(new Date(group.date), 'dd MMM yyyy')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-12">
                                                            {group.items.map((item, iIdx) => (
                                                                <div key={item.id} className="p-4 bg-navy-950/40 rounded-xl border border-navy-700/50 space-y-3 relative overflow-hidden group">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-md bg-navy-800 border border-navy-700 flex items-center justify-center text-[9px] text-slate-400 font-bold">{gIdx+1}.{iIdx+1}</div>
                                                                        <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 italic">"{item.description}"</p>
                                                                    <div className="flex items-center justify-between pt-2 border-t border-navy-700/50">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5 mb-0.5">Approx requested</span>
                                                                            <span className="text-[10px] font-black text-accent/80">₹{item.approx_amount?.toLocaleString() || 0}</span>
                                                                        </div>
                                                                        <div className="flex flex-col items-end">
                                                                            {item.amount > 0 ? (
                                                                                <>
                                                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5 mb-0.5">Actual Spent</span>
                                                                                    <span className="text-[10px] font-black text-success shadow-lg shadow-success/10 bg-success/5 px-2 py-0.5 rounded-md border border-success/20">₹{item.amount.toLocaleString()}</span>
                                                                                </>
                                                                            ) : (
                                                                                item.receipt_path && (
                                                                                    <button onClick={() => openReceiptForReview(req.id, item, iIdx)} className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest border border-blue-400/20 px-3 py-1 rounded-lg bg-blue-400/5 transition-all">View Receipt</button>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Stage 3 Modal */}
            {completingRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-navy-800 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-navy-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-navy-700 flex items-center justify-between bg-navy-900/40">
                            <div>
                                <h3 className="text-xl font-bold text-white">{completingRequest.status === 'receipt_rejected' ? 'Fix and Resubmit Details' : 'Finalize Submission'}</h3>
                                <p className="text-xs text-slate-500">Provide accurate amounts and clear receipts for payout</p>
                            </div>
                            <button onClick={() => setCompletingRequest(null)} className="p-2 hover:bg-white/10 rounded-xl"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form id="completion-form" onSubmit={handleSubmitCompletion} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                           {completingRequest.rejection_comment && (
                               <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-xs flex items-center gap-3">
                                   <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                   <span><strong>Correction Required:</strong> {completingRequest.rejection_comment}</span>
                               </div>
                           )}
                           {Object.entries(
                                completingRequest.items.reduce((acc, item) => {
                                    const groupKey = `${item.category}_${item.date}`;
                                    if (!acc[groupKey]) acc[groupKey] = { category: item.category, date: item.date, items: [] };
                                    acc[groupKey].items.push(item);
                                    return acc;
                                }, {})
                            ).map(([key, group], gIdx) => (
                                <div key={key} className="space-y-6 bg-navy-950/20 p-6 rounded-[2rem] border border-navy-700/30">
                                    <div className="flex items-center gap-4 border-b border-navy-700/50 pb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-accent text-navy-950 flex items-center justify-center text-sm font-black">{gIdx + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white uppercase tracking-wider">{group.category}</span>
                                            <span className="text-[10px] font-medium text-accent uppercase tracking-widest">{format(new Date(group.date), 'dd MMM yyyy')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {group.items.map((item) => {
                                            // Find the corresponding index in completionItems
                                            const cIdx = completionItems.findIndex(ci => ci.id === item.id);
                                            if (cIdx === -1) return null;
                                            
                                            return (
                                                <div key={item.id} className="p-6 bg-navy-900/60 rounded-2xl border border-navy-700/50 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-accent/80 uppercase tracking-widest px-2 py-0.5 bg-accent/5 rounded-md border border-accent/10 italic">Estimate: ₹{item.approx_amount?.toLocaleString() || 0}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-500 italic max-w-[200px] line-clamp-1">"{item.description}"</div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Final Amount (INR)</label>
                                                            <input type="number" required value={completionItems[cIdx].amount} onChange={(e) => handleItemDataChange(cIdx, 'amount', e.target.value)} className="w-full px-4 py-2.5 bg-navy-800 border border-navy-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-accent/20 outline-none" placeholder="0.00" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Mode</label>
                                                            <select required value={completionItems[cIdx].payment_mode} onChange={(e) => handleItemDataChange(cIdx, 'payment_mode', e.target.value)} className="w-full px-4 py-2.5 bg-navy-800 border border-navy-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-accent/20 outline-none">
                                                                <option value="">Select Mode</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Cash">Cash</option><option value="Net Banking">Net Banking</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{completingRequest.status === 'receipt_rejected' ? 'Upload NEW Receipt' : 'Upload Receipt'}</label>
                                                            <input type="file" required={completingRequest.status !== 'receipt_rejected'} onChange={(e) => handleItemDataChange(cIdx, 'receipt', e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent cursor-pointer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </form>
                        <div className="p-6 border-t border-navy-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-navy-900/40">
                            <div className="bg-accent/10 px-6 py-3 rounded-2xl border border-accent/20 flex flex-col">
                                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Total Amount to be Approved</span>
                                <span className="text-2xl font-black text-white">₹{totalAmountToApprove.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setCompletingRequest(null)} className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all">Cancel</button>
                                <button type="submit" form="completion-form" disabled={isSubmittingCompletion} className="px-10 py-2.5 bg-accent text-navy-950 text-sm font-bold rounded-xl shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50">{isSubmittingCompletion ? "Submitting..." : "Submit for Admin Review"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Review Modal */}
            {reviewingReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-navy-900 w-full max-w-5xl h-[85vh] rounded-3xl border border-navy-700 shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-navy-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Receipt Verification</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Item: {reviewingReceipt.item.title} | Mode: {reviewingReceipt.item.payment_mode}</p>
                            </div>
                            <button onClick={() => setReviewingReceipt(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><svg className="w-6 h-6 text-slate-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="flex-1 bg-black/20 overflow-auto p-4 flex items-center justify-center group scrollbar-thin">
                            {reviewingReceipt.url.endsWith('.pdf') ? (
                                <iframe src={reviewingReceipt.url} className="w-full h-full rounded-xl" title="PDF Receipt" />
                            ) : (
                                <img src={reviewingReceipt.url} alt="Receipt" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                            )}
                        </div>
                        {user.user_role === 'ADMIN' && (
                            <div className="p-8 border-t border-navy-700 bg-navy-950/40 flex items-center justify-end gap-6">
                                <span className="mr-auto text-xs text-slate-500 font-medium">Verify if the amount ₹{reviewingReceipt.item.amount} matches the document above.</span>
                                <button 
                                    onClick={() => handleReceiptReview('reject')}
                                    className="px-8 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg hover:shadow-red-500/20"
                                >
                                    Reject Receipt
                                </button>
                                <button 
                                    onClick={() => handleReceiptReview('approve')}
                                    className="px-8 py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all shadow-lg hover:shadow-green-500/40"
                                >
                                    Approve & Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ActionPop show={actionPop.show} type={actionPop.type} message={actionPop.message} title={actionPop.title} onClose={() => setActionPop({ ...actionPop, show: false })} />

            {/* Rejection Comment Modal */}
            {rejectionModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-navy-800 w-full max-w-md rounded-2xl border border-navy-700 shadow-2xl p-6"
                    >
                        <h4 className="text-lg font-bold text-white mb-2">Rejection Reason</h4>
                        <p className="text-xs text-slate-500 mb-4">Please provide a reason why this receipt is being rejected.</p>
                        <textarea 
                            value={rejectionModal.comment}
                            onChange={(e) => setRejectionModal({ ...rejectionModal, comment: e.target.value })}
                            className="w-full h-32 px-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-sm text-slate-200 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none mb-6"
                            placeholder="e.g., Amount mismatch, blurred image, invalid date..."
                            autoFocus
                        />
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => setRejectionModal({ show: false, requestId: null, comment: '' })}
                                className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmRejection}
                                disabled={!rejectionModal.comment.trim()}
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RequestsList;
