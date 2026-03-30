import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ResponsiveContainer, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell, Tooltip as RechartsTooltip } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import GlassySelect from '../components/GlassySelect';
import { Listbox, Transition } from '@headlessui/react';

const API_URL = "http://localhost:8000/api/expenses";

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#06B6D4'];
const STATUS_COLORS = { 
  approved: '#10B981', 
  pending_final_approval: '#8B5CF6', 
  manager_approved: '#3B82F6', 
  pending: '#F59E0B', 
  rejected: '#EF4444' 
};

const KpiIcon = ({ type }) => {
  const icons = {
    total: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    approved: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    pending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    rejected: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    total_all: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  };
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[type]}</svg>;
};





const SkeletonCard = () => (
  <div className="bg-navy-800 rounded-2xl p-5 border border-navy-700 animate-pulse">
    <div className="h-3 w-24 bg-navy-700 rounded mb-3" />
    <div className="h-8 w-32 bg-navy-700 rounded mb-2" />
    <div className="h-2 w-20 bg-navy-700 rounded" />
  </div>
);

const FinanceDashboard = ({ t, token, user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(response.data);
    } catch (error) { console.error("Error fetching requests", error); }
    finally { setLoading(false); }
  };

  const allItems = useMemo(() => {
     return requests.flatMap(req => req.items.map(item => ({ ...item, employee_name: req.employee_name, status: req.status, submitted_at: req.submitted_at })));
  }, [requests]);

  const uniqueCategories = useMemo(() => Array.from(new Set(allItems.map(i => i.category))), [allItems]);
  const uniqueEmployees = useMemo(() => Array.from(new Set(requests.map(r => r.employee_name))), [requests]);

  const clearFilters = () => {
    setDateRange([null, null]);
    setStatusFilter('all');
    setCategoryFilter('all');
    setEmployeeFilter('all');
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (employeeFilter !== 'all' && req.employee_name !== employeeFilter) return false;
      
      const submittedDate = new Date(req.submitted_at);
      if (startDate && !endDate) {
        if (startOfDay(submittedDate).getTime() !== startOfDay(startDate).getTime()) return false;
      } else if (startDate && endDate) {
        if (!isWithinInterval(submittedDate, { start: startOfDay(startDate), end: endOfDay(endDate) })) return false;
      }
      return true;
    });
  }, [requests, statusFilter, employeeFilter, startDate, endDate]);

  const analytics = useMemo(() => {
    let totalValue = 0, approvedValue = 0, pendingCount = 0, rejectedCount = 0;
    const categoryMap = {};
    const statusMap = { approved: 0, pending: 0, manager_approved: 0, pending_final_approval: 0, rejected: 0, receipt_rejected: 0 };
    
    filteredRequests.forEach(req => {
      const amount = req.items.reduce((sum, i) => sum + i.amount, 0);
      totalValue += amount;
      if (req.status === 'approved') approvedValue += amount;
      // Action Items are anything that isn't Approved or Rejected
      if (!['approved', 'rejected'].includes(req.status)) pendingCount++;
      if (req.status === 'rejected') rejectedCount++;
      statusMap[req.status] = (statusMap[req.status] || 0) + 1;
      
      req.items.forEach(item => {
        if (categoryFilter === 'all' || item.category === categoryFilter) {
           const cat = item.category || 'Other';
           categoryMap[cat] = (categoryMap[cat] || 0) + (item.amount || 0);
        }
      });
    });

    return {
      totalValue, approvedValue, pendingCount, rejectedCount,
      categoryDataLine: Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] })).sort((a, b) => b.value - a.value),
      statusDataLine: [
        { name: 'Manager', count: statusMap.pending, fill: STATUS_COLORS.pending },
        { name: 'Receipt Upload', count: statusMap.manager_approved, fill: STATUS_COLORS.manager_approved },
        { name: 'Admin', count: statusMap.pending_final_approval, fill: STATUS_COLORS.pending_final_approval },
        { name: 'Correction', count: statusMap.receipt_rejected, fill: '#f97316' }, // Orange for correction
        { name: 'Approved', count: statusMap.approved, fill: STATUS_COLORS.approved },
        { name: 'Rejected', count: statusMap.rejected, fill: STATUS_COLORS.rejected },
      ],
    };
  }, [filteredRequests, categoryFilter]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const selectClass = "bg-white dark:bg-navy-900/50 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer min-w-[130px] transition-all hover:border-slate-300 dark:hover:border-navy-600 shadow-sm";
  const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    fontSize: '13px',
    color: '#fff',
    backdropFilter: 'blur(8px)'
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-navy-800 rounded-2xl h-80 border border-navy-700 animate-pulse" />
          <div className="bg-navy-800 rounded-2xl h-80 border border-navy-700 animate-pulse" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    { key: 'total_all', label: 'Total Amount Requested', value: formatCurrency(analytics.totalValue), sub: 'Gross sum of all entries', color: 'text-indigo-500 dark:text-indigo-400', borderHover: 'hover:border-indigo-400', iconBg: 'bg-indigo-500/20 dark:bg-indigo-500/10' },
    { key: 'total', label: 'Incomplete/Pending Value', value: formatCurrency(analytics.totalValue - analytics.approvedValue), sub: 'Expected future payouts', color: 'text-blue-500 dark:text-blue-400', borderHover: 'hover:border-blue-400', iconBg: 'bg-blue-500/20 dark:bg-blue-500/10' },
    { key: 'approved', label: 'Total Paid Out', value: formatCurrency(analytics.approvedValue), sub: 'Ready for final accounts', color: 'text-success-600 dark:text-success', borderHover: 'hover:border-success/40', iconBg: 'bg-success/20 dark:bg-success/10' },
    { key: 'pending', label: 'Action Items', value: `${analytics.pendingCount}`, valueSuffix: 'requests', sub: 'In-progress across all roles', color: 'text-accent-600 dark:text-accent', borderHover: 'hover:border-accent/40', iconBg: 'bg-accent/20 dark:bg-accent/10' },
    { key: 'rejected', label: 'Rejected Entries', value: `${analytics.rejectedCount}`, valueSuffix: 'requests', sub: 'Declined submissions', color: 'text-danger-600 dark:text-danger', borderHover: 'hover:border-danger/40', iconBg: 'bg-danger/20 dark:bg-danger/10' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6 py-2">
        <div className="flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1 opacity-70">Data Analytics</p>
        </div>

        <div className="flex-grow flex items-center justify-end min-w-0 overflow-visible">
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="mr-4 relative z-50 overflow-visible">
                <div className="flex items-center gap-1.5 bg-navy-800/40 p-1 px-2.5 rounded-xl border border-navy-700/50 backdrop-blur-sm whitespace-nowrap">
                   <GlassySelect
                      label="STATUS"
                      width="135px"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: 'all', label: 'All Statuses' },
                        { value: 'pending', label: 'Manager' },
                        { value: 'manager_approved', label: 'Receipt Upload' },
                        { value: 'pending_final_approval', label: 'Admin' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                      ]}
                    />
                    <GlassySelect
                      label="CAT"
                      width="125px"
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
                        width="135px"
                        value={employeeFilter}
                        onChange={setEmployeeFilter}
                        options={[
                          { value: 'all', label: 'All Employees' },
                          ...uniqueEmployees.map(emp => ({ value: emp, label: emp }))
                        ]}
                      />
                    )}

                    <div className="h-6 w-px bg-navy-700/50 mx-1" />

                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">RANGE:</span>
                        <div className="relative">
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(update) => setDateRange(update)}
                                isClearable={true}
                                placeholderText="Select Date Range"
                                className="w-[180px] px-2.5 py-1.5 bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl text-[10px] font-bold text-slate-900 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm"
                            />
                        </div>
                    </div>

                    <GlassySelect
                        label="FY"
                        width="110px"
                        value={(() => {
                            if (!startDate || !endDate) return 'all';
                            const sy = startDate.getFullYear();
                            const sm = startDate.getMonth(); // 0-indexed, 3 is April
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 group flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-300 shadow-sm ${showFilters ? 'bg-accent/15 border-accent text-accent' : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:border-accent hover:text-accent'}`}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Close' : 'Filter'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-navy-800 rounded-2xl p-4 border border-navy-700 ${card.borderHover} transition-all duration-200 group relative overflow-visible`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.iconBg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -mr-8 -mt-8`} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              <div className={`w-8 h-8 ${card.iconBg} rounded-xl flex items-center justify-center ${card.color}`}><KpiIcon type={card.key} /></div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
              {card.valueSuffix && <span className="text-xs text-slate-500 font-medium">{card.valueSuffix}</span>}
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block font-medium relative z-10">{card.sub}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-navy-800 rounded-2xl p-6 border border-navy-700 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Item Spend Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.categoryDataLine} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  {analytics.categoryDataLine.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-navy-800 rounded-2xl p-6 border border-navy-700 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Request Status</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.statusDataLine} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} 
                    dy={10} 
                    interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(255, 158, 11, 0.05)' }} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {analytics.statusDataLine.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
