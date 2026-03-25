import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const API_URL = "http://localhost:8000/api/expenses";

const COLORS = ['rgb(var(--color-accent))', 'rgb(var(--color-success))', '#3B82F6', 'rgb(var(--color-danger))', '#8B5CF6', '#06B6D4'];
const STATUS_COLORS = { approved: 'rgb(var(--color-success))', pending: 'rgb(var(--color-accent))', rejected: 'rgb(var(--color-danger))' };

const KpiIcon = ({ type }) => {
  const icons = {
    total: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    approved: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    pending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    rejected: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
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

const FinanceDashboard = ({ t, token }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(response.data);
    } catch (error) { console.error("Error fetching expenses", error); }
    finally { setLoading(false); }
  };

  const uniqueCategories = useMemo(() => Array.from(new Set(expenses.map(e => e.category || 'Other'))), [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && (exp.category || 'Other') !== categoryFilter) return false;
      if (timeFilter !== 'all' && exp.date) {
        const expDate = new Date(exp.date);
        const now = new Date();
        if (timeFilter === 'this_month') { if (expDate.getMonth() !== now.getMonth() || expDate.getFullYear() !== now.getFullYear()) return false; }
        else if (timeFilter === 'last_month') { const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1; const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(); if (expDate.getMonth() !== lm || expDate.getFullYear() !== ly) return false; }
        else if (timeFilter === 'this_year') { if (expDate.getFullYear() !== now.getFullYear()) return false; }
      }
      return true;
    });
  }, [expenses, statusFilter, categoryFilter, timeFilter]);

  const analytics = useMemo(() => {
    let totalValue = 0, approvedValue = 0, pendingCount = 0, rejectedCount = 0;
    const categoryMap = {};
    const statusMap = { approved: 0, pending: 0, rejected: 0 };
    filteredExpenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      totalValue += amount;
      if (exp.status === 'approved') approvedValue += amount;
      if (exp.status === 'pending') pendingCount++;
      if (exp.status === 'rejected') rejectedCount++;
      const cat = exp.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + amount;
      if (statusMap[exp.status] !== undefined) statusMap[exp.status]++;
    });
    return {
      totalValue, approvedValue, pendingCount, rejectedCount,
      categoryDataLine: Object.keys(categoryMap).map(key => ({ name: t.categories?.[key] || key, value: categoryMap[key] })).sort((a,b) => b.value - a.value),
      statusDataLine: [
        { name: 'Approved', count: statusMap.approved, fill: STATUS_COLORS.approved },
        { name: 'Pending', count: statusMap.pending, fill: STATUS_COLORS.pending },
        { name: 'Rejected', count: statusMap.rejected, fill: STATUS_COLORS.rejected },
      ],
    };
  }, [filteredExpenses, t]);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  const selectClass = "bg-navy-900/50 border border-navy-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer min-w-[130px] transition-all hover:border-navy-600";
  const tooltipStyle = { backgroundColor: 'rgb(var(--navy-800))', border: '1px solid rgb(var(--navy-700))', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', fontSize: '13px' };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-navy-800 rounded-2xl h-80 border border-navy-700 animate-pulse" />
          <div className="bg-navy-800 rounded-2xl h-80 border border-navy-700 animate-pulse" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    { key: 'total', label: t.total_requested || 'Total Requested', value: formatCurrency(analytics.totalValue), sub: t.all_time_expenses || 'All time expenses', color: 'text-blue-500 dark:text-blue-400', borderHover: 'hover:border-blue-400', iconBg: 'bg-blue-500/20 dark:bg-blue-500/10' },
    { key: 'approved', label: t.approved_value || 'Approved Value', value: formatCurrency(analytics.approvedValue), sub: t.disbursed_successfully || 'Disbursed successfully', color: 'text-success-600 dark:text-success', borderHover: 'hover:border-success/40', iconBg: 'bg-success/20 dark:bg-success/10' },
    { key: 'pending', label: t.pending_action || 'Pending Action', value: `${analytics.pendingCount}`, valueSuffix: t.requests_suffix || 'requests', sub: t.awaiting_approval || 'Awaiting your approval', color: 'text-accent-600 dark:text-accent', borderHover: 'hover:border-accent/40', iconBg: 'bg-accent/20 dark:bg-accent/10' },
    { key: 'rejected', label: t.rejected_title || 'Rejected', value: `${analytics.rejectedCount}`, valueSuffix: t.requests_suffix || 'requests', sub: t.declined_expenses || 'Declined expenses', color: 'text-danger-600 dark:text-danger', borderHover: 'hover:border-danger/40', iconBg: 'bg-danger/20 dark:bg-danger/10' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Inline Filter Toggle */}
      <div className="flex flex-wrap items-center gap-6 py-2">
        <div className="flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.dashboard_overview || 'Dashboard Overview'}</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1 opacity-70">Expenditure Analytics</p>
        </div>

        <div className="flex-grow flex items-center justify-end min-w-0">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: 20 }}
                animate={{ width: 'auto', opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 120 }}
                className="overflow-hidden mr-4"
              >
                <div className="flex items-center gap-2 bg-navy-800/40 p-1.5 px-3 rounded-xl border border-navy-700/50 backdrop-blur-sm whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{t.time || 'Time'}:</span>
                    <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className={`${selectClass} min-w-[100px] py-1`}>
                      <option value="all">{t.all_time || 'All Time'}</option>
                      <option value="this_month">{t.this_month || 'This Month'}</option>
                      <option value="last_month">{t.last_month || 'Last Month'}</option>
                      <option value="this_year">{t.this_year || 'This Year'}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{t.status || 'Status'}:</span>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${selectClass} min-w-[100px] py-1`}>
                      <option value="all">{t.all_statuses || 'All Statuses'}</option>
                      <option value="approved">{t.approve || 'Approved'}</option>
                      <option value="pending">{t.pending || 'Pending'}</option>
                      <option value="rejected">{t.reject || 'Rejected'}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{t.category || 'Category'}:</span>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={`${selectClass} min-w-[100px] py-1`}>
                      <option value="all">{t.all_categories || 'All Categories'}</option>
                      {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 group flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${showFilters ? 'bg-accent/15 border-accent text-accent' : 'bg-navy-800 border-navy-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Close' : 'Filter'}
          </button>
        </div>
      </div>

      {/* KPI Cards (Now at the top as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <motion.div 
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-navy-800 rounded-2xl p-5 border border-navy-700 ${card.borderHover} transition-all duration-200 group relative overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.iconBg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -mr-8 -mt-8`} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-500">{card.label}</span>
              <div className={`w-8 h-8 ${card.iconBg} rounded-xl flex items-center justify-center ${card.color}`}><KpiIcon type={card.key} /></div>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
              {card.valueSuffix && <span className="text-xs text-slate-600 dark:text-slate-500 font-medium">{card.valueSuffix}</span>}
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-500 mt-2 block font-medium relative z-10">{card.sub}</span>
          </motion.div>
        ))}
      </div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-navy-800 rounded-2xl p-6 border border-navy-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">{t.spend_by_category || 'Spend by Category'}</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.categoryDataLine} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  {analytics.categoryDataLine.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-navy-800 rounded-2xl p-6 border border-navy-700 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">{t.requests_overview || 'Requests Overview'}</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.statusDataLine} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--navy-700))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: '600' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} contentStyle={tooltipStyle} />
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
