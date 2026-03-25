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
                ? 'bg-accent/15 border-accent/40 text-accent shadow-sm shadow-accent/10' 
                : 'bg-navy-900 border-navy-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-800 dark:text-slate-200 hover:bg-navy-950'}
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
