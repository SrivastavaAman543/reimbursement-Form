import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = {
  success: (
    <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
};

const bgMap = {
  success: 'border-success/20',
  error: 'border-danger/20',
  warning: 'border-warning/20',
};

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!message) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onClose?.();
      }
    }, 50);
    return () => clearInterval(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const progressColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 80, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed top-6 right-6 z-[100] glass-card rounded-xl shadow-elevated border ${bgMap[type]} overflow-hidden min-w-[320px] max-w-[420px]`}
      >
        <div className="flex items-center gap-3 p-4">
          <div className="flex-shrink-0">{iconMap[type]}</div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{message}</p>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-slate-600 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300 rounded-lg hover:bg-navy-700/50 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Auto-dismiss progress bar */}
        <div className="h-0.5 w-full bg-navy-700">
          <div
            className={`h-full ${progressColor} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Toast;
