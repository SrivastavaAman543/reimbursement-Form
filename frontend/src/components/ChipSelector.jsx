import React from 'react';

const ChipSelector = ({ options, selected, onChange, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-accent/30 border
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              ${isSelected 
                ? 'bg-accent/20 border-accent/60 text-accent shadow-[0_8px_20px_rgba(var(--color-accent),0.25)] ring-1 ring-accent/30 scale-105 z-10 font-bold dark:shadow-[0_4px_12px_rgba(var(--color-accent),0.15)]' 
                : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700/60 text-slate-600 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-navy-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]'}
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
