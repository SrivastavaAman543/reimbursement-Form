import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ActionPop = ({ show, type = 'success', message, title, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const icons = {
    success: (
      <motion.svg 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 text-success" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <motion.path 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.5" 
          d="M5 13l4 4L19 7" 
        />
      </motion.svg>
    ),
    error: (
      <motion.svg 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 text-danger" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <motion.path 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.5" 
          d="M6 18L18 6M6 6l12 12" 
        />
      </motion.svg>
    ),
    warning: (
      <motion.svg 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 text-danger" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <motion.path 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2.5" 
          d="M6 18L18 6M6 6l12 12" 
        />
      </motion.svg>
    )
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-navy-800 p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-navy-700 flex flex-col items-center max-w-sm w-full"
          >
            <div className="mb-6">
              {icons[type] || icons.success}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center uppercase tracking-wide">
              {title || (type === 'success' ? 'Success' : 'Error')}
            </h3>
            
            <p className="text-slate-600 dark:text-slate-400 text-center font-medium">
              {message}
            </p>
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1.5 ${type === 'success' ? 'bg-success' : 'bg-danger'} rounded-full`}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActionPop;
