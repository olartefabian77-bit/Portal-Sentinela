
import React from 'react';
import clsx from 'clsx';

export function Button({ className, variant='default', size='md', ...props }) {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50',
    secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300'
  };
  const sizes = { sm:'px-3 py-1.5 text-sm', md:'px-4 py-2', lg:'px-5 py-2.5' };
  return <button className={clsx('rounded-md inline-flex items-center justify-center gap-1 transition', variants[variant], sizes[size], className)} {...props} />
}
