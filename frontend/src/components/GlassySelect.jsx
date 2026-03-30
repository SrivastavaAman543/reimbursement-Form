import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';

const GlassySelect = ({ value, onChange, options, label, width = "120px" }) => {
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="flex items-center gap-1.5 overflow-visible">
      {label && <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{label}:</span>}
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
            <Listbox.Options className="absolute right-0 mt-2 max-h-56 w-56 overflow-hidden rounded-2xl bg-white dark:bg-navy-950/95 border border-slate-200 dark:border-navy-700/80 shadow-2xl z-[9999] backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none">
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

export default GlassySelect;
