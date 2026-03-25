import os
import glob

replacements = {
    # Text colors
    'text-white': 'text-slate-900 dark:text-white',
    'text-slate-100': 'text-slate-900 dark:text-slate-100',
    'text-slate-200': 'text-slate-800 dark:text-slate-200',
    'text-slate-300': 'text-slate-700 dark:text-slate-300',
    
    # Border & Divide colors (Since we mapped navy-700 to automatically switch colors for borders, just use navy-700)
    'border-white/[0.04]': 'border-navy-700',
    'border-white/[0.06]': 'border-navy-700',
    'divide-white/[0.04]': 'divide-navy-700',
    'divide-white/[0.03]': 'divide-navy-700',
    
    # Hover text
    'hover:text-white': 'hover:text-slate-900 dark:hover:text-white',
    
    # Hover background
    'hover:bg-white/[0.02]': 'hover:bg-navy-700/50',
    'hover:bg-white/5': 'hover:bg-navy-700/50 dark:hover:bg-white/5',
}

files_to_process = glob.glob('c:/Users/ogesa/Desktop/reimbursement Form/frontend/src/components/**/*.jsx', recursive=True) + \
                   glob.glob('c:/Users/ogesa/Desktop/reimbursement Form/frontend/src/pages/**/*.jsx', recursive=True) + \
                   ['c:/Users/ogesa/Desktop/reimbursement Form/frontend/src/App.jsx']

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for old, new in replacements.items():
        # Only replace exact class string matches, naive replace might be enough since Tailwind uses spaces
        # But we must be careful not to replace already expanded ones like 'text-slate-900 dark:text-white' again
        # which would result in 'text-slate-900 dark:text-slate-900 dark:text-white'
        
        # We will split text by space, quote, backtick, etc and only replace exact tokens, or just use string replace carefully
        pass

    # A safer approach is to replace, but first temporarily mask already correct ones to avoid double replacement.
    content = content.replace('text-slate-900 dark:text-white', '__MASKED_TEXT_WHITE__')
    content = content.replace('text-slate-800 dark:text-slate-200', '__MASKED_TEXT_200__')
    content = content.replace('text-slate-700 dark:text-slate-300', '__MASKED_TEXT_300__')
    content = content.replace('text-slate-900 dark:text-slate-900', '__MASKED_DOUBLE__')
    
    content = content.replace('text-white', 'text-slate-900 dark:text-white')
    content = content.replace('text-slate-200', 'text-slate-800 dark:text-slate-200')
    content = content.replace('text-slate-300', 'text-slate-700 dark:text-slate-300')
    content = content.replace('text-slate-100', 'text-slate-900 dark:text-slate-100')
    
    content = content.replace('border-white/[0.04]', 'border-navy-700')
    content = content.replace('border-white/[0.06]', 'border-navy-700')
    content = content.replace('divide-white/[0.04]', 'divide-navy-700')
    content = content.replace('divide-white/[0.03]', 'divide-navy-700')
    
    content = content.replace('hover:bg-white/[0.02]', 'hover:bg-navy-700/50')
    content = content.replace('hover:bg-white/5', 'hover:bg-navy-700/50 dark:hover:bg-white/5')
    
    # Unmask
    content = content.replace('hover:__MASKED_TEXT_WHITE__', 'hover:text-slate-900 dark:hover:text-white')
    content = content.replace('__MASKED_TEXT_WHITE__', 'text-slate-900 dark:text-white')
    content = content.replace('__MASKED_TEXT_200__', 'text-slate-800 dark:text-slate-200')
    content = content.replace('__MASKED_TEXT_300__', 'text-slate-700 dark:text-slate-300')
    content = content.replace('__MASKED_DOUBLE__', 'text-slate-900 dark:text-slate-900')

    # Fix potential messy combinations like "dark:text-slate-900 dark:text-white"
    content = content.replace('dark:text-slate-900 dark:text-white', 'dark:text-white')
    content = content.replace('dark:text-slate-800 dark:text-slate-200', 'dark:text-slate-200')
    content = content.replace('dark:text-slate-700 dark:text-slate-300', 'dark:text-slate-300')
    content = content.replace('hover:text-slate-900 dark:hover:text-white', 'hover:text-slate-900 dark:hover:text-white')

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

print("Done.")
