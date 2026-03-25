import os
import glob

replacements = {
    # Extra fixes
    'text-slate-400': 'text-slate-600 dark:text-slate-400',
    'text-slate-500': 'text-slate-600 dark:text-slate-500',
}

files_to_process = glob.glob('c:/Users/ogesa/Desktop/reimbursement Form/frontend/src/components/**/*.jsx', recursive=True) + \
                   glob.glob('c:/Users/ogesa/Desktop/reimbursement Form/frontend/src/pages/**/*.jsx', recursive=True) + \
                   ['c:/Users/ogesa/Desktop/reimbursement Form/frontend/src/App.jsx']

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Mask already correct ones
    content = content.replace('text-slate-600 dark:text-slate-400', '__MASKED_TEXT_400__')
    content = content.replace('text-slate-600 dark:text-slate-500', '__MASKED_TEXT_500__')
    
    content = content.replace('text-slate-400', 'text-slate-600 dark:text-slate-400')
    content = content.replace('text-slate-500', 'text-slate-600 dark:text-slate-500')
    
    # Unmask
    content = content.replace('__MASKED_TEXT_400__', 'text-slate-600 dark:text-slate-400')
    content = content.replace('__MASKED_TEXT_500__', 'text-slate-600 dark:text-slate-500')

    # Fix potential messy combinations
    content = content.replace('dark:text-slate-600 dark:text-slate-400', 'dark:text-slate-400')
    content = content.replace('dark:text-slate-600 dark:text-slate-500', 'dark:text-slate-500')

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

print("Done extra fixes.")
