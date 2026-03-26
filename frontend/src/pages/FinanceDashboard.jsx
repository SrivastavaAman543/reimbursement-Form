import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";

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

import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const GlassySelect = ({ value, onChange, options, label, width = "120px" }) => {
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="flex items-center gap-1.5 overflow-visible">
      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{label}:</span>
      <Listbox value={value} onChange={onChange}>
        <div className="relative" style={{ width }}>
          <Listbox.Button className="relative w-full flex items-center justify-between gap-1 px-2.5 py-1.5 bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl text-[10px] text-slate-900 dark:text-slate-200 hover:border-accent hover:bg-slate-50 dark:hover:bg-navy-800/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer shadow-sm dark:shadow-lg backdrop-blur-sm">
            <span className="truncate font-bold tracking-tight">{selectedOption?.label}</span>
            <svg className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </Listbox.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-2 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-2 scale-95"
          >
            <Listbox.Options className="absolute right-0 mt-2 max-h-56 w-56 overflow-hidden rounded-2xl bg-white dark:bg-navy-950/95 border border-slate-200 dark:border-navy-700/80 shadow-2xl z-[9000] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none">
              <div className="overflow-y-auto max-h-56 p-1.5 space-y-0.5 custom-scrollbar">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none py-1.5 px-3 rounded-xl text-[10px] transition-all duration-200 flex items-center justify-between
                      ${active ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}
                      ${selected ? 'bg-accent/10 dark:bg-accent/20 !text-accent font-bold' : ''}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="truncate">{option.label}</span>
                        {selected && (
                          <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-navy-800 rounded-2xl p-5 border border-navy-700 animate-pulse">
    <div className="h-3 w-24 bg-navy-700 rounded mb-3" />
    <div className="h-8 w-32 bg-navy-700 rounded mb-2" />
    <div className="h-2 w-20 bg-navy-700 rounded" />
  </div>
);

const FinanceDashboard = ({ t, token, user }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
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
  const uniqueEmployees = useMemo(() => Array.from(new Set(expenses.map(e => e.employee_name).filter(Boolean))), [expenses]);

  const clearFilters = () => {
    setDateRange([null, null]);
    setStatusFilter('all');
    setCategoryFilter('all');
    setEmployeeFilter('all');
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && (exp.category || 'Other') !== categoryFilter) return false;
      if (employeeFilter !== 'all' && exp.employee_name !== employeeFilter) return false;

      if (exp.date) {
        const d = new Date(exp.date);
        if (startDate && !endDate) {
          const s = startOfDay(startDate);
          const current = startOfDay(d);
          if (current.getTime() !== s.getTime()) return false;
        } else if (startDate && endDate) {
          if (!isWithinInterval(d, { start: startOfDay(startDate), end: endOfDay(endDate) })) return false;
        }
      }
      return true;
    });
  }, [expenses, statusFilter, categoryFilter, employeeFilter, startDate, endDate]);

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
      categoryDataLine: Object.keys(categoryMap).map(key => ({ name: t.categories?.[key] || key, value: categoryMap[key] })).sort((a, b) => b.value - a.value),
      statusDataLine: [
        { name: 'Approved', count: statusMap.approved, fill: STATUS_COLORS.approved },
        { name: 'Pending', count: statusMap.pending, fill: STATUS_COLORS.pending },
        { name: 'Rejected', count: statusMap.rejected, fill: STATUS_COLORS.rejected },
      ],
    };
  }, [filteredExpenses, t]);

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
    { key: 'total', label: t.total_requested || 'Total Requested', value: formatCurrency(analytics.totalValue), sub: user.user_role === 'ADMIN' ? 'All user expenses' : 'Your total submissions', color: 'text-blue-500 dark:text-blue-400', borderHover: 'hover:border-blue-400', iconBg: 'bg-blue-500/20 dark:bg-blue-500/10' },
    { key: 'approved', label: t.approved_value || 'Approved Value', value: formatCurrency(analytics.approvedValue), sub: 'Ready for payout', color: 'text-success-600 dark:text-success', borderHover: 'hover:border-success/40', iconBg: 'bg-success/20 dark:bg-success/10' },
    { key: 'pending', label: t.pending_action || 'Pending Action', value: `${analytics.pendingCount}`, valueSuffix: t.requests_suffix || 'requests', sub: user.user_role === 'ADMIN' ? 'Awaiting your approval' : 'Awaiting admin approval', color: 'text-accent-600 dark:text-accent', borderHover: 'hover:border-accent/40', iconBg: 'bg-accent/20 dark:bg-accent/10' },
    { key: 'rejected', label: t.rejected_title || 'Rejected', value: `${analytics.rejectedCount}`, valueSuffix: t.requests_suffix || 'requests', sub: 'Declined submissions', color: 'text-danger-600 dark:text-danger', borderHover: 'hover:border-danger/40', iconBg: 'bg-danger/20 dark:bg-danger/10' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Inline Filter Toggle */}
      <div className="flex flex-wrap items-center gap-6 py-2">
        <div className="flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.dashboard_overview || 'Dashboard Overview'}</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1 opacity-70">Expenditure Analytics</p>
        </div>

        <div className="flex-grow flex items-center justify-end min-w-0 overflow-visible">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="mr-4 relative z-50 overflow-visible"
              >
                <div className="relative group/filters">
                  <div className="flex items-center gap-1.5 bg-navy-800/40 p-1 px-2.5 rounded-xl border border-navy-700/50 backdrop-blur-sm whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{t.date_range || 'RANGE'}:</span>
                      <div className="relative custom-datepicker">
                        <DatePicker
                          selectsRange={true}
                          startDate={startDate}
                          endDate={endDate}
                          onChange={(update) => setDateRange(update)}
                          isClearable={true}
                          portalId="root"
                          className={`${selectClass} w-[155px] text-center`}
                          placeholderText="Select Period"
                          dateFormat="MMM dd, yyyy"
                        />
                      </div>
                    </div>

                    <GlassySelect
                      label="STATUS"
                      width="105px"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: 'all', label: t.all_statuses || 'All' },
                        { value: 'approved', label: t.approve || 'Approved' },
                        { value: 'pending', label: t.pending || 'Pending' },
                        { value: 'rejected', label: t.reject || 'Rejected' },
                      ]}
                    />

                    <GlassySelect
                      label="CAT"
                      width="125px"
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      options={[
                        { value: 'all', label: t.all_categories || 'All' },
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
                          { value: 'all', label: t.all_employees || 'All' },
                          ...uniqueEmployees.map(emp => ({ value: emp, label: emp }))
                        ]}
                      />
                    )}
                  </div>

                  {/* Floating Clear Button */}
                  <button
                    onClick={clearFilters}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-600 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-accent hover:border-accent hover:rotate-180 transition-all duration-300 shadow-lg z-[60] group-hover/filters:opacity-100 opacity-0 md:opacity-100"
                    title="Reset All Filters"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 group flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-300 shadow-sm ${showFilters ? 'bg-accent/15 border-accent text-accent' : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400 hover:border-accent hover:text-accent dark:hover:border-slate-500 dark:hover:text-slate-200'}`}
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
                <RechartsTooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
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
                <RechartsTooltip cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
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
